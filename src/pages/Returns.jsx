import { useState, useEffect } from 'react';
import { base44 } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/lib/AuthContext';
import { format } from 'date-fns';
import { Plus, Trash2, Send } from 'lucide-react';

export default function Returns() {
  const { user } = useAuth();
  const [returns, setReturns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customer_id: '', customer_name: '', pickup_date: format(new Date(), 'dd-MM-yyyy'), items: [], notes: '' });
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const load = async () => {
    const [rets, custs, prods] = await Promise.all([
      base44.entities.Return.list('-created_at'),
      base44.entities.Customer.list(),
      base44.entities.Product.list(),
    ]);
    setReturns(rets);
    setCustomers(custs);
    setProducts(prods);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const addItem = (product) => {
    const exists = form.items.find(i => i.product_id === product.id);
    if (exists) {
      set('items', form.items.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      set('items', [...form.items, { product_id: product.id, product_name: product.name, sku: product.sku || '', quantity: 1 }]);
    }
  };

  const updateQty = (product_id, qty) => {
    if (qty <= 0) {
      set('items', form.items.filter(i => i.product_id !== product_id));
    } else {
      set('items', form.items.map(i => i.product_id === product_id ? { ...i, quantity: qty } : i));
    }
  };

  const save = async () => {
    if (!form.customer_id || form.items.length === 0) return;
    setSaving(true);
    await base44.entities.Return.create({
      customer_id: form.customer_id,
      customer_name: form.customer_name,
      pickup_date: form.pickup_date,
      items: form.items,
      notes: form.notes,
      status: 'open',
      agent_name: user?.full_name || user?.email || '',
    });
    await load();
    setShowForm(false);
    setForm({ customer_id: '', customer_name: '', pickup_date: format(new Date(), 'dd-MM-yyyy'), items: [], notes: '' });
    setSaving(false);
  };

  const sendEmail = async (ret) => {
    setSending(ret.id);
    const itemsHtml = ret.items.map((i, idx) =>
      `<tr><td style="padding:4px 8px;border-bottom:1px solid #eee;">${idx + 1}</td><td style="padding:4px 8px;border-bottom:1px solid #eee;">${i.sku || ''}</td><td style="padding:4px 8px;border-bottom:1px solid #eee;">${i.product_name}</td><td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td></tr>`
    ).join('');

    const html = `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#7c3aed">החזרה ${ret.return_number}</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <tr><td style="padding:4px 8px;color:#666">לקוח:</td><td style="padding:4px 8px;font-weight:bold">${ret.customer_name}</td></tr>
        <tr><td style="padding:4px 8px;color:#666">תאריך איסוף:</td><td style="padding:4px 8px">${ret.pickup_date || ''}</td></tr>
        <tr><td style="padding:4px 8px;color:#666">סוכן:</td><td style="padding:4px 8px">${ret.agent_name || ''}</td></tr>
      </table>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#f3f0ff"><th style="padding:8px;text-align:right">#</th><th style="padding:8px;text-align:right">מק"ט</th><th style="padding:8px;text-align:right">פריט</th><th style="padding:8px;text-align:center">כמות</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      ${ret.notes ? `<p style="margin-top:16px"><strong>הערות:</strong> ${ret.notes}</p>` : ''}
    </div>`;

    try {
      const { supabase } = await import('@/api/supabaseClient');
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('https://rdvvkefnhgegcviluokx.supabase.co/functions/v1/sendOrderEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ html, subject: `החזרה ${ret.return_number} - ${ret.customer_name}` }),
      });
    } catch (e) { console.error(e); }
    setSending(null);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><img src="https://media.base44.com/images/public/69cbdbfb3ccb589826de82bf/2c09fa58d_SHIN_SHIN_transparent.png" alt="טוען..." className="h-16 animate-pulse" /></div>;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-center w-full">החזרות</h1>
      </div>

      <Button onClick={() => setShowForm(true)} className="w-full gap-2">
        <Plus className="w-4 h-4" /> החזרה חדשה
      </Button>

      <div className="space-y-3">
        {returns.map(ret => (
          <div key={ret.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary">{ret.return_number}</span>
              <span className="text-sm text-muted-foreground">{ret.pickup_date ? ret.pickup_date.split('-').reverse().join('-') : ''}</span>
            </div>
            <div className="font-medium mt-1">{ret.customer_name}</div>
            <div className="text-sm text-muted-foreground">{ret.items?.length || 0} פריטים</div>
            {ret.notes && <div className="text-sm text-muted-foreground mt-1">{ret.notes}</div>}
            <div className="flex justify-center mt-2"><Button variant="outline" size="sm" className="gap-1" onClick={() => sendEmail(ret)} disabled={sending === ret.id}>
              <Send className="w-3 h-3" /> {sending === ret.id ? 'שולח...' : 'שלח במייל'}
            </Button></div>
          </div>
        ))}
        {returns.length === 0 && <p className="text-center text-muted-foreground py-8">אין החזרות</p>}
      </div>

      <Dialog open={showForm} onOpenChange={v => { if (!v) setShowForm(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0" dir="rtl">
          <DialogTitle className="text-center p-4 border-b">החזרה חדשה</DialogTitle>
          <div className="p-4 space-y-4">
            <div>
              <Label>לקוח</Label>
              <Select value={form.customer_id} onValueChange={v => { const c = customers.find(c => c.id === v); set('customer_id', v); set('customer_name', c?.name || ''); }}>
                <SelectTrigger className="mt-1" dir="rtl"><SelectValue placeholder="בחר לקוח" /></SelectTrigger>
                <SelectContent dir="rtl">{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>תאריך איסוף</Label>
              <Input type="date" value={form.pickup_date} onChange={e => set('pickup_date', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>פריטים</Label>
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חפש מוצר..." className="mt-1" />
              <div className="max-h-40 overflow-y-auto border border-border rounded-lg mt-1">
                {filteredProducts.slice(0, 20).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer border-b last:border-0" onClick={() => addItem(p)}>
                    <span className="text-sm">{p.name}</span>
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                ))}
              </div>
              {form.items.length > 0 && (
                <div className="mt-2 space-y-1">
                  {form.items.map(item => (
                    <div key={item.product_id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <span className="flex-1 text-sm">{item.product_name}</span>
                      <button onClick={() => updateQty(item.product_id, item.quantity - 1)} className="w-6 h-6 rounded bg-background border flex items-center justify-center">-</button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button onClick={() => updateQty(item.product_id, item.quantity + 1)} className="w-6 h-6 rounded bg-background border flex items-center justify-center">+</button>
                      <button onClick={() => set('items', form.items.filter(i => i.product_id !== item.product_id))} className="text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>הערות</Label>
              <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="mt-1 resize-none" />
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving || !form.customer_id || form.items.length === 0} className="flex-1">{saving ? 'שומר...' : 'שמור החזרה'}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">ביטול</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
