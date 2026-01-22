export type Category = 'jackets' | 'hoodies' | 'jeans' | 'shoes' | 'vintage' | 'streetwear' | 'bags' | 'caps';

export type Condition = 'mint' | 'good' | 'fair';

export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'FREE';

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: Category;
  condition: Condition;
  size: Size;
  description: string;
  soldOut: boolean;
  createdAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  total: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'verified' | 'failed';
  createdAt: Date;
}

export interface FilterState {
  category: Category | 'all';
  priceRange: [number, number];
  sizes: Size[];
  conditions: Condition[];
  searchQuery: string;
}
