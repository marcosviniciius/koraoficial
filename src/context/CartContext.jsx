"use client";
import { createContext, useContext, useState } from "react";

const CartContext = createContext({});

export function CartProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState([]);

  const toggleCart = () => setIsOpen(!isOpen);

  const addItem = (product) => {
    setItems((prev) => {
      // A unique cart key combining Product ID and Size
      const cartKey = `${product.id}_${product.selectedSize}`;
      const existing = prev.find((item) => item.cartKey === cartKey);
      if (existing) {
        return prev.map((item) =>
          item.cartKey === cartKey ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, cartKey, quantity: 1 }];
    });
    setIsOpen(true);
  };

  const removeItem = (cartKey) => {
    setItems((prev) => prev.filter((item) => item.cartKey !== cartKey));
  };

  const updateQuantity = (cartKey, newQuantity) => {
    if (newQuantity < 1) return;
    setItems((prev) =>
      prev.map((item) => (item.cartKey === cartKey ? { ...item, quantity: newQuantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ isOpen, toggleCart, items, addItem, removeItem, updateQuantity, totalItems, totalPrice, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
