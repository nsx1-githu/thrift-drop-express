import { Link } from 'react-router-dom';
import { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const discount = product.originalPrice 
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <Link 
      to={`/product/${product.id}`}
      className="product-card block animate-fade-in"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-charcoal">
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        
        {product.soldOut && (
          <div className="sold-out-overlay">
            <span className="sold-out-text">Sold Out</span>
          </div>
        )}

        {!product.soldOut && discount > 0 && (
          <span className="absolute top-2 left-2 px-2 py-1 text-xs font-bold bg-accent text-accent-foreground rounded-sm">
            -{discount}%
          </span>
        )}

        <span className={`badge-condition absolute top-2 right-2 ${product.condition}`}>
          {product.condition}
        </span>
      </div>

      <div className="p-3 space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {product.brand}
        </p>
        <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 pt-1">
          <span className="price-tag text-base">₹{product.price.toLocaleString()}</span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              ₹{product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Size: {product.size}</p>
      </div>
    </Link>
  );
};
