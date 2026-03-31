import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Search, CreditCard, ChevronDown, ChevronUp, Plus, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

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

function DebtCard({ debt, onPayment }) {
  const [open, setOpen] = useState(false);
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
          </div>
          {/* Progress bar */}
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
          {debt.notes && <div className="text-xs text-muted-foreground bg-white rounded-lg p-2 border border-border">💬 {debt.notes}</div>}
          {debt.status !== 'paid' && (
            <Button size="sm" onClick={() => onPayment(debt)} className="gap-1.5 w-full">
              <CreditCard className="w-4 h-4" />
              רשום תשלום
            </Button>
          )}
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
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">חובות וגבייה</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
          <div className="text-xs text-muted-foreground">סה"כ חובות פתוחים</div>
          <div className="text-2xl font-bold text-destructive mt-1">₪{totalOpen.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">{debts.filter(d => d.status !== 'paid').length} לקוחות</div>
        </div>
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
          <div className="text-xs text-muted-foreground">חובות באיחור</div>
          <div className="text-2xl font-bold text-warning mt-1">₪{totalOverdue.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">{debts.filter(d => d.status === 'overdue').length} לקוחות</div>
        </div>
      </div>

      {/* Status filters */}
      <div className="grid grid-cols-4 gap-1.5">
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
              'rounded-xl py-2 text-xs font-medium border transition-all',
              statusFilter === key ? 'border-primary bg-accent text-primary' : 'border-border bg-card text-muted-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש לקוח / הזמנה..." className="pr-9" />
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