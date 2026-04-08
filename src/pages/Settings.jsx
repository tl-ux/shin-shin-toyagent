import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Mail, Phone, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [appSettings, setAppSettings] = useState(null);
  const [settingsForm, setSettingsForm] = useState({ office_email: '', office_whatsapp: '', vat_rate: 0.18 });
  const [savingSettings, setSavingSettings] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const settings = await base44.entities.AppSettings.list();
    if (settings.length > 0) {
      setAppSettings(settings[0]);
      setSettingsForm({
        office_email: settings[0].office_email || '',
        office_whatsapp: settings[0].office_whatsapp || '',
        vat_rate: settings[0].vat_rate ?? 0.18,
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
        <div>
          <Label>שיעור מע"מ (%)</Label>
          <Input
            value={Math.round(settingsForm.vat_rate * 100)}
            onChange={e => setSettingsForm(p => ({ ...p, vat_rate: parseFloat(e.target.value) / 100 || 0 }))}
            type="number"
            placeholder="18"
            className="mt-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            dir="ltr"
          />
          <p className="text-xs text-muted-foreground mt-1">כרגע: {Math.round(settingsForm.vat_rate * 100)}% — ישמש לחישוב מחירי סיטונאים</p>
        </div>
        <Button onClick={saveSettings} disabled={savingSettings} className="gap-2">
          <Save className="w-4 h-4" />
          {savingSettings ? 'שומר...' : 'שמור הגדרות'}
        </Button>
      </div>


    </div>
  );
}