import { useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STATUS_MAP = {
  new:         { label: 'חדש',        color: '#3b82f6' },
  contacted:   { label: 'נוצר קשר',   color: '#eab308' },
  qualified:   { label: 'מוכשר',      color: '#a855f7' },
  converted:   { label: 'הומר',       color: '#22c55e' },
  closed_lost: { label: 'אבוד',       color: '#ef4444' },
  customer:    { label: 'לקוח',       color: '#8b5cf6' },
  inactive:    { label: 'לא פעיל',    color: '#9ca3af' },
};

export default function CRMDashboard({ contacts }) {
  const stats = useMemo(() => {
    const byStatus = Object.entries(STATUS_MAP).map(([key, val]) => ({
      name: val.label,
      count: contacts.filter(c => c.status === key).length,
      color: val.color,
    }));
    const overdue = contacts.filter(c =>
      c.next_followup_date &&
      new Date(c.next_followup_date) < new Date() &&
      c.status !== 'closed_lost' && c.status !== 'inactive'
    );
    const conversionRate = contacts.length > 0
      ? Math.round((contacts.filter(c => c.status === 'converted' || c.status === 'customer').length / contacts.length) * 100)
      : 0;
    return { byStatus, overdue, conversionRate };
  }, [contacts]);

  const { byStatus, overdue, conversionRate } = stats;

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-primary">{contacts.length}</div>
          <div className="text-sm text-muted-foreground mt-1">סה"כ אנשי קשר</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-500">{contacts.filter(c => c.status === 'new').length}</div>
          <div className="text-sm text-muted-foreground mt-1">לידים חדשים</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-success">{conversionRate}%</div>
          <div className="text-sm text-muted-foreground mt-1">אחוז המרה</div>
        </div>
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-destructive">{stats.overdue.length}</div>
          <div className="text-sm text-muted-foreground mt-1">ממתינים למעקב</div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="font-semibold mb-3">התפלגות לפי סטטוס</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={stats.byStatus} layout="vertical" margin={{ right: 30, left: 10 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [`${v} אנשי קשר`]} />
            <Bar dataKey="count" radius={4}>
              {stats.byStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Overdue list */}
      {stats.overdue.length > 0 && (
        <div className="bg-card border border-destructive/20 rounded-xl p-4">
          <div className="font-semibold mb-3 text-destructive">⚠️ ממתינים למעקב</div>
          <div className="space-y-2">
            {stats.overdue.map(c => (
              <div key={c.id} className="flex items-center justify-between text-sm bg-destructive/5 rounded-lg px-3 py-2">
                <div>
                  <span className="font-medium">{c.name}</span>
                  {c.company && <span className="text-muted-foreground mr-1">· {c.company}</span>}
                </div>
                <span className="text-destructive font-medium">
                  {differenceInDays(new Date(), new Date(c.next_followup_date))} ימים באיחור
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}