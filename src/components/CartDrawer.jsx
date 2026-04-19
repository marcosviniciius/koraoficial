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
      <div className="relative w-full max-w-md h-full bg-surface dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-dim">
          <h2 className="font-logo text-3xl text-[var(--color-kora-blue)] flex items-center gap-2">
            <ShoppingBag className="text-[var(--color-kora-green)]" />
            CARRINHO
          </h2>
          <button onClick={toggleCart} className="text-dim hover:text-main transition-colors p-2 rounded-full hover:bg-surface-hover">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-dim gap-4">
              <ShoppingBag size={64} className="opacity-20" />
              <p className="text-lg">Seu carrinho está vazio.</p>
              <button onClick={toggleCart} className="text-[var(--color-kora-blue)] font-bold hover:underline">
                Continuar comprando
              </button>
            </div>
          ) : (
            <ul className="space-y-6">
              {items.map((item) => (
                <li key={item.cartKey} className="flex gap-4 p-4 rounded-2xl bg-background border border-border-dim relative overflow-hidden">
                  {item.orderType === 'Encomenda' && (
                      <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                          ENCOMENDA
                      </div>
                  )}
                  <div className="w-20 h-24 bg-surface dark:bg-slate-800 rounded-xl border border-border-dim flex items-center justify-center overflow-hidden shrink-0">
                    {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} /> : <span className="font-logo text-xs text-dim">FOTO</span>}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="pr-12">
                      <h3 className="font-bold text-sm text-main leading-tight">{item.name}</h3>
                      <p className="text-xs text-dim mt-1">Tamanho: <span className="font-bold text-main">{item.selectedSize}</span></p>
                      <p className="font-bold text-[var(--color-kora-green-dark)] mt-1">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      {/* Controls */}
                      <div className="flex items-center border border-border-dim rounded-lg bg-surface dark:bg-slate-800 overflow-hidden">
                        <button onClick={() => updateQuantity(item.cartKey, item.quantity - 1)} className="p-1 px-2 text-dim hover:bg-surface-hover transition"><Minus size={14} /></button>
                        <span className="text-sm font-bold w-6 text-center text-main">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.cartKey, item.quantity + 1)} className="p-1 px-2 text-[var(--color-kora-green)] hover:bg-green-50 dark:hover:bg-green-900/20 transition"><Plus size={14} /></button>
                      </div>
                      
                      <button onClick={() => removeItem(item.cartKey)} className="text-dim hover:text-red-500 transition p-1">
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
          <div className="border-t border-border-dim p-6 bg-surface dark:bg-slate-900">
            <div className="flex justify-between items-end mb-6">
              <span className="text-dim font-medium">Subtotal</span>
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

