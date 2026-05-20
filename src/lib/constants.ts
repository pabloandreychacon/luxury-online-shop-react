// Mock data until connected to real database
import type { Product } from '../lib/types';

export const FEATURED_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Classic Leather Tote',
    category: 'bag',
    price: 1299.99,
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&h=600&fit=crop',
    description: 'Timeless Italian leather tote with gold hardware and silk lining',
    material: 'Premium Italian Leather',
    rating: 4.8,
    reviews: 124,
  },
  {
    id: '2',
    name: 'Silk Luxury Scarf',
    category: 'scarf',
    price: 449.99,
    image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&h=600&fit=crop',
    description: 'Hand-painted silk scarf from French artisans with artistic designs',
    material: '100% Pure Mulberry Silk',
    rating: 4.9,
    reviews: 89,
  },
  {
    id: '3',
    name: 'Chronograph Watch',
    category: 'watch',
    price: 2499.99,
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500&h=600&fit=crop',
    description: 'Swiss automatic movement with sapphire crystal and chronograph function',
    material: 'Stainless Steel',
    dimensions: '42mm diameter, 13mm thickness',
    rating: 4.9,
    reviews: 156,
  },
];

export const PRODUCT_CATEGORIES = [
  { id: 'bag', label: 'Bags', icon: '👜' },
  { id: 'scarf', label: 'Scarfs', icon: '🧣' },
  { id: 'watch', label: 'Watches', icon: '⌚' },
];

export const PRICE_RANGES = [
  { id: '0-500', label: 'Under $500', min: 0, max: 500 },
  { id: '500-1000', label: '$500 - $1,000', min: 500, max: 1000 },
  { id: '1000-2000', label: '$1,000 - $2,000', min: 1000, max: 2000 },
  { id: '2000+', label: 'Over $2,000', min: 2000, max: Infinity },
];
