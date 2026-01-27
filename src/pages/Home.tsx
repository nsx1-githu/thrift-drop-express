import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Truck, CreditCard } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Category } from '@/types/product';
import { useStorefrontProducts } from "@/hooks/useStorefrontProducts";
import { PageTransition, StaggerWrapper, StaggerItem, MotionButton } from '@/components/ui/motion';

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
    <PageTransition className="min-h-screen pb-28">
      {/* Hero Section */}
      <section className="relative px-6 pt-8 pb-12 md:pt-16 md:pb-20 overflow-hidden">
        <div className="max-w-xl relative z-10">
          <motion.p 
            className="section-title mb-4 text-primary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Curated Collection
          </motion.p>
          <motion.h1 
            className="heading-xl mb-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Rare Finds.</span>
            <br />
            <span className="text-muted-foreground">Timeless Style.</span>
          </motion.h1>
          <motion.p 
            className="text-base text-muted-foreground mb-8 leading-relaxed max-w-md"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            Every piece in our collection is unique. Curated vintage and premium streetwear, authenticated and ready to ship.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Link to="/products">
              <MotionButton className="inline-flex items-center gap-3 px-10 py-5 text-lg font-semibold rounded-full bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                Explore Collection
                <ArrowRight className="w-5 h-5" />
              </MotionButton>
            </Link>
          </motion.div>
        </div>

        {/* Colorful Floating Accents */}
        <motion.div 
          className="absolute top-1/4 right-0 w-72 h-72 bg-gradient-to-br from-primary/20 to-accent/10 rounded-full blur-3xl -z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
        <motion.div 
          className="absolute bottom-0 left-1/4 w-48 h-48 bg-violet/10 rounded-full blur-3xl -z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.7 }}
        />
      </section>

      {/* Latest Drops */}
      <section className="px-6 py-8">
        <motion.div 
          className="flex items-end justify-between mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div>
            <p className="section-title mb-2">Just Dropped</p>
            <h2 className="heading-md">New Arrivals</h2>
          </div>
          <Link to="/products" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5">
            View All
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-luxury aspect-[3/4]" />
            ))}
          </div>
        ) : (
          <StaggerWrapper className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {latestDrops.map((product) => (
              <StaggerItem key={product.id}>
                <ProductCard product={product} />
              </StaggerItem>
            ))}
          </StaggerWrapper>
        )}
      </section>

      {/* Browse by Category */}
      <section className="px-6 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="section-title mb-2">Browse</p>
          <h2 className="heading-md mb-5">Shop by Category</h2>
        </motion.div>
        
        <CategoryFilter 
          selected={selectedCategory} 
          onSelect={setSelectedCategory} 
        />
        
        <StaggerWrapper className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-luxury aspect-[3/4]" />
              ))
            : filteredProducts.slice(0, 8).map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product} />
                </StaggerItem>
              ))}
        </StaggerWrapper>

        {filteredProducts.length > 8 && (
          <motion.div 
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link to="/products">
              <MotionButton className="btn-secondary inline-flex items-center gap-2">
                View More
                <ArrowRight className="w-4 h-4" />
              </MotionButton>
            </Link>
          </motion.div>
        )}
      </section>

      {/* Trust Banner */}
      <section className="px-6 py-10">
        <motion.div 
          className="section-floating p-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid grid-cols-3 gap-6">
            {[
              { icon: Shield, value: '100%', label: 'Authentic' },
              { icon: Truck, value: '24hr', label: 'Dispatch' },
              { icon: CreditCard, value: 'UPI', label: 'Secure' }
            ].map((item, index) => (
              <motion.div 
                key={item.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <motion.div 
                  className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center"
                  whileHover={{ scale: 1.1, backgroundColor: 'hsl(var(--primary) / 0.2)' }}
                  transition={{ duration: 0.2 }}
                >
                  <item.icon className="w-5 h-5 text-primary" />
                </motion.div>
                <p className="text-lg font-semibold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </PageTransition>
  );
};

export default Home;
