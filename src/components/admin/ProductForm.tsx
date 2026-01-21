import { useState, useRef } from 'react';
import { ChevronLeft, Upload, X, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Database } from '@/integrations/supabase/types';
import { Constants } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];

interface ProductFormProps {
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = Constants.public.Enums.product_category;
const CONDITIONS = Constants.public.Enums.product_condition;
const SIZES = Constants.public.Enums.product_size;

export const ProductForm = ({ product, onClose, onSuccess }: ProductFormProps) => {
  const isEditing = !!product;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: product?.name || '',
    brand: product?.brand || '',
    price: product?.price?.toString() || '',
    original_price: product?.original_price?.toString() || '',
    category: product?.category || '' as Database['public']['Enums']['product_category'] | '',
    condition: product?.condition || '' as Database['public']['Enums']['product_condition'] | '',
    size: product?.size || '' as Database['public']['Enums']['product_size'] | '',
    description: product?.description || '',
    sold_out: product?.sold_out || false,
  });
  
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const newImages: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          continue;
        }

        // Validate file size (max 5MB)
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
        setImages(prev => [...prev, ...newImages]);
        toast.success(`${newImages.length} image(s) uploaded`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
    if (!formData.price.trim()) newErrors.price = 'Price is required';
    if (formData.price && isNaN(Number(formData.price))) newErrors.price = 'Invalid price';
    if (formData.original_price && isNaN(Number(formData.original_price))) {
      newErrors.original_price = 'Invalid original price';
    }
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.condition) newErrors.condition = 'Condition is required';
    if (!formData.size) newErrors.size = 'Size is required';
    if (images.length === 0) newErrors.images = 'At least one image is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors');
      return;
    }

    setIsSubmitting(true);

    try {
      const productData: ProductInsert = {
        name: formData.name.trim(),
        brand: formData.brand.trim(),
        price: Number(formData.price),
        original_price: formData.original_price ? Number(formData.original_price) : null,
        category: formData.category as Database['public']['Enums']['product_category'],
        condition: formData.condition as Database['public']['Enums']['product_condition'],
        size: formData.size as Database['public']['Enums']['product_size'],
        description: formData.description.trim() || null,
        sold_out: formData.sold_out,
        images,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);

        if (error) throw error;
        toast.success('Product updated successfully');
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
        toast.success('Product added successfully');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={onClose} className="p-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold">
            {isEditing ? 'Edit Product' : 'Add Product'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
        {/* Images */}
        <div>
          <Label className="text-sm font-medium mb-2 block">
            Product Images {errors.images && <span className="text-destructive">*</span>}
          </Label>
          <div className="flex flex-wrap gap-2">
            {images.map((url, index) => (
              <div key={index} className="relative w-20 h-20">
                <img
                  src={url}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImages}
              className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
            >
              {uploadingImages ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span className="text-[10px] mt-1">Add</span>
                </>
              )}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          {errors.images && (
            <p className="text-xs text-destructive mt-1">{errors.images}</p>
          )}
        </div>

        {/* Name */}
        <div>
          <Label htmlFor="name" className="text-sm font-medium mb-2 block">
            Product Name
          </Label>
          <input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Vintage Denim Jacket"
            className={`input-field ${errors.name ? 'border-destructive' : ''}`}
          />
          {errors.name && (
            <p className="text-xs text-destructive mt-1">{errors.name}</p>
          )}
        </div>

        {/* Brand */}
        <div>
          <Label htmlFor="brand" className="text-sm font-medium mb-2 block">
            Brand
          </Label>
          <input
            id="brand"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            placeholder="e.g., Levi's"
            className={`input-field ${errors.brand ? 'border-destructive' : ''}`}
          />
          {errors.brand && (
            <p className="text-xs text-destructive mt-1">{errors.brand}</p>
          )}
        </div>

        {/* Price Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="price" className="text-sm font-medium mb-2 block">
              Price (₹)
            </Label>
            <input
              id="price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              placeholder="1999"
              className={`input-field ${errors.price ? 'border-destructive' : ''}`}
            />
            {errors.price && (
              <p className="text-xs text-destructive mt-1">{errors.price}</p>
            )}
          </div>
          <div>
            <Label htmlFor="original_price" className="text-sm font-medium mb-2 block">
              Original Price (₹)
            </Label>
            <input
              id="original_price"
              name="original_price"
              type="number"
              value={formData.original_price}
              onChange={handleChange}
              placeholder="Optional"
              className={`input-field ${errors.original_price ? 'border-destructive' : ''}`}
            />
            {errors.original_price && (
              <p className="text-xs text-destructive mt-1">{errors.original_price}</p>
            )}
          </div>
        </div>

        {/* Category, Condition, Size */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-sm font-medium mb-2 block">Category</Label>
            <Select value={formData.category} onValueChange={(v) => handleSelectChange('category', v)}>
              <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="capitalize">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-destructive mt-1">{errors.category}</p>
            )}
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">Condition</Label>
            <Select value={formData.condition} onValueChange={(v) => handleSelectChange('condition', v)}>
              <SelectTrigger className={errors.condition ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {CONDITIONS.map((cond) => (
                  <SelectItem key={cond} value={cond} className="capitalize">
                    {cond}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.condition && (
              <p className="text-xs text-destructive mt-1">{errors.condition}</p>
            )}
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">Size</Label>
            <Select value={formData.size} onValueChange={(v) => handleSelectChange('size', v)}>
              <SelectTrigger className={errors.size ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {SIZES.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.size && (
              <p className="text-xs text-destructive mt-1">{errors.size}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" className="text-sm font-medium mb-2 block">
            Description
          </Label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Product description (optional)"
            rows={3}
            className="input-field resize-none"
          />
        </div>

        {/* Sold Out Toggle */}
        <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
          <div>
            <Label htmlFor="sold_out" className="font-medium">Mark as Sold Out</Label>
            <p className="text-xs text-muted-foreground">
              Product will show as unavailable
            </p>
          </div>
          <Switch
            id="sold_out"
            checked={formData.sold_out}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sold_out: checked }))}
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || uploadingImages}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditing ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              isEditing ? 'Update Product' : 'Add Product'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
