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
      className="product-card block animate-fade-in group"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-[1.5rem]">
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {product.soldOut && (
          <div className="sold-out-overlay rounded-t-[1.5rem]">
            <span className="sold-out-text">Sold Out</span>
          </div>
        )}

        {/* Badges Container */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          {!product.soldOut && discount > 0 && (
            <span className="px-3 py-1.5 text-xs font-semibold bg-accent text-accent-foreground rounded-full">
              -{discount}%
            </span>
          )}
          {!discount && <span />}
          
          <span className={`badge-condition ${product.condition}`}>
            {product.condition}
          </span>
        </div>

        {/* One of One Badge */}
        <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
          <span className="badge-rare">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            One of One
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">
          {product.brand}
        </p>
        <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-300">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2 pt-1">
          <span className="price-tag text-lg">₹{product.price.toLocaleString()}</span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              ₹{product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Size {product.size}</p>
      </div>
    </Link>
  );
};
