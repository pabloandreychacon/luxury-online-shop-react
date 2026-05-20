import { create } from 'zustand';
import type { Product } from '../lib/types';

interface WishlistStore {
  wishlistItems: Product[];
  itemCount: number;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const loadWishlist = (): Product[] => {
  try {
    const saved = localStorage.getItem('wishlist');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  wishlistItems: loadWishlist(),
  itemCount: loadWishlist().length,

  addToWishlist: (product) => {
    const { wishlistItems } = get();
    if (wishlistItems.find((i) => i.id === product.id)) return;
    const updated = [...wishlistItems, product];
    localStorage.setItem('wishlist', JSON.stringify(updated));
    set({ wishlistItems: updated, itemCount: updated.length });
  },

  removeFromWishlist: (productId) => {
    const updated = get().wishlistItems.filter((i) => i.id !== productId);
    localStorage.setItem('wishlist', JSON.stringify(updated));
    set({ wishlistItems: updated, itemCount: updated.length });
  },

  isInWishlist: (productId) => get().wishlistItems.some((i) => i.id === productId),
}));
