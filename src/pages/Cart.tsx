import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Package } from 'lucide-react';
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
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-28">
        <div className="w-20 h-20 rounded-3xl bg-card flex items-center justify-center mb-6">
          <ShoppingBag className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="heading-md mb-2">Your cart is empty</h1>
        <p className="text-base text-muted-foreground mb-8 text-center">
          Discover unique pieces from our collection
        </p>
        <Link to="/products" className="btn-primary inline-flex items-center gap-3">
          Explore Collection
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-52">
      <div className="px-6 py-6">
        <p className="section-title mb-2">Shopping</p>
        <h1 className="heading-md mb-6">Your Cart</h1>

        {/* Cart Items */}
        <div className="space-y-4 mb-6">
          {items.map((item, index) => (
            <div 
              key={item.product.id}
              className="flex gap-4 p-4 section-floating animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Link to={`/product/${item.product.id}`} className="flex-shrink-0">
                <img 
                  src={item.product.images[0]} 
                  alt={item.product.name}
                  className="w-24 h-28 object-cover rounded-xl"
                />
              </Link>
              
              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">{item.product.brand}</p>
                  <h3 className="text-sm font-medium text-foreground line-clamp-2 mt-1">
                    {item.product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">Size {item.product.size}</p>
                </div>
                <p className="price-tag text-lg">₹{item.product.price.toLocaleString()}</p>
              </div>

              <button 
                onClick={() => removeItem(item.product.id)}
                className="p-2.5 h-fit rounded-xl bg-destructive/10 hover:bg-destructive/20 transition-colors"
                aria-label="Remove item"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </div>
          ))}
        </div>

        {/* Free Shipping Banner */}
        {!shippingFree && (
          <div className="section-floating p-4 flex items-center gap-3 animate-fade-in">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm text-foreground">
              Add <span className="font-semibold text-primary">₹{(999 - total).toLocaleString()}</span> more for free shipping
            </p>
          </div>
        )}
      </div>

      {/* Order Summary - Fixed Bottom */}
      <div className="fixed bottom-20 md:bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 p-5">
        <div className="space-y-3 mb-5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">₹{total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className={`font-medium ${shippingFree ? 'text-success' : ''}`}>
              {shippingFree ? 'Free' : `₹${shippingCost}`}
            </span>
          </div>
          <div className="flex justify-between pt-3 border-t border-border">
            <span className="font-medium">Total</span>
            <span className="price-tag-lg">₹{finalTotal.toLocaleString()}</span>
          </div>
        </div>

        <button 
          onClick={() => navigate('/checkout')}
          className="w-full btn-primary flex items-center justify-center gap-3"
        >
          Proceed to Checkout
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Cart;
