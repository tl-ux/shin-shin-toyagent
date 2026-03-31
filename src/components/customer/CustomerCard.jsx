import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Phone, MapPin, ShoppingCart, CreditCard, TrendingUp } from 'lucide-react';
import CustomerDebtHistory from './CustomerDebtHistory';

export default function CustomerCard({ customer, priceGroups }) {
  const [orders, setOrders] = useState([]);
  const [openDebt, setOpenDebt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('info'); // 'info' | 'debts'

  useEffect(() => {
    Promise.all([
      base44.entities.Order.filter({ customer_id: customer.id }, '-created_date', 5),
      base44.entities.Debt.filter({ customer_id: customer.id }),
    ]).then(([ords, debts]) => {
      setOrders(ords);
      setOpenDebt(debts.filter(d => d.status !== 'paid').reduce((s, d) => s + (d.balance_due || 0), 0));
      setLoading(false);
    });
  }, [customer.id]);

  const totalPurchases = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total_amount || 0), 0);
  const groupName = priceGroups.find(g => g.id === customer.price_group_id)?.name;

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-primary/5 rounded-xl p-3 text-center">
          <ShoppingCart className="w-4 h-4 text-primary mx-auto mb-1" />
          <div className="text-sm font-bold text-primary">₪{totalPurchases.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">סה"כ רכישות</div>
        </div>
        <div className="bg-muted rounded-xl p-3 text-center">
          <TrendingUp className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
          <div className="text-sm font-bold">{orders.length}</div>
          <div className="text-xs text-muted-foreground">הזמנות אחרונות</div>
        </div>
        <div className={`rounded-xl p-3 text-center ${openDebt > 0 ? 'bg-destructive/5' : 'bg-success/5'}`}>
          <CreditCard className={`w-4 h-4 mx-auto mb-1 ${openDebt > 0 ? 'text-destructive' : 'text-success'}`} />
          <div className={`text-sm font-bold ${openDebt > 0 ? 'text-destructive' : 'text-success'}`}>
            {openDebt > 0 ? `₪${openDebt.toLocaleString()}` : '✓'}
          </div>
          <div className="text-xs text-muted-foreground">חוב פתוח</div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-sm">
        {customer.contact_name && <div className="flex gap-2 text-muted-foreground"><span>איש קשר:</span><span className="text-foreground font-medium">{customer.contact_name}</span></div>}
        {customer.phone && (
          <a href={`tel:${customer.phone}`} className="flex gap-2 text-muted-foreground hover:text-primary transition-colors">
            <Phone className="w-4 h-4 flex-shrink-0" /><span dir="ltr">{customer.phone}</span>
          </a>
        )}
        {customer.city && <div className="flex gap-2 text-muted-foreground"><MapPin className="w-4 h-4 flex-shrink-0" /><span>{customer.city} {customer.address}</span></div>}
        {groupName && <div className="flex gap-2 text-muted-foreground"><span>קבוצת מחיר:</span><span className="bg-accent text-accent-foreground px-1.5 py-0.5 rounded text-xs font-medium">{groupName}</span></div>}
        {customer.notes && <div className="text-muted-foreground bg-muted/50 rounded-lg p-2 text-xs">💬 {customer.notes}</div>}
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-2 border-b border-border mb-3">
          {[{ key: 'info', label: 'הזמנות אחרונות' }, { key: 'debts', label: 'היסטוריית חובות' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'info' && (
          <div className="space-y-2">
            {loading && <div className="text-center text-sm text-muted-foreground py-4">טוען...</div>}
            {!loading && orders.length === 0 && <div className="text-center text-sm text-muted-foreground py-4">אין הזמנות</div>}
            {orders.map(o => (
              <div key={o.id} className="bg-muted/40 rounded-xl p-3 flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium">{o.order_number}</div>
                  <div className="text-xs text-muted-foreground">{o.visit_date}</div>
                </div>
                <div className="text-sm font-bold text-primary">₪{(o.total_amount || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'debts' && <CustomerDebtHistory customerId={customer.id} />}
      </div>
    </div>
  );
}