import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingBag, Check, Shield, Truck, AlertTriangle, Clock } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import { useStorefrontProducts } from "@/hooks/useStorefrontProducts";
import { PageTransition, MotionButton } from '@/components/ui/motion';
import { useProductAvailability } from '@/hooks/useProductAvailability';
import { useProductLock } from '@/hooks/useProductLock';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { items, addItem } = useCartStore();

  const { data: products = [], isLoading } = useStorefrontProducts();
  const product = products.find(p => p.id === id);

  // Real-time lock status check
  const { isLocked } = useProductLock(product?.id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  if (!product) {
    return (
      <PageTransition className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-6">Product not found</p>
          <MotionButton onClick={() => navigate('/products')} className="btn-secondary">
            Back to Shop
          </MotionButton>
        </div>
      </PageTransition>
    );
  }

  // Real-time availability check
  const { isAvailable } = useProductAvailability(product.id);
  const isSoldOut = product.soldOut || isAvailable === false;
  const isTemporarilyReserved = isLocked && !isSoldOut;
  
  const isInCart = items.some(item => item.product.id === product.id);
  const discount = product.originalPrice 
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (isSoldOut) {
      toast.error('This item was just sold!', {
        icon: <AlertTriangle className="w-4 h-4" />,
      });
      return;
    }
    if (isTemporarilyReserved) {
      toast.error('This item is temporarily reserved. Please check back later.', {
        icon: <Clock className="w-4 h-4" />,
      });
      return;
    }
    if (isInCart) {
      navigate('/cart');
      return;
    }
    addItem(product);
    toast.success('Added to cart!');
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  return (
    <PageTransition className="min-h-screen pb-32">
      {/* Image Gallery */}
      <div className="relative aspect-[4/5] bg-card overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img 
            key={currentImageIndex}
            src={product.images[currentImageIndex]} 
            alt={product.name}
            className="w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        </AnimatePresence>
        
        {/* Sold Out Overlay */}
        {isSoldOut && (
          <div className="sold-out-overlay">
            <span className="sold-out-text text-base">Sold Out</span>
          </div>
        )}

        {/* Temporarily Reserved Overlay */}
        {isTemporarilyReserved && !isSoldOut && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <motion.div 
              className="text-center p-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Clock className="w-12 h-12 mx-auto mb-3 text-primary" />
              <p className="text-lg font-semibold">Temporarily Reserved</p>
              <p className="text-sm text-muted-foreground mt-1">
                This item is being held for another customer.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Please check back later.
              </p>
            </motion.div>
          </div>
        )}

        {product.images.length > 1 && (
          <>
            <motion.button 
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <motion.button 
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
            
            {/* Image Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {product.images.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-2 rounded-full transition-colors ${
                    index === currentImageIndex 
                      ? 'bg-primary' 
                      : 'bg-foreground/30 hover:bg-foreground/50'
                  }`}
                  animate={{ 
                    width: index === currentImageIndex ? 24 : 8 
                  }}
                  transition={{ duration: 0.2 }}
                />
              ))}
            </div>
          </>
        )}

        {/* Back Button */}
        <motion.button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-3 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>

        {/* Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
          {!isSoldOut && !isTemporarilyReserved && discount > 0 && (
            <motion.span 
              className="px-4 py-1.5 text-sm font-semibold bg-accent text-accent-foreground rounded-full"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              -{discount}%
            </motion.span>
          )}
          <motion.span 
            className={`badge-condition ${product.condition}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {product.condition}
          </motion.span>
        </div>

        {/* One of One */}
        <motion.div 
          className="absolute bottom-4 left-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <span className="badge-rare">
            <motion.span 
              className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            One of One
          </span>
        </motion.div>
      </div>

      {/* Product Info */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="section-title mb-1 sm:mb-2">{product.brand}</p>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-3 sm:mb-4">{product.name}</h1>
        </motion.div>

        {/* Price */}
        <motion.div 
          className="flex items-baseline gap-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <span className="price-tag-lg"><span className="font-bold text-2xl">₹</span>{product.price.toLocaleString()}</span>
          {product.originalPrice && (
            <span className="text-base text-muted-foreground line-through">
              ₹{product.originalPrice.toLocaleString()}
            </span>
          )}
        </motion.div>

        {/* Quick Info Cards */}
        <motion.div 
          className="grid grid-cols-2 gap-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div 
            className="p-4 section-floating"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Size</p>
            <p className="text-lg font-semibold">{product.size}</p>
          </motion.div>
          <motion.div 
            className="p-4 section-floating"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Category</p>
            <p className="text-lg font-semibold capitalize">{product.category}</p>
          </motion.div>
        </motion.div>

        {/* Description */}
        {product.description && (
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Details</p>
            <p className="text-base text-foreground/80 leading-relaxed">
              {product.description}
            </p>
          </motion.div>
        )}

        {/* Trust Indicators */}
        <motion.div 
          className="section-floating p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-4">
            {[
              { icon: Shield, title: 'Authenticated', subtitle: 'Quality checked' },
              { icon: Truck, title: 'Shipping', subtitle: '₹200 flat rate' }
            ].map((item, index) => (
              <motion.div 
                key={item.title}
                className="flex items-center gap-3 flex-1"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div 
                  className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"
                  whileHover={{ scale: 1.1, backgroundColor: 'hsl(var(--primary) / 0.2)' }}
                >
                  <item.icon className="w-4 h-4 text-primary" />
                </motion.div>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                </div>
                {index === 0 && <div className="w-px h-10 bg-border ml-auto" />}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Fixed Bottom CTA */}
      <motion.div 
        className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 sm:p-5 bg-background/80 backdrop-blur-xl border-t border-border/50"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 100, damping: 20 }}
      >
        <MotionButton 
          onClick={handleAddToCart}
          disabled={isSoldOut || isTemporarilyReserved}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-full font-semibold text-base transition-colors ${
            isSoldOut 
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : isTemporarilyReserved
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : isInCart
                  ? 'bg-success text-success-foreground'
                  : 'btn-primary'
          }`}
        >
          {isSoldOut ? (
            'Sold Out'
          ) : isTemporarilyReserved ? (
            <>
              <Clock className="w-5 h-5" />
              Temporarily Reserved
            </>
          ) : isInCart ? (
            <>
              <Check className="w-5 h-5" />
              View in Cart
            </>
          ) : (
            <>
              <ShoppingBag className="w-5 h-5" />
              Add to Cart — ₹{product.price.toLocaleString()}
            </>
          )}
        </MotionButton>
      </motion.div>
    </PageTransition>
  );
};

export default ProductDetail;
