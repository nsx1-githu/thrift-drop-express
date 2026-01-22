import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { products } from '@/data/products';
import { ProductCard } from '@/components/ProductCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Category } from '@/types/product';
import { Footer } from '@/components/Footer';

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');

  const latestDrops = products
    .filter(p => !p.soldOut)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative px-4 py-8 md:py-12">
        <div className="max-w-lg">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono text-accent uppercase tracking-wider">New Drops Weekly</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-cream leading-tight mb-3">
            Curated Thrift.
            <br />
            <span className="text-tan">Unbeatable Prices.</span>
          </h1>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            Premium second-hand streetwear and vintage. Every piece is one-of-one.
          </p>
          <Link to="/products" className="btn-primary inline-flex items-center gap-2">
            Shop All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Latest Drops */}
      <section className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title flex items-center gap-2">
            <span>🔥</span>
            Latest Drops
          </h2>
          <Link to="/products" className="text-xs font-medium text-primary hover:underline">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {latestDrops.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Browse by Category */}
      <section className="px-4 py-6">
        <h2 className="section-title mb-4">Browse by Category</h2>
        <CategoryFilter 
          selected={selectedCategory} 
          onSelect={setSelectedCategory} 
        />
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-4">
          {filteredProducts.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length > 8 && (
          <div className="mt-6 text-center">
            <Link to="/products" className="btn-secondary inline-flex items-center gap-2">
              View More
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {/* Trust Banner */}
      <section className="px-4 py-8 mt-4">
        <div className="bg-card rounded-sm p-6 border border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-cream">100%</p>
              <p className="text-xs text-muted-foreground mt-1">Authentic</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-cream">24hr</p>
              <p className="text-xs text-muted-foreground mt-1">Dispatch</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-cream">UPI</p>
              <p className="text-xs text-muted-foreground mt-1">Only</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
