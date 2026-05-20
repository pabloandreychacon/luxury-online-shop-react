import { create } from 'zustand';
import type { CartItem, Product } from '../lib/types';
import { supabase } from '../lib/supabase';
import i18n from 'i18next';
import { defaultSettings } from '../data/settings';

interface CartStore {
  items: CartItem[];
  showModal: boolean;
  lastAddedProduct: string;
  total: number;
  itemCount: number;
  loadFromStorage: () => Promise<void>;
  loadFromSupabase: (userId: string) => Promise<void>;
  addItem: (product: Product, quantity: number, userId?: string) => Promise<void>;
  removeItem: (productId: string, userId?: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, userId?: string) => Promise<void>;
  clearCart: (userId?: string) => Promise<void>;
  closeModal: () => void;
}

const calcTotals = (items: CartItem[]) => ({
  total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
});

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  showModal: false,
  lastAddedProduct: '',
  total: 0,
  itemCount: 0,

  loadFromStorage: async () => {
    const saved = localStorage.getItem('cart');
    if (!saved) return;
    try {
      const cartItems: CartItem[] = JSON.parse(saved);
      const updatedItems = await Promise.all(
        cartItems.map(async (item) => {
          if (item.taxes === undefined) {
            const { data } = await supabase.from('Products').select('Taxes').eq('Id', item.id).maybeSingle();
            return { ...item, taxes: data?.Taxes || 0 };
          }
          return item;
        })
      );
      set({ items: updatedItems, ...calcTotals(updatedItems) });
    } catch {
      // ignore parse errors
    }
  },

  loadFromSupabase: async (userId) => {
    const { data } = await supabase
      .from('CartItems')
      .select('*, Products(*)')
      .eq('UserId', userId);

    if (!data?.length) return;

    const productIds = data.map((item) => item.ProductId);
    const { data: mediaData } = await supabase
      .from('ProductMedia')
      .select('ProductId, MediaUrl, DisplayOrder')
      .in('ProductId', productIds)
      .eq('IdBusiness', defaultSettings.id)
      .order('DisplayOrder', { ascending: true });

    const mediaMap: Record<number, string> = {};
    if (mediaData) {
      mediaData.forEach((media) => {
        if (!mediaMap[media.ProductId]) {
          mediaMap[media.ProductId] = media.MediaUrl;
        }
      });
    }

    const language = i18n.language || 'en';
    const { data: translations } = await supabase
      .from('ProductTranslations')
      .select('ProductId, Language, Name, Description')
      .in('ProductId', productIds);

    const translationsMap: Record<number, Record<string, { Name: string; Description?: string }>> = {};
    (translations || []).forEach((t) => {
      translationsMap[t.ProductId] = translationsMap[t.ProductId] || {};
      translationsMap[t.ProductId][t.Language] = { Name: t.Name, Description: t.Description };
    });

    const items: CartItem[] = data.map((item) => {
      const trs = translationsMap[item.ProductId] || {};
      const preferred = trs[language] || Object.values(trs)[0];
      return {
        id: String(item.ProductId),
        name: preferred?.Name || item.Products?.Name || '',
        price: item.Products.Price,
        image: mediaMap[item.ProductId] || item.Products.ImageUrl,
        description: preferred?.Description || item.Products?.Description || '',
        category: '',
        material: '',
        rating: 4.5,
        reviews: 0,
        quantity: item.Quantity,
        taxes: item.Products.Taxes || 0,
        dimensions: '',
      };
    });

    localStorage.setItem('cart', JSON.stringify(items));
    set({ items, ...calcTotals(items) });
  },

  addItem: async (product, quantity, userId) => {
    const prevItems = get().items;
    const existing = prevItems.find((i) => i.id === product.id);
    const items = existing
      ? prevItems.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i))
      : [...prevItems, { ...product, quantity }];

    localStorage.setItem('cart', JSON.stringify(items));
    set({ items, showModal: true, lastAddedProduct: product.name, ...calcTotals(items) });

    if (userId) {
      const { data: existingItem } = await supabase
        .from('CartItems')
        .select('*')
        .eq('UserId', userId)
        .eq('ProductId', parseInt(product.id))
        .maybeSingle();

      if (existingItem) {
        await supabase.from('CartItems').update({ Quantity: existingItem.Quantity + quantity }).eq('Id', existingItem.Id);
      } else {
        await supabase.from('CartItems').insert([{ UserId: userId, ProductId: parseInt(product.id), Quantity: quantity }]);
      }
    }
  },

  removeItem: async (productId, userId) => {
    const items = get().items.filter((i) => i.id !== productId);
    localStorage.setItem('cart', JSON.stringify(items));
    set({ items, ...calcTotals(items) });

    if (userId) {
      await supabase.from('CartItems').delete().eq('UserId', userId).eq('ProductId', parseInt(productId));
    }
  },

  updateQuantity: async (productId, quantity, userId) => {
    if (quantity <= 0) return get().removeItem(productId, userId);

    const items = get().items.map((i) => (i.id === productId ? { ...i, quantity } : i));
    localStorage.setItem('cart', JSON.stringify(items));
    set({ items, ...calcTotals(items) });

    if (userId) {
      await supabase.from('CartItems').update({ Quantity: quantity }).eq('UserId', userId).eq('ProductId', parseInt(productId));
    }
  },

  clearCart: async (userId) => {
    localStorage.removeItem('cart');
    set({ items: [], total: 0, itemCount: 0 });

    if (userId) {
      await supabase.from('CartItems').delete().eq('UserId', userId);
    }
  },

  closeModal: () => set({ showModal: false }),
}));
