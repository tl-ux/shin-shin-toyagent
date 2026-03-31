import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Plus, Package, AlertTriangle, Tag, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

function ProductForm({ product, onSave, onClose, priceGroups }) {
  const [form, setForm] = useState(product || {
    name: '', sku: '', category: '', product_type: 'single', price: '', unit: "יח'", stock: '', description: '', image_url: '', is_active: true, group_prices: []
  });
  const [saving, setSaving] = useState(false);

  const setGroupPrice = (groupId, groupName, price) => {
    setForm(prev => {
      const existing = (prev.group_prices || []).filter(gp => gp.price_group_id !== groupId);
      if (price === '') return { ...prev, group_prices: existing };
      return { ...prev, group_prices: [...existing, { price_group_id: groupId, price_group_name: groupName, price: parseFloat(price) }] };
    });
  };

  const getGroupPrice = (groupId) => {
    return form.group_prices?.find(gp => gp.price_group_id === groupId)?.price ?? '';
  };

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    const data = { ...form, price: parseFloat(form.price), stock: form.stock !== '' ? parseInt(form.stock) : null, group_prices: form.group_prices || [] };
    if (product?.id) {
      await base44.entities.Product.update(product.id, data);
    } else {
      await base44.entities.Product.create(data);
    }
    onSave();
  };

  return (
    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
      <DialogHeader className="text-center">
        <DialogTitle className="text-center">{product ? 'עריכת פריט' : 'פריט חדש'}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 pt-2">
        <div>
          <Label>שם הפריט *</Label>
          <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="שם הפריט" className="mt-1" />
        </div>
        <div>
          <Label>מחיר *</Label>
          <Input value={form.price} onChange={e => set('price', e.target.value)} type="number" placeholder="0.00" className="mt-1" dir="ltr" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>מק"ט</Label>
            <Input value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="SKU-001" className="mt-1" dir="ltr" />
          </div>
          <div>
            <Label>קטגוריה</Label>
            <Input value={form.category} onChange={e => set('category', e.target.value)} placeholder="קטגוריה" className="mt-1" />
          </div>
        </div>
        <div>
          <Label>סוג פריט</Label>
          <Select value={form.product_type || 'single'} onValueChange={v => set('product_type', v)}>
            <SelectTrigger className="mt-1" dir="rtl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">פריט בודד</SelectItem>
              <SelectItem value="display">דיספליי</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>כמות במלאי</Label>
          <Input value={form.stock} onChange={e => set('stock', e.target.value)} type="number" placeholder="0" className="mt-1" dir="ltr" />
        </div>
        {priceGroups.length > 0 && (
          <div>
            <Label className="flex items-center gap-1"><Tag className="w-3 h-3" /> מחירים לפי קבוצה</Label>
            <div className="space-y-2 mt-1">
              {priceGroups.map(g => (
                <div key={g.id} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-24 flex-shrink-0">{g.name}</span>
                  <Input
                    type="number"
                    placeholder={`מחיר בסיס: ${form.price || '0'}`}
                    value={getGroupPrice(g.id)}
                    onChange={e => setGroupPrice(g.id, g.name, e.target.value)}
                    className="flex-1"
                    dir="ltr"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        <div>
          <Label>תיאור</Label>
          <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className="mt-1 resize-none" />
        </div>
        <div>
          <Label>קישור לתמונה</Label>
          <Input value={form.image_url} onChange={e => set('image_url', e.target.value)} placeholder="https://..." className="mt-1" dir="ltr" />
        </div>
        <div className="flex gap-3 pt-2">
          <Button onClick={save} disabled={saving || !form.name || !form.price} className="flex-1">
            {saving ? 'שומר...' : 'שמור'}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">ביטול</Button>
        </div>
      </div>
    </DialogContent>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [priceGroups, setPriceGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('הכל');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                sku: { type: 'string' },
                price: { type: 'number' },
                stock: { type: 'number' },
                category: { type: 'string' },
                unit: { type: 'string' },
              }
            }
          }
        }
      }
    });
    if (result.status === 'success') {
      const rows = Array.isArray(result.output) ? result.output : result.output?.items || [];
      for (const row of rows) {
        if (row.name && row.price) {
          await base44.entities.Product.create({ ...row, is_active: true });
        }
      }
    }
    setImporting(false);
    e.target.value = '';
    load();
  };

  const load = () => Promise.all([
    base44.entities.Product.list('-created_date'),
    base44.entities.PriceGroup.list(),
  ]).then(([d, pg]) => { setProducts(d); setPriceGroups(pg); setLoading(false); });
  useEffect(() => { load(); }, []);

  const cats = ['הכל', ...new Set(products.map(p => p.category).filter(Boolean))];

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'הכל' || p.category === category;
    return matchSearch && matchCat;
  });

  const lowStock = products.filter(p => p.stock !== null && p.stock !== undefined && p.stock <= 5).length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">מלאי</h1>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          <Button variant="outline" onClick={() => fileRef.current.click()} disabled={importing} className="gap-1 h-10 text-base">
            <Upload className="w-4 h-4" />
            {importing ? 'מייבא...' : 'ייבוא'}
          </Button>
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-1 h-10 text-base">
            <Plus className="w-4 h-4" />
            פריט חדש
          </Button>
        </div>
      </div>

      {lowStock > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-3 flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
          <span><strong>{lowStock}</strong> פריטים במלאי נמוך (5 ומטה)</span>
        </div>
      )}

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש פריט..." className="pr-9 h-11 text-base" />
      </div>

      {cats.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {cats.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border',
                category === cat ? 'bg-primary text-white border-primary' : 'bg-white border-border text-muted-foreground'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-16 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>אין פריטים</p>
          </div>
        )}
        {filtered.map(p => (
          <button
            key={p.id}
            onClick={() => { setEditing(p); setShowForm(true); }}
            className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-sm transition-all text-right"
          >
            {p.image_url ? (
              <img src={p.image_url} alt={p.name} className="w-full h-24 object-cover" />
            ) : (
              <div className="w-full h-24 bg-gradient-to-br from-accent to-primary/10 flex items-center justify-center">
                <span className="text-3xl font-bold text-primary/30">{p.name[0]}</span>
              </div>
            )}
            <div className="p-3">
              <div className="font-semibold text-base leading-tight truncate text-center">{p.name}</div>
              {p.sku && <div className="text-xs text-muted-foreground mt-0.5 text-center">מק"ט: {p.sku}</div>}
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-primary text-base">₪{(p.price || 0).toLocaleString()}</span>
                {p.stock !== null && p.stock !== undefined && (
                  <span className={cn(
                    'text-xs font-medium px-1.5 py-0.5 rounded',
                    p.stock === 0 ? 'bg-destructive/10 text-destructive' :
                    p.stock <= 5 ? 'bg-warning/10 text-warning' :
                    'bg-success/10 text-success'
                  )}>
                    {p.stock}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={v => { if (!v) setShowForm(false); }}>
        {showForm && (
          <ProductForm
            product={editing}
            priceGroups={priceGroups}
            onSave={() => { setShowForm(false); load(); }}
            onClose={() => setShowForm(false)}
          />
        )}
      </Dialog>
    </div>
  );
}