import { useState, useEffect } from 'react';
import { base44 } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Plus, Tag } from 'lucide-react';
import { format } from 'date-fns';

const TYPES = [
  { value: 'percent', label: 'הנחה באחוזים' },
  { value: 'buy_get', label: 'קנה X קבל Y' },
  { value: 'min_qty', label: 'הנחה מכמות' },
  { value: 'customer', label: 'מבצע ללקוח ספציפי' },
];

const EMPTY = {
  name: '', type: 'percent', discount_percent: '', buy_quantity: '', get_quantity: '',
  min_quantity: '', discounted_price: '', applies_to: 'all', category: '',
  customer_id: '', customer_name: '', product_id: '', product_name: '',
  start_date: format(new Date(), 'yyyy-MM-dd'), end_date: '', is_active: true,
};

export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [p, c, pr, cats] = await Promise.all([
      base44.entities.Promotion.list('-created_at'),
      base44.entities.Customer.list(),
      base44.entities.Product.list(),
      base44.entities.Category.list(),
    ]);
    setPromotions(p);
    setCustomers(c);
    setProducts(pr);
    setCategories(cats);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    if (!form.name || !form.type) return;
    setSaving(true);
    await base44.entities.Promotion.create({
      ...form,
      discount_percent: parseFloat(form.discount_percent) || 0,
      buy_quantity: parseInt(form.buy_quantity) || 0,
      get_quantity: parseInt(form.get_quantity) || 0,
      min_quantity: parseInt(form.min_quantity) || 0,
      discounted_price: parseFloat(form.discounted_price) || 0,
    });
    await load();
    setShowForm(false);
    setForm(EMPTY);
    setSaving(false);
  };

  const deletePromo = async (id) => {
    await base44.entities.Promotion.delete(id);
    setPromotions(prev => prev.filter(p => p.id !== id));
  };

  const toggleActive = async (promo) => {
    await base44.entities.Promotion.update(promo.id, { is_active: !promo.is_active });
    setPromotions(prev => prev.map(p => p.id === promo.id ? { ...p, is_active: !p.is_active } : p));
  };

  const describePromo = (p) => {
    if (p.type === 'percent') return `${p.discount_percent}% הנחה`;
    if (p.type === 'buy_get') return `קנה ${p.buy_quantity} קבל ${p.get_quantity}`;
    if (p.type === 'min_qty') return `מעל ${p.min_quantity} יח - ₪${p.discounted_price}`;
    if (p.type === 'customer') return `${p.discount_percent}% ל${p.customer_name || 'לקוח'}`;
    return '';
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-center w-full">ניהול מבצעים</h1>

      <Button onClick={() => setShowForm(true)} className="w-full gap-2">
        <Plus className="w-4 h-4" /> מבצע חדש
      </Button>

      <div className="space-y-3">
        {promotions.map(p => (
          <div key={p.id} className={`bg-card border rounded-xl p-4 ${p.is_active ? 'border-primary/30' : 'border-border opacity-60'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                <span className="font-bold">{p.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(p)} className={`text-xs px-2 py-1 rounded-full ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                  {p.is_active ? 'פעיל' : 'לא פעיל'}
                </button>
                <button onClick={() => deletePromo(p.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground mt-1">{describePromo(p)}</div>
            <div className="flex gap-3 text-xs text-muted-foreground mt-1">
              {p.applies_to === 'category' && <span>קטגוריה: {p.category}</span>}
              {p.applies_to === 'product' && <span>מוצר: {p.product_name}</span>}
              {p.applies_to === 'customer' && <span>לקוח: {p.customer_name}</span>}
              {p.start_date && <span>מ: {p.start_date.split('-').reverse().join('-')}</span>}
              {p.end_date && <span>עד: {p.end_date.split('-').reverse().join('-')}</span>}
            </div>
          </div>
        ))}
        {promotions.length === 0 && <p className="text-center text-muted-foreground py-8">אין מבצעים</p>}
      </div>

      <Dialog open={showForm} onOpenChange={v => { if (!v) setShowForm(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0" dir="rtl">
          <DialogTitle className="text-center p-4 border-b">מבצע חדש</DialogTitle>
          <div className="p-4 space-y-4">
            <div>
              <Label>שם המבצע</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="למשל: מבצע קיץ" className="mt-1" />
            </div>
            <div>
              <Label>סוג מבצע</Label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger className="mt-1" dir="rtl"><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl">
                  {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {form.type === 'percent' && (
              <div>
                <Label>אחוז הנחה</Label>
                <Input type="number" value={form.discount_percent} onChange={e => set('discount_percent', e.target.value)} placeholder="10" className="mt-1" dir="ltr" />
              </div>
            )}
            {form.type === 'buy_get' && (
              <div className="grid grid-cols-2 gap-2">
                <div><Label>קנה כמות</Label><Input type="number" value={form.buy_quantity} onChange={e => set('buy_quantity', e.target.value)} className="mt-1" dir="ltr" /></div>
                <div><Label>קבל כמות</Label><Input type="number" value={form.get_quantity} onChange={e => set('get_quantity', e.target.value)} className="mt-1" dir="ltr" /></div>
              </div>
            )}
            {form.type === 'min_qty' && (
              <div className="grid grid-cols-2 gap-2">
                <div><Label>כמות מינימום</Label><Input type="number" value={form.min_quantity} onChange={e => set('min_quantity', e.target.value)} className="mt-1" dir="ltr" /></div>
                <div><Label>מחיר מוזל (₪)</Label><Input type="number" value={form.discounted_price} onChange={e => set('discounted_price', e.target.value)} className="mt-1" dir="ltr" /></div>
              </div>
            )}
            {form.type === 'customer' && (
              <div className="space-y-2">
                <div>
                  <Label>לקוח</Label>
                  <Select value={form.customer_id} onValueChange={v => { const c = customers.find(x => x.id === v); set('customer_id', v); set('customer_name', c?.name || ''); set('applies_to', 'customer'); }}>
                    <SelectTrigger className="mt-1" dir="rtl"><SelectValue placeholder="בחר לקוח" /></SelectTrigger>
                    <SelectContent dir="rtl">{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>אחוז הנחה</Label><Input type="number" value={form.discount_percent} onChange={e => set('discount_percent', e.target.value)} placeholder="10" className="mt-1" dir="ltr" /></div>
              </div>
            )}

            {form.type !== 'customer' && (
              <div>
                <Label>חל על</Label>
                <Select value={form.applies_to} onValueChange={v => set('applies_to', v)}>
                  <SelectTrigger className="mt-1" dir="rtl"><SelectValue /></SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="all">כל המוצרים</SelectItem>
                    <SelectItem value="category">קטגוריה</SelectItem>
                    <SelectItem value="product">מוצר ספציפי</SelectItem>
                  </SelectContent>
                </Select>
                {form.applies_to === 'category' && (
                  <Select value={form.category} onValueChange={v => set('category', v)}>
                    <SelectTrigger className="mt-1" dir="rtl"><SelectValue placeholder="בחר קטגוריה" /></SelectTrigger>
                    <SelectContent dir="rtl">{categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                )}
                {form.applies_to === 'product' && (
                  <Select value={form.product_id} onValueChange={v => { const p = products.find(x => x.id === v); set('product_id', v); set('product_name', p?.name || ''); }}>
                    <SelectTrigger className="mt-1" dir="rtl"><SelectValue placeholder="בחר מוצר" /></SelectTrigger>
                    <SelectContent dir="rtl">{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div><Label>תאריך התחלה</Label><Input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className="mt-1" /></div>
              <div><Label>תאריך סיום</Label><Input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} className="mt-1" /></div>
            </div>

            <div className="flex gap-2">
              <Button onClick={save} disabled={saving || !form.name} className="flex-1">{saving ? 'שומר...' : 'שמור מבצע'}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">ביטול</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
