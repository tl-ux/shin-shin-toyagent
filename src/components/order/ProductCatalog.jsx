import { useState, useMemo } from 'react';
import { Search, ShoppingCart, Plus, Minus, ArrowUpDown, LayoutList, LayoutGrid, Grid3X3, Edit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const categories = (products) => {
  const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];
  return ['הכל', ...cats];
};

const SORT_OPTIONS = [
  { key: 'default', label: 'ברירת מחדל' },
  { key: 'price_asc', label: 'מחיר ↑' },
  { key: 'price_desc', label: 'מחיר ↓' },
  { key: 'popular', label: 'פופולרי' },
];

export default function ProductCatalog({ products, cart, onAdd, onGoToCart, cartCount, getProductPrice, recentProductIds = [] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('הכל');
  const [sortKey, setSortKey] = useState('default');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [inputQty, setInputQty] = useState('');
  const [cols, setCols] = useState(2);
  const [zoomedProduct, setZoomedProduct] = useState(null);

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'הכל' || p.category === category;
      return matchSearch && matchCat;
    });

    const categoryOrder = (cat) => {
      if (!cat) return 3;
      const lower = cat.toLowerCase();
      if (lower.includes('tiger tribe')) return 0;
      if (lower.includes('שין שין עץ')) return 1;
      return 2;
    };

    if (sortKey === 'default') list = [...list].sort((a, b) => {
      const orderDiff = categoryOrder(a.category) - categoryOrder(b.category);
      if (orderDiff !== 0) return orderDiff;
      const catDiff = (a.category || '').localeCompare(b.category || '', 'he');
      if (catDiff !== 0) return catDiff;
      return (a.name || '').localeCompare(b.name || '', 'he');
    });
    else if (sortKey === 'price_asc') list = [...list].sort((a, b) => (getProductPrice ? getProductPrice(a) : a.price) - (getProductPrice ? getProductPrice(b) : b.price));
    else if (sortKey === 'price_desc') list = [...list].sort((a, b) => (getProductPrice ? getProductPrice(b) : b.price) - (getProductPrice ? getProductPrice(a) : a.price));
    else if (sortKey === 'popular') list = [...list].sort((a, b) => (recentProductIds.indexOf(a.id) === -1 ? 999 : recentProductIds.indexOf(a.id)) - (recentProductIds.indexOf(b.id) === -1 ? 999 : recentProductIds.indexOf(b.id)));

    return list;
  }, [products, search, category, sortKey, getProductPrice, recentProductIds]);

  const cats = categories(products);

  const getCartQty = (productId) => {
    return cart.find((i) => i.product_id === productId)?.quantity || 0;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search + Filter */}
      <div className="p-4 space-y-3 bg-white border-b border-border">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש פריט..."
              className="pr-9" />
          </div>
          {/* Layout toggle */}
          <div className="flex gap-1 border border-border rounded-md p-0.5 bg-white">
            {[{ c: 2, Icon: LayoutGrid }, { c: 3, Icon: Grid3X3 }].map(({ c, Icon }) => (
              <button
                key={c}
                onClick={() => setCols(c)}
                className={cn('p-1.5 rounded transition-colors', cols === c ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground')}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* Sort button */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(v => !v)}
              className={cn('flex items-center gap-1.5 px-3 h-9 rounded-md border text-sm font-medium transition-colors',
                sortKey !== 'default' ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:text-foreground bg-white'
              )}
            >
              <ArrowUpDown className="w-4 h-4" />
              {SORT_OPTIONS.find(s => s.key === sortKey)?.label}
            </button>
            {showSortMenu && (
              <div className="absolute left-0 top-10 bg-white border border-border rounded-xl shadow-lg z-50 min-w-[130px] overflow-hidden">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => { setSortKey(opt.key); setShowSortMenu(false); }}
                    className={cn('w-full text-right px-4 py-2.5 text-sm hover:bg-muted transition-colors',
                      sortKey === opt.key ? 'font-bold text-primary' : 'text-foreground'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {cats.length > 1 &&
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {cats.map((cat) =>
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-full text-base font-medium transition-colors border',
              category === cat ?
              'bg-primary text-primary-foreground border-primary' :
              'bg-white text-muted-foreground border-border hover:border-primary/50'
            )}>
                {cat}
              </button>
          )}
          </div>
        }
      </div>

      {/* Products Grid */}
      <div className={cn('p-4 gap-3', cols === 1 ? 'flex flex-col' : cols === 2 ? 'grid grid-cols-2' : 'grid grid-cols-3')}>
        {filtered.map((product) => {
          const qty = getCartQty(product.id);
          const placeholderText = cols === 1 ? 'text-6xl' : cols === 2 ? 'text-3xl' : 'text-2xl';
          return (
            <div key={product.id} className={cn("bg-card rounded-xl border overflow-hidden shadow-sm flex flex-col", recentProductIds.includes(product.id) ? 'border-primary/40' : 'border-border')}>
              <div className="w-full aspect-square overflow-hidden bg-white flex items-center justify-center">
                {product.image_url ?
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-contain cursor-zoom-in"
                  style={{ imageRendering: 'crisp-edges' }}
                  loading="lazy"
                  onClick={(e) => { e.stopPropagation(); setZoomedProduct(product); }}
                /> :
                <span className={cn('font-bold text-primary/30', placeholderText)}>{product.name[0]}</span>
                }
              </div>
              <div className="p-3 flex flex-col flex-1">
                <div>
                  <div className="font-semibold text-xl leading-tight text-center">{product.name}</div>
                  {product.sku && <div className="text-xs text-muted-foreground mt-0.5 text-center">מק"ט: {product.sku}</div>}
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-primary text-lg font-bold w-full text-center block">
                      {(() => {
                        const price = getProductPrice ? getProductPrice(product) : product.price;
                        return <>₪{price.toLocaleString()}{product.unit && <span className="text-muted-foreground mr-1 ml-3 text-sm font-normal">{product.unit}</span>}</>;
                      })()}
                    </span>

                  </div>
                </div>

                <div className="mt-auto pt-2">
                  {qty === 0 ?
                  <Button
                   size="sm"
                   className="w-full h-10 text-base"
                    onClick={() => {
                      setSelectedProduct(product);
                      setInputQty('');
                    }}>
                      <Plus className="w-3 h-3 ml-1" />
                      הוסף
                    </Button> :

                  <button
                    onClick={() => { setSelectedProduct(product); setInputQty(String(qty)); }}
                    className="w-full flex items-center justify-between bg-accent rounded-lg p-1 hover:bg-accent/80 transition-colors"
                  >
                      <span className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">✓</span>
                      <span className="font-bold text-primary text-sm">{qty}</span>
                      <span className="w-7 h-7 rounded-md bg-primary/20 text-primary flex items-center justify-center">
                        <Edit2 className="w-3 h-3" />
                      </span>
                    </button>
                  }
                </div>
              </div>
            </div>);

        })}
      </div>

      {/* Floating cart button */}
      {cartCount > 0 &&
      <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40">
          <Button onClick={onGoToCart} className="shadow-xl px-6 py-3 h-auto rounded-full gap-2">
            <ShoppingCart className="w-5 h-5" />
            לסיכום הזמנה
            <Badge className="bg-white text-primary font-bold">{cartCount}</Badge>
          </Button>
        </div>
      }

      {/* Zoomed image overlay */}
      {zoomedProduct && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setZoomedProduct(null)}>
          <img src={zoomedProduct.image_url} alt="" className="max-w-full max-h-[80vh] object-contain rounded-lg" style={{ imageRendering: 'crisp-edges' }} />
        </div>
      )}

      {/* Quantity input dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={(v) => {if (!v) setSelectedProduct(null);}}>
        {selectedProduct &&
        <DialogContent className="max-w-sm p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
           <div className="flex flex-col items-center w-full">
             {/* Product Image */}
             <div className="w-full aspect-square bg-white flex items-center justify-center overflow-hidden">
               {selectedProduct.image_url ?
               <img
                 src={selectedProduct.image_url}
                 alt={selectedProduct.name}
                 className="w-full h-full object-contain cursor-zoom-in"
                 style={{ imageRendering: 'crisp-edges' }}
                 loading="lazy"
                 onClick={() => { setZoomedProduct(selectedProduct); }}
               /> :
               <span className="text-6xl font-bold text-primary/30">{selectedProduct.name[0]}</span>
               }
             </div>

             {/* Content */}
             <div className="p-4 space-y-3 w-full flex flex-col items-center text-center">
               <div className="w-full text-center">
                 <h2 className="text-base font-semibold text-center">{selectedProduct.name}</h2>
                 {selectedProduct.sku && <div className="text-xs text-muted-foreground mt-0.5 text-center">מק"ט: {selectedProduct.sku}</div>}
               </div>

               {/* Price and Stock */}
               <div className="w-full flex items-center justify-center gap-4 text-sm">
               <span className="font-bold text-primary">
                 ₪{getProductPrice ? getProductPrice(selectedProduct) : selectedProduct.price}
               </span>

               </div>

               {/* Quantity Input */}
             <Input
                type="number"
                min="1"
                value={inputQty}
                onChange={(e) => setInputQty(e.target.value)}
                placeholder="הקלד כמות..."
                autoFocus
                dir="rtl"
                className="text-center" />
              

             {/* Add Button */}
             <Button
                className="w-full"
                onClick={() => {
                  const qty = parseInt(inputQty) || 1;
                  if (qty > 0) {
                    onAdd(selectedProduct, qty);
                    setSelectedProduct(null);
                    setInputQty('');
                  }
                }}>
                
               <Plus className="w-4 h-4 ml-1" />
               הוסף
             </Button>
             </div>
             </div>
             </DialogContent>
        }
      </Dialog>
    </div>);

}