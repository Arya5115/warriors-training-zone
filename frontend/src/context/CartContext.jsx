import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const [c, w] = await Promise.all([api.get("/cart"), api.get("/wishlist")]);
      setItems(c.data.items || []);
      setWishlist(w.data || []);
    } catch {
      /* ignore */
    }
  }, [user]);

  useEffect(() => {
    if (user) refresh();
    else {
      setItems([]);
      setWishlist([]);
    }
  }, [user, refresh]);

  const addToCart = async (product_id, quantity = 1) => {
    await api.post("/cart/add", { product_id, quantity });
    await refresh();
  };
  const removeFromCart = async (product_id) => {
    await api.post("/cart/remove", { product_id, quantity: 1 });
    await refresh();
  };
  const clearCart = async () => {
    await api.post("/cart/clear");
    await refresh();
  };
  const toggleWishlist = async (product_id) => {
    await api.post("/wishlist/toggle", { product_id, quantity: 1 });
    await refresh();
  };

  const subtotal = items.reduce((s, i) => {
    const price = i.product.price * (1 - (i.product.discount || 0) / 100);
    return s + price * i.quantity;
  }, 0);

  const inWishlist = (pid) => wishlist.some((w) => w.id === pid);

  return (
    <CartContext.Provider
      value={{ items, wishlist, refresh, addToCart, removeFromCart, clearCart, toggleWishlist, subtotal, inWishlist }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
