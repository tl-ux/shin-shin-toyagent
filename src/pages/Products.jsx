import { useState, useEffect, useRef } from 'react';
import { base44, supabase } from '@/api/supabaseClient';
import { Search, Plus, Package, Upload, X, ImagePlus, Edit2, Trash2, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import ProductCard from '@/components/products/ProductCard';

function ProductForm({ product, categories, allProducts, onSave, onClose }) {
  const [form, setForm] = useState(product || {
    name: '', sku: '', category: '', categories: [], product_type: 'single', price: '', unit: "יח'", stock: '', description: '', image_url: '', video_url: '', is_active: true
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const imgInputRef = useRef();

  const set = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    if (k === 'name') {
      const exists = allProducts.some(p => p.name.trim().toLowerCase() === v.trim().toLowerCase() && p.id !== product?.id);
      setDuplicateWarning(exists);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImg(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('product-images').upload(fileName, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
    setForm((prev) => ({ ...prev, image_url: publicUrl }));
    setUploadingImg(false);
    e.target.value = '';
  };

  const handleDelete = async () => {
    setDeleting(true);
    await base44.entities.Product.delete(product.id);
    onSave();
  };

  const save = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    const data = { ...form, price: parseFloat(form.price), stock: form.stock !== '' ? parseInt(form.stock) : null, categories: form.categories || [] };
    console.log('saving data:', JSON.stringify(data.categories));
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
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="שם הפריט" className={`mt-1 ${duplicateWarning ? 'border-destructive' : ''}`} />
          {duplicateWarning && <p className="text-destructive text-xs mt-1">פריט עם שם זה כבר קיים בקטלוג</p>}
        </div>
        <div>
          <Label>מחיר *</Label>
          <Input value={form.price} onChange={(e) => set('price', e.target.value)} type="number" placeholder="0.00" className="mt-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" dir="ltr" />
        </div>
        <div>
          <Label>קטגוריות</Label>
          <div className="mt-1 border border-input rounded-lg p-2 space-y-1 max-h-40 overflow-y-auto" dir="rtl">
            {categories.map(cat => (
              <label key={cat.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted p-1 rounded">
                <input
                  type="checkbox"
                  checked={(form.categories || []).includes(cat.name)}
                  onChange={(e) => {
                    const current = form.categories || [];
                    if (e.target.checked) {
                      set('categories', [...current, cat.name]);
                      if (!form.category) set('category', cat.name);
                    } else {
                      set('categories', current.filter(c => c !== cat.name));
                    }
                  }}
                />
                <span className="text-sm">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <Label>סוג פריט</Label>
          <Select value={form.product_type || 'single'} onValueChange={(v) => set('product_type', v)}>
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
          <Label>תמונה</Label>
          <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <div className="mt-1 space-y-2">
            {form.image_url && (
              <div className="relative group w-fit">
                <img src={form.image_url} alt="" className="w-24 h-24 object-cover rounded-lg border border-border" />
                <button
                  type="button"
                  onClick={() => set('image_url', '')}
                  className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-destructive text-white rounded-full hidden group-hover:flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => imgInputRef.current.click()} disabled={uploadingImg} className="gap-1.5 w-full">
              <ImagePlus className="w-4 h-4" />
              {uploadingImg ? 'מעלה...' : form.image_url ? 'החלף תמונה' : 'העלה תמונה'}
            </Button>
            <Input
              type="url"
              placeholder="או הדבק כתובת תמונה (URL)..."
              dir="ltr"
              className="text-sm"
              onPaste={(e) => {
                const url = e.clipboardData.getData('text').trim();
                if (url.startsWith('http')) { e.preventDefault(); set('image_url', url); }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim().startsWith('http')) {
                  e.preventDefault(); set('image_url', e.target.value.trim()); e.target.value = '';
                }
              }}
            />
          </div>
        </div>
        <div>
          <Label>סרטון (YouTube URL)</Label>
          <Input value={form.video_url || ''} onChange={(e) => set('video_url', e.target.value)} placeholder="https://youtube.com/watch?v=..." className="mt-1" dir="ltr" />
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={save} disabled={saving || !form.name || !form.price || duplicateWarning} className="flex-1">
            {saving ? 'שומר...' : 'שמור'}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">ביטול</Button>
        </div>
        {product?.id && (
          <div className="pt-1 border-t border-border">
            {!confirmDelete ? (
              <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="w-4 h-4 ml-1" /> מחק פריט
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

function CategoryManager({ categories, onClose, onRefresh }) {
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);

  const addCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    setSaving(true);
    await base44.entities.Category.create({ name });
    setNewCatName('');
    setSaving(false);
    onRefresh();
  };

  const renameCategory = async (cat) => {
    if (!editingName.trim()) return;
    await base44.entities.Category.update(cat.id, { name: editingName.trim() });
    // עדכן גם את כל המוצרים עם השם הישן
    const products = await base44.entities.Product.filter({ category: cat.name });
    await Promise.all(products.map(p => base44.entities.Product.update(p.id, { category: editingName.trim() })));
    setEditingId(null);
    setEditingName('');
    onRefresh();
  };

  const deleteCategory = async (cat) => {
    try { await base44.entities.Category.delete(cat.id); } catch (_) {}
    const prods = await base44.entities.Product.filter({ category: cat.name });
    await Promise.all(prods.map(p => base44.entities.Product.update(p.id, { category: '' })));
    onRefresh();
  };

  return (
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>ניהול קטגוריות</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 pt-2">
        <div className="flex gap-2">
          <Input
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="שם קטגוריה חדשה"
            onKeyDown={(e) => { if (e.key === 'Enter') addCategory(); }}
          />
          <Button onClick={addCategory} disabled={saving || !newCatName.trim()}>הוסף</Button>
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">אין קטגוריות עדיין</p>
          )}
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between p-2 bg-muted rounded-lg gap-2">
              {editingId === cat.id ? (
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') renameCategory(cat); }}
                  autoFocus
                  className="flex-1 h-8"
                />
              ) : (
                <span className="text-sm flex-1">{cat.name}</span>
              )}
              <div className="flex gap-1 flex-shrink-0">
                {editingId === cat.id ? (
                  <>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => renameCategory(cat)}>✓</Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>✕</Button>
                  </>
                ) : (
                  <>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteCategory(cat)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        <Button onClick={onClose} className="w-full">סיום</Button>
      </div>
    </DialogContent>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('הכל');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
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
                unit: { type: 'string' }
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

  const load = async () => {
    const [prods, cats] = await Promise.all([
      base44.entities.Product.list('-created_date'),
      base44.entities.Category.list('sort_order'),
    ]);
    setProducts(prods);
    setCategories(cats);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const catNames = ['הכל', ...categories.map(c => c.name)];

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'הכל' || p.category === category;
    return matchSearch && matchCat;
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <img src="https://media.base44.com/images/public/69cbdbfb3ccb589826de82bf/2c09fa58d_SHIN_SHIN_transparent.png" alt="טוען..." className="h-16 animate-pulse" />
    </div>
  );

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">קטלוג מוצרים</h1>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          <Button variant="outline" onClick={() => fileRef.current.click()} disabled={importing} className="gap-1 h-10 text-base">
            <Upload className="w-4 h-4" />
            {importing ? 'מייבא...' : 'ייבוא'}
          </Button>
          <Button variant="outline" onClick={() => setShowCategoryManager(true)} className="gap-1 h-10 text-base">
            <Tag className="w-4 h-4" />
            קטגוריות
          </Button>
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-1 h-10 text-base">
            <Plus className="w-4 h-4" />
            פריט חדש
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש פריט..." className="pr-9 h-11 text-base" />
      </div>

      {/* סיכום מוצרים לפי קטגוריה */}
      {categories.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat) => {
            const count = products.filter(p => p.category === cat.name && p.is_active !== false).length;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.name)}
                className={cn(
                  'text-right rounded-xl border p-3 transition-all',
                  category === cat.name ? 'bg-primary text-white border-primary' : 'bg-white border-border hover:border-primary/40'
                )}
              >
                <div className={cn('text-2xl font-bold', category === cat.name ? 'text-white' : 'text-primary')}>{count}</div>
                <div className={cn('text-sm truncate mt-0.5', category === cat.name ? 'text-white/80' : 'text-muted-foreground')}>{cat.name}</div>
              </button>
            );
          })}
        </div>
      )}

      {catNames.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {catNames.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border',
                category === cat ? 'bg-primary text-white border-primary' : 'bg-white border-border text-muted-foreground'
              )}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>אין פריטים</p>
        </div>
      )}

      {(() => {
        if (filtered.length === 0) return null;
        // Group by category in order
        const groups = [];
        const seen = new Set();
        filtered.forEach((p) => {
          const cat = p.category || 'ללא קטגוריה';
          if (!seen.has(cat)) { seen.add(cat); groups.push({ cat, items: [] }); }
          groups.find(g => g.cat === cat).items.push(p);
        });
        return groups.map(({ cat, items }) => (
          <div key={cat} className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground border-b border-border pb-2 text-center w-full" style={{textAlign: "center"}}>{cat}</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((p) => (
                <ProductCard key={p.id} p={p} onClick={() => { setEditing(p); setShowForm(true); }} />
              ))}
            </div>
          </div>
        ));
      })()}

      <Dialog open={showForm} onOpenChange={(v) => { if (!v) setShowForm(false); }}>
        {showForm && (
          <ProductForm
            product={editing}
            categories={categories}
            allProducts={products}
            onSave={() => { setShowForm(false); load(); }}
            onClose={() => setShowForm(false)}
          />
        )}
      </Dialog>

      <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
        {showCategoryManager && (
          <CategoryManager
            categories={categories}
            onClose={() => setShowCategoryManager(false)}
            onRefresh={load}
          />
        )}
      </Dialog>
    </div>
  );
}