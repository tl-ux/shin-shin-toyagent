import { useState, useEffect } from 'react';
import { base44 } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/lib/AuthContext';
import { format } from 'date-fns';
import { Plus, Trash2, ChevronUp, ChevronDown, CheckCircle, Circle } from 'lucide-react';

export default function VisitRoutes() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ visit_date: format(new Date(), 'yyyy-MM-dd'), notes: '', customers: [] });
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [r, c] = await Promise.all([
      base44.entities.VisitRoute.list('-visit_date'),
      base44.entities.Customer.list(),
    ]);
    setRoutes(r);
    setCustomers(c);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const addCustomer = (c) => {
    if (form.customers.find(x => x.id === c.id)) return;
    set('customers', [...form.customers, { id: c.id, name: c.name, city: c.city || '', visited: false }]);
    setSearch('');
  };

  const removeCustomer = (id) => set('customers', form.customers.filter(c => c.id !== id));

  const moveUp = (idx) => {
    if (idx === 0) return;
    const arr = [...form.customers];
    [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]];
    set('customers', arr);
  };

  const moveDown = (idx) => {
    if (idx === form.customers.length - 1) return;
    const arr = [...form.customers];
    [arr[idx], arr[idx+1]] = [arr[idx+1], arr[idx]];
    set('customers', arr);
  };

  const save = async () => {
    if (!form.visit_date || form.customers.length === 0) return;
    setSaving(true);
    await base44.entities.VisitRoute.create({
      visit_date: form.visit_date,
      agent_id: user?.id,
      agent_name: user?.full_name || user?.email,
      customers: form.customers,
      notes: form.notes,
    });
    await load();
    setShowForm(false);
    setForm({ visit_date: format(new Date(), 'yyyy-MM-dd'), notes: '', customers: [] });
    setSaving(false);
  };

  const toggleVisited = async (route, custId) => {
    const updated = route.customers.map(c => c.id === custId ? { ...c, visited: !c.visited } : c);
    await base44.entities.VisitRoute.update(route.id, { customers: updated });
    setRoutes(prev => prev.map(r => r.id === route.id ? { ...r, customers: updated } : r));
  };

  const deleteRoute = async (id) => {
    await base44.entities.VisitRoute.delete(id);
    setRoutes(prev => prev.filter(r => r.id !== id));
  };

  const filteredCustomers = customers.filter(c =>
    search && (c.name.toLowerCase().includes(search.toLowerCase()) || (c.city || '').toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-center w-full">מסלולי ביקור</h1>

      <Button onClick={() => setShowForm(true)} className="w-full gap-2">
        <Plus className="w-4 h-4" /> מסלול חדש
      </Button>

      <div className="space-y-3">
        {routes.map(route => {
          const visited = route.customers?.filter(c => c.visited).length || 0;
          const total = route.customers?.length || 0;
          return (
            <div key={route.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-primary">{route.visit_date ? route.visit_date.split('-').reverse().join('-') : ''}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{visited}/{total} ביקורים</span>
                  <button onClick={() => deleteRoute(route.id)} className="text-destructive text-sm"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {route.agent_name && <div className="text-sm text-muted-foreground mb-2">סוכן: {route.agent_name}</div>}
              <div className="space-y-1">
                {route.customers?.map((c, idx) => (
                  <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted">
                    <span className="text-muted-foreground text-xs w-5">{idx + 1}</span>
                    <button onClick={() => toggleVisited(route, c.id)}>
                      {c.visited ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                    </button>
                    <span className={`flex-1 text-sm ${c.visited ? 'line-through text-muted-foreground' : ''}`}>{c.name}</span>
                    {c.city && <span className="text-xs text-muted-foreground">{c.city}</span>}
                  </div>
                ))}
              </div>
              {route.notes && <div className="text-sm text-muted-foreground mt-2 border-t pt-2">{route.notes}</div>}
            </div>
          );
        })}
        {routes.length === 0 && <p className="text-center text-muted-foreground py-8">אין מסלולים</p>}
      </div>

      <Dialog open={showForm} onOpenChange={v => { if (!v) setShowForm(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0" dir="rtl">
          <DialogTitle className="text-center p-4 border-b">מסלול חדש</DialogTitle>
          <div className="p-4 space-y-4">
            <div>
              <Label>תאריך ביקור</Label>
              <Input type="date" value={form.visit_date} onChange={e => set('visit_date', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>הוסף לקוח</Label>
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חפש לקוח לפי שם או עיר..." className="mt-1" />
              {filteredCustomers.length > 0 && (
                <div className="border border-border rounded-lg mt-1 max-h-40 overflow-y-auto">
                  {filteredCustomers.slice(0, 10).map(c => (
                    <button key={c.id} onClick={() => addCustomer(c)} className="w-full flex items-center justify-between p-2 hover:bg-muted text-sm border-b last:border-0">
                      <span>{c.name}</span>
                      <span className="text-muted-foreground text-xs">{c.city}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {form.customers.length > 0 && (
              <div className="space-y-1">
                <Label>סדר ביקורים</Label>
                {form.customers.map((c, idx) => (
                  <div key={c.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <span className="text-muted-foreground text-xs w-5">{idx + 1}</span>
                    <span className="flex-1 text-sm">{c.name}</span>
                    {c.city && <span className="text-xs text-muted-foreground">{c.city}</span>}
                    <button onClick={() => moveUp(idx)} className="text-muted-foreground hover:text-foreground"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => moveDown(idx)} className="text-muted-foreground hover:text-foreground"><ChevronDown className="w-4 h-4" /></button>
                    <button onClick={() => removeCustomer(c.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
            <div>
              <Label>הערות</Label>
              <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="mt-1 resize-none" />
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving || !form.visit_date || form.customers.length === 0} className="flex-1">{saving ? 'שומר...' : 'שמור מסלול'}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">ביטול</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
