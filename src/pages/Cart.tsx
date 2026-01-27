import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingBag, ArrowRight, Package } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { PageTransition, MotionButton } from '@/components/ui/motion';
import { useCartAvailability } from '@/hooks/useCartAvailability';

const Cart = () => {
  const navigate = useNavigate();
  const { items, removeItem, getTotal } = useCartStore();
  
  // Monitor cart items for availability changes in real-time
  useCartAvailability();
  
  const total = getTotal();
  const shippingCost = 200;
  const finalTotal = total + shippingCost;

  if (items.length === 0) {
    return (
      <PageTransition className="min-h-screen flex flex-col items-center justify-center px-6 pb-28">
        <motion.div 
          className="w-20 h-20 rounded-3xl bg-card flex items-center justify-center mb-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
        >
          <ShoppingBag className="w-8 h-8 text-muted-foreground" />
        </motion.div>
        <motion.h1 
          className="heading-md mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Your cart is empty
        </motion.h1>
        <motion.p 
          className="text-base text-muted-foreground mb-8 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Discover unique pieces from our collection
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link to="/products">
            <MotionButton className="btn-primary inline-flex items-center gap-3">
              Explore Collection
              <ArrowRight className="w-4 h-4" />
            </MotionButton>
          </Link>
        </motion.div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen pb-52 md:pb-44">
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="section-title mb-1 sm:mb-2">Shopping</p>
          <h1 className="heading-md mb-4 sm:mb-6">Your Cart</h1>
        </motion.div>

        {/* Cart Items */}
        <div className="space-y-4 mb-6">
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <motion.div 
                key={item.product.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -100, scale: 0.9 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.05,
                  layout: { duration: 0.3 }
                }}
                className="flex gap-4 p-4 section-floating"
              >
                <Link to={`/product/${item.product.id}`} className="flex-shrink-0">
                  <motion.img 
                    src={item.product.images[0]} 
                    alt={item.product.name}
                    className="w-24 h-28 object-cover rounded-xl"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
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
                  <p className="price-tag text-lg"><span className="font-bold">₹</span>{item.product.price.toLocaleString()}</p>
                </div>

                <motion.button 
                  onClick={() => removeItem(item.product.id)}
                  className="p-2.5 h-fit rounded-xl bg-destructive/10 hover:bg-destructive/20 transition-colors"
                  aria-label="Remove item"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Shipping Info Banner */}
        <motion.div 
          className="section-floating p-4 flex items-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div 
            className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Package className="w-4 h-4 text-primary" />
          </motion.div>
          <p className="text-sm text-foreground">
            Flat shipping fee: <span className="font-bold text-primary">₹{shippingCost}</span>
          </p>
        </motion.div>

        {/* No Refund Policy */}
        <motion.div 
          className="section-floating p-4 flex items-center gap-3 bg-destructive/5 border-destructive/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-destructive" />
          </div>
          <p className="text-sm text-foreground">
            <span className="font-semibold text-destructive">No refunds.</span> Please shop carefully.
          </p>
        </motion.div>
      </div>

      {/* Order Summary - Fixed Bottom */}
      <motion.div 
        className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 p-4 sm:p-5"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div className="space-y-3 mb-5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium"><span className="font-bold">₹</span>{total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-bold"><span className="font-bold">₹</span>{shippingCost}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-border">
            <span className="font-medium">Total</span>
            <motion.span 
              className="price-tag-lg"
              key={finalTotal}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
            >
              <span className="font-bold text-xl">₹</span>{finalTotal.toLocaleString()}
            </motion.span>
          </div>
        </div>

        <MotionButton 
          onClick={() => navigate('/checkout')}
          className="w-full btn-primary flex items-center justify-center gap-3"
        >
          Proceed to Checkout
          <ArrowRight className="w-4 h-4" />
        </MotionButton>
      </motion.div>
    </PageTransition>
  );
};

export default Cart;
