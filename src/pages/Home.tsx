import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Leaf, Sparkles, Heart, Recycle, Eye } from 'lucide-react';
import { HighlightsCarousel } from '@/components/HighlightsCarousel';
import { ProductCard } from '@/components/ProductCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { OwnerSection } from '@/components/OwnerSection';
import { Category } from '@/types/product';
import { useStorefrontProducts } from "@/hooks/useStorefrontProducts";
import { useSiteContent } from "@/hooks/useSiteContent";
import { PageTransition, StaggerWrapper, StaggerItem, MotionButton } from '@/components/ui/motion';

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');

  const { data: products = [], isLoading } = useStorefrontProducts();
  const { getContent } = useSiteContent();

  // Get featured products for highlights, fallback to latest drops if none featured
  const featuredProducts = products.filter(p => p.isFeatured && !p.soldOut);
  const latestDrops = featuredProducts.length > 0 
    ? featuredProducts 
    : products.filter(p => !p.soldOut).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 6);

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  // Get benefit content
  const benefits = [
    { 
      icon: Leaf, 
      title: getContent('content_benefit_1_title'), 
      desc: getContent('content_benefit_1_desc') 
    },
    { 
      icon: Sparkles, 
      title: getContent('content_benefit_2_title'), 
      desc: getContent('content_benefit_2_desc') 
    },
    { 
      icon: Heart, 
      title: getContent('content_benefit_3_title'), 
      desc: getContent('content_benefit_3_desc') 
    },
    { 
      icon: Recycle, 
      title: getContent('content_benefit_4_title'), 
      desc: getContent('content_benefit_4_desc') 
    }
  ];

  return (
    <PageTransition className="min-h-screen pb-8">
      {/* Hero Section - About Thrifting */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-12 sm:pb-16 md:pt-20 md:pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <motion.p 
            className="text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] text-muted-foreground mb-4 sm:mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {getContent('content_hero_subtitle')}
          </motion.p>
          <motion.h1 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal mb-6 sm:mb-8 leading-tight text-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {getContent('content_hero_title')}
          </motion.h1>
          <motion.p 
            className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-10 leading-relaxed max-w-xl mx-auto px-2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {getContent('content_hero_description')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Link to="/products">
              <MotionButton className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-none border border-primary">
                {getContent('content_hero_button')}
                <ArrowRight className="w-4 h-4" />
              </MotionButton>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Why Thrift Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-10 sm:py-12 md:py-16 border-t border-border">
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl text-center mb-8 sm:mb-12 text-foreground">
            {getContent('content_why_thrift_title')}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {benefits.map((item, index) => (
              <motion.div 
                key={item.title}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                  <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="text-xs sm:text-sm font-medium uppercase tracking-wider mb-1 sm:mb-2 text-foreground">{item.title}</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Owner Section */}
      <OwnerSection />

      {/* Highlights Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-10 sm:py-12 border-t border-border">
        <motion.div 
          className="flex items-end justify-between mb-6 sm:mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <h2 className="text-xl sm:text-2xl md:text-3xl text-foreground">
              {getContent('content_highlights_title')}
            </h2>
          </div>
          <Link to="/products" className="text-xs sm:text-sm uppercase tracking-wider text-foreground hover:text-muted-foreground transition-colors flex items-center gap-1 sm:gap-2">
            <span className="hidden sm:inline">View All</span>
            <span className="sm:hidden">All</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </Link>
        </motion.div>
        
        <HighlightsCarousel 
          products={latestDrops} 
          isLoading={isLoading} 
        />
      </section>

      {/* Browse by Category */}
      <section className="px-4 sm:px-6 lg:px-8 py-10 sm:py-12 border-t border-border">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl mb-4 sm:mb-6 text-foreground">
            {getContent('content_category_title')}
          </h2>
        </motion.div>
        
        <CategoryFilter 
          selected={selectedCategory} 
          onSelect={setSelectedCategory} 
        />
        
        <StaggerWrapper className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mt-4 sm:mt-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-muted aspect-[3/4] animate-pulse rounded-lg" />
              ))
            : filteredProducts.slice(0, 8).map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product} />
                </StaggerItem>
              ))}
        </StaggerWrapper>

        {filteredProducts.length > 8 && (
          <motion.div 
            className="mt-8 sm:mt-10 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link to="/products">
              <MotionButton className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm uppercase tracking-wider border border-foreground text-foreground bg-transparent hover:bg-foreground hover:text-background transition-colors">
                View More
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </MotionButton>
            </Link>
          </motion.div>
        )}
      </section>
    </PageTransition>
  );
};

export default Home;
