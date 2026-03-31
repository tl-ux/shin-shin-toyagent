import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format, startOfDay, startOfWeek, startOfMonth, subMonths, startOfMonth as SOM, endOfMonth as EOM } from 'date-fns';
import { he } from 'date-fns/locale';
import { TrendingUp, ShoppingCart, Users, Award, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from '@/lib/utils';

export default function AgentSummary() {
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month'); // today | week | month | prev_month

  useEffect(() => {
    Promise.all([
      base44.auth.me(),
      base44.entities.Order.list('-created_date', 500),
    ]).then(([u, o]) => { setUser(u); setOrders(o); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const now = new Date();

  const getPeriodRange = (p) => {
    if (p === 'today') return [startOfDay(now), now];
    if (p === 'week') return [startOfWeek(now, { weekStartsOn: 0 }), now];
    if (p === 'month') return [startOfMonth(now), now];
    if (p === 'prev_month') return [SOM(subMonths(now, 1)), EOM(subMonths(now, 1))];
    return [startOfMonth(now), now];
  };

  const [rangeStart, rangeEnd] = getPeriodRange(period);

  // Filter by agent and period
  const myOrders = orders.filter(o => {
    const d = new Date(o.visit_date || o.created_date);
    return o.agent_name === user?.full_name && d >= rangeStart && d <= rangeEnd && o.status !== 'cancelled';
  });

  const allAgents = {};
  orders.filter(o => {
    const d = new Date(o.visit_date || o.created_date);
    return d >= rangeStart && d <= rangeEnd && o.status !== 'cancelled';
  }).forEach(o => {
    const agent = o.agent_name || 'לא ידוע';
    if (!allAgents[agent]) allAgents[agent] = { total: 0, count: 0 };
    allAgents[agent].total += o.total_amount || 0;
    allAgents[agent].count += 1;
  });

  const agentRanking = Object.entries(allAgents).sort((a, b) => b[1].total - a[1].total);
  const myRank = agentRanking.findIndex(([name]) => name === user?.full_name) + 1;

  const myTotal = myOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const myCount = myOrders.length;
  const myCustomers = new Set(myOrders.map(o => o.customer_id)).size;

  // Monthly comparison - last 6 months
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(now, 5 - i);
    const start = SOM(date);
    const end = EOM(date);
    const total = orders
      .filter(o => {
        const d = new Date(o.visit_date || o.created_date);
        return o.agent_name === user?.full_name && d >= start && d <= end && o.status !== 'cancelled';
      })
      .reduce((s, o) => s + (o.total_amount || 0), 0);
    return { month: format(date, 'MMM', { locale: he }), total };
  });

  const PERIODS = [
    { key: 'today', label: 'היום' },
    { key: 'week', label: 'השבוע' },
    { key: 'month', label: 'החודש' },
    { key: 'prev_month', label: 'חודש קודם' },
  ];

  return (
    <div className="p-4 pb-24 space-y-5">
      {/* Greeting */}
      <div className="bg-gradient-to-l from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5">
        <div className="text-sm text-muted-foreground">שלום,</div>
        <div className="text-2xl font-bold text-foreground mt-0.5">{user?.full_name || 'סוכן'} 👋</div>
        <div className="text-sm text-muted-foreground mt-1">{format(now, 'EEEE, dd MMMM yyyy', { locale: he })}</div>
      </div>

      {/* Period selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={cn(
              'flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
              period === p.key ? 'bg-primary text-white border-primary' : 'bg-card border-border text-muted-foreground'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground">סה"כ מכירות</div>
          <div className="text-2xl font-bold text-primary mt-1">₪{myTotal.toLocaleString()}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground">הזמנות</div>
          <div className="text-2xl font-bold text-foreground mt-1">{myCount}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground">לקוחות פעילים</div>
          <div className="text-2xl font-bold text-foreground mt-1">{myCustomers}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground">דירוג סוכנים</div>
          <div className="text-2xl font-bold mt-1 flex items-center gap-1">
            {myRank > 0 ? (
              <>
                <Award className={cn('w-5 h-5', myRank === 1 ? 'text-yellow-500' : myRank === 2 ? 'text-gray-400' : myRank === 3 ? 'text-orange-400' : 'text-muted-foreground')} />
                #{myRank}
              </>
            ) : '-'}
          </div>
        </div>
      </div>

      {/* Monthly table */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="font-semibold text-base mb-4 flex items-center gap-2">
         <BarChart2 className="w-4 h-4 text-primary" />
         ביצועים חודשיים
        </h2>
        <div className="grid grid-cols-6 gap-2 text-xs font-semibold text-muted-foreground mb-3">
          {monthlyData.map(d => (
            <div key={d.month} className="text-center">{d.month}</div>
          ))}
        </div>
        <div className="grid grid-cols-6 gap-2 text-xs">
          {monthlyData.map(d => (
            <div key={d.month} className="text-center font-bold text-primary">₪{(d.total / 1000).toFixed(0)}K</div>
          ))}
        </div>
      </div>

      {/* Agents ranking */}
      {agentRanking.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
           <Award className="w-4 h-4 text-primary" />
           טבלת סוכנים
          </h2>
          <div className="space-y-2">
            {agentRanking.map(([name, data], i) => (
              <div
                key={name}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2',
                  name === user?.full_name ? 'bg-primary/10' : 'bg-muted/40'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                    i === 0 ? 'bg-yellow-100 text-yellow-700' :
                    i === 1 ? 'bg-gray-100 text-gray-600' :
                    i === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-muted text-muted-foreground'
                  )}>{i + 1}</span>
                  <span className={cn('text-sm font-medium', name === user?.full_name && 'text-primary font-bold')}>{name}</span>
                  {name === user?.full_name && <span className="text-xs bg-primary/20 text-primary px-1.5 rounded">אתה</span>}
                </div>
                <div className="text-left text-sm">
                  <span className="font-bold text-primary">₪{data.total.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground mr-1">({data.count} הזמנות)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent orders */}
      {myOrders.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-primary" />
            הזמנות אחרונות
          </h2>
          <div className="space-y-2">
            {myOrders.slice(0, 5).map(o => (
              <div key={o.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{o.customer_name}</span>
                  <span className="text-xs text-muted-foreground mr-2">{o.order_number}</span>
                </div>
                <span className="font-bold text-primary">₪{(o.total_amount || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}