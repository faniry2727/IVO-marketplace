import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Product, Shop, Profile } from '@/types';

export interface CartItem {
  product: Product;
  shop: Shop;
  seller: Profile;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, shop: Shop, seller: Profile, quantity: number) => { success: boolean; error?: string };
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  sellerId: string | null;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = 'ketrika_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(product: Product, shop: Shop, seller: Profile, quantity: number): { success: boolean; error?: string } {
    if (product.stock <= 0) {
      return { success: false, error: 'Ce produit est en rupture de stock.' };
    }

    if (items.length > 0 && items[0].product.seller_id !== product.seller_id) {
      return {
        success: false,
        error: 'Pour cette première version, vous devez passer une commande séparée pour chaque boutique.',
      };
    }

    const existing = items.find((i) => i.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        return { success: false, error: `Stock insuffisant. Vous avez déjà ${existing.quantity} article(s) dans le panier (stock: ${product.stock}).` };
      }
      const newQty = Math.min(existing.quantity + quantity, product.stock);
      setItems(items.map((i) => i.product.id === product.id ? { ...i, quantity: newQty } : i));
    } else {
      setItems([...items, { product, shop, seller, quantity: Math.min(quantity, product.stock) }]);
    }
    return { success: true };
  }

  function removeItem(productId: string) {
    setItems(items.filter((i) => i.product.id !== productId));
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(items.map((i) => i.product.id === productId ? { ...i, quantity: Math.min(quantity, i.product.stock) } : i));
  }

  function clearCart() {
    setItems([]);
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.product.price_ariary * i.quantity, 0);
  const sellerId = items.length > 0 ? items[0].product.seller_id : null;

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal, sellerId }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
