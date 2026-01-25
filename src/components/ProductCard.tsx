import { Link } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
}

const cardVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  hover: { 
    y: -6,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  }
};

const imageVariants: Variants = {
  hover: { 
    scale: 1.05,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

const badgeVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  hover: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, delay: 0.1, ease: 'easeOut' }
  }
};

const glowVariants: Variants = {
  initial: { opacity: 0 },
  hover: { 
    opacity: 1,
    transition: { duration: 0.4 }
  }
};

export const ProductCard = ({ product }: ProductCardProps) => {
  const discount = product.originalPrice 
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <Link to={`/product/${product.id}`}>
      <motion.div 
        className="product-card block group relative"
        variants={cardVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
      >
        {/* Hover Glow Effect */}
        <motion.div 
          className="absolute -inset-1 rounded-[1.75rem] bg-primary/8 blur-xl -z-10"
          variants={glowVariants}
        />

        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-[1.5rem]">
          <motion.img 
            src={product.images[0]} 
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            variants={imageVariants}
          />
          
          {/* Gradient Overlay */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          />
          
          {product.soldOut && (
            <div className="sold-out-overlay rounded-t-[1.5rem]">
              <span className="sold-out-text">Sold Out</span>
            </div>
          )}

          {/* Badges Container */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            {!product.soldOut && discount > 0 && (
              <motion.span 
                className="px-3 py-1.5 text-xs font-semibold bg-accent text-accent-foreground rounded-full"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                -{discount}%
              </motion.span>
            )}
            {!discount && <span />}
            
            <motion.span 
              className={`badge-condition ${product.condition}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
            >
              {product.condition}
            </motion.span>
          </div>

          {/* One of One Badge */}
          <motion.div 
            className="absolute bottom-3 left-3"
            variants={badgeVariants}
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

        {/* Content */}
        <div className="p-4 space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            {product.brand}
          </p>
          <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-200">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="price-tag text-lg"><span className="font-bold">₹</span>{product.price.toLocaleString()}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                ₹{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Size {product.size}</p>
        </div>
      </motion.div>
    </Link>
  );
};
