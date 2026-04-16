import { useState } from 'react';
import { Minus, Plus, Trash2, CheckCircle, ArrowRight, BookmarkCheck, BookOpen, MessageCircle, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { SaveTemplateDialog, LoadTemplateDialog } from '@/components/order/OrderTemplates';
import * as XLSX from 'xlsx';

export default function OrderCart({ cart, customer, totalAmount, onUpdateQty, onRemove, onSubmit, onBackToCatalog, onLoadTemplate, onDeleteDraft }) {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [loadTemplateOpen, setLoadTemplateOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    const order = await onSubmit(notes);
    setDone(true);
    setCompletedOrder(order);
  };

  const sendWhatsApp = () => {
    if (!customer?.phone) return;
    const lines = [
      `שלום ${customer.name}, אישור הזמנה:`,
      '',
      ...cart.map(i => `• ${i.product_name} × ${i.quantity} = ₪${(i.total || 0).toLocaleString()}`),
      '',
      `סה"כ: ₪${totalAmount.toLocaleString()}`,
      notes ? `הערות: ${notes}` : '',
    ].filter(l => l !== undefined);
    const phone = customer.phone.replace(/\D/g, '');
    const fullPhone = phone.startsWith('0') ? `972${phone.slice(1)}` : phone;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  };

  const downloadExcel = () => {
    const data = [
      ['הזמנה', customer?.name || 'ללא לקוח'],
      ['תאריך', new Date().toLocaleDateString('he-IL')],
      ['הערות', notes || ''],
      [],
      ['שם פריט', 'מק"ט', 'כמות', 'מחיר ליחידה', 'סך הכל'],
      ...cart.map(i => [i.product_name, i.sku || '', i.quantity, i.unit_price, i.total]),
      [],
      ['סה"כ', '', '', '', totalAmount],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'הזמנה');
    XLSX.writeFile(wb, `order-${customer?.name || 'order'}.xlsx`);
  };

  if (done) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <CheckCircle className="w-20 h-20 text-success mb-4" />
      <h2 className="text-2xl font-bold mb-2">ההזמנה נשלחה!</h2>
      <p className="text-muted-foreground mb-6">ההזמנה עבור {customer?.name} נרשמה בהצלחה</p>
      <div className="flex gap-3 flex-wrap justify-center">
        {customer?.phone && (
          <Button variant="outline" onClick={sendWhatsApp} className="gap-2 text-green-600 border-green-200 hover:bg-green-50">
            <MessageCircle className="w-4 h-4" />
            שלח ב-WhatsApp
          </Button>
        )}
        <Button variant="outline" onClick={downloadExcel} className="gap-2">
          <FileDown className="w-4 h-4" />
          הורדה כ-Excel
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-4 pb-6">
      {/* Customer */}
      <div className="bg-accent rounded-xl p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
          {customer?.name?.[0] || '?'}
        </div>
        <div>
          <div className="font-semibold text-foreground">{customer?.name || 'לא נבחר לקוח'}</div>
          {customer?.city && <div className="text-xs text-muted-foreground">{customer.city}</div>}
        </div>
      </div>



      {/* Items */}
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground">פריטים ({cart.length})</h3>
        {cart.map(item => (
          <div key={item.product_id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{item.product_name}</div>
              {item.sku && <div className="text-xs text-muted-foreground">מק"ט: {item.sku}</div>}
              <div className="text-xs text-muted-foreground mt-0.5">₪{item.unit_price.toLocaleString()} ליחידה</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                <button
                  onClick={() => onUpdateQty(item.product_id, item.quantity - 1)}
                  className="w-7 h-7 rounded flex items-center justify-center hover:bg-white transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQty(item.product_id, item.quantity + 1)}
                  className="w-7 h-7 rounded flex items-center justify-center hover:bg-white transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="text-sm font-bold text-primary w-16 text-left">₪{item.total.toLocaleString()}</div>
              <button onClick={() => onRemove(item.product_id)} className="text-destructive hover:text-destructive/80">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">הערות להזמנה</label>
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="הוסף הערות..."
          rows={2}
          className="resize-none"
        />
      </div>

      {/* Total */}
      <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
        <div className="flex justify-between items-center">
          <span className="font-medium text-muted-foreground">סה"כ</span>
          <span className="text-2xl font-bold text-primary">₪{totalAmount.toLocaleString()}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {cart.reduce((s, i) => s + i.quantity, 0)} פריטים
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBackToCatalog} className="flex-1 gap-1">
          <ArrowRight className="w-4 h-4" />
          חזרה לקטלוג
        </Button>
        <Button variant="outline" onClick={onDeleteDraft} className="flex-1 gap-1 text-destructive border-destructive hover:bg-destructive/10">
          <Trash2 className="w-4 h-4" />
          מחק הזמנה
        </Button>
        <Button variant="outline" onClick={downloadExcel} disabled={cart.length === 0} className="flex-1 gap-1">
          <FileDown className="w-4 h-4" />
          Excel
        </Button>
        <Button onClick={handleSubmit} disabled={submitting || cart.length === 0} className="flex-1">
          {submitting ? 'שולח...' : 'אשר הזמנה'}
        </Button>
      </div>

      {/* Dialogs */}
      <Dialog open={saveTemplateOpen} onOpenChange={v => { if (!v) setSaveTemplateOpen(false); }}>
        {saveTemplateOpen && (
          <SaveTemplateDialog
            cart={cart}
            customer={customer}
            onClose={() => setSaveTemplateOpen(false)}
            onSaved={() => setSaveTemplateOpen(false)}
          />
        )}
      </Dialog>

      <Dialog open={loadTemplateOpen} onOpenChange={v => { if (!v) setLoadTemplateOpen(false); }}>
        {loadTemplateOpen && (
          <LoadTemplateDialog
            onLoad={(template) => { onLoadTemplate && onLoadTemplate(template); }}
            onClose={() => setLoadTemplateOpen(false)}
          />
        )}
      </Dialog>
    </div>
  );
}