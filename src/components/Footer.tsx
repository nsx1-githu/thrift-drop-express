import { useState, useEffect } from 'react';
import { Instagram, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ContactSettings {
  contact_email: string;
  instagram_id: string;
  store_name: string;
}

export const Footer = () => {
  const [settings, setSettings] = useState<ContactSettings>({
    contact_email: '',
    instagram_id: '',
    store_name: 'THRIFT DROPS',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('store_settings')
        .select('key, value');

      if (data) {
        const settingsMap: ContactSettings = {
          contact_email: '',
          instagram_id: '',
          store_name: 'THRIFT DROPS',
        };
        data.forEach((item) => {
          if (item.key in settingsMap) {
            settingsMap[item.key as keyof ContactSettings] = item.value || settingsMap[item.key as keyof ContactSettings];
          }
        });
        setSettings(settingsMap);
      }
    };

    fetchSettings();
  }, []);

  const hasContact = settings.contact_email || settings.instagram_id;

  if (!hasContact) return null;

  return (
    <footer className="bg-card border-t border-border mt-8">
      <div className="container px-4 py-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <h3 className="text-sm font-semibold text-cream uppercase tracking-wider">
            Get in Touch
          </h3>
          
          <div className="flex flex-wrap items-center justify-center gap-6">
            {settings.instagram_id && (
              <a
                href={`https://instagram.com/${settings.instagram_id.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram className="w-5 h-5" />
                <span className="text-sm">@{settings.instagram_id.replace('@', '')}</span>
              </a>
            )}
            
            {settings.contact_email && (
              <a
                href={`mailto:${settings.contact_email}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="w-5 h-5" />
                <span className="text-sm">{settings.contact_email}</span>
              </a>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            © {new Date().getFullYear()} {settings.store_name || 'THRIFT DROPS'}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
