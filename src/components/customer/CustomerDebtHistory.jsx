import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { CreditCard, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_MAP = {
  open: { label: 'פתוח', color: 'bg-destructive/10 text-destructive' },
  partially_paid: { label: 'שולם חלקית', color: 'bg-warning/10 text-warning' },
  paid: { label: 'שולם', color: 'bg-success/10 text-success' },
  overdue: { label: 'באיחור', color: 'bg-destructive/10 text-destructive' },
};

export default function CustomerDebtHistory({ customerId }) {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId) return;
    base44.entities.Debt.filter({ customer_id: customerId }, '-created_date').then(d => {
      setDebts(d);
      setLoading(false);
    });
  }, [customerId]);

  if (loading) return <div className="py-4 text-center text-sm text-muted-foreground">טוען...</div>;

  const totalBalance = debts.filter(d => d.status !== 'paid').reduce((s, d) => s + (d.balance_due || 0), 0);

  return (
    <div className="space-y-3">
      {totalBalance > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-destructive font-medium">
            <TrendingDown className="w-4 h-4" />
            יתרת חוב פתוחה
          </div>
          <span className="text-lg font-bold text-destructive">₪{totalBalance.toLocaleString()}</span>
        </div>
      )}

      {debts.length === 0 && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
          אין היסטוריית חובות
        </div>
      )}

      {debts.map(debt => {
        const st = STATUS_MAP[debt.status] || STATUS_MAP.open;
        return (
          <div key={debt.id} className="bg-card border border-border rounded-xl p-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{debt.order_number || 'ללא מספר'}</span>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', st.color)}>{st.label}</span>
                </div>
                {debt.created_date && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(debt.created_date), 'dd/MM/yyyy')}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-foreground">₪{(debt.amount || 0).toLocaleString()}</div>
                {debt.status !== 'paid' && (
                  <div className="text-xs text-destructive">יתרה: ₪{(debt.balance_due || 0).toLocaleString()}</div>
                )}
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-2 bg-muted rounded-full h-1.5">
              <div
                className="bg-success h-1.5 rounded-full transition-all"
                style={{ width: `${debt.amount > 0 ? Math.min(100, ((debt.amount_paid || 0) / debt.amount) * 100) : 0}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}