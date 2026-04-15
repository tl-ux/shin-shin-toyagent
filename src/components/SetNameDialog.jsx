import { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SetNameDialog({ user, onDone }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const isNeeded = user && (!user.full_name || user.full_name.includes('@'));

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await supabase.from('users').update({ full_name: name.trim() }).eq('id', user.id);
    setSaving(false);
    onDone(name.trim());
  };

  if (!isNeeded) return null;

  return (
    <Dialog open={true}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>ברוך הבא! 👋</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">איך לקרוא לך?</p>
          <div>
            <Label>שם מלא</Label>
            <Input
              className="mt-1"
              placeholder="ישראל ישראלי"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              autoFocus
            />
          </div>
          <Button className="w-full" onClick={save} disabled={saving || !name.trim()}>
            {saving ? 'שומר...' : 'המשך'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
