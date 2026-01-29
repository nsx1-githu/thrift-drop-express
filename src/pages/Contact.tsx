import { motion } from 'framer-motion';
import { MapPin, Clock, Mail, Instagram, Phone } from 'lucide-react';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { PageTransition } from '@/components/ui/motion';

const Contact = () => {
  const { getContent } = useSiteContent();
  const { settings } = useStoreSettings();

  const contactItems = [
    {
      icon: MapPin,
      title: getContent('content_contact_address_title'),
      value: getContent('content_contact_address'),
      link: null,
    },
    {
      icon: Clock,
      title: getContent('content_contact_hours_title'),
      value: getContent('content_contact_hours'),
      link: null,
    },
    ...(settings.contact_email ? [{
      icon: Mail,
      title: 'Email',
      value: settings.contact_email,
      link: `mailto:${settings.contact_email}`,
    }] : []),
    ...(settings.instagram_id ? [{
      icon: Instagram,
      title: 'Instagram',
      value: `@${settings.instagram_id}`,
      link: `https://instagram.com/${settings.instagram_id}`,
    }] : []),
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
            {getContent('content_contact_title')}
          </motion.h1>
          <motion.p 
            className="text-sm sm:text-base text-muted-foreground leading-relaxed"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {getContent('content_contact_description')}
          </motion.p>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-2xl mx-auto">
          <div className="grid gap-4 sm:gap-6">
            {contactItems.map((item, index) => (
              <motion.div
                key={item.title}
                className="bg-card border border-border rounded-xl p-5 sm:p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                      {item.title}
                    </h3>
                    {item.link ? (
                      <a 
                        href={item.link}
                        target={item.link.startsWith('http') ? '_blank' : undefined}
                        rel={item.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="text-base sm:text-lg text-primary hover:underline font-medium"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-base sm:text-lg text-foreground font-medium">
                        {item.value}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Message Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-muted/30">
        <div className="max-w-xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-xl sm:text-2xl font-serif font-normal mb-4 text-foreground">
              We'd Love to Hear From You
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Whether you have a question about our products, want to collaborate, or just want to say hi — reach out through any of the channels above!
            </p>
            
            {settings.instagram_id && (
              <a
                href={`https://instagram.com/${settings.instagram_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-none border border-primary hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Instagram className="w-4 h-4" />
                Message Us on Instagram
              </a>
            )}
          </motion.div>
        </div>
      </section>
    </PageTransition>
  );
};

export default Contact;
