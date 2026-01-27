import { useState, useRef } from 'react';
import { ChevronLeft, Upload, X, Plus, Loader2, Trash2, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { Database } from '@/integrations/supabase/types';
import { Constants } from '@/integrations/supabase/types';

type ProductInsert = Database['public']['Tables']['products']['Insert'];

interface BatchProductFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ProductEntry {
  id: string;
  name: string;
  brand: string;
  price: string;
  original_price: string;
  category: Database['public']['Enums']['product_category'] | '';
  condition: Database['public']['Enums']['product_condition'] | '';
  size: Database['public']['Enums']['product_size'] | '';
  description: string;
  sold_out: boolean;
  is_featured: boolean;
  images: string[];
  uploadingImages: boolean;
  errors: Record<string, string>;
}

const CATEGORIES = Constants.public.Enums.product_category;
const CONDITIONS = Constants.public.Enums.product_condition;
const SIZES = Constants.public.Enums.product_size;

const createEmptyProduct = (): ProductEntry => ({
  id: crypto.randomUUID(),
  name: '',
  brand: '',
  price: '',
  original_price: '',
  category: '',
  condition: '',
  size: '',
  description: '',
  sold_out: false,
  is_featured: false,
  images: [],
  uploadingImages: false,
  errors: {},
});

export const BatchProductForm = ({ onClose, onSuccess }: BatchProductFormProps) => {
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const [products, setProducts] = useState<ProductEntry[]>([createEmptyProduct()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([products[0].id]);

  const updateProduct = (id: string, updates: Partial<ProductEntry>) => {
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates, errors: { ...p.errors } } : p
    ));
  };

  const updateProductField = (id: string, field: string, value: string | boolean) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const newErrors = { ...p.errors };
      delete newErrors[field];
      return { ...p, [field]: value, errors: newErrors };
    }));
  };

  const addProduct = () => {
    const newProduct = createEmptyProduct();
    setProducts(prev => [...prev, newProduct]);
    setExpandedItems(prev => [...prev, newProduct.id]);
  };

  const duplicateProduct = (sourceId: string) => {
    const source = products.find(p => p.id === sourceId);
    if (!source) return;
    
    const newProduct: ProductEntry = {
      ...source,
      id: crypto.randomUUID(),
      name: `${source.name} (Copy)`,
      images: [...source.images],
      is_featured: source.is_featured,
      errors: {},
    };
    
    setProducts(prev => [...prev, newProduct]);
    setExpandedItems(prev => [...prev, newProduct.id]);
    toast.success('Product duplicated');
  };

  const removeProduct = (id: string) => {
    if (products.length === 1) {
      toast.error('At least one product is required');
      return;
    }
    setProducts(prev => prev.filter(p => p.id !== id));
    setExpandedItems(prev => prev.filter(item => item !== id));
  };

  const handleImageUpload = async (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    updateProduct(productId, { uploadingImages: true });
    const newImages: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        newImages.push(publicUrl);
      }

      if (newImages.length > 0) {
        setProducts(prev => prev.map(p => 
          p.id === productId 
            ? { ...p, images: [...p.images, ...newImages], uploadingImages: false }
            : p
        ));
        toast.success(`${newImages.length} image(s) uploaded`);
      } else {
        updateProduct(productId, { uploadingImages: false });
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
      updateProduct(productId, { uploadingImages: false });
    }

    const inputRef = fileInputRefs.current.get(productId);
    if (inputRef) inputRef.value = '';
  };

  const removeImage = (productId: string, index: number) => {
    setProducts(prev => prev.map(p => 
      p.id === productId 
        ? { ...p, images: p.images.filter((_, i) => i !== index) }
        : p
    ));
  };

  const validateProduct = (product: ProductEntry): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!product.name.trim()) errors.name = 'Required';
    if (!product.brand.trim()) errors.brand = 'Required';
    if (!product.price.trim()) errors.price = 'Required';
    if (product.price && isNaN(Number(product.price))) errors.price = 'Invalid';
    if (product.original_price && isNaN(Number(product.original_price))) {
      errors.original_price = 'Invalid';
    }
    if (!product.category) errors.category = 'Required';
    if (!product.condition) errors.condition = 'Required';
    if (!product.size) errors.size = 'Required';
    if (product.images.length === 0) errors.images = 'At least 1 image';

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all products
    let hasErrors = false;
    const updatedProducts = products.map(product => {
      const errors = validateProduct(product);
      if (Object.keys(errors).length > 0) hasErrors = true;
      return { ...product, errors };
    });

    setProducts(updatedProducts);

    if (hasErrors) {
      // Expand all products with errors
      const errorProductIds = updatedProducts
        .filter(p => Object.keys(p.errors).length > 0)
        .map(p => p.id);
      setExpandedItems(prev => [...new Set([...prev, ...errorProductIds])]);
      toast.error('Please fix the errors in all products');
      return;
    }

    setIsSubmitting(true);

    try {
      const productData: ProductInsert[] = products.map(p => ({
        name: p.name.trim(),
        brand: p.brand.trim(),
        price: Number(p.price),
        original_price: p.original_price ? Number(p.original_price) : null,
        category: p.category as Database['public']['Enums']['product_category'],
        condition: p.condition as Database['public']['Enums']['product_condition'],
        size: p.size as Database['public']['Enums']['product_size'],
        description: p.description.trim() || null,
        sold_out: p.sold_out,
        is_featured: p.is_featured,
        images: p.images,
      }));

      const { error } = await supabase
        .from('products')
        .insert(productData);

      if (error) throw error;

      toast.success(`${products.length} product(s) added successfully!`);
      onSuccess();
    } catch (error) {
      console.error('Error saving products:', error);
      toast.error('Failed to save products');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-40">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-semibold">Add Multiple Products</h1>
          </div>
          <span className="text-sm text-muted-foreground">
            {products.length} product{products.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
        <Accordion
          type="multiple"
          value={expandedItems}
          onValueChange={setExpandedItems}
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.2 }}
              >
                <AccordionItem
                  value={product.id}
                  className="border border-border rounded-xl overflow-hidden bg-card"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {product.name || 'New Product'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.brand || 'No brand'} • {product.images.length} images
                        </p>
                      </div>
                      {Object.keys(product.errors).length > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-destructive/10 text-destructive rounded-full">
                          {Object.keys(product.errors).length} errors
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 space-y-4">
                    {/* Images */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Images {product.errors.images && <span className="text-destructive">*</span>}
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {product.images.map((url, imgIndex) => (
                          <div key={imgIndex} className="relative w-16 h-16">
                            <img
                              src={url}
                              alt={`Product ${imgIndex + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(product.id, imgIndex)}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current.get(product.id)?.click()}
                          disabled={product.uploadingImages}
                          className="w-16 h-16 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                        >
                          {product.uploadingImages ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <input
                        ref={(el) => {
                          if (el) fileInputRefs.current.set(product.id, el);
                        }}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleImageUpload(product.id, e)}
                        className="hidden"
                      />
                    </div>

                    {/* Name & Brand */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs mb-1 block">Name</Label>
                        <input
                          value={product.name}
                          onChange={(e) => updateProductField(product.id, 'name', e.target.value)}
                          placeholder="Product name"
                          className={`input-field text-sm ${product.errors.name ? 'border-destructive' : ''}`}
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Brand</Label>
                        <input
                          value={product.brand}
                          onChange={(e) => updateProductField(product.id, 'brand', e.target.value)}
                          placeholder="Brand"
                          className={`input-field text-sm ${product.errors.brand ? 'border-destructive' : ''}`}
                        />
                      </div>
                    </div>

                    {/* Price */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs mb-1 block">Price (₹)</Label>
                        <input
                          type="number"
                          value={product.price}
                          onChange={(e) => updateProductField(product.id, 'price', e.target.value)}
                          placeholder="1999"
                          className={`input-field text-sm ${product.errors.price ? 'border-destructive' : ''}`}
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Original (₹)</Label>
                        <input
                          type="number"
                          value={product.original_price}
                          onChange={(e) => updateProductField(product.id, 'original_price', e.target.value)}
                          placeholder="Optional"
                          className="input-field text-sm"
                        />
                      </div>
                    </div>

                    {/* Category, Condition, Size */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs mb-1 block">Category</Label>
                        <Select
                          value={product.category}
                          onValueChange={(v) => updateProductField(product.id, 'category', v)}
                        >
                          <SelectTrigger className={`text-xs h-9 ${product.errors.category ? 'border-destructive' : ''}`}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat} className="capitalize text-sm">
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Condition</Label>
                        <Select
                          value={product.condition}
                          onValueChange={(v) => updateProductField(product.id, 'condition', v)}
                        >
                          <SelectTrigger className={`text-xs h-9 ${product.errors.condition ? 'border-destructive' : ''}`}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONDITIONS.map((cond) => (
                              <SelectItem key={cond} value={cond} className="capitalize text-sm">
                                {cond}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Size</Label>
                        <Select
                          value={product.size}
                          onValueChange={(v) => updateProductField(product.id, 'size', v)}
                        >
                          <SelectTrigger className={`text-xs h-9 ${product.errors.size ? 'border-destructive' : ''}`}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {SIZES.map((size) => (
                              <SelectItem key={size} value={size} className="text-sm">
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <Label className="text-xs mb-1 block">Description</Label>
                      <textarea
                        value={product.description}
                        onChange={(e) => updateProductField(product.id, 'description', e.target.value)}
                        placeholder="Optional description"
                        rows={2}
                        className="input-field text-sm resize-none"
                      />
                    </div>

                    {/* Toggles Row */}
                    <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border">
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`sold_out_${product.id}`}
                          checked={product.sold_out}
                          onCheckedChange={(checked) => updateProductField(product.id, 'sold_out', checked)}
                        />
                        <Label htmlFor={`sold_out_${product.id}`} className="text-xs">
                          Sold Out
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`is_featured_${product.id}`}
                          checked={product.is_featured}
                          onCheckedChange={(checked) => updateProductField(product.id, 'is_featured', checked)}
                        />
                        <Label htmlFor={`is_featured_${product.id}`} className="text-xs text-primary">
                          ⭐ Featured
                        </Label>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex justify-end gap-1 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateProduct(product.id)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Duplicate
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProduct(product.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </AnimatePresence>
        </Accordion>

        {/* Add Another Product Button */}
        <Button
          type="button"
          variant="outline"
          onClick={addProduct}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Product
        </Button>
      </form>

      {/* Fixed Submit Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border z-10">
        <Button
          type="submit"
          onClick={handleSubmit}
          className="w-full"
          disabled={isSubmitting || products.some(p => p.uploadingImages)}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Adding {products.length} Product{products.length !== 1 ? 's' : ''}...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add {products.length} Product{products.length !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
