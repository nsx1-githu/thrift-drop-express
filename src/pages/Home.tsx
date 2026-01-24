import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Truck, CreditCard } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Category } from '@/types/product';
import { useStorefrontProducts } from "@/hooks/useStorefrontProducts";

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');

  const { data: products = [], isLoading } = useStorefrontProducts();

  const latestDrops = products
    .filter(p => !p.soldOut)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen pb-28">
      {/* Hero Section */}
      <section className="relative px-6 pt-8 pb-12 md:pt-16 md:pb-20">
        <div className="max-w-xl">
          <p className="section-title mb-4 animate-fade-in">Curated Collection</p>
          <h1 className="heading-xl mb-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Rare Finds.
            <br />
            <span className="text-muted-foreground">Timeless Style.</span>
          </h1>
          <p className="text-base text-muted-foreground mb-8 leading-relaxed max-w-md animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Every piece in our collection is unique. Curated vintage and premium streetwear, authenticated and ready to ship.
          </p>
          <Link 
            to="/products" 
            className="btn-primary inline-flex items-center gap-3 animate-fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            Explore Collection
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Floating Accent */}
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
      </section>

      {/* Latest Drops */}
      <section className="px-6 py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="section-title mb-2">Just Dropped</p>
            <h2 className="heading-md">New Arrivals</h2>
          </div>
          <Link to="/products" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5">
            View All
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-luxury aspect-[3/4]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {latestDrops.map((product, index) => (
              <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Browse by Category */}
      <section className="px-6 py-8">
        <p className="section-title mb-2">Browse</p>
        <h2 className="heading-md mb-5">Shop by Category</h2>
        
        <CategoryFilter 
          selected={selectedCategory} 
          onSelect={setSelectedCategory} 
        />
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-luxury aspect-[3/4]" />
              ))
            : filteredProducts.slice(0, 8).map((product, index) => (
                <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <ProductCard product={product} />
                </div>
              ))}
        </div>

        {filteredProducts.length > 8 && (
          <div className="mt-8 text-center">
            <Link to="/products" className="btn-secondary inline-flex items-center gap-2">
              View More
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {/* Trust Banner */}
      <section className="px-6 py-10">
        <div className="section-floating p-8">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <p className="text-lg font-semibold text-foreground">100%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Authentic</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <p className="text-lg font-semibold text-foreground">24hr</p>
              <p className="text-xs text-muted-foreground mt-0.5">Dispatch</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <p className="text-lg font-semibold text-foreground">UPI</p>
              <p className="text-xs text-muted-foreground mt-0.5">Secure</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
