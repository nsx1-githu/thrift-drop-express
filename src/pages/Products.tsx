import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Category, Condition, Size } from '@/types/product';
import { Constants } from "@/integrations/supabase/types";
import { useStorefrontProducts } from "@/hooks/useStorefrontProducts";
import { PageTransition, StaggerWrapper, StaggerItem, MotionButton } from '@/components/ui/motion';

const Products = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedSizes, setSelectedSizes] = useState<Size[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<Condition[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);

  const { data: products = [], isLoading } = useStorefrontProducts();

  const sizes = Constants.public.Enums.product_size as unknown as Size[];
  const conditions = Constants.public.Enums.product_condition as unknown as Condition[];

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;
      if (selectedSizes.length > 0 && !selectedSizes.includes(product.size)) return false;
      if (selectedConditions.length > 0 && !selectedConditions.includes(product.condition)) return false;
      if (product.price < priceRange[0] || product.price > priceRange[1]) return false;
      return true;
    });
  }, [products, selectedCategory, selectedSizes, selectedConditions, priceRange]);

  const toggleSize = (size: Size) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const toggleCondition = (condition: Condition) => {
    setSelectedConditions(prev => 
      prev.includes(condition) ? prev.filter(c => c !== condition) : [...prev, condition]
    );
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedSizes([]);
    setSelectedConditions([]);
    setPriceRange([0, 10000]);
  };

  const activeFilterCount = 
    (selectedCategory !== 'all' ? 1 : 0) + 
    selectedSizes.length + 
    selectedConditions.length +
    (priceRange[0] > 0 || priceRange[1] < 10000 ? 1 : 0);

  return (
    <PageTransition className="min-h-screen pb-28">
      <div className="px-6 py-6">
        {/* Header */}
        <motion.div 
          className="flex items-end justify-between mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <p className="section-title mb-2">Collection</p>
            <h1 className="heading-md">All Products</h1>
          </div>
          <MotionButton 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-full transition-all ${
              showFilters || activeFilterCount > 0
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-secondary text-secondary-foreground border border-transparent'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <motion.span 
                className="w-5 h-5 flex items-center justify-center text-xs bg-primary text-primary-foreground rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                {activeFilterCount}
              </motion.span>
            )}
            <motion.div
              animate={{ rotate: showFilters ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </MotionButton>
        </motion.div>

        {/* Category Filter */}
        <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              className="mt-5 p-5 section-floating overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-5">
                <span className="text-sm font-medium text-foreground">Refine Selection</span>
                {activeFilterCount > 0 && (
                  <motion.button 
                    onClick={clearFilters}
                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-3 h-3" />
                    Clear All
                  </motion.button>
                )}
              </div>

              {/* Size Filter */}
              <div className="mb-5">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Size</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size, index) => (
                    <motion.button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
                        selectedSizes.includes(size)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary border-border hover:border-muted-foreground'
                      }`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {size}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Condition Filter */}
              <div className="mb-5">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Condition</p>
                <div className="flex flex-wrap gap-2">
                  {conditions.map((condition, index) => (
                    <motion.button
                      key={condition}
                      onClick={() => toggleCondition(condition)}
                      className={`px-4 py-2 text-sm font-medium rounded-full border capitalize transition-colors ${
                        selectedConditions.includes(condition)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary border-border hover:border-muted-foreground'
                      }`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {condition}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
                  Price Range
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium tabular-nums">₹{priceRange[0]}</span>
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="500"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="flex-1 accent-primary h-1 rounded-full appearance-none bg-muted cursor-pointer"
                  />
                  <span className="text-sm font-medium tabular-nums">₹{priceRange[1]}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Count */}
        <motion.p 
          className="text-sm text-muted-foreground mt-6 mb-4"
          key={filteredProducts.length}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {isLoading ? 'Loading collection…' : `${filteredProducts.length} pieces found`}
        </motion.p>

        {/* Product Grid */}
        <StaggerWrapper className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton-luxury aspect-[3/4]" />
              ))
            : filteredProducts.map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product} />
                </StaggerItem>
              ))}
        </StaggerWrapper>

        {!isLoading && filteredProducts.length === 0 && (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-muted-foreground mb-4">No products match your selection</p>
            <MotionButton 
              onClick={clearFilters}
              className="btn-secondary"
            >
              Clear Filters
            </MotionButton>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
};

export default Products;
