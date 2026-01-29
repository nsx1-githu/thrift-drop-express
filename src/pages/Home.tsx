import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Leaf, Sparkles, Heart, Recycle, Eye, User, BookOpen, Phone } from 'lucide-react';
import { HighlightsCarousel } from '@/components/HighlightsCarousel';
import { ProductCard } from '@/components/ProductCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Category } from '@/types/product';
import { useStorefrontProducts } from "@/hooks/useStorefrontProducts";
import { useSiteContent } from "@/hooks/useSiteContent";
import { PageTransition, StaggerWrapper, StaggerItem, MotionButton, MotionCard } from '@/components/ui/motion';

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

  // Owner section content
  const ownerName = getContent('content_owner_name');
  const ownerBio = getContent('content_owner_bio');
  const ownerImage = getContent('content_owner_image');

  return (
    <PageTransition className="min-h-screen pb-8">
      {/* Owner Hero Section with Thrifting Content */}
      <section className="relative w-full min-h-[100svh] overflow-hidden">
        <div className="flex flex-col lg:flex-row min-h-[100svh]">
          {/* Left Side - Owner Image */}
          <div className="relative w-full lg:w-1/2 h-[60svh] lg:h-[100svh]">
            {ownerImage ? (
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${ownerImage})` }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-muted">
                <div className="absolute inset-0 flex items-center justify-center">
                  <User className="w-32 h-32 sm:w-48 sm:h-48 text-foreground/10" strokeWidth={0.5} />
                </div>
              </div>
            )}
            
            {/* Gradient Overlay for mobile */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-background" />
            
            {/* Owner Name & Bio - Mobile Only */}
            <motion.div 
              className="absolute bottom-6 left-0 right-0 text-center px-4 lg:hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl sm:text-4xl font-serif font-normal mb-2 text-foreground">
                {ownerName}
              </h1>
              <p className="text-sm text-foreground/80 leading-relaxed max-w-sm mx-auto">
                {ownerBio}
              </p>
            </motion.div>
          </div>

          {/* Right Side - Thrifting Content */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-8 lg:px-12 xl:px-16 py-10 lg:py-0 bg-background">
            {/* Owner Name & Bio - Desktop Only */}
            <motion.div 
              className="hidden lg:block mb-10"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl xl:text-5xl font-serif font-normal mb-3 text-foreground">
                {ownerName}
              </h1>
              <p className="text-sm xl:text-base text-foreground/70 leading-relaxed max-w-md">
                {ownerBio}
              </p>
            </motion.div>

            {/* Thrifting Section */}
            <motion.div
              className="mb-8 lg:mb-10"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2 lg:mb-3">
                {getContent('content_hero_subtitle')}
              </p>
              <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-normal mb-3 lg:mb-4 leading-tight text-foreground">
                {getContent('content_hero_title')}
              </h2>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed max-w-md">
                {getContent('content_hero_description')}
              </p>
            </motion.div>

            {/* Why Thrift Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <h3 className="text-sm sm:text-base lg:text-lg font-medium mb-4 lg:mb-5 text-foreground">
                {getContent('content_why_thrift_title')}
              </h3>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
                {benefits.map((item, index) => (
                  <motion.div 
                    key={item.title}
                    className="flex items-start gap-2 sm:gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.08 }}
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-primary/10">
                      <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-foreground">{item.title}</h4>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-snug">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Shop Now Button */}
            <motion.div
              className="mt-6 lg:mt-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Link to="/products">
                <MotionButton className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-none border border-primary">
                  {getContent('content_hero_button')}
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </MotionButton>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Latest Drops Section - Now right after owner */}
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

      {/* About & Contact Links Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {/* About Us Card */}
            <Link to="/about">
              <MotionCard className="group relative overflow-hidden bg-card border border-border rounded-xl p-6 sm:p-8 h-full hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-serif font-normal mb-2 text-foreground group-hover:text-primary transition-colors">
                      {getContent('content_about_title')}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      Learn our story, mission, and the passion behind every curated piece.
                    </p>
                  </div>
                </div>
                <ArrowRight className="absolute bottom-6 right-6 w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </MotionCard>
            </Link>

            {/* Contact Us Card */}
            <Link to="/contact">
              <MotionCard className="group relative overflow-hidden bg-card border border-border rounded-xl p-6 sm:p-8 h-full hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-serif font-normal mb-2 text-foreground group-hover:text-primary transition-colors">
                      {getContent('content_contact_title')}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      Get in touch with us for questions, collaborations, or just to say hello.
                    </p>
                  </div>
                </div>
                <ArrowRight className="absolute bottom-6 right-6 w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </MotionCard>
            </Link>
          </div>
        </div>
      </section>
    </PageTransition>
  );
};

export default Home;
