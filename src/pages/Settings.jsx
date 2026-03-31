import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Tag, ChevronRight, Mail, Phone, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

function PriceGroupForm({ group, onSave, onClose }) {
  const [form, setForm] = useState(group || { name: '', description: '', discount_percent: '' });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    const data = { ...form, discount_percent: form.discount_percent !== '' ? parseFloat(form.discount_percent) : null };
    if (group?.id) {
      await base44.entities.PriceGroup.update(group.id, data);
    } else {
      await base44.entities.PriceGroup.create(data);
    }
    onSave();
  };

  return (
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>{group ? 'עריכת קבוצת מחיר' : 'קבוצת מחיר חדשה'}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 pt-2">
        <div>
          <Label>שם הקבוצה *</Label>
          <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="VIP, סיטונאי, רגיל..." className="mt-1" />
        </div>
        <div>
          <Label>תיאור</Label>
          <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className="mt-1 resize-none" />
        </div>
        <div>
          <Label>הנחה ברירת מחדל (%)</Label>
          <Input value={form.discount_percent} onChange={e => set('discount_percent', e.target.value)} type="number" placeholder="0" className="mt-1" dir="ltr" />
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

export default function Settings() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [appSettings, setAppSettings] = useState(null);
  const [settingsForm, setSettingsForm] = useState({ office_email: '', office_whatsapp: '' });
  const [savingSettings, setSavingSettings] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const [grps, settings] = await Promise.all([
      base44.entities.PriceGroup.list(),
      base44.entities.AppSettings.list(),
    ]);
    setGroups(grps);
    if (settings.length > 0) {
      setAppSettings(settings[0]);
      setSettingsForm({
        office_email: settings[0].office_email || '',
        office_whatsapp: settings[0].office_whatsapp || '',
      });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveSettings = async () => {
    setSavingSettings(true);
    if (appSettings?.id) {
      await base44.entities.AppSettings.update(appSettings.id, settingsForm);
    } else {
      const created = await base44.entities.AppSettings.create(settingsForm);
      setAppSettings(created);
    }
    setSavingSettings(false);
    toast({ description: 'ההגדרות נשמרו בהצלחה' });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 pb-24 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">הגדרות</h1>
        <p className="text-sm text-muted-foreground mt-1">ניהול הגדרות המערכת</p>
      </div>

      {/* Office Contact Settings */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          פרטי המשרד
        </h2>
        <div>
          <Label>מייל המשרד לקבלת הזמנות</Label>
          <Input
            value={settingsForm.office_email}
            onChange={e => setSettingsForm(p => ({ ...p, office_email: e.target.value }))}
            placeholder="office@example.com"
            className="mt-1"
            dir="ltr"
            type="email"
          />
        </div>
        <div>
          <Label className="flex items-center gap-1"><Phone className="w-3 h-3" /> מספר וואטסאפ של המשרד</Label>
          <Input
            value={settingsForm.office_whatsapp}
            onChange={e => setSettingsForm(p => ({ ...p, office_whatsapp: e.target.value }))}
            placeholder="972501234567"
            className="mt-1"
            dir="ltr"
          />
          <p className="text-xs text-muted-foreground mt-1">ללא + ורווחים, לדוגמה: 972501234567</p>
        </div>
        <Button onClick={saveSettings} disabled={savingSettings} className="gap-2">
          <Save className="w-4 h-4" />
          {savingSettings ? 'שומר...' : 'שמור הגדרות'}
        </Button>
      </div>

      {/* Price Groups Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">קבוצות מחיר</h2>
          </div>
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-1">
            <Plus className="w-4 h-4" />
            חדש
          </Button>
        </div>

        <div className="space-y-2">
          {groups.length === 0 && (
            <div className="text-center py-8 text-muted-foreground bg-card rounded-xl border border-border">
              <p>אין קבוצות מחיר</p>
            </div>
          )}
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => { setEditing(g); setShowForm(true); }}
              className="w-full text-right bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-sm transition-all flex items-center justify-between"
            >
              <div>
                <div className="font-semibold text-foreground">{g.name}</div>
                {g.description && <div className="text-sm text-muted-foreground mt-0.5">{g.description}</div>}
              </div>
              <div className="flex items-center gap-2">
                {g.discount_percent > 0 && (
                  <span className="text-sm font-bold text-primary bg-accent px-2 py-1 rounded-lg">
                    {g.discount_percent}%
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={v => { if (!v) setShowForm(false); }}>
        {showForm && (
          <PriceGroupForm
            group={editing}
            onSave={() => { setShowForm(false); load(); }}
            onClose={() => setShowForm(false)}
          />
        )}
      </Dialog>
    </div>
  );
}