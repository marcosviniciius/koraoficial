"use client";
import { useCart } from "@/context/CartContext";
import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function CartDrawer() {
  const { isOpen, toggleCart, items, removeItem, updateQuantity, totalPrice } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={toggleCart}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-logo text-3xl text-[var(--color-kora-blue)] flex items-center gap-2">
            <ShoppingBag className="text-[var(--color-kora-green)]" />
            CARRINHO
          </h2>
          <button onClick={toggleCart} className="text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-100">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 gap-4">
              <ShoppingBag size={64} className="text-gray-200" />
              <p className="text-lg">Seu carrinho está vazio.</p>
              <button onClick={toggleCart} className="text-[var(--color-kora-blue)] font-bold hover:underline">
                Continuar comprando
              </button>
            </div>
          ) : (
            <ul className="space-y-6">
              {items.map((item) => (
                <li key={item.cartKey} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 relative overflow-hidden">
                  {item.orderType === 'Encomenda' && (
                      <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                          ENCOMENDA
                      </div>
                  )}
                  <div className="w-20 h-24 bg-white rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                    {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} /> : <span className="font-logo text-xs text-gray-300">FOTO</span>}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="pr-12">
                      <h3 className="font-bold text-sm text-gray-900 leading-tight">{item.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">Tamanho: <span className="font-bold text-slate-800">{item.selectedSize}</span></p>
                      <p className="font-bold text-[var(--color-kora-green-dark)] mt-1">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      {/* Controls */}
                      <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden">
                        <button onClick={() => updateQuantity(item.cartKey, item.quantity - 1)} className="p-1 px-2 text-gray-500 hover:bg-gray-100 transition"><Minus size={14} /></button>
                        <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.cartKey, item.quantity + 1)} className="p-1 px-2 text-[var(--color-kora-green)] hover:bg-green-50 transition"><Plus size={14} /></button>
                      </div>
                      
                      <button onClick={() => removeItem(item.cartKey)} className="text-gray-400 hover:text-red-500 transition p-1">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-6 bg-white shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-end mb-6">
              <span className="text-gray-500 font-medium">Subtotal</span>
              <span className="text-3xl font-bold text-[var(--color-kora-blue)]">
                R$ {totalPrice.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <Link href="/checkout" onClick={toggleCart} className="w-full bg-[var(--color-kora-green)] hover:bg-[var(--color-kora-green-dark)] text-white font-bold py-4 rounded-xl text-lg uppercase tracking-wider transition transform hover:-translate-y-1 shadow-[0_10px_20px_rgba(0,191,99,0.2)] flex items-center justify-center gap-2">
              Avançar para o Pagamento
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
