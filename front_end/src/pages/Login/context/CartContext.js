// src/context/CartContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import CartService from "../../../services/CartService";
import { useAuth } from "../../../pages/Login/context/AuthContext";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

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

