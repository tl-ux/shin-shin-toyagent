import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Users, ShoppingCart, CreditCard, Package, AlertTriangle, ClipboardList, BookOpen, Settings } from 'lucide-react';
import { format, subMonths, subYears, startOfMonth, endOfMonth } from 'date-fns';
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
         <div className="text-3xl font-bold text-foreground">{value}</div>
         <div className="text-base text-muted-foreground">{label}</div>
         {sub && <div className="text-base text-muted-foreground mt-0.5">{sub}</div>}
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

  // Monthly sales - last 6 months, with year-over-year comparison
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(now, 5 - i);
    const dateLastYear = subYears(date, 1);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const startLY = startOfMonth(dateLastYear);
    const endLY = endOfMonth(dateLastYear);

    const total = orders
      .filter(o => { const d = new Date(o.created_date); return d >= start && d <= end && o.status !== 'cancelled'; })
      .reduce((s, o) => s + (o.total_amount || 0), 0);

    const totalLastYear = orders
      .filter(o => { const d = new Date(o.created_date); return d >= startLY && d <= endLY && o.status !== 'cancelled'; })
      .reduce((s, o) => s + (o.total_amount || 0), 0);

    return {
      month: format(date, 'MMM yy', { locale: he }),
      monthLY: format(dateLastYear, 'MMM yy', { locale: he }),
      total,
      totalLastYear,
    };
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

  const navCards = [
    { path: '/orders', label: 'הזמנות', icon: ClipboardList, color: 'bg-primary/10 text-primary', count: orders.length, sub: `${orders.filter(o => o.status === 'confirmed').length} מאושרות` },
    { path: '/customers', label: 'לקוחות', icon: Users, color: 'bg-success/10 text-success', count: customers.length, sub: 'לקוחות פעילים' },
    { path: '/debts', label: 'חובות', icon: CreditCard, color: 'bg-destructive/10 text-destructive', count: `₪${openDebts.toLocaleString()}`, sub: 'חובות פתוחים' },
    { path: '/products', label: 'קטלוג', icon: BookOpen, color: 'bg-warning/10 text-warning', count: products.length, sub: 'פריטים במלאי' },
    { path: '/agent-summary', label: 'ביצועים', icon: TrendingUp, color: 'bg-primary/10 text-primary', count: `₪${thisMonthRevenue.toLocaleString()}`, sub: 'מכירות החודש' },
    { path: '/settings', label: 'הגדרות', icon: Settings, color: 'bg-muted text-muted-foreground', count: '⚙️', sub: 'הגדרות מערכת' },
  ];

  return (
    <div className="p-4 pb-24 space-y-6">
      <h1 className="text-2xl font-bold">דשבורד</h1>

      {/* Nav Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {navCards.map(({ path, label, icon: Icon, color, count, sub }) => (
          <Link key={path} to={path} className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2 hover:border-primary/40 hover:shadow-sm transition-all text-center">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="font-bold text-xl text-foreground">{count}</div>
            <div className="text-sm font-semibold text-foreground">{label}</div>
            <div className="text-xs text-muted-foreground">{sub}</div>
          </Link>
        ))}
      </div>

      {/* Monthly Table YoY */}
      <div className="bg-card border border-border rounded-xl p-4">
         <h2 className="font-semibold text-base mb-3">מכירות לפי חודש — שנה מול שנה</h2>
         <table className="w-full text-base">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-xs">
              <th className="text-right pb-2 font-medium">חודש</th>
              <th className="text-center pb-2 font-medium">השנה</th>
              <th className="text-center pb-2 font-medium">שנה קודמת</th>
              <th className="text-center pb-2 font-medium">שינוי</th>
            </tr>
          </thead>
          <tbody>
            {[...monthlyData].reverse().map((row, i) => {
              const diff = row.totalLastYear > 0
                ? Math.round(((row.total - row.totalLastYear) / row.totalLastYear) * 100)
                : null;
              const isCurrentMonth = i === 0;
              return (
                <tr key={row.month} className={`border-b border-border/50 last:border-0 ${isCurrentMonth ? 'bg-accent/30' : ''}`}>
                  <td className="py-2 text-right font-medium">{row.month}</td>
                  <td className="py-2 text-center font-bold text-primary">₪{row.total.toLocaleString()}</td>
                  <td className="py-2 text-center text-muted-foreground">₪{row.totalLastYear.toLocaleString()}</td>
                  <td className="py-2 text-center">
                    {diff === null ? (
                      <span className="text-muted-foreground text-xs">—</span>
                    ) : (
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${diff > 0 ? 'bg-success/10 text-success' : diff < 0 ? 'bg-destructive/10 text-destructive' : 'text-muted-foreground'}`}>
                        {diff > 0 ? '+' : ''}{diff}%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top customers */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="font-semibold text-base mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-primary" />לקוחות מובילים</h2>
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
          <h2 className="font-semibold text-base mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-primary" />פריטים נמכרים ביותר</h2>
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
              <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
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
              <Link to="/orders" className="text-sm text-primary mt-3 block hover:underline font-medium">כל ההזמנות ←</Link>
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