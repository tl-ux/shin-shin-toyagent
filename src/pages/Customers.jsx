import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Plus, Users, Phone, MapPin, FileText, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

function CustomerForm({ customer, onSave, onClose }) {
  const [form, setForm] = useState(customer || { name: '', contact_name: '', phone: '', address: '', city: '', notes: '', is_active: true });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    if (customer?.id) {
      await base44.entities.Customer.update(customer.id, form);
    } else {
      await base44.entities.Customer.create(form);
    }
    onSave();
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{customer ? 'עריכת לקוח' : 'לקוח חדש'}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 pt-2">
        <div>
          <Label>שם עסק / לקוח *</Label>
          <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="שם הלקוח" className="mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>איש קשר</Label>
            <Input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="שם איש קשר" className="mt-1" />
          </div>
          <div>
            <Label>טלפון</Label>
            <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="050..." className="mt-1" dir="ltr" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>עיר</Label>
            <Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="עיר" className="mt-1" />
          </div>
          <div>
            <Label>כתובת</Label>
            <Input value={form.address} onChange={e => set('address', e.target.value)} placeholder="רחוב + מספר" className="mt-1" />
          </div>
        </div>
        <div>
          <Label>הערות</Label>
          <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="mt-1 resize-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">ביטול</Button>
          <Button onClick={save} disabled={saving || !form.name} className="flex-1">
            {saving ? 'שומר...' : 'שמור'}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => base44.entities.Customer.list('-created_date').then(d => { setCustomers(d); setLoading(false); });
  useEffect(() => { load(); }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.city || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">לקוחות</h1>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} size="sm" className="gap-1">
          <Plus className="w-4 h-4" />
          לקוח חדש
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לקוח..."
          className="pr-9"
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>אין לקוחות עדיין</p>
          </div>
        )}
        {filtered.map(c => (
          <button
            key={c.id}
            onClick={() => { setEditing(c); setShowForm(true); }}
            className="w-full text-right bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-foreground">{c.name}</div>
                {c.contact_name && <div className="text-sm text-muted-foreground mt-0.5">{c.contact_name}</div>}
                <div className="flex gap-3 mt-1.5">
                  {c.phone && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />{c.phone}
                    </span>
                  )}
                  {c.city && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{c.city}
                    </span>
                  )}
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full mt-1.5 ${c.is_active ? 'bg-success' : 'bg-muted-foreground'}`} />
            </div>
          </button>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={v => { if (!v) setShowForm(false); }}>
        {showForm && (
          <CustomerForm
            customer={editing}
            onSave={() => { setShowForm(false); load(); }}
            onClose={() => setShowForm(false)}
          />
        )}
      </Dialog>
    </div>
  );
}