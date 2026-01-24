import { useState, useMemo } from 'react';
import { Search as SearchIcon, X, TrendingUp, Clock } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { useStorefrontProducts } from "@/hooks/useStorefrontProducts";

const Search = () => {
  const [query, setQuery] = useState('');

  const { data: products = [], isLoading } = useStorefrontProducts();

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase().trim();
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.brand.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm)
    );
  }, [query, products]);

  const recentSearches = ['Carhartt', 'Nike', 'Vintage', 'Jeans'];
  const trendingBrands = ['Stüssy', 'Supreme', 'The North Face', 'Levi\'s'];

  return (
    <div className="min-h-screen pb-28">
      <div className="px-6 py-6">
        {/* Search Input */}
        <div className="relative mb-8">
          <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, brands..."
            className="input-field pl-14 pr-12"
            autoFocus
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-muted/50 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Search Results */}
        {query.trim() ? (
          <>
            <p className="text-sm text-muted-foreground mb-5">
              {isLoading ? 'Searching…' : `${searchResults.length} results for "${query}"`}
            </p>
            
            {!isLoading && searchResults.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {searchResults.map((product, index) => (
                  <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton-luxury aspect-[3/4]" />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-2">No products found</p>
                <p className="text-sm text-muted-foreground">
                  Try searching for brands like "Nike" or categories like "Jackets"
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Recent Searches */}
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Recent Searches</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-5 py-2.5 text-sm font-medium bg-secondary rounded-full hover:bg-muted transition-all hover:-translate-y-0.5"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </section>

            {/* Trending Brands */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Trending Brands</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {trendingBrands.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => setQuery(brand)}
                    className="px-5 py-2.5 text-sm font-medium bg-card border border-border rounded-full hover:border-primary/30 hover:bg-primary/5 transition-all hover:-translate-y-0.5"
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default Search;
