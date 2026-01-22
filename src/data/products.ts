import { Product } from '@/types/product';

export const products: Product[] = [
  {
    id: '1',
    name: 'Vintage Carhartt Work Jacket',
    brand: 'Carhartt',
    price: 1499,
    originalPrice: 4500,
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600',
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600',
    ],
    category: 'jackets',
    condition: 'good',
    size: 'L',
    description: 'Classic Carhartt Detroit jacket. Faded to perfection. Minor wear on cuffs. Made in USA.',
    soldOut: false,
    createdAt: new Date('2024-01-15'),
  },
];

export const categories = [
  { id: 'all', name: 'All', icon: '🏷️' },
  { id: 'jackets', name: 'Jackets', icon: '🧥' },
  { id: 'hoodies', name: 'Hoodies', icon: '👕' },
  { id: 'jeans', name: 'Jeans', icon: '👖' },
  { id: 'shoes', name: 'Shoes', icon: '👟' },
  { id: 'bags', name: 'Bags', icon: '👜' },
  { id: 'caps', name: 'Caps', icon: '🧢' },
  { id: 'vintage', name: 'Vintage', icon: '✨' },
  { id: 'streetwear', name: 'Streetwear', icon: '🔥' },
] as const;

export const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'FREE'] as const;
export const conditions = ['mint', 'good', 'fair'] as const;
