import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { subMonths, startOfMonth, format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function MonthlySalesChart({ orders }) {
  const data = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      const start = startOfMonth(date);
      const end = startOfMonth(subMonths(date, -1));
      const total = orders
        .filter(o => {
          if (o.status === 'cancelled') return false;
          const d = o.visit_date ? new Date(o.visit_date) : new Date(o.created_date);
          return d >= start && d < end;
        })
        .reduce((s, o) => s + (o.total_amount || 0), 0);
      return {
        name: format(date, 'MMM', { locale: he }),
        total,
      };
    });
    return months;
  }, [orders]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white border border-border rounded-lg px-3 py-2 shadow text-sm">
          <div className="font-semibold">{label}</div>
          <div className="text-primary font-bold">₪{payload[0].value.toLocaleString()}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-base font-semibold mb-3">מכירות 6 חודשים אחרונים</div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}