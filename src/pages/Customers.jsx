import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Plus, Users, Phone, MapPin } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import CustomerCard from '@/components/customer/CustomerCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

function CustomerForm({ customer, onSave, onClose, networks = [] }) {
  const [form, setForm] = useState(customer || {
    customer_number: '', name: '', email: '', contact_name: '', phone: '',
    address: '', city: '', notes: '', is_wholesale: true, network_commission_percent: '', network_id: '',
    is_active: true, business_id: '', rivhit_document_type: 10, rivhit_customer_id: null
  });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    const data = {
      ...form,
      network_commission_percent: form.network_commission_percent !== '' ? parseFloat(form.network_commission_percent) : null
    };
    if (customer?.id) {
      await base44.entities.Customer.update(customer.id, data);
    } else {
      await base44.entities.Customer.create(data);
    }
    onSave();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await base44.entities.Customer.delete(customer.id);
    onSave();
  };

  return (
    <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-center">{customer ? 'עריכת לקוח' : 'לקוח חדש'}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 pt-2">
        <div>
          <Label>מספר לקוח</Label>
          <Input value={form.customer_number} onChange={e => set('customer_number', e.target.value)} placeholder="למשל: 001" className="mt-1" />
        </div>
        <div>
          <Label>שם עסק / לקוח *</Label>
          <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="שם הלקוח" className="mt-1" />
        </div>
        <div>
          <Label>דוא"ל</Label>
          <Input value={form.email} onChange={e => set('email', e.target.value)} placeholder="customer@example.com" className="mt-1" dir="ltr" type="email" />
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

        {/* סיטונאי / עמלת רשת */}
        <div className="border border-border rounded-xl p-3 space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_wholesale"
              checked={true}
              onChange={() => {}}
              style={{display:'none'}}
              className="w-4 h-4 accent-primary"
            />
            <div>

  
            </div>
          </div>

        </div>



        <div>
          <Label>הערות</Label>
          <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="mt-1 resize-none" />
        </div>
        <div>
          <Label>רשת</Label>
          <Select value={form.network_id || '__none__'} onValueChange={v => set('network_id', v === '__none__' ? '' : v)}>
            <SelectTrigger className="mt-1" dir="rtl">
              <SelectValue placeholder="ללא רשת" />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="__none__">ללא רשת</SelectItem>
              {networks.map(n => (
                <SelectItem key={n.id} value={n.id}>{n.name} - {n.commission_percent}%</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>תנאי תשלום</Label>
          <Select value={form.payment_terms || ''} onValueChange={v => set('payment_terms', v)}>
            <SelectTrigger className="mt-1" dir="rtl">
              <SelectValue placeholder="בחר תנאי תשלום" />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="העברה בנקאית - 5% הנחה">העברה בנקאית - 5% הנחה</SelectItem>
              <SelectItem value="כרטיס אשראי - 3.5% הנחה">כרטיס אשראי - 3.5% הנחה</SelectItem>
              <SelectItem value="שיק גוביינא - שוטף 60+">שיק גוביינא - שוטף 60+</SelectItem>
              <SelectItem value="שיק - שוטף 60+ (טל אוסף)">שיק - שוטף 60+ (טל אוסף)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {customer?.id && (
          <div>
            <div className="font-medium text-sm mb-2 border-t border-border pt-3">סיכום לקוח</div>
            <CustomerCard customer={customer} />
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">ביטול</Button>
          <Button onClick={save} disabled={saving || !form.name} className="flex-1">
            {saving ? 'שומר...' : 'שמור'}
          </Button>
        </div>
        {customer?.id && (
          <div className="pt-1 border-t border-border">
            {!confirmDelete ? (
              <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setConfirmDelete(true)}>
                מחק לקוח
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'מוחק...' : 'אשר מחיקה'}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>ביטול</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </DialogContent>
  );
}

export default function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('הכל');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    base44.entities.Network.list().then(setNetworks);
    base44.entities.Customer.list('-created_date').then(d => {
      const filteredCustomers = user?.role === 'store_manager' && user?.email
        ? d.filter(c => c.email?.toLowerCase() === user.email?.toLowerCase())
        : d;
      setCustomers(filteredCustomers);
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, [user]);

  const cities = ['הכל', ...new Set(customers.map(c => c.city).filter(Boolean))];

  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.city || '').toLowerCase().includes(search.toLowerCase());
    const matchCity = cityFilter === 'הכל' || c.city === cityFilter;
    return matchSearch && matchCity;
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <img src="https://media.base44.com/images/public/69cbdbfb3ccb589826de82bf/2c09fa58d_SHIN_SHIN_transparent.png" alt="טוען..." className="h-16 animate-pulse" />
    </div>
  );

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">לקוחות</h1>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-1 h-10 text-base">
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
         className="pr-9 h-11 text-base"
       />
      </div>

      {cities.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {cities.map(city => (
            <button
              key={city}
              onClick={() => setCityFilter(city)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border',
                cityFilter === city ? 'bg-primary text-white border-primary' : 'bg-white border-border text-muted-foreground'
              )}
            >
              {city}
            </button>
          ))}
        </div>
      )}

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
                <div className="font-semibold text-lg text-foreground">{c.name}</div>
                {c.contact_name && <div className="text-base text-muted-foreground mt-0.5">{c.contact_name}</div>}
                <div className="flex gap-3 mt-1.5">
                   {c.phone && (
                     <span className="text-sm text-muted-foreground flex items-center gap-1">
                       <Phone className="w-3 h-3" />{c.phone}
                     </span>
                   )}
                   {c.city && (
                     <span className="text-sm text-muted-foreground flex items-center gap-1">
                       <MapPin className="w-3 h-3" />{c.city}
                     </span>
                   )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={v => { if (!v) setShowForm(false); }}>
        {showForm && (
          <CustomerForm
            customer={editing}
            networks={networks}
            onSave={() => { setShowForm(false); load(); }}
            onClose={() => setShowForm(false)}
          />
        )}
      </Dialog>
    </div>
  );
}