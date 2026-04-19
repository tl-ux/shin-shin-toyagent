import { useState, useEffect } from 'react';
import { base44, supabase } from '@/api/supabaseClient';
import { Mail, Phone, Save, Users, Send, CheckCircle, XCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [appSettings, setAppSettings] = useState(null);
  const [settingsForm, setSettingsForm] = useState({ office_email: '', office_whatsapp: '', vat_rate: 0.18, rivhit_api_token: '', rivhit_enabled: false });
  const [savingSettings, setSavingSettings] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [inviting, setInviting] = useState({});
  const [inviteStatus, setInviteStatus] = useState({});
  const { toast } = useToast();

  const load = async () => {
    const [settings, custs] = await Promise.all([
      base44.entities.AppSettings.list(),
      base44.entities.Customer.list(),
    ]);
    if (settings.length > 0) {
      setAppSettings(settings[0]);
      setSettingsForm({
        office_email: settings[0].office_email || '',
        office_whatsapp: settings[0].office_whatsapp || '',
        vat_rate: settings[0].vat_rate ?? 0.18,
        rivhit_api_token: settings[0].rivhit_api_token || '',
        rivhit_enabled: settings[0].rivhit_enabled ?? false,
      });
    }
    setCustomers(custs.filter(c => c.is_active));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);const saveSettings = async () => {
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

  const inviteCustomer = async (customer) => {
    if (!customer.email) {
      toast({ description: 'אין כתובת מייל ללקוח זה', variant: 'destructive' });
      return;
    }
    setInviting(p => ({ ...p, [customer.id]: true }));
    try {
      const { error } = await supabase.functions.invoke('invite-user', {
        body: { email: customer.email },
      });
      if (error) throw error;
      setInviteStatus(p => ({ ...p, [customer.id]: 'sent' }));
      toast({ description: `הזמנה נשלחה ל-${customer.email}` });
    } catch (err) {
      setInviteStatus(p => ({ ...p, [customer.id]: 'error' }));
      toast({ description: `שגיאה: ${err.message}`, variant: 'destructive' });
    }
    setInviting(p => ({ ...p, [customer.id]: false }));
  };if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <img src="https://media.base44.com/images/public/69cbdbfb3ccb589826de82bf/2c09fa58d_SHIN_SHIN_transparent.png" alt="טוען..." className="h-16 animate-pulse" />
    </div>
  );

  const customersWithEmail = customers.filter(c => c.email);
  const customersWithoutEmail = customers.filter(c => !c.email);

  return (
    <div className="p-4 pb-24 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-center">הגדרות</h1>
        <p className="text-sm text-muted-foreground mt-1">ניהול הגדרות המערכת</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          גישת חנויות לאפליקציה
        </h2>
        <p className="text-sm text-muted-foreground">
          שלח הזמנה לבעלי חנויות - הם יוכלו להיכנס ולבצע הזמנות בעצמם
        </p>
        {customersWithEmail.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            אין לקוחות עם כתובת מייל. הוסף מייל לכרטיס הלקוח כדי לשלוח הזמנה.
          </p>
        ) : (
          <div className="space-y-2">
            {customersWithEmail.map(customer => (
              <div key={customer.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">{customer.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {inviteStatus[customer.id] === 'sent' && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> נשלח
                    </span>
                  )}
                  {inviteStatus[customer.id] === 'error' && (
                    <span className="text-xs text-red-500 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> שגיאה
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    disabled={inviting[customer.id] || inviteStatus[customer.id] === 'sent'}
                    onClick={() => inviteCustomer(customer)}
                  >
                    <Send className="w-3 h-3" />
                    {inviting[customer.id] ? 'שולח...' : 'הזמן'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {customersWithoutEmail.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {customersWithoutEmail.length} לקוחות ללא מייל: {customersWithoutEmail.map(c => c.name).join(', ')}
          </p>
        )}
      </div><div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          פרטי המשרד
        </h2>
        <div>
          <Label>מייל המשרד לקבלת הזמנות</Label>
          <Input value={settingsForm.office_email} onChange={e => setSettingsForm(p => ({ ...p, office_email: e.target.value }))} placeholder="office@example.com" className="mt-1" dir="ltr" type="email" />
        </div>

        <div>
          <Label>שיעור מע"מ (%)</Label>
          <Input value={Math.round(settingsForm.vat_rate * 100)} onChange={e => setSettingsForm(p => ({ ...p, vat_rate: parseFloat(e.target.value) / 100 || 0 }))} type="number" placeholder="18" className="mt-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" dir="ltr" />
          <p className="text-xs text-muted-foreground mt-1">כרגע: {Math.round(settingsForm.vat_rate * 100)}%</p>
        </div>

      </div>

      {/* Networks */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h2 className="text-xl font-semibold">רשתות</h2>
        <NetworkManager />
      </div>

      <div className="flex justify-center">
      <Button onClick={saveSettings} disabled={savingSettings} className="gap-2">
        <Save className="w-4 h-4" />
        {savingSettings ? 'שומר...' : 'שמור הגדרות'}
      </Button>
      </div>
    </div>
  );
}

function NetworkManager() {
  const [networks, setNetworks] = useState([]);
  const [newName, setNewName] = useState('');
  const [newCommission, setNewCommission] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Network.list().then(setNetworks);
  }, []);

  const add = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await base44.entities.Network.create({
      name: newName.trim(),
      commission_percent: parseFloat(newCommission) || 0,
    });
    setNewName('');
    setNewCommission('');
    const updated = await base44.entities.Network.list();
    setNetworks(updated);
    setSaving(false);
  };

  const remove = async (id) => {
    await base44.entities.Network.delete(id);
    setNetworks(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="space-y-3">
      {networks.map(n => (
        <div key={n.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
          <span className="text-sm font-medium">{n.name} - {n.commission_percent}%</span>
          <button onClick={() => remove(n.id)} className="text-destructive text-sm">מחק</button>
        </div>
      ))}
      <div className="flex gap-2">
        <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="שם רשת" dir="rtl" className="flex-1" />
        <Input value={newCommission} onChange={e => setNewCommission(e.target.value)} placeholder="עמלה %" type="number" dir="ltr" className="w-24" />
        <Button onClick={add} disabled={saving || !newName.trim()} size="sm">הוסף</Button>
      </div>
    </div>
  );
}



