import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import CustomerSelect from '@/components/order/CustomerSelect';
import ProductCatalog from '@/components/order/ProductCatalog';
import OrderCart from '@/components/order/OrderCart';
import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function NewOrder() {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('customer');
  const [recentProductIds, setRecentProductIds] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [draftOrderId, setDraftOrderId] = useState(null);
  const [vatRate, setVatRate] = useState(0.18);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // איפוס הזמנה רק כשמגיעים מדף אחר (לא ריענון)
  useEffect(() => {
    const isRefresh = sessionStorage.getItem('new-order-refresh');
    if (isRefresh) {
      sessionStorage.removeItem('new-order-refresh');
      return;
    }
    setSelectedCustomer(null);
    setCart([]);
    setStep('customer');
    setRecentProductIds([]);
    setDraftOrderId(null);
  }, [location.key]);

  // סמן שהדף עומד להתרענן
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (selectedCustomer) {
        sessionStorage.setItem('new-order-refresh', '1');
        sessionStorage.setItem('new-order-customer', JSON.stringify(selectedCustomer));
        sessionStorage.setItem('new-order-step', step);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [selectedCustomer, step]);

  // שחזר מצב אחרי ריענון
  useEffect(() => {
    const saved = sessionStorage.getItem('new-order-customer');
    const savedStep = sessionStorage.getItem('new-order-step');
    if (saved && savedStep) {
      try {
        const customer = JSON.parse(saved);
        setSelectedCustomer(customer);
        setStep(savedStep);
        sessionStorage.removeItem('new-order-customer');
        sessionStorage.removeItem('new-order-step');
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([
      base44.entities.Product.filter({ is_active: true }),
      base44.entities.Customer.filter({ is_active: true }),
      base44.entities.AppSettings.list(),
      base44.entities.Category.list(),
    ]).then(([prods, custs, settings, cats]) => {
      setAllCategories(cats.map(c => c.name));
      setProducts(prods);
      // אם המשתמש הוא store_manager, הוא רואה רק את הלקוח שלו
      const filteredCustomers = user?.role === 'store_manager' && user?.email
        ? custs.filter(c => c.email?.toLowerCase() === user.email?.toLowerCase())
        : custs;
      setCustomers(filteredCustomers);
      if (settings.length > 0 && settings[0].vat_rate) {
        setVatRate(settings[0].vat_rate);
      }
      setLoading(false);
    });
  }, [user?.id]);

  const loadDraft = async (customer) => {
    const drafts = await base44.entities.Order.filter({ customer_id: customer.id, status: 'draft' }, '-created_date', 1);
    if (drafts.length > 0) {
      const draft = drafts[0];
      setDraftOrderId(draft.id);
      setCart(draft.items || []);
      setStep('cart');
    }
  };

  const loadRecentProducts = async (customer) => {
    const orders = await base44.entities.Order.filter({ customer_id: customer.id }, '-created_date', 5);
    const ids = [];
    orders.forEach(o => (o.items || []).forEach(item => {
      if (!ids.includes(item.product_id)) ids.push(item.product_id);
    }));
    setRecentProductIds(ids);
  };

  const getProductPrice = (product) => {
    let basePrice = product.price;

    // סיטונאי - 50% ממחיר הצרכן כולל מע"מ
    if (selectedCustomer?.is_wholesale) {
      basePrice = Math.round(product.price * 0.5 * 100) / 100;
    }

    // עמלת רשת - מתווספת על המחיר הסיטונאי (50% ממחיר צרכן כולל מע"מ)
    if (selectedCustomer?.network_commission_percent) {
      const wholesaleBase = Math.round(product.price * 0.5 * 100) / 100;
      basePrice = Math.round(wholesaleBase * (1 + selectedCustomer.network_commission_percent / 100) * 100) / 100;
    }

    return basePrice;
  };

  const addToCart = (product, qty) => {
    if (qty <= 0) {
      setCart(prev => {
        const newCart = prev.filter(i => i.product_id !== product.id);
        saveDraft(newCart, selectedCustomer);
        return newCart;
      });
      return;
    }
    const unitPrice = getProductPrice(product);
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      let newCart;
      if (existing) {
        newCart = prev.map(i =>
          i.product_id === product.id
            ? { ...i, quantity: qty, total: qty * i.unit_price }
            : i
        );
      } else {
        newCart = [...prev, {
          product_id: product.id,
          product_name: product.name,
          sku: product.sku || '',
          quantity: qty,
          unit_price: unitPrice,
          total: qty * unitPrice,
        }];
      }
      saveDraft(newCart, selectedCustomer);
      return newCart;
    });
  };

  const saveDraft = async (newCart, customer) => {
    if (!customer) return;
    if (newCart.length === 0) {
      if (draftOrderId) {
        await base44.entities.Order.delete(draftOrderId);
        setDraftOrderId(null);
      }
      return;
    }
    const total = newCart.reduce((s, i) => s + i.total, 0);
    const currentUser = await base44.auth.me();
    if (draftOrderId) {
      await base44.entities.Order.update(draftOrderId, {
        items: newCart,
        total_amount: total,
      });
    } else {
      const orderNum = `ORD-${Date.now().toString().slice(-6)}`;
      const draft = await base44.entities.Order.create({
        order_number: orderNum,
        customer_id: customer.id || '',
        customer_name: customer.name || '',
        agent_name: currentUser?.full_name || '',
        status: 'draft',
        items: newCart,
        total_amount: total,
        visit_date: new Date().toISOString().split('T')[0],
      });
      setDraftOrderId(draft.id);
    }
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(i => i.product_id !== productId));
  };

  const updateQty = (productId, qty) => {
    if (qty <= 0) { removeFromCart(productId); return; }
    setCart(prev => prev.map(i =>
      i.product_id === productId
        ? { ...i, quantity: qty, total: qty * i.unit_price }
        : i
    ));
  };

  const totalAmount = cart.reduce((sum, i) => sum + i.total, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const submitOrder = async (notes) => {
    const currentUser = await base44.auth.me();
    let order;
    if (draftOrderId) {
      order = await base44.entities.Order.update(draftOrderId, {
        status: 'confirmed',
        items: cart,
        total_amount: totalAmount,
        notes,
        rivhit_status: 'pending',
      });
    } else {
      const orderNum = `ORD-${Date.now().toString().slice(-6)}`;
      order = await base44.entities.Order.create({
        order_number: orderNum,
        customer_id: selectedCustomer?.id || '',
        customer_name: selectedCustomer?.name || '',
        agent_name: currentUser?.full_name || '',
        status: 'confirmed',
        items: cart,
        total_amount: totalAmount,
        notes,
        visit_date: new Date().toISOString().split('T')[0],
        rivhit_status: 'pending',
      });
    }
    try {
      const settings = await base44.entities.AppSettings.list();
      const appSettings = settings[0] || {};
      if (appSettings.rivhit_enabled && appSettings.rivhit_api_token) {
        supabase.functions.invoke('sendToRivhit', { order_id: order.id })
          .catch(() => {});
      }
    } catch (_) {}
    navigate(`/orders`);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <img src="https://media.base44.com/images/public/69cbdbfb3ccb589826de82bf/2c09fa58d_SHIN_SHIN_transparent.png" alt="טוען..." className="h-16 animate-pulse" />
    </div>
  );

  return (
    <div className="pb-20 lg:pb-6">
      {/* Customer header */}
      {selectedCustomer && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-3 text-center">
          <div className="text-lg font-bold text-primary">{selectedCustomer.name}</div>
          {selectedCustomer.customer_number && (
            <div className="text-xs text-primary/70 mt-1">מספר לקוח: {selectedCustomer.customer_number}</div>
          )}
        </div>
      )}

      {/* Step Tabs */}
      <div className="bg-white border-b border-border sticky top-0 z-30">
        <div className="flex">
          {[
            { key: 'customer', label: 'לקוח', icon: null },
            { key: 'catalog', label: 'קטלוג', icon: null },
            { key: 'cart', label: 'הזמנה', icon: ShoppingCart },
          ].map((s, idx) => (
            <button
              key={s.key}
              onClick={() => {
                if (s.key === 'catalog' && !selectedCustomer) return;
                if (s.key === 'cart' && cart.length === 0) return;
                setStep(s.key);
              }}
              className={`flex-1 py-4 text-base font-medium border-b-2 transition-colors relative ${
                step === s.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <span className={`w-6 h-6 rounded-full text-sm flex items-center justify-center font-bold ${
                  step === s.key ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>{s.icon ? <s.icon className="w-3.5 h-3.5" /> : idx + 1}</span>
                <span className="text-base">{s.label}</span>
                {s.key === 'cart' && cartCount > 0 && (
                  <Badge className="h-10 px-3 text-lg bg-primary">{cartCount}</Badge>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {step === 'customer' && (
        <CustomerSelect
          customers={customers}
          selected={selectedCustomer}
          onSelect={async (c) => { setSelectedCustomer(c); loadRecentProducts(c); const drafts = await base44.entities.Order.filter({ customer_id: c.id, status: 'draft' }, '-created_date', 1); if (drafts.length > 0) { setDraftOrderId(drafts[0].id); setCart(drafts[0].items || []); setStep('cart'); } else { setStep('catalog'); } }}
        />
      )}

      {step === 'catalog' && (
        <ProductCatalog
          products={products}
          cart={cart}
          onAdd={addToCart}
          onGoToCart={() => setStep('cart')}
          cartCount={cartCount}
          getProductPrice={getProductPrice}
          recentProductIds={recentProductIds}
          allCategories={allCategories}
        />
      )}

      {step === 'cart' && (
        <OrderCart
          cart={cart}
          customer={selectedCustomer}
          totalAmount={totalAmount}
          onUpdateQty={updateQty}
          onRemove={removeFromCart}
          onSubmit={submitOrder}
          onBackToCatalog={() => setStep('catalog')}
          onLoadTemplate={(template) => {
            // Load template items into cart
            const newCart = (template.items || []).map(item => ({
              ...item,
              // recalculate price based on current customer group
              unit_price: item.unit_price,
              total: item.quantity * item.unit_price,
            }));
            newCart.forEach(item => {
              const product = products.find(p => p.id === item.product_id);
              if (product) {
                const price = getProductPrice(product);
                addToCart(product, item.quantity);
              }
            });
          }}
        />
      )}
    </div>
  );
}