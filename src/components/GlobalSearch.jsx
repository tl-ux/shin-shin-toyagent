import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, X, Package, Users, ShoppingCart, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      const q = query.toLowerCase();
      const [orders, customers, products, debts] = await Promise.all([
        base44.entities.Order.list('-created_date', 100),
        base44.entities.Customer.list(),
        base44.entities.Product.list(),
        base44.entities.Debt.list('-created_date', 100),
      ]);
      const res = [
        ...customers.filter(c => c.name?.toLowerCase().includes(q) || c.phone?.includes(q)).slice(0, 3).map(c => ({
          type: 'customer', icon: Users, label: c.name, sub: c.phone || c.city || '', path: '/customers', color: 'text-primary'
        })),
        ...orders.filter(o => o.customer_name?.toLowerCase().includes(q) || o.order_number?.toLowerCase().includes(q)).slice(0, 3).map(o => ({
          type: 'order', icon: ShoppingCart, label: o.customer_name, sub: `${o.order_number} • ₪${(o.total_amount||0).toLocaleString()}`, path: '/orders', color: 'text-success'
        })),
        ...products.filter(p => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)).slice(0, 3).map(p => ({
          type: 'product', icon: Package, label: p.name, sub: `₪${p.price} • ${p.sku || ''}`, path: '/products', color: 'text-primary'
        })),
        ...debts.filter(d => d.customer_name?.toLowerCase().includes(q) || d.order_number?.toLowerCase().includes(q)).filter(d => d.status !== 'paid').slice(0, 2).map(d => ({
          type: 'debt', icon: CreditCard, label: d.customer_name, sub: `חוב: ₪${(d.balance_due||0).toLocaleString()}`, path: '/debts', color: 'text-destructive'
        })),
      ];
      setResults(res);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const go = (path) => { navigate(path); setOpen(false); setQuery(''); };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-sm transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">חיפוש...</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-start justify-center pt-16 px-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="חיפוש לקוחות, הזמנות, מוצרים, חובות..."
                className="flex-1 outline-none text-base bg-transparent"
                dir="rtl"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {loading && (
              <div className="p-6 text-center text-muted-foreground text-sm">מחפש...</div>
            )}

            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="p-6 text-center text-muted-foreground text-sm">לא נמצאו תוצאות</div>
            )}

            {!loading && results.length > 0 && (
              <div className="py-2 max-h-80 overflow-y-auto">
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => go(r.path)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-right"
                  >
                    <div className={cn('w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0', r.color)}>
                      <r.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{r.label}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!query && (
              <div className="p-4 text-center text-xs text-muted-foreground">
                הקלד לפחות 2 תווים לחיפוש
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}