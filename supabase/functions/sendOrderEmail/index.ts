import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { order, toEmail } = await req.json()
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

    // טען פרטי לקוח
    let customer = null;
    if (order.customer_id) {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SERVICE_ROLE_KEY')!);
      const { data } = await sb.from('customers').select('*').eq('id', order.customer_id).single();
      customer = data;
    }

    const items = order.items || []
    const rows = items.map((i: any, idx: number) => `
      <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f9f9f9'}">
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;color:#888;">${idx + 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;color:#666;font-size:12px;">${i.sku || ''}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${i.product_name || ''}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:left;">₪${(i.unit_price || 0).toLocaleString()}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:left;font-weight:bold;">₪${(i.total || 0).toLocaleString()}</td>
      </tr>
    `).join('')

    const html = `
    <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:#6366f1;color:white;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="margin:0;font-size:24px;">🧸 הזמנה חדשה</h1>
        <p style="margin:8px 0 0;opacity:0.9;">${order.order_number || ''}</p>
      </div>

      <div style="background:#f8f9fa;padding:16px;border:1px solid #eee;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:4px 8px;color:#666;">לקוח:</td>
            <td style="padding:4px 8px;font-weight:bold;">${order.customer_name || ''}</td>
          </tr>
          ${customer?.contact_name ? `<tr><td style="padding:4px 8px;color:#666;">איש קשר:</td><td style="padding:4px 8px;">${customer.contact_name}</td></tr>` : ''}
          ${customer?.phone ? `<tr><td style="padding:4px 8px;color:#666;">טלפון:</td><td style="padding:4px 8px;">${customer.phone}</td></tr>` : ''}
          ${customer?.address ? `<tr><td style="padding:4px 8px;color:#666;">כתובת:</td><td style="padding:4px 8px;">${customer.address}${customer.city ? ', ' + customer.city : ''}</td></tr>` : ''}
          ${customer?.business_id ? `<tr><td style="padding:4px 8px;color:#666;">ח.פ / ע.מ:</td><td style="padding:4px 8px;">${customer.business_id}</td></tr>` : ''}
          <tr>
            <td style="padding:4px 8px;color:#666;">סוכן:</td>
            <td style="padding:4px 8px;">${order.agent_name || ''}</td>
          </tr>
          <tr>
            <td style="padding:4px 8px;color:#666;">תאריך:</td>
            <td style="padding:4px 8px;">${order.visit_date || ''}</td>
          </tr>
          ${order.delivery_date ? `<tr><td style="padding:4px 8px;color:#666;">משלוח:</td><td style="padding:4px 8px;">${order.delivery_date}</td></tr>` : ''}
          ${customer?.payment_terms ? `<tr><td style="padding:4px 8px;color:#666;">תנאי תשלום:</td><td style="padding:4px 8px;font-weight:bold;">${customer.payment_terms}</td></tr>` : ''}
        </table>
      </div>

      <table style="width:100%;border-collapse:collapse;border:1px solid #eee;">
        <thead>
          <tr style="background:#6366f1;color:white;">
            <th style="padding:10px 12px;text-align:center;">#</th>
            <th style="padding:10px 12px;text-align:center;">מק"ט</th>
            <th style="padding:10px 12px;text-align:right;">תאור פריט</th>
            <th style="padding:10px 12px;text-align:center;">כמות</th>
            <th style="padding:10px 12px;text-align:left;">מחיר ליחידה</th>
            <th style="padding:10px 12px;text-align:left;">סה"כ ש"ח</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr style="background:#f0f0ff;">
            <td colspan="3" style="padding:12px;text-align:right;font-weight:bold;font-size:16px;">סה"כ:</td>
            <td style="padding:12px;font-weight:bold;font-size:18px;color:#6366f1;">₪${(order.total_amount || 0).toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>

      ${order.notes ? `<div style="margin-top:16px;padding:12px;background:#fff9e6;border-radius:8px;border:1px solid #ffd;">הערות: ${order.notes}</div>` : ''}
    </div>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'ToyAgent <orders@vendisto.app>',
        to: [toEmail],
        subject: `הזמנה חדשה - ${order.customer_name} - ${order.order_number}`,
        html,
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'שגיאה בשליחת מייל')

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
