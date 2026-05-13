import { useState, useEffect } from 'react';
import { base44 } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/AuthContext';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

export default function Targets() {
  const { user } = useAuth();
  const [targets, setTargets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editing, setEditing] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Target.list(),
      base44.entities.Order.list('-created_date', 500),
      base44.entities.User.list(),
    ]).then(([t, o, u]) => {
      setTargets(t);
      setOrders(o.filter(x => x.status !== 'cancelled'));
      setUsers(u.filter(x => x.role === 'user' || x.role === 'admin'));
      setLoading(false);
    });
  }, []);

  const getActual = (agentId, month, year) => {
    return orders
      .filter(o => {
        const d = new Date(o.visit_date || o.created_at);
        return o.agent_id === agentId &&
          d.getMonth() === month &&
          d.getFullYear() === year;
      })
      .reduce((s, o) => s + (o.total_amount || 0), 0);
  };

  const getTarget = (agentId, month, year) => {
    return targets.find(t => t.agent_id === agentId && parseInt(t.month) === month && t.year === year);
  };

  const saveTarget = async (agentId, agentName, month, year, amount) => {
    setSaving(true);
    const existing = getTarget(agentId, month, year);
    if (existing) {
      await base44.entities.Target.update(existing.id, { target_amount: parseFloat(amount) || 0 });
    } else {
      await base44.entities.Target.create({ agent_id: agentId, agent_name: agentName, month: String(month), year, target_amount: parseFloat(amount) || 0 });
    }
    const t = await base44.entities.Target.list();
    setTargets(t);
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-center w-full">ניהול יעדים</h1>
      </div>

      <div className="flex justify-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setSelectedYear(y => y - 1)}>◀</Button>
        <span className="px-4 py-2 font-bold text-lg">{selectedYear}</span>
        <Button variant="outline" size="sm" onClick={() => setSelectedYear(y => y + 1)}>▶</Button>
      </div>

      {users.map(u => (
        <div key={u.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h2 className="font-bold text-lg">{u.full_name || u.email}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="text-right pb-2">חודש</th>
                  <th className="text-right pb-2">יעד (₪)</th>
                  <th className="text-right pb-2">בפועל (₪)</th>
                  <th className="text-right pb-2">%</th>
                </tr>
              </thead>
              <tbody>
                {MONTHS.map((month, idx) => {
                  const target = getTarget(u.id, idx, selectedYear);
                  const actual = getActual(u.id, idx, selectedYear);
                  const targetAmt = target?.target_amount || 0;
                  const pct = targetAmt > 0 ? Math.round((actual / targetAmt) * 100) : 0;
                  const key = `${u.id}-${idx}`;
                  return (
                    <tr key={idx} className="border-t border-border">
                      <td className="py-2 font-medium">{month}</td>
                      <td className="py-1">
                        <Input
                          type="number"
                          value={editing[key] !== undefined ? editing[key] : (targetAmt || '')}
                          onChange={e => setEditing(prev => ({ ...prev, [key]: e.target.value }))}
                          onBlur={() => {
                            if (editing[key] !== undefined) {
                              saveTarget(u.id, u.full_name || u.email, idx, selectedYear, editing[key]);
                              setEditing(prev => { const n = {...prev}; delete n[key]; return n; });
                            }
                          }}
                          className="w-28 h-7 text-sm"
                          dir="ltr"
                        />
                      </td>
                      <td className="py-2 text-right">₪{actual.toLocaleString()}</td>
                      <td className="py-2 text-right">
                        <span className={pct >= 100 ? 'text-green-600 font-bold' : pct >= 70 ? 'text-yellow-600' : 'text-destructive'}>
                          {targetAmt > 0 ? `${pct}%` : '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
