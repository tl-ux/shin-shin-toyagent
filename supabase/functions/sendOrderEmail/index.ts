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

    const items = order.items || []
    const rows = items.map((i: any) => `
      <tr>
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
          <tr>
            <td style="padding:4px 8px;color:#666;">סוכן:</td>
            <td style="padding:4px 8px;">${order.agent_name || ''}</td>
          </tr>
          <tr>
            <td style="padding:4px 8px;color:#666;">תאריך:</td>
            <td style="padding:4px 8px;">${order.visit_date || ''}</td>
          </tr>
          ${order.delivery_date ? `<tr><td style="padding:4px 8px;color:#666;">משלוח:</td><td style="padding:4px 8px;">${order.delivery_date}</td></tr>` : ''}
        </table>
      </div>

      <table style="width:100%;border-collapse:collapse;border:1px solid #eee;">
        <thead>
          <tr style="background:#6366f1;color:white;">
            <th style="padding:10px 12px;text-align:right;">פריט</th>
            <th style="padding:10px 12px;text-align:center;">כמות</th>
            <th style="padding:10px 12px;text-align:left;">מחיר יחידה</th>
            <th style="padding:10px 12px;text-align:left;">סכום</th>
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
        from: 'ToyAgent <onboarding@resend.dev>',
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
