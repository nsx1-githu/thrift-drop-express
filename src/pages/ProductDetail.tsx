import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ShoppingBag, Check, Shield, Truck } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import { useStorefrontProducts } from "@/hooks/useStorefrontProducts";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { items, addItem } = useCartStore();

  const { data: products = [], isLoading } = useStorefrontProducts();
  const product = products.find(p => p.id === id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-6">Product not found</p>
          <button onClick={() => navigate('/products')} className="btn-secondary">
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  const isInCart = items.some(item => item.product.id === product.id);
  const discount = product.originalPrice 
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (product.soldOut) {
      toast.error('This item is sold out');
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
    <div className="min-h-screen pb-32">
      {/* Image Gallery */}
      <div className="relative aspect-[4/5] bg-card overflow-hidden">
        <img 
          src={product.images[currentImageIndex]} 
          alt={product.name}
          className="w-full h-full object-cover"
        />
        
        {product.soldOut && (
          <div className="sold-out-overlay">
            <span className="sold-out-text text-base">Sold Out</span>
          </div>
        )}

        {product.images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            
            {/* Image Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {product.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex 
                      ? 'bg-primary w-6' 
                      : 'bg-foreground/30 hover:bg-foreground/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-3 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
          {!product.soldOut && discount > 0 && (
            <span className="px-4 py-1.5 text-sm font-semibold bg-accent text-accent-foreground rounded-full">
              -{discount}%
            </span>
          )}
          <span className={`badge-condition ${product.condition}`}>
            {product.condition}
          </span>
        </div>

        {/* One of One */}
        <div className="absolute bottom-4 left-4">
          <span className="badge-rare">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            One of One
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="px-6 py-6">
        <p className="section-title mb-2">{product.brand}</p>
        <h1 className="heading-lg mb-4">{product.name}</h1>

        {/* Price */}
        <div className="flex items-baseline gap-3 mb-6">
          <span className="price-tag-lg">₹{product.price.toLocaleString()}</span>
          {product.originalPrice && (
            <span className="text-base text-muted-foreground line-through">
              ₹{product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 section-floating">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Size</p>
            <p className="text-lg font-semibold">{product.size}</p>
          </div>
          <div className="p-4 section-floating">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Category</p>
            <p className="text-lg font-semibold capitalize">{product.category}</p>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="mb-6">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Details</p>
            <p className="text-base text-foreground/80 leading-relaxed">
              {product.description}
            </p>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="section-floating p-5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Authenticated</p>
                <p className="text-xs text-muted-foreground">Quality checked</p>
              </div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Truck className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Free Shipping</p>
                <p className="text-xs text-muted-foreground">Orders ₹999+</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-20 md:bottom-0 left-0 right-0 p-5 bg-background/80 backdrop-blur-xl border-t border-border/50">
        <button 
          onClick={handleAddToCart}
          disabled={product.soldOut}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-full font-semibold text-base transition-all ${
            product.soldOut 
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : isInCart
                ? 'bg-success text-success-foreground'
                : 'btn-primary'
          }`}
        >
          {product.soldOut ? (
            'Sold Out'
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
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
