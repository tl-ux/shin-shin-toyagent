import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { order, toEmail } = await req.json();

  const itemsHtml = order.items.map(item =>
    `<tr>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;">${item.product_name}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:left;">₪${(item.unit_price || 0).toLocaleString()}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:left;font-weight:bold;">₪${(item.total || 0).toLocaleString()}</td>
    </tr>`
  ).join('');

  const body = `
    <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1a56a8;">הזמנה חדשה - ${order.order_number || ''}</h2>
      <p><strong>לקוח:</strong> ${order.customer_name}</p>
      <p><strong>סוכן:</strong> ${order.agent_name}</p>
      <p><strong>תאריך:</strong> ${order.visit_date || ''}</p>
      ${order.notes ? `<p><strong>הערות:</strong> ${order.notes}</p>` : ''}
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <thead>
          <tr style="background:#f0f4ff;">
            <th style="padding:8px 10px;text-align:right;">פריט</th>
            <th style="padding:8px 10px;text-align:center;">כמות</th>
            <th style="padding:8px 10px;text-align:left;">מחיר יח'</th>
            <th style="padding:8px 10px;text-align:left;">סה"כ</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p style="font-size:18px;font-weight:bold;margin-top:16px;color:#1a56a8;">סה"כ לתשלום: ₪${(order.total_amount || 0).toLocaleString()}</p>
    </div>
  `;

  await base44.integrations.Core.SendEmail({
    to: toEmail,
    subject: `הזמנה חדשה - ${order.customer_name} | ${order.order_number || ''}`,
    body,
  });

  return Response.json({ success: true });
});