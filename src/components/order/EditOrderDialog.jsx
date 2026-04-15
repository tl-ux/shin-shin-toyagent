import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Minus, Plus, Trash2, Save } from 'lucide-react';
import { base44 } from '@/api/supabaseClient';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'טיוטה' },
  { value: 'confirmed', label: 'מאושר' },
  { value: 'delivered', label: 'נמסר' },
  { value: 'cancelled', label: 'בוטל' },
];

export default function EditOrderDialog({ order, onClose, onSave }) {
  const [form, setForm] = useState({
    status: order.status,
    notes: order.notes || '',
    items: order.items ? [...order.items] : [],
    delivery_date: order.delivery_date || '',
    customer_id: order.customer_id || '',
    customer_name: order.customer_name || '',
  });
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    base44.entities.Customer.filter({ is_active: true }).then(setCustomers);
  }, []);
  const [saving, setSaving] = useState(false);
  

  const updateQty = (idx, qty) => {
    if (qty <= 0) {
      setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
      return;
    }
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === idx ? { ...item, quantity: qty, total: qty * item.unit_price } : item
      ),
    }));
  };

  const totalAmount = form.items.reduce((s, i) => s + (i.total || 0), 0);

  const save = async () => {
    setSaving(true);
    await base44.entities.Order.update(order.id, {
      status: form.status,
      notes: form.notes,
      items: form.items,
      total_amount: totalAmount,
      customer_id: form.customer_id,
      customer_name: form.customer_name,
      delivery_date: form.delivery_date || null,
    });
    toast('ההזמנה עודכנה בהצלחה');
    onSave();
  };

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader className="text-center">
        <DialogTitle className="text-center">עריכת הזמנה {order.order_number}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div>
          <Label>לקוח</Label>
          <Select
            value={form.customer_id}
            onValueChange={(val) => {
              const c = customers.find(c => c.id === val);
              if (c) setForm(p => ({ ...p, customer_id: c.id, customer_name: c.name }));
            }}
          >
            <SelectTrigger className="mt-1" dir="rtl">
              <SelectValue placeholder="בחר לקוח" />
            </SelectTrigger>
            <SelectContent>
              {customers.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>סטטוס</Label>
          <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
            <SelectTrigger className="mt-1" dir="rtl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>פריטים ({form.items.length})</Label>
          <div className="space-y-2 mt-1">
            {form.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-muted/50 rounded-xl p-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.product_name}</div>
                  <div className="text-xs text-muted-foreground">₪{item.unit_price} ליח'</div>
                </div>
                <div className="flex items-center gap-1 bg-white rounded-lg p-0.5">
                  <button onClick={() => updateQty(idx, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center text-sm font-bold">{item.quantity}</span>
                  <button onClick={() => updateQty(idx, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-sm font-bold text-primary w-16 text-left">₪{(item.total || 0).toLocaleString()}</div>
                <button onClick={() => updateQty(idx, 0)} className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>תאריך משלוח רצוי</Label>
          <input
            type="date"
            value={form.delivery_date}
            onChange={e => setForm(p => ({ ...p, delivery_date: e.target.value }))}
            className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            dir="ltr"
          />
        </div>

        <div>
          <Label>הערות</Label>
          <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="mt-1 resize-none" />
        </div>

        <div className="bg-primary/5 rounded-xl p-3 flex justify-between items-center">
          <span className="text-muted-foreground font-medium">סה"כ</span>
          <span className="text-xl font-bold text-primary">₪{totalAmount.toLocaleString()}</span>
        </div>

        <div className="flex gap-3">
          <Button onClick={save} disabled={saving} className="flex-1 gap-1">
            <Save className="w-4 h-4" />
            {saving ? 'שומר...' : 'שמור שינויים'}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">ביטול</Button>
        </div>
      </div>
    </DialogContent>
  );
}