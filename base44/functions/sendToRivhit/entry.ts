import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const RIVHIT_BASE = 'https://api.rivhit.co.il/online/RivhitOnlineAPI.svc';
const DEFAULT_DOCUMENT_TYPE = 10;

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { order_id } = await req.json();
  if (!order_id) return Response.json({ error: 'order_id is required' }, { status: 400 });

  const [order, settings] = await Promise.all([
    base44.entities.Order.get(order_id),
    base44.entities.AppSettings.list(),
  ]);

  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

  const appSettings = settings[0] || {};
  const apiToken = appSettings.rivhit_api_token;

  if (!apiToken) {
    await base44.entities.Order.update(order_id, {
      rivhit_status: 'error',
      rivhit_error: 'API Token של ריווחית לא הוגדר בהגדרות',
    });
    return Response.json({ error: 'Rivhit API token not configured' }, { status: 400 });
  }

  let customer = null;
  if (order.customer_id) {
    customer = await base44.entities.Customer.get(order.customer_id);
  }

  const documentType = customer?.rivhit_document_type || DEFAULT_DOCUMENT_TYPE;

  const items = (order.items || []).map((item) => ({
    description: item.product_name,
    catalog_number: item.sku || '',
    quantity: item.quantity,
    price_nis: item.unit_price,
  }));

  if (items.length === 0) {
    return Response.json({ error: 'No items in order' }, { status: 400 });
  }

  const hasRivhitId = customer?.rivhit_customer_id && customer.rivhit_customer_id > 0;
  const hasBusinessId = customer?.business_id && customer.business_id.trim() !== '';

  const payload = {
    api_token: apiToken,
    document_type: documentType,
    reference: order.order_number || '',
    reference_request: order.id,
    comments: order.notes || `הזמנה ${order.order_number || ''}`,
    items,
  };

  if (hasRivhitId) {
    payload.customer_id = customer.rivhit_customer_id;
  } else if (hasBusinessId) {
    payload.customer_id = 0;
    payload.customer_create = true;
    payload.id_by_find = true;
    payload.name_last = customer?.name || order.customer_name;
    payload.id_number = parseInt(customer.business_id.replace(/\D/g, ''), 10);
    if (customer?.phone) payload.phone = customer.phone;
    if (customer?.city) payload.city = customer.city;
    if (customer?.address) payload.address = customer.address;
  } else {
    payload.customer_id = 0;
    payload.customer_create = true;
    payload.name_last = customer?.name || order.customer_name;
    if (customer?.phone) payload.phone = customer.phone;
    if (customer?.city) payload.city = customer.city;
  }

  let rivhitRes;
  try {
    rivhitRes = await fetch(`${RIVHIT_BASE}/Document.New`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    const msg = `שגיאת רשת בחיבור לריווחית: ${err}`;
    await base44.entities.Order.update(order_id, { rivhit_status: 'error', rivhit_error: msg });
    return Response.json({ error: msg }, { status: 500 });
  }

  const result = await rivhitRes.json();

  if (result.error_code !== 0) {
    const errMsg = result.client_message || `קוד שגיאה: ${result.error_code}`;
    await base44.entities.Order.update(order_id, {
      rivhit_status: 'error',
      rivhit_error: errMsg,
    });
    return Response.json({ error: errMsg, rivhit_error_code: result.error_code }, { status: 422 });
  }

  const data = result.data;

  await base44.entities.Order.update(order_id, {
    rivhit_status: 'sent',
    rivhit_document_number: data.document_number,
    rivhit_document_type: data.document_type,
    rivhit_pdf_link: data.document_link || data.link_document || '',
    rivhit_error: '',
  });

  if (!hasRivhitId && data.customer_id && customer?.id) {
    await base44.entities.Customer.update(customer.id, {
      rivhit_customer_id: data.customer_id,
    });
  }

  return Response.json({
    success: true,
    document_number: data.document_number,
    document_type: data.document_type,
    pdf_link: data.document_link || data.link_document || '',
  });
});