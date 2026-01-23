import { useState, useMemo } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
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
  }, [selectedCategory, selectedSizes, selectedConditions, priceRange]);

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
    <div className="min-h-screen pb-20">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="section-title">All Products</h1>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-secondary rounded-sm"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 flex items-center justify-center text-xs bg-primary text-primary-foreground rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Category Filter */}
        <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-card rounded-sm border border-border animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Filters</span>
              {activeFilterCount > 0 && (
                <button 
                  onClick={clearFilters}
                  className="text-xs text-accent hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Size Filter */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-sm border transition-colors ${
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
            <div className="mb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Condition</p>
              <div className="flex flex-wrap gap-2">
                {conditions.map(condition => (
                  <button
                    key={condition}
                    onClick={() => toggleCondition(condition)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-sm border capitalize transition-colors ${
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
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Price: ₹{priceRange[0]} - ₹{priceRange[1]}
              </p>
              <input
                type="range"
                min="0"
                max="10000"
                step="500"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full accent-primary"
              />
            </div>
          </div>
        )}

        {/* Results Count */}
        <p className="text-xs text-muted-foreground mt-4 mb-3">
          {isLoading ? 'Loading…' : `${filteredProducts.length} products found`}
        </p>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 bg-card border border-border rounded-sm animate-pulse" />
              ))
            : filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>

        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products match your filters</p>
            <button 
              onClick={clearFilters}
              className="mt-3 text-sm text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
