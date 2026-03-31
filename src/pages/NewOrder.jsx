import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
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
  const [step, setStep] = useState('customer'); // 'customer' | 'catalog' | 'cart'
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      base44.entities.Product.filter({ is_active: true }),
      base44.entities.Customer.filter({ is_active: true }),
    ]).then(([prods, custs]) => {
      setProducts(prods);
      setCustomers(custs);
      setLoading(false);
    });
  }, []);

  const getProductPrice = (product) => {
    if (!selectedCustomer?.price_group_id) return product.price;
    const gp = product.group_prices?.find(g => g.price_group_id === selectedCustomer.price_group_id);
    return gp ? gp.price : product.price;
  };

  const addToCart = (product, qty) => {
    const unitPrice = getProductPrice(product);
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product_id === product.id
            ? { ...i, quantity: qty, total: qty * i.unit_price }
            : i
        );
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        sku: product.sku || '',
        quantity: qty,
        unit_price: unitPrice,
        total: qty * unitPrice,
      }];
    });
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
    const user = await base44.auth.me();
    const orderNum = `ORD-${Date.now().toString().slice(-6)}`;
    const order = await base44.entities.Order.create({
      order_number: orderNum,
      customer_id: selectedCustomer?.id || '',
      customer_name: selectedCustomer?.name || '',
      agent_name: user?.full_name || '',
      status: 'confirmed',
      items: cart,
      total_amount: totalAmount,
      notes,
      visit_date: new Date().toISOString().split('T')[0],
    });
    // יצירה אוטומטית של חוב
    if (totalAmount > 0) {
      await base44.entities.Debt.create({
        customer_id: selectedCustomer?.id || '',
        customer_name: selectedCustomer?.name || '',
        order_id: order.id,
        order_number: orderNum,
        amount: totalAmount,
        amount_paid: 0,
        balance_due: totalAmount,
        status: 'open',
      });
    }
    navigate(`/orders`);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
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
            { key: 'customer', label: 'לקוח' },
            { key: 'catalog', label: 'קטלוג' },
            { key: 'cart', label: 'הזמנה' },
          ].map((s, idx) => (
            <button
              key={s.key}
              onClick={() => {
                if (s.key === 'catalog' && !selectedCustomer) return;
                if (s.key === 'cart' && cart.length === 0) return;
                setStep(s.key);
              }}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors relative ${
                step === s.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
                  step === s.key ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>{idx + 1}</span>
                {s.label}
                {s.key === 'cart' && cartCount > 0 && (
                  <Badge className="h-4 px-1 text-xs bg-primary">{cartCount}</Badge>
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
          onSelect={(c) => { setSelectedCustomer(c); setStep('catalog'); }}
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