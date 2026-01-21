import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

const Cart = () => {
  const navigate = useNavigate();
  const { items, removeItem, getTotal } = useCartStore();
  const total = getTotal();
  const shippingFree = total >= 999;
  const shippingCost = shippingFree ? 0 : 79;
  const finalTotal = total + shippingCost;

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-20">
        <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold text-cream mb-2">Your cart is empty</h1>
        <p className="text-sm text-muted-foreground mb-6">Start adding some fire pieces!</p>
        <Link to="/products" className="btn-primary inline-flex items-center gap-2">
          Shop Now
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-40">
      <div className="px-4 py-4">
        <h1 className="section-title mb-4">Your Cart</h1>

        {/* Cart Items */}
        <div className="space-y-3 mb-6">
          {items.map((item) => (
            <div 
              key={item.product.id}
              className="flex gap-3 p-3 bg-card rounded-sm border border-border animate-fade-in"
            >
              <Link to={`/product/${item.product.id}`} className="flex-shrink-0">
                <img 
                  src={item.product.images[0]} 
                  alt={item.product.name}
                  className="w-20 h-24 object-cover rounded-sm"
                />
              </Link>
              
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{item.product.brand}</p>
                <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                  {item.product.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">Size: {item.product.size}</p>
                <p className="price-tag">₹{item.product.price.toLocaleString()}</p>
              </div>

              <button 
                onClick={() => removeItem(item.product.id)}
                className="p-2 h-fit hover:bg-destructive/10 rounded-sm transition-colors"
                aria-label="Remove item"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </div>
          ))}
        </div>

        {/* Free Shipping Banner */}
        {!shippingFree && (
          <div className="p-3 bg-accent/10 rounded-sm border border-accent/20 mb-4">
            <p className="text-sm text-accent">
              Add ₹{(999 - total).toLocaleString()} more for free shipping!
            </p>
          </div>
        )}
      </div>

      {/* Order Summary - Fixed Bottom */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹{total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className={shippingFree ? 'text-success' : ''}>
              {shippingFree ? 'Free' : `₹${shippingCost}`}
            </span>
          </div>
          <div className="flex justify-between font-semibold text-cream pt-2 border-t border-border">
            <span>Total</span>
            <span className="price-tag text-lg">₹{finalTotal.toLocaleString()}</span>
          </div>
        </div>

        <button 
          onClick={() => navigate('/checkout')}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          Proceed to Checkout
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Cart;
