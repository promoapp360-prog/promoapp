import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type PianoId = "base" | "pro";

export interface CartItem {
  id: PianoId;
  nome: string;
  prezzo: number;
  mensile: number;
}

const PIANI: Record<PianoId, CartItem> = {
  base: { id: "base", nome: "Piano Base", prezzo: 690, mensile: 19 },
  pro:  { id: "pro",  nome: "Piano Business Pro", prezzo: 890, mensile: 29 },
};

interface CartContextValue {
  item: CartItem | null;
  addItem: (id: PianoId) => void;
  removeItem: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<CartItem | null>(() => {
    try {
      const saved = localStorage.getItem("cart_item");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (item) localStorage.setItem("cart_item", JSON.stringify(item));
    else localStorage.removeItem("cart_item");
  }, [item]);

  function addItem(id: PianoId) {
    setItem(PIANI[id]);
    setIsOpen(true);
  }

  function removeItem() {
    setItem(null);
  }

  return (
    <CartContext.Provider value={{ item, addItem, removeItem, isOpen, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false) }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
