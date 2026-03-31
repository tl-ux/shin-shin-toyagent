import { useState } from 'react';
import { Search, ShoppingCart, Plus, Minus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const categories = (products) => {
  const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
  return ['הכל', ...cats];
};

export default function ProductCatalog({ products, cart, onAdd, onGoToCart, cartCount, getProductPrice }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('הכל');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [inputQty, setInputQty] = useState('');

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'הכל' || p.category === category;
    return matchSearch && matchCat;
  });

  const cats = categories(products);

  const getCartQty = (productId) => {
    return cart.find(i => i.product_id === productId)?.quantity || 0;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search + Filter */}
      <div className="p-4 space-y-3 bg-white border-b border-border">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש פריט..."
            className="pr-9"
          />
        </div>
        {cats.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {cats.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                  category === cat
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white text-muted-foreground border-border hover:border-primary/50'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="p-4 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map(product => {
          const qty = getCartQty(product.id);
          return (
            <div key={product.id} className="bg-card rounded-xl border border-border overflow-hidden shadow-sm flex flex-col">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-28 object-cover" />
              ) : (
                <div className="w-full h-28 bg-gradient-to-br from-accent to-primary/10 flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary/30">{product.name[0]}</span>
                </div>
              )}
              <div className="p-3 flex flex-col flex-1">
                <div>
                  <div className="font-semibold text-sm leading-tight">{product.name}</div>
                  {product.sku && <div className="text-xs text-muted-foreground mt-0.5">מק"ט: {product.sku}</div>}
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-bold text-primary text-sm">
                      {(() => {
                        const price = getProductPrice ? getProductPrice(product) : product.price;
                        return <>₪{price.toLocaleString()}{product.unit && <span className="text-xs text-muted-foreground font-normal">/{product.unit}</span>}</>;
                      })()}
                    </span>
                    {product.stock !== undefined && product.stock !== null && (
                      <span className={cn('text-xs font-medium', product.stock > 0 ? 'text-success' : 'text-destructive')}>
                        {product.stock > 0 ? `${product.stock} במלאי` : 'אזל'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-2">
                  {qty === 0 ? (
                    <Button
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={() => {
                        setSelectedProduct(product);
                        setInputQty('');
                      }}
                    >
                      <Plus className="w-3 h-3 ml-1" />
                      הוסף
                    </Button>
                  ) : (
                    <div className="flex items-center justify-between bg-accent rounded-lg p-1">
                      <button
                        onClick={() => onAdd(product, qty - 1)}
                        className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-primary text-sm">{qty}</span>
                      <button
                        onClick={() => onAdd(product, qty + 1)}
                        className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating cart button */}
      {cartCount > 0 && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40">
          <Button onClick={onGoToCart} className="shadow-xl px-6 py-3 h-auto rounded-full gap-2">
            <ShoppingCart className="w-5 h-5" />
            לסיכום הזמנה
            <Badge className="bg-white text-primary font-bold">{cartCount}</Badge>
          </Button>
        </div>
      )}

      {/* Quantity input dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={v => { if (!v) setSelectedProduct(null); }}>
        {selectedProduct && (
          <DialogContent className="max-w-xs p-0 overflow-hidden">
           {/* Product Image */}
           {selectedProduct.image_url ? (
             <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-32 object-cover" />
           ) : (
             <div className="w-full h-32 bg-gradient-to-br from-accent to-primary/10 flex items-center justify-center">
               <span className="text-4xl font-bold text-primary/30">{selectedProduct.name[0]}</span>
             </div>
           )}

           {/* Content */}
           <div className="p-4 space-y-3">
             <div className="flex flex-col items-center justify-center">
               <h2 className="text-base font-semibold">{selectedProduct.name}</h2>
               {selectedProduct.sku && <div className="text-xs text-muted-foreground mt-0.5">מק"ט: {selectedProduct.sku}</div>}
             </div>

             {/* Price and Stock */}
             <div className="flex items-center justify-between text-sm">
               <span className="font-bold text-primary">
                 ₪{getProductPrice ? getProductPrice(selectedProduct) : selectedProduct.price}
               </span>
               {selectedProduct.stock !== undefined && selectedProduct.stock !== null && (
                 <span className="text-muted-foreground text-xs">
                   {selectedProduct.stock > 0 ? `${selectedProduct.stock} במלאי` : 'אזל'}
                 </span>
               )}
             </div>

             {/* Quantity Input */}
             <Input
               type="number"
               min="1"
               value={inputQty}
               onChange={e => setInputQty(e.target.value)}
               placeholder="הקלד כמות..."
               autoFocus
               dir="rtl"
               className="text-right text-center"
             />

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
               }}
             >
               <Plus className="w-4 h-4 ml-1" />
               הוסף
             </Button>
           </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}