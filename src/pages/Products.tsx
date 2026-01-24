import { useState, useMemo } from 'react';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Category, Condition, Size } from '@/types/product';
import { Constants } from "@/integrations/supabase/types";
import { useStorefrontProducts } from "@/hooks/useStorefrontProducts";

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
    <div className="min-h-screen pb-28">
      <div className="px-6 py-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="section-title mb-2">Collection</p>
            <h1 className="heading-md">All Products</h1>
          </div>
          <button 
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
              <span className="w-5 h-5 flex items-center justify-center text-xs bg-primary text-primary-foreground rounded-full">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Category Filter */}
        <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-5 p-5 section-floating animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-medium text-foreground">Refine Selection</span>
              {activeFilterCount > 0 && (
                <button 
                  onClick={clearFilters}
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear All
                </button>
              )}
            </div>

            {/* Size Filter */}
            <div className="mb-5">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`px-4 py-2 text-sm font-medium rounded-full border transition-all ${
                      selectedSizes.includes(size)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary border-border hover:border-muted-foreground'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition Filter */}
            <div className="mb-5">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Condition</p>
              <div className="flex flex-wrap gap-2">
                {conditions.map(condition => (
                  <button
                    key={condition}
                    onClick={() => toggleCondition(condition)}
                    className={`px-4 py-2 text-sm font-medium rounded-full border capitalize transition-all ${
                      selectedConditions.includes(condition)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary border-border hover:border-muted-foreground'
                    }`}
                  >
                    {condition}
                  </button>
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
          </div>
        )}

        {/* Results Count */}
        <p className="text-sm text-muted-foreground mt-6 mb-4">
          {isLoading ? 'Loading collection…' : `${filteredProducts.length} pieces found`}
        </p>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton-luxury aspect-[3/4]" />
              ))
            : filteredProducts.map((product, index) => (
                <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <ProductCard product={product} />
                </div>
              ))}
        </div>

        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No products match your selection</p>
            <button 
              onClick={clearFilters}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
