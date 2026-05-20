import { create } from 'zustand';
import type { CartItem, Product } from '../lib/types';

interface CartStore {
  items: CartItem[];
  showModal: boolean;
  lastAddedProduct: string;
  total: number;
  itemCount: number;
  loadFromStorage: () => void;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  closeModal: () => void;
}

const calcTotals = (items: CartItem[]) => ({
  total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
});

const saveToStorage = (items: CartItem[]) =>
  localStorage.setItem('cart', JSON.stringify(items));

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  showModal: false,
  lastAddedProduct: '',
  total: 0,
  itemCount: 0,

  loadFromStorage: () => {
    try {
      const saved = localStorage.getItem('cart');
      if (!saved) return;
      const items: CartItem[] = JSON.parse(saved);
      set({ items, ...calcTotals(items) });
    } catch {
      // ignore parse errors
    }
  },

  addItem: (product, quantity) => {
    const prevItems = get().items;
    const existing = prevItems.find((i) => i.id === product.id);
    const items = existing
      ? prevItems.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i))
      : [...prevItems, { ...product, quantity }];
    saveToStorage(items);
    set({ items, showModal: true, lastAddedProduct: product.name, ...calcTotals(items) });
  },

  removeItem: (productId) => {
    const items = get().items.filter((i) => i.id !== productId);
    saveToStorage(items);
    set({ items, ...calcTotals(items) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) return get().removeItem(productId);
    const items = get().items.map((i) => (i.id === productId ? { ...i, quantity } : i));
    saveToStorage(items);
    set({ items, ...calcTotals(items) });
  },

  clearCart: () => {
    localStorage.removeItem('cart');
    set({ items: [], total: 0, itemCount: 0 });
  },

  closeModal: () => set({ showModal: false }),
}));
