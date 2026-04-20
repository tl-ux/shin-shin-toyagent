import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format, differenceInDays } from 'date-fns';
import { Search, CreditCard, ChevronDown, ChevronUp, Check, MessageCircle, FileDown, History } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import jsPDF from 'jspdf';

const STATUS_MAP = {
  open: { label: 'פתוח', color: 'bg-destructive/10 text-destructive' },
  partially_paid: { label: 'שולם חלקית', color: 'bg-warning/10 text-warning' },
  paid: { label: 'שולם', color: 'bg-success/10 text-success' },
  overdue: { label: 'באיחור', color: 'bg-destructive/10 text-destructive border border-destructive/30' },
};

function PaymentDialog({ debt, onClose, onSave }) {
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handlePay = async () => {
    const paid = parseFloat(amount);
    if (!paid || paid <= 0) return;
    setSaving(true);
    const newAmountPaid = (debt.amount_paid || 0) + paid;
    const newBalance = debt.amount - newAmountPaid;
    let newStatus = 'partially_paid';
    if (newBalance <= 0) newStatus = 'paid';
    await base44.entities.Debt.update(debt.id, {
      amount_paid: newAmountPaid,
      balance_due: Math.max(0, newBalance),
      status: newStatus,
    });
    await base44.entities.PaymentHistory.create({
      debt_id: debt.id,
      customer_id: debt.customer_id,
      customer_name: debt.customer_name,
      order_number: debt.order_number,
      amount: paid,
      payment_date: new Date().toISOString().split('T')[0],
    });
    toast({ description: `תשלום של ₪${paid.toLocaleString()} נרשם בהצלחה` });
    onSave();
  };

  return (
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>רישום תשלום</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="bg-muted rounded-xl p-3 text-sm">
          <div className="flex justify-between"><span>לקוח:</span><span className="font-semibold">{debt.customer_name}</span></div>
          <div className="flex justify-between mt-1"><span>הזמנה:</span><span>{debt.order_number}</span></div>
          <div className="flex justify-between mt-1"><span>יתרה לתשלום:</span><span className="font-bold text-destructive">₪{(debt.balance_due || 0).toLocaleString()}</span></div>
        </div>
        <div>
          <Label>סכום ששולם (₪)</Label>
          <Input
            value={amount}
            onChange={e => setAmount(e.target.value)}
            type="number"
            placeholder="0"
            className="mt-1"
            dir="ltr"
            max={debt.balance_due}
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">ביטול</Button>
          <Button onClick={handlePay} disabled={saving || !amount} className="flex-1 gap-1">
            <Check className="w-4 h-4" />
            {saving ? 'שומר...' : 'אשר תשלום'}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

function agingLabel(debt) {
  if (debt.status === 'paid') return null;
  const created = debt.created_at ? new Date(debt.created_at) : null;
  if (!created || isNaN(created.getTime())) return null;
  const days = differenceInDays(new Date(), created);
  if (days < 30) return { label: `${days} ימים`, color: 'text-success' };
  if (days < 60) return { label: `${days} ימים`, color: 'text-warning' };
  return { label: `${days} ימים`, color: 'text-destructive font-bold' };
}

function exportDebtsExcel(debts) {
  const rows = [
    ['לקוח', 'הזמנה', 'סכום מקורי', 'שולם', 'יתרה', 'ימים פתוח', 'סטטוס'],
    ...debts.map(d => [
      d.customer_name || '',
      d.order_number || '',
      d.amount || 0,
      d.amount_paid || 0,
      d.balance_due || 0,
      differenceInDays(new Date(), new Date(d.created_at)),
      STATUS_MAP[d.status]?.label || d.status,
    ])
  ];
  const ws = rows.map(r => r.join('\t')).join('\n');
  const blob = new Blob(['\uFEFF' + ws], { type: 'text/tab-separated-values;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `debts-${format(new Date(), 'yyyy-MM-dd')}.xls`; a.click();
  URL.revokeObjectURL(url);
}

function exportDebtsPDF(debts) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  doc.setFont('helvetica');
  doc.setFontSize(16);
  doc.setTextColor(26, 86, 168);
  doc.text('Debts Report', 105, 18, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const total = debts.reduce((s, d) => s + (d.balance_due || 0), 0);
  doc.text(`Total open: ${total.toLocaleString()} ILS  |  Count: ${debts.length}`, 14, 28);

  let y = 38;
  doc.setFillColor(240, 244, 255);
  doc.rect(14, y - 5, 182, 8, 'F');
  doc.setFontSize(9);
  doc.setTextColor(26, 86, 168);
  doc.text('Customer', 16, y); doc.text('Order', 80, y); doc.text('Days', 115, y); doc.text('Status', 135, y); doc.text('Balance', 185, y, { align: 'right' });
  y += 7;
  doc.setTextColor(40, 40, 40);
  debts.forEach((d, idx) => {
    if (y > 275) { doc.addPage(); y = 20; }
    if (idx % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(14, y - 4, 182, 7, 'F'); }
    doc.setFontSize(8.5);
    doc.text((d.customer_name || '').substring(0, 30), 16, y);
    doc.text(d.order_number || '-', 80, y);
    const days = differenceInDays(new Date(), new Date(d.created_at));
    doc.text(String(days), 115, y);
    doc.text(d.status || '-', 135, y);
    doc.text(`${(d.balance_due || 0).toLocaleString()}`, 196, y, { align: 'right' });
    y += 8;
  });
  doc.save(`debts-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

function PaymentHistoryModal({ debt, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.PaymentHistory.filter({ debt_id: debt.id }, '-created_date')
      .then(h => { setHistory(h); setLoading(false); });
  }, [debt.id]);

  return (
    <DialogContent className="max-w-sm">
      <DialogHeader><DialogTitle>היסטוריית תשלומים - {debt.customer_name}</DialogTitle></DialogHeader>
      <div className="space-y-2 pt-2 max-h-72 overflow-y-auto">
        {loading && <div className="text-center text-muted-foreground py-4">טוען...</div>}
        {!loading && history.length === 0 && <div className="text-center text-muted-foreground py-6">אין תשלומים רשומים</div>}
        {history.map((h, i) => (
          <div key={h.id || i} className="flex items-center justify-between bg-muted/50 rounded-lg p-3 text-sm">
            <div>
              <div className="font-medium text-success">₪{(h.amount || 0).toLocaleString()}</div>
              {h.notes && <div className="text-xs text-muted-foreground">{h.notes}</div>}
            </div>
            <div className="text-xs text-muted-foreground">{h.payment_date ? format(new Date(h.payment_date), 'dd/MM/yyyy') : format(new Date(h.created_date), 'dd/MM/yyyy')}</div>
          </div>
        ))}
        <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
          <span>סה"כ שולם:</span>
          <span className="text-success">₪{(debt.amount_paid || 0).toLocaleString()}</span>
        </div>
      </div>
    </DialogContent>
  );
}

function DebtCard({ debt, onPayment }) {
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const st = STATUS_MAP[debt.status] || STATUS_MAP.open;
  const paidPercent = debt.amount > 0 ? Math.min(100, ((debt.amount_paid || 0) / debt.amount) * 100) : 0;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <button className="w-full text-right p-4 flex items-start gap-3" onClick={() => setOpen(!open)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-foreground">{debt.customer_name}</span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', st.color)}>{st.label}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex gap-3 flex-wrap">
            {debt.order_number && <span>הזמנה: {debt.order_number}</span>}
            {debt.due_date && <span>יעד: {format(new Date(debt.due_date), 'dd/MM/yyyy')}</span>}
            {debt.collection_date && <span className={differenceInDays(new Date(debt.collection_date), new Date()) <= 1 ? 'text-destructive font-medium' : ''}>גבייה: {format(new Date(debt.collection_date), 'dd/MM/yyyy')}</span>}
          </div>
          <div className="mt-2 bg-muted rounded-full h-1.5 w-full">
            <div
              className="bg-success h-1.5 rounded-full transition-all"
              style={{ width: `${paidPercent}%` }}
            />
          </div>
        </div>
        <div className="text-left flex flex-col items-end gap-1">
          <span className="font-bold text-destructive text-lg">₪{(debt.balance_due || 0).toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">מתוך ₪{(debt.amount || 0).toLocaleString()}</span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-4 py-3 bg-muted/30 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted-foreground">סכום מקורי: </span><span className="font-medium">₪{(debt.amount || 0).toLocaleString()}</span></div>
            <div><span className="text-muted-foreground">שולם: </span><span className="font-medium text-success">₪{(debt.amount_paid || 0).toLocaleString()}</span></div>
          </div>
          {(() => { const a = agingLabel(debt); return a ? <div className="text-xs text-muted-foreground">גיל חוב: <span className={a.color}>{a.label}</span></div> : null; })()}
          {debt.notes && <div className="text-xs text-muted-foreground bg-white rounded-lg p-2 border border-border">💬 {debt.notes}</div>}
          <div className="flex gap-2 flex-wrap">
            {(debt.amount_paid > 0) && (
              <Button size="sm" variant="outline" onClick={() => setHistoryOpen(true)} className="gap-1.5">
                <History className="w-4 h-4" />
                היסטוריה
              </Button>
            )}
            {debt.status !== 'paid' && (
              <>
                <div className="flex items-center gap-2 w-full mb-2">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">תאריך גבייה</label>
                  <input type="date" defaultValue={debt.collection_date || ''} className="flex-1 text-xs border border-border rounded px-2 py-1" onChange={async e => {
                    await base44.entities.Debt.update(debt.id, { collection_date: e.target.value || null });
                  }} />
                </div>
                <Button size="sm" onClick={() => onPayment(debt)} className="gap-1.5 flex-1">
                  <CreditCard className="w-4 h-4" />
                  רשום תשלום
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  const msg = `שלום ${debt.customer_name}, יש יתרה פתוחה בסך ₪${(debt.balance_due||0).toLocaleString()} עבור הזמנה ${debt.order_number||''}. נא לסדר את התשלום. תודה!`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                }} className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50">
                  <MessageCircle className="w-4 h-4" />
                  וואטסאפ
                </Button>
              </>
            )}
          </div>
          <Dialog open={historyOpen} onOpenChange={v => { if (!v) setHistoryOpen(false); }}>
            {historyOpen && <PaymentHistoryModal debt={debt} onClose={() => setHistoryOpen(false)} />}
          </Dialog>
        </div>
      )}
    </div>
  );
}

export default function Debts() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [payingDebt, setPayingDebt] = useState(null);

  const load = () => base44.entities.Debt.list('-created_date', 200).then(d => { setDebts(d); setLoading(false); });
  useEffect(() => { load(); }, []);

  const filtered = debts.filter(d => {
    const matchSearch = (d.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.order_number || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalOpen = debts.filter(d => d.status !== 'paid').reduce((s, d) => s + (d.balance_due || 0), 0);
  const totalOverdue = debts.filter(d => d.status === 'overdue').reduce((s, d) => s + (d.balance_due || 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <img src="https://media.base44.com/images/public/69cbdbfb3ccb589826de82bf/2c09fa58d_SHIN_SHIN_transparent.png" alt="טוען..." className="h-16 animate-pulse" />
    </div>
  );

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-center w-full">חובות וגבייה</h1>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" onClick={() => exportDebtsExcel(filtered.filter(d => d.status !== 'paid'))} className="gap-1.5 text-green-700 border-green-200 hover:bg-green-50">
            <FileDown className="w-4 h-4" />
            Excel
          </Button>

        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
          <div className="text-sm text-muted-foreground text-center">סה"כ חובות פתוחים</div>
          <div className="text-3xl font-bold text-destructive mt-2 text-center">₪{totalOpen.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground mt-2 text-center">{debts.filter(d => d.status !== 'paid').length} לקוחות</div>
        </div>
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
          <div className="text-sm text-muted-foreground text-center">חובות באיחור</div>
          <div className="text-3xl font-bold text-warning mt-2 text-center">₪{totalOverdue.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground mt-2 text-center">{debts.filter(d => d.status === 'overdue').length} לקוחות</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { key: 'all', label: 'הכל' },
          { key: 'open', label: 'פתוח' },
          { key: 'partially_paid', label: 'חלקי' },
          { key: 'overdue', label: 'איחור' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={cn(
              'rounded-xl py-3 text-sm font-medium border transition-all',
              statusFilter === key ? 'border-primary bg-accent text-primary' : 'border-border bg-card text-muted-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש לקוח / הזמנה..." className="pr-9 h-11 text-base" />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>אין חובות פתוחים</p>
          </div>
        )}
        {filtered.map(debt => (
          <DebtCard key={debt.id} debt={debt} onPayment={setPayingDebt} />
        ))}
      </div>

      <Dialog open={!!payingDebt} onOpenChange={v => { if (!v) setPayingDebt(null); }}>
        {payingDebt && (
          <PaymentDialog
            debt={payingDebt}
            onClose={() => setPayingDebt(null)}
            onSave={() => { setPayingDebt(null); load(); }}
          />
        )}
      </Dialog>
    </div>
  );
}