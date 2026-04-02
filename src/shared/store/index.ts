import { create } from 'zustand';
import type { Product } from '@/entities/product/types';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AIGenerationState {
  isGeneratingVideo: boolean;
  isGeneratingImage: boolean;
  heroVideoUrl: string | null;
  heroFirstFrameUrl: string | null;
  generatedImageUrl: string | null;
  videoError: string | null;
  imageError: string | null;
}

export interface UIState {
  isCartOpen: boolean;
  isNavTransparent: boolean;
  currentPageTransition: 'idle' | 'entering' | 'leaving';
}

interface AppStore {
  ai: AIGenerationState;
  setAI: (updates: Partial<AIGenerationState>) => void;

  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  cartTotal: () => number;

  ui: UIState;
  setUI: (updates: Partial<UIState>) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  ai: {
    isGeneratingVideo:  false,
    isGeneratingImage:  false,
    heroVideoUrl:       null,
    heroFirstFrameUrl:  null,
    generatedImageUrl:  null,
    videoError:         null,
    imageError:         null,
  },
  setAI: (updates) =>
    set((s) => ({ ai: { ...s.ai, ...updates } })),

  cartItems: [],
  addToCart: (product) =>
    set((s) => {
      const existing = s.cartItems.find((i) => i.product.id === product.id);
      if (existing) {
        return {
          cartItems: s.cartItems.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { cartItems: [...s.cartItems, { product, quantity: 1 }] };
    }),
  removeFromCart: (productId) =>
    set((s) => ({
      cartItems: s.cartItems.filter((i) => i.product.id !== productId),
    })),
  updateQuantity: (productId, qty) =>
    set((s) => ({
      cartItems:
        qty <= 0
          ? s.cartItems.filter((i) => i.product.id !== productId)
          : s.cartItems.map((i) =>
              i.product.id === productId ? { ...i, quantity: qty } : i
            ),
    })),
  cartTotal: () =>
    get().cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    ),

  ui: {
    isCartOpen:            false,
    isNavTransparent:      true,
    currentPageTransition: 'idle',
  },
  setUI: (updates) =>
    set((s) => ({ ui: { ...s.ui, ...updates } })),
}));
