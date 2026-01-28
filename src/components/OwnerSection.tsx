import { motion } from 'framer-motion';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';

export const OwnerSection = () => {
  const { getContent } = useSiteContent();
  const { get } = useStoreSettings();
  
  const ownerName = get('owner_name', 'The Founder');
  const ownerBio = get('owner_bio', 'Passionate about sustainable fashion and giving pre-loved pieces a second life. Every item in our collection is hand-picked with care.');
  const ownerImage = get('owner_image', '');

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-t border-border">
      <motion.div
        className="max-w-2xl mx-auto text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Avatar className="w-24 h-24 sm:w-32 sm:h-32 mx-auto border-2 border-primary/20 shadow-lg">
            {ownerImage ? (
              <AvatarImage src={ownerImage} alt={ownerName} className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-muted text-muted-foreground">
              <User className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={1.5} />
            </AvatarFallback>
          </Avatar>
        </motion.div>

        <motion.h3
          className="text-lg sm:text-xl font-medium mb-2 text-foreground"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {ownerName}
        </motion.h3>

        <motion.p
          className="text-xs sm:text-sm uppercase tracking-wider text-muted-foreground mb-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          {getContent('content_owner_title') || 'Founder & Curator'}
        </motion.p>

        <motion.p
          className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {ownerBio}
        </motion.p>
      </motion.div>
    </section>
  );
};
