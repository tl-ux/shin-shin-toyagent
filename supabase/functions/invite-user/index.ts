import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!

serve(async (req) => {
  const { email } = await req.json()
  if (!email) return new Response(JSON.stringify({ error: 'email required' }), { status: 400 })

  const res = await fetch(`${SUPABASE_URL}/auth/v1/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ email }),
  })

  const data = await res.json()
  if (!res.ok) return new Response(JSON.stringify({ error: data.msg || data.message }), { status: res.status })
  return new Response(JSON.stringify({ success: true }), { status: 200 })
})
