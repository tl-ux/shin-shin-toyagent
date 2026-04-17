import { useState, useMemo } from 'react';
import { Search, ShoppingCart, Plus, Minus, ArrowUpDown, LayoutList, LayoutGrid, Grid3X3, Edit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const buildCategories = (products, allCategories) => {
  const fromProducts = [...new Set([
    ...products.map((p) => p.category).filter(Boolean),
    ...products.flatMap((p) => p.categories || []).filter(Boolean),
  ])];
  const extra = (allCategories || []).filter(c => !fromProducts.includes(c));
  return ['הכל', ...fromProducts, ...extra];
};

const SORT_OPTIONS = [
  { key: 'price_asc', label: 'מחיר ↑' },
  { key: 'price_desc', label: 'מחיר ↓' },
  { key: 'popular', label: 'פופולרי' },
];

export default function ProductCatalog({ products, cart, onAdd, onGoToCart, cartCount, getProductPrice, recentProductIds = [], allCategories = [] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('הכל');
  const [sortKey, setSortKey] = useState('default');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [inputQty, setInputQty] = useState('');
  const [cols, setCols] = useState(2);
  const [zoomedProduct, setZoomedProduct] = useState(null);
  const [zoomedImageUrl, setZoomedImageUrl] = useState(null);

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'הכל' || p.category === category || (p.categories || []).includes(category);
      return matchSearch && matchCat;
    });

    const categoryOrder = (cat) => {
      if (!cat) return 3;
      const trimmed = cat.trim().toLowerCase();
      if (trimmed.includes('tiger')) return 0;
      if (trimmed === 'שין שין - עץ' || trimmed.includes('שין שין - עץ')) return 1;
      if (trimmed === 'שין שין - יצירה' || trimmed.includes('שין שין - יצירה')) return 2;
      if (trimmed.includes('box candiy') || trimmed.includes('box candy')) return 3;
      if (trimmed.includes('sluban')) return 4;
      if (trimmed.includes('mideer')) return 5;
      if (trimmed.includes('mudpuppy')) return 6;
      if (trimmed.includes('mbi')) return 7;
      if (trimmed.includes('kaichi')) return 8;
      return 9;
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

  const cats = buildCategories(products, allCategories);

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


        </div>

        {cats.length > 1 &&
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {cats.map((cat) =>
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              'flex-shrink-0 px-6 py-3 rounded-full text-xl font-medium transition-colors border',
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
      <div className="p-4 space-y-6">
        {(() => {
          // Group products by category
          const groups = [];
          let currentCat = null;
          let currentItems = [];
          filtered.forEach((product) => {
            const cat = product.category || 'ללא קטגוריה';
            if (cat !== currentCat) {
              if (currentItems.length > 0) groups.push({ category: currentCat, items: currentItems });
              currentCat = cat;
              currentItems = [product];
            } else {
              currentItems.push(product);
            }
          });
          if (currentItems.length > 0) groups.push({ category: currentCat, items: currentItems });

          return groups.map(({ category: cat, items }) => (
            <div key={cat}>
              <h2 className="text-3xl font-bold text-foreground mb-3 border-b border-border pb-2 text-center" style={{textAlign: "center"}}>{cat}</h2>
              <div className={cn('gap-3', cols === 1 ? 'flex flex-col' : cols === 2 ? 'grid grid-cols-2' : 'grid grid-cols-3')}>
                {items.map((product) => {
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
                  onClick={(e) => { e.stopPropagation(); setZoomedImageUrl(product.image_url); }}
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

                  <div className="w-full flex items-center justify-between bg-accent rounded-lg p-1">
                      <button
                        onClick={() => onAdd(product, qty - 1)}
                        className="w-8 h-8 rounded-md bg-primary/20 text-primary flex items-center justify-center text-lg font-bold hover:bg-primary/30"
                      >-</button>
                      <span className="font-bold text-primary text-sm">{qty}</span>
                      <button
                        onClick={() => onAdd(product, qty + 1)}
                        className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold hover:bg-primary/80"
                      >+</button>
                    </div>
                  }
                </div>
              </div>
            </div>);

                })}
              </div>
            </div>
          ));
        })()}
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
      {zoomedImageUrl && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4" onClick={() => setZoomedImageUrl(null)}>
          <img src={zoomedImageUrl} alt="" className="max-w-full max-h-[80vh] object-contain rounded-lg" style={{ imageRendering: 'crisp-edges' }} />
        </div>
      )}

      {/* Quantity input dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={(v) => {if (!v) setSelectedProduct(null);}}>
        {selectedProduct &&
        <DialogContent className="max-w-lg p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
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
                 onClick={() => setZoomedImageUrl(selectedProduct.image_url)}
               /> :
               <span className="text-6xl font-bold text-primary/30">{selectedProduct.name[0]}</span>
               }
             </div>

             {/* Additional images gallery */}
             {selectedProduct.images && selectedProduct.images.length > 0 && (
               <div className="flex gap-2 p-2 overflow-x-auto w-full">
                 {selectedProduct.images.filter(Boolean).map((url, idx) => (
                   <img key={idx} src={url} alt="" className="h-20 w-20 object-cover rounded-lg border border-border flex-shrink-0 cursor-pointer" onClick={(e) => { e.stopPropagation(); setZoomedImageUrl(url); }} />
                 ))}
               </div>
             )}

             {/* Content */}
             <div className="p-4 space-y-3 w-full flex flex-col items-center text-center">
               <div className="w-full text-center">
                 <h2 className="text-2xl font-semibold text-center">{selectedProduct.name}</h2>
                 {selectedProduct.sku && <div className="text-base text-muted-foreground mt-0.5 text-center">מק"ט: {selectedProduct.sku}</div>}
               </div>

               {/* Price and Stock */}
               <div className="w-full flex items-center justify-center gap-4">
               <span className="font-bold text-primary text-2xl">
                 ₪{getProductPrice ? getProductPrice(selectedProduct) : selectedProduct.price}
               </span>

               </div>





               {/* Video */}
               {selectedProduct.video_url && (() => {
                 const url = selectedProduct.video_url;
                 const ytMatch = url.match(/(?:youtube.com.watch.v=|youtu.be.)([^&]+)/);
                 const driveMatch = url.match(/drive.google.com.file.d.([^/]+)/);
                 const embedUrl = ytMatch
                   ? `https://www.youtube.com/embed/${ytMatch[1]}`
                   : driveMatch
                   ? `https://drive.google.com/file/d/${driveMatch[1]}/preview`
                   : url;
                 return (
                   <div className="w-full aspect-video rounded-lg overflow-hidden border border-border">
                     <iframe src={embedUrl} className="w-full h-full" allowFullScreen allow="autoplay" />
                   </div>
                 );
               })()}

               {/* Quantity Input */}
             <Input
                type="number"
                min="1"
                value={inputQty}
                onChange={(e) => setInputQty(e.target.value)}
                placeholder="הקלד כמות..."
                autoFocus
                dir="rtl"
                className="text-center text-2xl py-7" />
              

             {/* Add Button */}
             <Button
                className="w-full text-xl py-6"
                onClick={() => {
                  const raw = inputQty.trim();
                  const qty = raw === '' ? 1 : parseInt(raw);
                  if (isNaN(qty)) return;
                  onAdd(selectedProduct, qty);
                  setSelectedProduct(null);
                  setInputQty('');
                }}>
               <Plus className="w-4 h-4 ml-1" />
               {inputQty.trim() === '0' ? 'הסר מהזמנה' : 'הוסף'}
             </Button>
             </div>
             </div>
             </DialogContent>
        }
      </Dialog>
    </div>);

}