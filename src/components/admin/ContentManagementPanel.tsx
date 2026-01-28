import { useState, useEffect } from 'react';
import { Loader2, Save, RefreshCw, FileText, Type } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Content keys grouped by page/section
const CONTENT_SCHEMA = {
  owner: {
    label: 'Owner Section',
    icon: '👤',
    fields: [
      { key: 'content_owner_name', label: 'Owner Name', placeholder: 'The Owner', type: 'text' },
      { key: 'content_owner_bio', label: 'Owner Bio (2-3 lines)', placeholder: 'Passionate about sustainable fashion...', type: 'textarea' },
      { key: 'content_owner_image', label: 'Owner Image URL', placeholder: 'https://...', type: 'text' },
    ],
  },
  homepage: {
    label: 'Homepage',
    icon: '🏠',
    fields: [
      { key: 'content_hero_subtitle', label: 'Hero Subtitle', placeholder: 'Sustainable Fashion', type: 'text' },
      { key: 'content_hero_title', label: 'Hero Title', placeholder: 'What is Thrifting?', type: 'text' },
      { key: 'content_hero_description', label: 'Hero Description', placeholder: 'Thrifting is the art of finding pre-loved treasures...', type: 'textarea' },
      { key: 'content_hero_button', label: 'Hero Button Text', placeholder: 'SHOP NOW', type: 'text' },
      { key: 'content_why_thrift_title', label: 'Why Thrift Section Title', placeholder: 'Why Thrift?', type: 'text' },
      { key: 'content_benefit_1_title', label: 'Benefit 1 Title', placeholder: 'Eco-Friendly', type: 'text' },
      { key: 'content_benefit_1_desc', label: 'Benefit 1 Description', placeholder: 'Reduce textile waste and carbon footprint', type: 'text' },
      { key: 'content_benefit_2_title', label: 'Benefit 2 Title', placeholder: 'Unique Finds', type: 'text' },
      { key: 'content_benefit_2_desc', label: 'Benefit 2 Description', placeholder: "One-of-a-kind pieces you won't find elsewhere", type: 'text' },
      { key: 'content_benefit_3_title', label: 'Benefit 3 Title', placeholder: 'Affordable', type: 'text' },
      { key: 'content_benefit_3_desc', label: 'Benefit 3 Description', placeholder: 'Premium brands at a fraction of retail', type: 'text' },
      { key: 'content_benefit_4_title', label: 'Benefit 4 Title', placeholder: 'Circular', type: 'text' },
      { key: 'content_benefit_4_desc', label: 'Benefit 4 Description', placeholder: 'Extend the lifecycle of quality garments', type: 'text' },
      { key: 'content_highlights_title', label: 'Highlights Section Title', placeholder: 'Latest Drops', type: 'text' },
      { key: 'content_category_title', label: 'Category Section Title', placeholder: 'Shop by Category', type: 'text' },
    ],
  },
  products: {
    label: 'Products Page',
    icon: '🛍️',
    fields: [
      { key: 'content_products_title', label: 'Page Title', placeholder: 'All Products', type: 'text' },
      { key: 'content_products_empty', label: 'Empty State Message', placeholder: 'No products found', type: 'text' },
    ],
  },
  cart: {
    label: 'Cart Page',
    icon: '🛒',
    fields: [
      { key: 'content_cart_title', label: 'Page Title', placeholder: 'Your Cart', type: 'text' },
      { key: 'content_cart_empty', label: 'Empty Cart Message', placeholder: 'Your cart is empty', type: 'text' },
      { key: 'content_cart_checkout_button', label: 'Checkout Button Text', placeholder: 'Proceed to Checkout', type: 'text' },
    ],
  },
  checkout: {
    label: 'Checkout Page',
    icon: '💳',
    fields: [
      { key: 'content_checkout_title', label: 'Page Title', placeholder: 'Checkout', type: 'text' },
      { key: 'content_checkout_success', label: 'Success Message', placeholder: 'Order placed successfully!', type: 'text' },
    ],
  },
  footer: {
    label: 'Footer',
    icon: '📄',
    fields: [
      { key: 'content_footer_tagline', label: 'Footer Tagline', placeholder: 'Curated vintage & streetwear', type: 'text' },
      { key: 'content_footer_copyright', label: 'Copyright Text', placeholder: '© 2024 All rights reserved.', type: 'text' },
    ],
  },
  misc: {
    label: 'Miscellaneous',
    icon: '⚙️',
    fields: [
      { key: 'content_sold_out_label', label: 'Sold Out Badge Text', placeholder: 'Sold Out', type: 'text' },
      { key: 'content_featured_label', label: 'Featured Badge Text', placeholder: 'Featured', type: 'text' },
      { key: 'content_add_to_cart_button', label: 'Add to Cart Button', placeholder: 'Add to Cart', type: 'text' },
    ],
  },
};

export const ContentManagementPanel = () => {
  const [content, setContent] = useState<Record<string, string>>({});
  const [originalContent, setOriginalContent] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchContent = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('key, value')
        .like('key', 'content_%');

      if (error) throw error;

      const contentMap: Record<string, string> = {};
      (data || []).forEach((row) => {
        contentMap[row.key] = row.value;
      });
      setContent(contentMap);
      setOriginalContent(contentMap);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Failed to load content');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleChange = (key: string, value: string) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  const hasChanges = JSON.stringify(content) !== JSON.stringify(originalContent);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Get all content keys that have values
      const keysToSave = Object.entries(content).filter(([, value]) => value.trim() !== '');

      for (const [key, value] of keysToSave) {
        const { error } = await supabase
          .from('store_settings')
          .upsert({ key, value }, { onConflict: 'key' });

        if (error) throw error;
      }

      setOriginalContent({ ...content });
      toast.success('Content saved successfully!');
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save content');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Content Management</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchContent}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            Save All
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Edit all text content across your store. Leave fields empty to use defaults.
      </p>

      {/* Content Sections */}
      <Accordion type="multiple" defaultValue={['owner', 'homepage']} className="space-y-2">
        {Object.entries(CONTENT_SCHEMA).map(([sectionKey, section]) => (
          <AccordionItem
            key={sectionKey}
            value={sectionKey}
            className="border border-border rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <span>{section.icon}</span>
                <span className="font-medium">{section.label}</span>
                <span className="text-xs text-muted-foreground">
                  ({section.fields.length} fields)
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <Label htmlFor={field.key} className="text-sm font-medium mb-1 block">
                    {field.label}
                  </Label>
                  {field.type === 'textarea' ? (
                    <textarea
                      id={field.key}
                      value={content[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      className="input-field resize-none"
                    />
                  ) : (
                    <input
                      id={field.key}
                      type="text"
                      value={content[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="input-field"
                    />
                  )}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {hasChanges && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <Button onClick={handleSave} disabled={isSaving} className="shadow-lg">
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
};
