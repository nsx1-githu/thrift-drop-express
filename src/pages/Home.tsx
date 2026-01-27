import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Leaf, Sparkles, Heart, Recycle, Eye } from 'lucide-react';
import { HighlightsCarousel } from '@/components/HighlightsCarousel';
import { ProductCard } from '@/components/ProductCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Category } from '@/types/product';
import { useStorefrontProducts } from "@/hooks/useStorefrontProducts";
import { PageTransition, StaggerWrapper, StaggerItem, MotionButton } from '@/components/ui/motion';

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');

  const { data: products = [], isLoading } = useStorefrontProducts();

  // Get featured products for highlights, fallback to latest drops if none featured
  const featuredProducts = products.filter(p => p.isFeatured && !p.soldOut);
  const latestDrops = featuredProducts.length > 0 
    ? featuredProducts 
    : products.filter(p => !p.soldOut).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 6);

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  return (
    <PageTransition className="min-h-screen pb-28">
      {/* Hero Section - About Thrifting */}
      <section className="relative px-6 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <motion.p 
            className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Sustainable Fashion
          </motion.p>
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-normal mb-8 leading-tight text-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            What is Thrifting?
          </motion.h1>
          <motion.p 
            className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            Thrifting is the art of finding pre-loved treasures. It's about giving beautiful pieces a second life while reducing fashion's environmental footprint.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Link to="/products">
              <MotionButton className="inline-flex items-center gap-3 px-8 py-4 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-none border border-primary">
                SHOP NOW
                <ArrowRight className="w-4 h-4" />
              </MotionButton>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Why Thrift Section */}
      <section className="px-6 py-12 md:py-16 border-t border-border">
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl text-center mb-12 text-foreground">Why Thrift?</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { 
                icon: Leaf, 
                title: 'Eco-Friendly', 
                desc: 'Reduce textile waste and carbon footprint' 
              },
              { 
                icon: Sparkles, 
                title: 'Unique Finds', 
                desc: 'One-of-a-kind pieces you won\'t find elsewhere' 
              },
              { 
                icon: Heart, 
                title: 'Affordable', 
                desc: 'Premium brands at a fraction of retail' 
              },
              { 
                icon: Recycle, 
                title: 'Circular', 
                desc: 'Extend the lifecycle of quality garments' 
              }
            ].map((item, index) => (
              <motion.div 
                key={item.title}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-medium uppercase tracking-wider mb-2 text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Highlights Section */}
      <section className="px-6 py-12 border-t border-border">
        <motion.div 
          className="flex items-end justify-between mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-primary" />
            <h2 className="text-2xl md:text-3xl text-foreground">Highlights</h2>
          </div>
          <Link to="/products" className="text-sm uppercase tracking-wider text-foreground hover:text-muted-foreground transition-colors flex items-center gap-2">
            View All
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
        
        <HighlightsCarousel 
          products={latestDrops} 
          isLoading={isLoading} 
        />
      </section>

      {/* Browse by Category */}
      <section className="px-6 py-12 border-t border-border">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl mb-6 text-foreground">Shop by Category</h2>
        </motion.div>
        
        <CategoryFilter 
          selected={selectedCategory} 
          onSelect={setSelectedCategory} 
        />
        
        <StaggerWrapper className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-muted aspect-[3/4] animate-pulse" />
              ))
            : filteredProducts.slice(0, 8).map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product} />
                </StaggerItem>
              ))}
        </StaggerWrapper>

        {filteredProducts.length > 8 && (
          <motion.div 
            className="mt-10 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link to="/products">
              <MotionButton className="inline-flex items-center gap-2 px-6 py-3 text-sm uppercase tracking-wider border border-foreground text-foreground bg-transparent hover:bg-foreground hover:text-background transition-colors">
                View More
                <ArrowRight className="w-4 h-4" />
              </MotionButton>
            </Link>
          </motion.div>
        )}
      </section>
    </PageTransition>
  );
};

export default Home;
