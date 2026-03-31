import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Package, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import OrderShareMenu from '@/components/order/OrderShareMenu';

const STATUS_MAP = {
  draft: { label: 'טיוטה', color: 'bg-muted text-muted-foreground' },
  confirmed: { label: 'מאושר', color: 'bg-success/10 text-success' },
  delivered: { label: 'נמסר', color: 'bg-primary/10 text-primary' },
  cancelled: { label: 'בוטל', color: 'bg-destructive/10 text-destructive' },
};

function OrderCard({ order, officeEmail, officeWhatsapp }) {
  const [open, setOpen] = useState(false);
  const st = STATUS_MAP[order.status] || STATUS_MAP.draft;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <button
        className="w-full text-right p-4 flex items-start gap-3"
        onClick={() => setOpen(!open)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-foreground">{order.customer_name}</span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', st.color)}>{st.label}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex gap-3">
            {order.order_number && <span>{order.order_number}</span>}
            {order.visit_date && <span>{format(new Date(order.visit_date), 'dd/MM/yyyy')}</span>}
            {order.agent_name && <span>סוכן: {order.agent_name}</span>}
          </div>
        </div>
        <div className="text-left flex flex-col items-end gap-1">
          <span className="font-bold text-primary text-lg">₪{(order.total_amount || 0).toLocaleString()}</span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {open && order.items?.length > 0 && (
        <div className="border-t border-border px-4 py-3 bg-muted/30">
          <div className="text-xs font-semibold text-muted-foreground mb-2">פריטי ההזמנה:</div>
          <div className="space-y-1.5">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{item.product_name}</span>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>{item.quantity} יח'</span>
                  <span className="font-medium text-foreground">₪{(item.total || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
          {order.notes && (
            <div className="mt-2 text-xs text-muted-foreground bg-white rounded-lg p-2 border border-border">
              💬 {order.notes}
            </div>
          )}
          <div className="mt-3">
            <OrderShareMenu order={order} officeEmail={officeEmail} officeWhatsapp={officeWhatsapp} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [officeEmail, setOfficeEmail] = useState('');
  const [officeWhatsapp, setOfficeWhatsapp] = useState('');

  useEffect(() => {
    Promise.all([
      base44.entities.Order.list('-created_date', 100),
      base44.entities.AppSettings.list(),
    ]).then(([data, settings]) => {
      setOrders(data);
      if (settings.length > 0) {
        setOfficeEmail(settings[0].office_email || '');
        setOfficeWhatsapp(settings[0].office_whatsapp || '');
      }
      setLoading(false);
    });
  }, []);

  const filtered = orders.filter(o => {
    const matchSearch = (o.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.order_number || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalSales = filtered.reduce((s, o) => s + (o.total_amount || 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">הזמנות</h1>
        <div className="text-left">
          <div className="text-xs text-muted-foreground">סה"כ</div>
          <div className="font-bold text-primary text-lg">₪{totalSales.toLocaleString()}</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(STATUS_MAP).map(([key, val]) => {
          const count = orders.filter(o => o.status === key).length;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
              className={cn(
                'rounded-xl p-2.5 text-center border transition-all',
                statusFilter === key ? 'border-primary bg-accent' : 'border-border bg-card'
              )}
            >
              <div className="text-xl font-bold text-foreground">{count}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{val.label}</div>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לקוח / מספר הזמנה..."
          className="pr-9"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>לא נמצאו הזמנות</p>
          </div>
        )}
        {filtered.map(order => (
          <OrderCard key={order.id} order={order} officeEmail={officeEmail} officeWhatsapp={officeWhatsapp} />
        ))}
      </div>
    </div>
  );
}