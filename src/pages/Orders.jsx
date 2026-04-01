import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format, startOfDay, startOfWeek, startOfMonth, subMonths, differenceInDays } from 'date-fns';
import { Package, ChevronDown, ChevronUp, Search, Pencil, Copy, Trash2, AlertTriangle, BarChart2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import OrderShareMenu from '@/components/order/OrderShareMenu';
import EditOrderDialog from '@/components/order/EditOrderDialog';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import MonthlySalesChart from '@/components/order/MonthlySalesChart';

const STATUS_MAP = {
  draft: { label: 'טיוטה', color: 'bg-muted text-muted-foreground' },
  confirmed: { label: 'מאושר', color: 'bg-success/10 text-success' },
  delivered: { label: 'נמסר', color: 'bg-primary/10 text-primary' },
  cancelled: { label: 'בוטל', color: 'bg-destructive/10 text-destructive' },
};

const DATE_FILTERS = [
  { key: 'all', label: 'הכל' },
  { key: 'today', label: 'היום' },
  { key: 'week', label: 'השבוע' },
  { key: 'month', label: 'החודש' },
  { key: 'prev_month', label: 'חודש קודם' },
  { key: 'unsent', label: '📬 לא נשלחו' },
];

function matchesDateFilter(order, dateFilter) {
  if (dateFilter === 'all') return true;
  const date = order.visit_date ? new Date(order.visit_date) : new Date(order.created_date);
  const now = new Date();
  if (dateFilter === 'today') return date >= startOfDay(now);
  if (dateFilter === 'week') return date >= startOfWeek(now, { weekStartsOn: 0 });
  if (dateFilter === 'month') return date >= startOfMonth(now);
  if (dateFilter === 'prev_month') {
    const start = startOfMonth(subMonths(now, 1));
    const end = startOfMonth(now);
    return date >= start && date < end;
  }
  if (dateFilter === 'unsent') return order.status === 'confirmed' && (!order.sent_via || order.sent_via.length === 0);
  return true;
}





function OrderCard({ order, officeEmail, officeWhatsapp, onEdit, onCopy, onDelete }) {
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
            <span className="font-bold text-foreground text-lg">{order.customer_name}</span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', st.color)}>{st.label}</span>
          </div>
          <div className="text-sm text-muted-foreground mt-1 flex gap-3 flex-wrap">
            {order.order_number && <span>{order.order_number}</span>}
            {order.visit_date && <span>{format(new Date(order.visit_date), 'dd/MM/yyyy')}</span>}
            {order.agent_name && <span>סוכן: {order.agent_name}</span>}
            {order.delivery_date && (
              <span className="text-primary font-medium">🚚 משלוח: {format(new Date(order.delivery_date), 'dd/MM/yyyy')}</span>
            )}
          </div>
          {order.status === 'confirmed' && (!order.sent_via || order.sent_via.length === 0) && (
            <div className="text-sm text-destructive mt-1 font-medium">⚠️ לא נשלחה</div>
          )}
          {order.sent_via && order.sent_via.length > 0 && (
            <div className="text-xs text-muted-foreground mt-1 flex gap-1">
              {order.sent_via.includes('whatsapp') && <span>💬</span>}
              {order.sent_via.includes('email') && <span>📧</span>}
            </div>
          )}
        </div>
        <div className="text-left flex flex-col items-end gap-1">
          <span className="font-bold text-primary text-lg">₪{(order.total_amount || 0).toLocaleString()}</span>
          <div className="flex items-center gap-1">
            <button onClick={e => { e.stopPropagation(); onEdit(order); }} className="p-1 rounded hover:bg-muted transition-colors" title="עריכה">
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={e => { e.stopPropagation(); onCopy(order); }} className="p-1 rounded hover:bg-muted transition-colors" title="העתקה">
              <Copy className="w-4 h-4 text-muted-foreground" />
            </button>
            {order.status === 'confirmed' && (
              <button onClick={e => { e.stopPropagation(); onDelete(order); }} className="p-1 rounded hover:bg-red-50 transition-colors" title="מחיקה">
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            )}
            {open ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </div>
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
  const [dateFilter, setDateFilter] = useState('all');
  const [officeEmail, setOfficeEmail] = useState('');
  const [officeWhatsapp, setOfficeWhatsapp] = useState('');
  const [editingOrder, setEditingOrder] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const { toast } = useToast();

  const reload = () => base44.entities.Order.list('-created_date', 100).then(setOrders);

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

  const handleCopy = async (order) => {
    const newOrderNum = `ORD-${Date.now().toString().slice(-6)}`;
    await base44.entities.Order.create({
      order_number: newOrderNum,
      customer_id: order.customer_id,
      customer_name: order.customer_name,
      agent_name: order.agent_name,
      status: 'draft',
      items: order.items || [],
      total_amount: order.total_amount || 0,
      notes: order.notes || '',
      visit_date: new Date().toISOString().split('T')[0],
    });
    toast({ description: `הזמנה הועתקה בהצלחה — ${newOrderNum}` });
    reload();
  };

  const handleDelete = async (order) => {
    if (confirm(`האם אתה בטוח שברצונך למחוק את ההזמנה ${order.order_number}?`)) {
      await base44.entities.Order.delete(order.id);
      toast({ description: 'ההזמנה נמחקה בהצלחה' });
      reload();
    }
  };

  const filtered = orders.filter(o => {
    const matchSearch = (o.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.order_number || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchDate = matchesDateFilter(o, dateFilter);
    return matchSearch && matchStatus && matchDate;
  });

  const totalSales = filtered.reduce((s, o) => s + (o.total_amount || 0), 0);

  // הזמנות מאושרות ישנות שלא נמסרו (מעל 3 ימים)
  const staleOrders = orders.filter(o => {
    if (o.status !== 'confirmed') return false;
    const d = o.visit_date ? new Date(o.visit_date) : new Date(o.created_date);
    return differenceInDays(new Date(), d) >= 3;
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">הזמנות</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowChart(v => !v)}
            className={cn('p-2 rounded-lg border transition-colors', showChart ? 'bg-primary text-white border-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground')}
            title="גרף מכירות"
          >
            <BarChart2 className="w-5 h-5" />
          </button>
          <div className="text-center">
            <div className="text-base text-muted-foreground">סה"כ</div>
            <div className="font-bold text-primary text-2xl">₪{totalSales.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* התראה על הזמנות ישנות */}
      {staleOrders.length > 0 && (
        <div
          className="bg-warning/10 border border-warning/30 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-warning/15 transition-colors"
          onClick={() => { setStatusFilter('confirmed'); setDateFilter('all'); }}
        >
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
          <div>
            <div className="font-semibold text-sm text-warning-foreground">
              {staleOrders.length} הזמנות מאושרות שלא נמסרו מעל 3 ימים
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">לחץ לסינון הזמנות מאושרות</div>
          </div>
        </div>
      )}

      {/* גרף מכירות */}
      {showChart && <MonthlySalesChart orders={orders} />}

      {/* Date filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {DATE_FILTERS.map(df => (
          <button
            key={df.key}
            onClick={() => setDateFilter(df.key)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-lg text-base font-medium border transition-all',
              dateFilter === df.key ? 'bg-primary text-white border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {df.label}
          </button>
        ))}
      </div>

      {/* Status stats */}
      <div className="grid grid-cols-4 gap-2">
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
              <div className="text-base text-muted-foreground mt-0.5">{val.label}</div>
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
          className="pr-9 h-11 text-base"
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
          <OrderCard
            key={order.id}
            order={order}
            officeEmail={officeEmail}
            officeWhatsapp={officeWhatsapp}
            onEdit={setEditingOrder}
            onCopy={handleCopy}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <Dialog open={!!editingOrder} onOpenChange={v => { if (!v) setEditingOrder(null); }}>
        {editingOrder && (
          <EditOrderDialog
            order={editingOrder}
            onClose={() => setEditingOrder(null)}
            onSave={() => {
              setEditingOrder(null);
              reload();
            }}
          />
        )}
      </Dialog>
    </div>
  );
}