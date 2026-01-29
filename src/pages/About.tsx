import { motion } from 'framer-motion';
import { User, Leaf, Sparkles, Heart, Recycle } from 'lucide-react';
import { useSiteContent } from '@/hooks/useSiteContent';
import { PageTransition } from '@/components/ui/motion';

const About = () => {
  const { getContent } = useSiteContent();

  const ownerName = getContent('content_owner_name');
  const ownerBio = getContent('content_owner_bio');
  const ownerImage = getContent('content_owner_image');

  const values = [
    { icon: Leaf, title: getContent('content_benefit_1_title'), desc: getContent('content_benefit_1_desc') },
    { icon: Sparkles, title: getContent('content_benefit_2_title'), desc: getContent('content_benefit_2_desc') },
    { icon: Heart, title: getContent('content_benefit_3_title'), desc: getContent('content_benefit_3_desc') },
    { icon: Recycle, title: getContent('content_benefit_4_title'), desc: getContent('content_benefit_4_desc') },
  ];

  return (
    <PageTransition className="min-h-screen pb-16">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-12 sm:pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h1 
            className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal mb-4 text-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {getContent('content_about_title')}
          </motion.h1>
          <motion.p 
            className="text-sm sm:text-base text-muted-foreground leading-relaxed"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {getContent('content_about_story')}
          </motion.p>
        </div>
      </section>

      {/* Owner Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Owner Image */}
            <motion.div 
              className="w-48 h-48 sm:w-64 sm:h-64 flex-shrink-0"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              {ownerImage ? (
                <img 
                  src={ownerImage} 
                  alt={ownerName}
                  className="w-full h-full object-cover rounded-full border-4 border-primary/20"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                  <User className="w-20 h-20 text-primary/30" strokeWidth={1} />
                </div>
              )}
            </motion.div>

            {/* Owner Info */}
            <motion.div 
              className="text-center md:text-left"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">Founder</p>
              <h2 className="text-2xl sm:text-3xl font-serif font-normal mb-4 text-foreground">
                {ownerName}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md">
                {ownerBio}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Origin Story */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-xl sm:text-2xl font-serif font-normal mb-4 text-foreground">
              {getContent('content_about_origin_title')}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {getContent('content_about_origin')}
            </p>
          </motion.div>

          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl sm:text-2xl font-serif font-normal mb-4 text-foreground">
              {getContent('content_about_mission_title')}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {getContent('content_about_mission')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Values */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.h2 
            className="text-xl sm:text-2xl font-serif font-normal text-center mb-10 text-foreground"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Our Values
          </motion.h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {values.map((item, index) => (
              <motion.div
                key={item.title}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-xs sm:text-sm font-medium uppercase tracking-wider mb-1 text-foreground">
                  {item.title}
                </h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PageTransition>
  );
};

export default About;
