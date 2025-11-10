// src/context/CartContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import CartService from "../../../services/CartService";
import { useAuth } from "../../../pages/Login/context/AuthContext";

const CartContext = createContext();

export const useCart = () => {
  try {
    const context = useContext(CartContext);
    if (!context) {
      // Return default values if context is not available
      console.warn('useCart must be used within a CartProvider');
      return { cart: null, setCart: () => {}, loadCart: async () => {}, loading: false };
    }
    // Ensure context is always an object
    if (typeof context !== 'object' || context === null) {
      console.warn('CartContext returned invalid value');
      return { cart: null, setCart: () => {}, loadCart: async () => {}, loading: false };
    }
    return context;
  } catch (error) {
    console.error('Error in useCart:', error);
    // Return default values on error
    return { cart: null, setCart: () => {}, loadCart: async () => {}, loading: false };
  }
};

export const CartProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCart = async (showLoading = false) => {
    if (!currentUser?.id) {
      setCart(null);
      setLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      }
      // Add timestamp to bypass cache if needed
      const data = await CartService.getCartByUserId(currentUser.id);
      setCart(data);
    } catch (err) {
      console.error("Load cart failed:", err);
      setCart({ userId: currentUser.id, items: [], totalPrice: 0 });
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  return (
    <CartContext.Provider value={{ cart, setCart, loadCart, loading }}>
      {children}
    </CartContext.Provider>
  );
};

