export interface Product {
  id: string;
  name: string;
  category: 'bag' | 'scarf' | 'watch' | string;
  price: number;
  image: string;
  description: string;
  material: string;
  dimensions?: string;
  rating: number;
  reviews: number;
  taxes?: number;
  brandId?: number;
  brandName?: string;
}

export interface CartItem extends Product {
  quantity: number;
  priceListId?: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'completed' | 'shipped' | 'cancelled';
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface ProductTranslation {
  Id?: number;
  ProductId: number;
  Language: string;
  Name: string;
  Description?: string | null;
}
