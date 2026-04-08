import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Plus, Package, Tag, Upload, X, ImagePlus, Edit2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import ProductCard from '@/components/products/ProductCard';

const PRESET_CATEGORIES = ['MIDEER', 'TIGER TRIBE', 'MUDPUPPY', 'Make Believe Idea', 'SLUBAN', 'Shin Shin', 'BOX CANDIY', 'KAICHI'];

function ProductForm({ product, onSave, onClose, priceGroups }) {
  const [form, setForm] = useState(product || {
    name: '', sku: '', category: '', product_type: 'single', price: '', unit: "יח'", stock: '', description: '', image_url: '', is_active: true, group_prices: []
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [customCategory, setCustomCategory] = useState(
    product?.category && !PRESET_CATEGORIES.includes(product.category) ? product.category : ''
  );
  const [showCustom, setShowCustom] = useState(
    product?.category && !PRESET_CATEGORIES.includes(product.category) && product.category !== ''
  );
  const imgInputRef = useRef();

  const setGroupPrice = (groupId, groupName, price) => {
    setForm((prev) => {
      const existing = (prev.group_prices || []).filter((gp) => gp.price_group_id !== groupId);
      if (price === '') return { ...prev, group_prices: existing };
      return { ...prev, group_prices: [...existing, { price_group_id: groupId, price_group_name: groupName, price: parseFloat(price) }] };
    });
  };

  const getGroupPrice = (groupId) => {
    return form.group_prices?.find((gp) => gp.price_group_id === groupId)?.price ?? '';
  };

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImg(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((prev) => ({ ...prev, image_url: file_url }));
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
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="שם הפריט" className="mt-1" />
        </div>
        <div>
          <Label>מחיר *</Label>
          <Input value={form.price} onChange={(e) => set('price', e.target.value)} type="number" placeholder="0.00" className="mt-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" dir="ltr" />
        </div>
        <div>
            <Label>קטגוריה</Label>
            <Select
              value={showCustom ? '__custom__' : (form.category || '__none__')}
              onValueChange={(v) => {
                if (v === '__custom__') {
                  setShowCustom(true);
                  set('category', customCategory);
                } else if (v === '__none__') {
                  setShowCustom(false);
                  set('category', '');
                } else {
                  setShowCustom(false);
                  set('category', v);
                }
              }}
            >
              <SelectTrigger className="mt-1" dir="rtl">
                <SelectValue placeholder="בחר קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">ללא קטגוריה</SelectItem>
                {PRESET_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
                <SelectItem value="__custom__">+ קטגוריה חדשה...</SelectItem>
              </SelectContent>
            </Select>
            {showCustom && (
              <Input
                value={customCategory}
                onChange={(e) => { setCustomCategory(e.target.value); set('category', e.target.value); }}
                placeholder="הקלד קטגוריה חדשה"
                className="mt-1"
                autoFocus
              />
            )}
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

        {priceGroups.length > 0 &&
        <div>
            <Label className="flex items-center gap-1"><Tag className="w-3 h-3" /> מחירים לפי קבוצה</Label>
            <div className="space-y-2 mt-1">
              {priceGroups.map((g) =>
            <div key={g.id} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-24 flex-shrink-0">{g.name}</span>
                  <Input
                type="number"
                placeholder={`מחיר בסיס: ${form.price || '0'}`}
                value={getGroupPrice(g.id)}
                onChange={(e) => setGroupPrice(g.id, g.name, e.target.value)}
                className="flex-1"
                dir="ltr" />
              
                </div>
            )}
            </div>
          </div>
        }

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
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="או הדבק כתובת תמונה (URL)..."
                dir="ltr"
                className="text-sm flex-1"
                onPaste={(e) => {
                  const url = e.clipboardData.getData('text').trim();
                  if (url.startsWith('http')) {
                    e.preventDefault();
                    set('image_url', url);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim().startsWith('http')) {
                    e.preventDefault();
                    set('image_url', e.target.value.trim());
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button onClick={save} disabled={saving || !form.name || !form.price} className="flex-1">
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
    </DialogContent>);

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
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [categoryInput, setCategoryInput] = useState('');
  const [editingCat, setEditingCat] = useState(null);
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

  const load = () => Promise.all([
  base44.entities.Product.list('-created_date'),
  base44.entities.PriceGroup.list()]
  ).then(([d, pg]) => {setProducts(d);setPriceGroups(pg);setLoading(false);});
  useEffect(() => {load();}, []);

  const cats = ['הכל', ...new Set(products.map((p) => p.category).filter(Boolean))];

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'הכל' || p.category === category;
    return matchSearch && matchCat;
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>);


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
          <Button onClick={() => {setEditing(null);setShowForm(true);}} className="gap-1 h-10 text-base">
            <Plus className="w-4 h-4" />
            פריט חדש
          </Button>
        </div>
      </div>



      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש פריט..." className="pr-9 h-11 text-base" />
      </div>

      {cats.length > 1 &&
      <div className="flex gap-2 overflow-x-auto pb-1 items-center">
          {cats.map((cat) =>
        <button
          key={cat}
          onClick={() => setCategory(cat)}
          className={cn(
            'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border',
            category === cat ? 'bg-primary text-white border-primary' : 'bg-white border-border text-muted-foreground'
          )}>
          
              {cat}
            </button>
        )}
        <Button variant="outline" size="sm" onClick={() => setShowCategoryManager(true)} className="gap-1.5 flex-shrink-0">
          <Edit2 className="w-3.5 h-3.5" />
          ערוך קטגוריות
        </Button>
        </div>
      }

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.length === 0 &&
        <div className="col-span-2 text-center py-16 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>אין פריטים</p>
          </div>
        }
        {filtered.map((p) =>
        <ProductCard key={p.id} p={p} onClick={() => {setEditing(p);setShowForm(true);}} />
        )}
      </div>

      <Dialog open={showForm} onOpenChange={(v) => {if (!v) setShowForm(false);}}>
        {showForm &&
        <ProductForm
          product={editing}
          priceGroups={priceGroups}
          onSave={() => {setShowForm(false);load();}}
          onClose={() => setShowForm(false)} />

        }
      </Dialog>

      <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>ערוך קטגוריות</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="flex gap-2">
              <Input
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                placeholder="קטגוריה חדשה"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && categoryInput.trim()) {
                    // עדכן את כל המוצרים עם הקטגוריה החדשה
                    setEditingCat(null);
                    setCategoryInput('');
                  }
                }}
              />
              <Button onClick={() => {
                if (categoryInput.trim()) {
                  setEditingCat(null);
                  setCategoryInput('');
                }
              }}>הוסף</Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {cats.filter(c => c !== 'הכל').map((cat) => (
                <div key={cat} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  {editingCat === cat ? (
                    <Input
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && categoryInput.trim()) {
                          // עדכן את הקטגוריה הקיימת
                          setEditingCat(null);
                          setCategoryInput('');
                        }
                      }}
                      autoFocus
                      className="flex-1 h-8"
                    />
                  ) : (
                    <span className="text-sm">{cat}</span>
                  )}
                  <div className="flex gap-1">
                    {editingCat === cat ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => {
                          // שמור עריכה
                          setEditingCat(null);
                          setCategoryInput('');
                        }}
                      >
                        ✓
                      </Button>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => {
                          setEditingCat(cat);
                          setCategoryInput(cat);
                        }}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={async () => {
                        // מחק קטגוריה - עדכן את כל המוצרים עם הקטגוריה הזו
                        const productsToUpdate = products.filter(p => p.category === cat);
                        for (const p of productsToUpdate) {
                          await base44.entities.Product.update(p.id, { ...p, category: '' });
                        }
                        setEditingCat(null);
                        load();
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={() => setShowCategoryManager(false)} className="w-full">סיום</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

}