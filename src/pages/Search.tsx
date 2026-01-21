import { useState, useMemo } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { products } from '@/data/products';
import { ProductCard } from '@/components/ProductCard';

const Search = () => {
  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase().trim();
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.brand.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm)
    );
  }, [query]);

  const recentSearches = ['Carhartt', 'Nike', 'Vintage', 'Jeans'];
  const trendingBrands = ['Stüssy', 'Supreme', 'The North Face', 'Levi\'s'];

  return (
    <div className="min-h-screen pb-20">
      <div className="px-4 py-4">
        {/* Search Input */}
        <div className="relative mb-6">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, brands..."
            className="input-field pl-10 pr-10"
            autoFocus
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Search Results */}
        {query.trim() ? (
          <>
            <p className="text-xs text-muted-foreground mb-4">
              {searchResults.length} results for "{query}"
            </p>
            
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {searchResults.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No products found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try searching for brands like "Nike" or categories like "Jackets"
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Recent Searches */}
            <section className="mb-6">
              <h2 className="text-sm font-semibold mb-3">Recent Searches</h2>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3 py-1.5 text-sm bg-secondary rounded-sm hover:bg-muted transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </section>

            {/* Trending Brands */}
            <section>
              <h2 className="text-sm font-semibold mb-3">Trending Brands</h2>
              <div className="flex flex-wrap gap-2">
                {trendingBrands.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => setQuery(brand)}
                    className="px-3 py-1.5 text-sm bg-card border border-border rounded-sm hover:border-muted-foreground transition-colors"
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
