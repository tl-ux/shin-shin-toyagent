import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Plus, Search, Phone, Mail, Users, ChevronDown, ChevronUp, FileDown, LayoutGrid, List, BarChart2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import CRMDashboard from '@/components/crm/CRMDashboard';
import CRMKanban from '@/components/crm/CRMKanban';

const STATUS_MAP = {
  new:         { label: 'חדש',       color: 'bg-blue-100 text-blue-700' },
  contacted:   { label: 'נוצר קשר',  color: 'bg-yellow-100 text-yellow-700' },
  qualified:   { label: 'מוכשר',     color: 'bg-purple-100 text-purple-700' },
  converted:   { label: 'הומר',      color: 'bg-success/10 text-success' },
  closed_lost: { label: 'אבוד',      color: 'bg-destructive/10 text-destructive' },
  customer:    { label: 'לקוח',      color: 'bg-primary/10 text-primary' },
  inactive:    { label: 'לא פעיל',   color: 'bg-muted text-muted-foreground' },
};

const TYPE_MAP = {
  call:     { label: 'שיחה',    icon: '📞' },
  email:    { label: 'מייל',    icon: '📧' },
  meeting:  { label: 'פגישה',   icon: '🤝' },
  whatsapp: { label: 'וואטסאפ', icon: '💬' },
  note:     { label: 'הערה',    icon: '📝' },
  sms:      { label: 'SMS',     icon: '✉️' },
};

