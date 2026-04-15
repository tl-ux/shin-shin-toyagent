import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BookmarkCheck, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Dialog to save current cart as template
export function SaveTemplateDialog({ cart, customer, onClose, onSaved }) {
  const [name, setName] = useState(`תבנית - ${customer?.name || ''}`);
  const [saving, setSaving] = useState(false);
  

  const save = async () => {
    if (!name) return;
    setSaving(true);
    await base44.entities.OrderTemplate.create({
      name,
      customer_id: customer?.id || '',
      customer_name: customer?.name || '',
      items: cart,
    });
    toast('התבנית נשמרה בהצלחה!');
    onSaved();
  };

  return (
    <DialogContent className="max-w-sm">
      <DialogHeader><DialogTitle>שמור כתבנית חוזרת</DialogTitle></DialogHeader>
      <div className="space-y-4 pt-2">
        <div>
          <Label>שם התבנית</Label>
          <Input value={name} onChange={e => setName(e.target.value)} className="mt-1" />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">ביטול</Button>
          <Button onClick={save} disabled={saving || !name} className="flex-1">שמור</Button>
        </div>
      </div>
    </DialogContent>
  );
}

// List of templates to load
export function LoadTemplateDialog({ onLoad, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    base44.entities.OrderTemplate.list('-created_date').then(t => { setTemplates(t); setLoading(false); });
  }, []);

  const deleteTemplate = async (id, e) => {
    e.stopPropagation();
    await base44.entities.OrderTemplate.delete(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast('התבנית נמחקה');
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>טען תבנית הזמנה</DialogTitle></DialogHeader>
      <div className="pt-2 space-y-2 max-h-80 overflow-y-auto">
        {loading && <div className="text-center text-muted-foreground py-4">טוען...</div>}
        {!loading && templates.length === 0 && (
          <div className="text-center text-muted-foreground py-8">אין תבניות שמורות</div>
        )}
        {templates.map(t => (
          <button
            key={t.id}
            onClick={() => { onLoad(t); onClose(); }}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/30 transition-all text-right"
          >
            <div>
              <div className="font-semibold text-sm">{t.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t.customer_name} • {(t.items || []).length} פריטים</div>
            </div>
            <button
              onClick={(e) => deleteTemplate(t.id, e)}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </button>
        ))}
      </div>
    </DialogContent>
  );
}