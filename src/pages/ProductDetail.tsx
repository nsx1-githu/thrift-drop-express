import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ShoppingBag, Check } from 'lucide-react';
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
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Product not found</p>
          <button 
            onClick={() => navigate('/products')}
            className="mt-4 btn-secondary"
          >
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
    <div className="min-h-screen pb-24">
      {/* Image Gallery */}
      <div className="relative aspect-square bg-charcoal">
        <img 
          src={product.images[currentImageIndex]} 
          alt={product.name}
          className="w-full h-full object-cover"
        />
        
        {product.soldOut && (
          <div className="sold-out-overlay">
            <span className="sold-out-text text-lg">Sold Out</span>
          </div>
        )}

        {product.images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-background/80 rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-background/80 rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            
            {/* Image Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {product.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-primary' : 'bg-foreground/30'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-3 left-3 p-2 bg-background/80 rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Discount Badge */}
        {!product.soldOut && discount > 0 && (
          <span className="absolute top-3 right-3 px-3 py-1 text-sm font-bold bg-accent text-accent-foreground rounded-sm">
            -{discount}%
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="px-4 py-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {product.brand}
            </p>
            <h1 className="text-xl font-bold text-cream">{product.name}</h1>
          </div>
          <span className={`badge-condition ${product.condition}`}>
            {product.condition}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className="price-tag text-2xl">₹{product.price.toLocaleString()}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ₹{product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Quick Info */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1 p-3 bg-card rounded-sm border border-border">
            <p className="text-xs text-muted-foreground">Size</p>
            <p className="font-medium">{product.size}</p>
          </div>
          <div className="flex-1 p-3 bg-card rounded-sm border border-border">
            <p className="text-xs text-muted-foreground">Category</p>
            <p className="font-medium capitalize">{product.category}</p>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-2">Description</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Shipping Info */}
        <div className="p-4 bg-card rounded-sm border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Shipping</p>
          <p className="text-sm">Free shipping on orders above ₹999</p>
          <p className="text-sm text-muted-foreground mt-1">Dispatched within 24 hours</p>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
        <button 
          onClick={handleAddToCart}
          disabled={product.soldOut}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-sm font-semibold transition-all ${
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