function exportToExcel(contacts) {
  const rows = [
    ['שם', 'חברה', 'טלפון', 'דוא"ל', 'סטטוס', 'מקור', 'אחראי', 'מעקב הבא', 'הערות'],
    ...contacts.map(c => [
      c.name || '',
      c.company || '',
      c.phone || '',
      c.email || '',
      STATUS_MAP[c.status]?.label || c.status || '',
      c.source || '',
      c.assigned_to || '',
      c.next_followup_date || '',
      c.notes || '',
    ])
  ];
  const ws = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join('\t')).join('\n');
  const blob = new Blob(['\uFEFF' + ws], { type: 'text/tab-separated-values;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `crm-leads-${format(new Date(), 'yyyy-MM-dd')}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

function ContactForm({ contact, customers, onSave, onClose }) {
  const [form, setForm] = useState(contact || {
    name: '', email: '', phone: '', status: 'new', source: '',
    company: '', notes: '', assigned_to: '', next_followup_date: '',
    linked_customer_id: ''
  });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    if (contact?.id) {
      await base44.entities.CRMContact.update(contact.id, form);
    } else {
      await base44.entities.CRMContact.create(form);
    }
    onSave();
  };

  const handleDelete = async () => {
    await base44.entities.CRMContact.delete(contact.id);
    onSave();
  };

  return (
    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-center">{contact ? 'עריכת איש קשר' : 'איש קשר חדש'}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>שם *</Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="שם מלא" className="mt-1" />
          </div>
          <div>
            <Label>חברה</Label>
            <Input value={form.company} onChange={e => set('company', e.target.value)} placeholder="שם החברה" className="mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>טלפון</Label>
            <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="050..." className="mt-1" dir="ltr" />
          </div>
          <div>
            <Label>דוא"ל</Label>
            <Input value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@..." className="mt-1" dir="ltr" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>סטטוס</Label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <Label>מקור</Label>
            <Input value={form.source} onChange={e => set('source', e.target.value)} placeholder="המלצה, אתר..." className="mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>אחראי</Label>
            <Input value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} placeholder="שם הנציג" className="mt-1" />
          </div>
          <div>
            <Label>מעקב הבא</Label>
            <Input value={form.next_followup_date} onChange={e => set('next_followup_date', e.target.value)} type="date" className="mt-1" />
          </div>
        </div>
        {/* קישור ללקוח קיים */}
        {customers.length > 0 && (
          <div>
            <Label>קישור ללקוח קיים (אופציונלי)</Label>
            <select value={form.linked_customer_id || ''} onChange={e => set('linked_customer_id', e.target.value)} className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="">— ללא קישור —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <Label>הערות</Label>
          <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className="mt-1 resize-none" />
        </div>
        <div className="flex gap-3 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1">ביטול</Button>
          <Button onClick={save} disabled={saving || !form.name} className="flex-1">{saving ? 'שומר...' : 'שמור'}</Button>
        </div>
        {contact?.id && (
          <div className="border-t border-border pt-2">
            {!confirmDelete ? (
              <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setConfirmDelete(true)}>מחק</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="destructive" className="flex-1" onClick={handleDelete}>אשר מחיקה</Button>
                <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>ביטול</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </DialogContent>
  );
}

function InteractionForm({ contactId, contactName, onSave, onClose }) {
  const [form, setForm] = useState({
    contact_id: contactId, contact_name: contactName,
    type: 'call', date: new Date().toISOString().split('T')[0], summary: '', notes: ''
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.summary) return;
    setSaving(true);
    await base44.entities.Interaction.create(form);
    onSave();
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="text-center">רישום אינטראקציה - {contactName}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>סוג</Label>
            <select value={form.type} onChange={e => set('type', e.target.value)} className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              {Object.entries(TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
          </div>
          <div>
            <Label>תאריך</Label>
            <Input value={form.date} onChange={e => set('date', e.target.value)} type="date" className="mt-1" />
          </div>
        </div>
        <div>
          <Label>סיכום *</Label>
          <Input value={form.summary} onChange={e => set('summary', e.target.value)} placeholder="תיאור קצר" className="mt-1" />
        </div>
        <div>
          <Label>הערות</Label>
          <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className="mt-1 resize-none" />
        </div>
        <div className="flex gap-3 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1">ביטול</Button>
          <Button onClick={save} disabled={saving || !form.summary} className="flex-1">{saving ? 'שומר...' : 'שמור'}</Button>
        </div>
      </div>
    </DialogContent>
  );
}

function ContactCard({ contact, onEdit, onAddInteraction }) {
  const [open, setOpen] = useState(false);
  const [interactions, setInteractions] = useState([]);
  const [loadingInt, setLoadingInt] = useState(false);
  const st = STATUS_MAP[contact.status] || STATUS_MAP.new;
  const isOverdue = contact.next_followup_date && new Date(contact.next_followup_date) < new Date();

  const loadInteractions = async () => {
    if (open) { setOpen(false); return; }
    setLoadingInt(true);
    const data = await base44.entities.Interaction.filter({ contact_id: contact.id }, '-created_date', 10);
    setInteractions(data);
    setLoadingInt(false);
    setOpen(true);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-foreground text-lg">{contact.name}</span>
            {contact.company && <span className="text-sm text-muted-foreground">· {contact.company}</span>}
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', st.color)}>{st.label}</span>
          </div>
          <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-muted-foreground">
            {contact.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{contact.phone}</span>}
            {contact.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{contact.email}</span>}
          </div>
          {contact.next_followup_date && (
            <div className={cn('text-xs mt-1.5 font-medium', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
              {isOverdue ? '⚠️' : '📅'} מעקב: {format(new Date(contact.next_followup_date), 'dd/MM/yyyy')}
            </div>
          )}
          {contact.source && <div className="text-xs text-muted-foreground mt-1">מקור: {contact.source}</div>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(contact)}>עריכה</Button>
          <Button size="sm" onClick={() => onAddInteraction(contact)} className="gap-1 text-xs">
            <Plus className="w-3 h-3" /> אינטראקציה
          </Button>
        </div>
      </div>
      <button className="w-full border-t border-border px-4 py-2 text-sm text-muted-foreground flex items-center justify-center gap-1 hover:bg-muted/30 transition-colors" onClick={loadInteractions}>
        {loadingInt ? 'טוען...' : open
          ? <><ChevronUp className="w-4 h-4" /> הסתר היסטוריה</>
          : <><ChevronDown className="w-4 h-4" /> הצג היסטוריה</>}
      </button>
      {open && (
        <div className="border-t border-border px-4 py-3 bg-muted/20 space-y-2">
          {interactions.length === 0 && <div className="text-sm text-muted-foreground text-center py-2">אין אינטראקציות עדיין</div>}
          {interactions.map((i, idx) => {
            const t = TYPE_MAP[i.type] || { label: i.type, icon: '•' };
            return (
              <div key={idx} className="flex gap-3 text-sm bg-white rounded-lg p-2.5 border border-border">
                <span className="text-lg leading-none mt-0.5">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground">{i.summary}</div>
                  {i.notes && <div className="text-xs text-muted-foreground mt-0.5">{i.notes}</div>}
                </div>
                <div className="text-xs text-muted-foreground flex-shrink-0">{i.date ? format(new Date(i.date), 'dd/MM/yy') : ''}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CRM() {
  const [contacts, setContacts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState('list'); // list | kanban | dashboard
  const [editingContact, setEditingContact] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [interactionFor, setInteractionFor] = useState(null);

  const load = () => Promise.all([
    base44.entities.CRMContact.list('-created_date', 200),
    base44.entities.Customer.list(),
  ]).then(([c, custs]) => { setContacts(c); setCustomers(custs); setLoading(false); });

  useEffect(() => { load(); }, []);

  const filtered = contacts.filter(c => {
    const matchSearch = (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.company || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').includes(search);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const overdueCount = contacts.filter(c =>
    c.next_followup_date && new Date(c.next_followup_date) < new Date() &&
    c.status !== 'closed_lost' && c.status !== 'inactive'
  ).length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">CRM - לידים ולקוחות</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToExcel(filtered)} className="gap-1.5 text-green-700 border-green-200 hover:bg-green-50">
            <FileDown className="w-4 h-4" /> Excel
          </Button>
          <Button onClick={() => { setEditingContact(null); setShowContactForm(true); }} className="gap-1 h-10">
            <Plus className="w-4 h-4" /> חדש
          </Button>
        </div>
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive font-medium">
          ⚠️ {overdueCount} אנשי קשר עם מעקב שחלף
        </div>
      )}

      {/* View toggle */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
        {[
          { key: 'list',      icon: List,        label: 'רשימה' },
          { key: 'kanban',    icon: LayoutGrid,   label: 'קנבן' },
          { key: 'dashboard', icon: BarChart2,    label: 'דשבורד' },
        ].map(v => (
          <button key={v.key} onClick={() => setView(v.key)}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              view === v.key ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground')}>
            <v.icon className="w-4 h-4" />{v.label}
          </button>
        ))}
      </div>

      {view === 'dashboard' && <CRMDashboard contacts={contacts} />}

      {view !== 'dashboard' && (
        <>
          {/* Status filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[{ key: 'all', label: 'הכל' }, ...Object.entries(STATUS_MAP).map(([k, v]) => ({ key: k, label: v.label }))].map(s => (
              <button key={s.key} onClick={() => setStatusFilter(s.key)}
                className={cn('flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                  statusFilter === s.key ? 'bg-primary text-white border-primary' : 'bg-card border-border text-muted-foreground')}>
                {s.label} <span className="mr-1 text-xs opacity-70">{s.key === 'all' ? contacts.length : contacts.filter(c => c.status === s.key).length}</span>
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש לפי שם, חברה, טלפון..." className="pr-9 h-11 text-base" />
          </div>
        </>
      )}

      {view === 'list' && (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>אין אנשי קשר עדיין</p>
            </div>
          )}
          {filtered.map(c => (
            <ContactCard
              key={c.id}
              contact={c}
              onEdit={contact => { setEditingContact(contact); setShowContactForm(true); }}
              onAddInteraction={contact => setInteractionFor(contact)}
            />
          ))}
        </div>
      )}

      {view === 'kanban' && (
        <CRMKanban contacts={filtered} onUpdate={load} />
      )}

      <Dialog open={showContactForm} onOpenChange={v => { if (!v) setShowContactForm(false); }}>
        {showContactForm && (
          <ContactForm
            contact={editingContact}
            customers={customers}
            onSave={() => { setShowContactForm(false); load(); }}
            onClose={() => setShowContactForm(false)}
          />
        )}
      </Dialog>

      <Dialog open={!!interactionFor} onOpenChange={v => { if (!v) setInteractionFor(null); }}>
        {interactionFor && (
          <InteractionForm
            contactId={interactionFor.id}
            contactName={interactionFor.name}
            onSave={() => { setInteractionFor(null); }}
            onClose={() => setInteractionFor(null)}
          />
        )}
      </Dialog>
    </div>
  );
}