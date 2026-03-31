import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, ShoppingCart, CreditCard, Package, AlertTriangle } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import { Link } from 'react-router-dom';

function StatCard({ icon: Icon, label, value, sub, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    destructive: 'bg-destructive/10 text-destructive',
    warning: 'bg-warning/10 text-warning',
  };
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Order.list('-created_date', 500),
      base44.entities.Customer.list(),
      base44.entities.Debt.list('-created_date', 500),
      base44.entities.Product.list(),
    ]).then(([o, c, d, p]) => { setOrders(o); setCustomers(c); setDebts(d); setProducts(p); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  // Monthly sales - last 6 months
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(now, 5 - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const total = orders
      .filter(o => {
        const d = new Date(o.created_date);
        return d >= start && d <= end && o.status !== 'cancelled';
      })
      .reduce((s, o) => s + (o.total_amount || 0), 0);
    return { month: format(date, 'MMM', { locale: he }), total };
  });

  // Top customers
  const customerTotals = {};
  orders.filter(o => o.status !== 'cancelled').forEach(o => {
    if (!customerTotals[o.customer_name]) customerTotals[o.customer_name] = 0;
    customerTotals[o.customer_name] += o.total_amount || 0;
  });
  const topCustomers = Object.entries(customerTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Top products
  const productTotals = {};
  orders.filter(o => o.status !== 'cancelled').forEach(o => {
    (o.items || []).forEach(item => {
      if (!productTotals[item.product_name]) productTotals[item.product_name] = 0;
      productTotals[item.product_name] += item.quantity || 0;
    });
  });
  const topProducts = Object.entries(productTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total_amount || 0), 0);
  const openDebts = debts.filter(d => d.status !== 'paid').reduce((s, d) => s + (d.balance_due || 0), 0);
  const thisMonthRevenue = monthlyData[monthlyData.length - 1]?.total || 0;

  return (
    <div className="p-4 pb-24 space-y-6">
      <h1 className="text-2xl font-bold">דשבורד</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={TrendingUp} label="מכירות החודש" value={`₪${thisMonthRevenue.toLocaleString()}`} color="primary" />
        <StatCard icon={ShoppingCart} label="סה״כ הזמנות" value={orders.length} sub={`${orders.filter(o=>o.status==='confirmed').length} מאושרות`} color="success" />
        <StatCard icon={Users} label="לקוחות" value={customers.length} color="primary" />
        <StatCard icon={CreditCard} label="חובות פתוחים" value={`₪${openDebts.toLocaleString()}`} color="destructive" />
      </div>

      {/* Monthly Chart */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="font-semibold text-sm mb-4">מכירות לפי חודש</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={v => [`₪${v.toLocaleString()}`, 'מכירות']} />
            <Bar dataKey="total" radius={[6, 6, 0, 0]}>
              {monthlyData.map((_, i) => (
                <Cell key={i} fill={i === monthlyData.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.3)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top customers */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-primary" />לקוחות מובילים</h2>
          <div className="space-y-2">
            {topCustomers.map(([name, total], i) => (
              <div key={name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  <span className="text-sm font-medium truncate max-w-[140px]">{name}</span>
                </div>
                <span className="text-sm font-bold text-primary">₪{total.toLocaleString()}</span>
              </div>
            ))}
            {topCustomers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">אין נתונים</p>}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-primary" />פריטים נמכרים ביותר</h2>
          <div className="space-y-2">
            {topProducts.map(([name, qty], i) => (
              <div key={name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  <span className="text-sm font-medium truncate max-w-[140px]">{name}</span>
                </div>
                <span className="text-sm font-bold text-muted-foreground">{qty} יח'</span>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">אין נתונים</p>}
          </div>
        </div>
      </div>

      {/* Pending orders + low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending confirmed orders */}
        {(() => {
          const pending = orders.filter(o => o.status === 'confirmed').slice(0, 5);
          return pending.length > 0 ? (
            <div className="bg-card border border-border rounded-xl p-4">
              <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                הזמנות מאושרות (ממתינות למסירה)
              </h2>
              <div className="space-y-2">
                {pending.map(o => (
                  <div key={o.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{o.customer_name}</span>
                      <span className="text-xs text-muted-foreground mr-2">{o.order_number}</span>
                    </div>
                    <span className="font-bold text-primary">₪{(o.total_amount||0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <Link to="/orders" className="text-xs text-primary mt-3 block hover:underline">כל ההזמנות ←</Link>
            </div>
          ) : null;
        })()}

        {/* Low stock alert */}
        {(() => {
          const low = products.filter(p => p.stock !== null && p.stock !== undefined && p.stock <= 5 && p.is_active);
          return low.length > 0 ? (
            <div className="bg-warning/5 border border-warning/30 rounded-xl p-4">
              <h2 className="font-semibold text-sm mb-3 flex items-center gap-2 text-warning">
                <AlertTriangle className="w-4 h-4" />
                מלאי נמוך ({low.length} פריטים)
              </h2>
              <div className="space-y-2">
                {low.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate max-w-[160px]">{p.name}</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-xs ${p.stock === 0 ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                      {p.stock} יח'
                    </span>
                  </div>
                ))}
              </div>
              <Link to="/products" className="text-xs text-warning mt-3 block hover:underline">לניהול מלאי ←</Link>
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
}