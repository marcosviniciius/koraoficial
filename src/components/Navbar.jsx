"use client";
import Link from "next/link";
import { ShoppingCart, Search, Menu, Sun, Moon } from "lucide-react";
import { useCart } from "@/context/CartContext";

import { useState, useRef, useEffect } from "react";

export default function Navbar({ onSearch, searchTerm, isSearchOpen, setIsSearchOpen }) {
  const { toggleCart, totalItems } = useCart();
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearchClick = () => {
    if (isSearchOpen && onSearch && !searchTerm) {
       setIsSearchOpen(false);
    } else {
       setIsSearchOpen(true);
       if(!onSearch) {
          document.getElementById('vitrine')?.scrollIntoView({behavior: 'smooth'})
       }
    }
  };

  return (
    <div className="fixed top-2 md:top-4 left-0 right-0 z-[100] w-full px-2 md:px-4 flex justify-center pointer-events-none">
      <nav className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg shadow-slate-200/50 w-full max-w-7xl rounded-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between transition-all">
        
        {/* Logo / Left */}
        <div className={`flex items-center transition-all duration-300 ${isSearchOpen ? 'w-0 overflow-hidden opacity-0 md:w-auto md:opacity-100 md:mr-8' : 'w-auto opacity-100'}`}>
          <Link href="/" className="flex items-center shrink-0">
            <span className="font-logo text-2xl md:text-3xl tracking-wider text-[var(--color-kora-blue)] leading-none pt-1">
              K<span className="text-[var(--color-kora-yellow)]">O</span>RA
            </span>
          </Link>
        </div>

        {/* Dynamic Center/Search */}
        <div className={`flex-1 flex justify-end md:justify-center items-center transition-all duration-300 ${isSearchOpen ? 'w-full px-0 md:px-8' : 'w-0'}`}>
            <div className={`flex items-center bg-slate-100/80 hover:bg-slate-100 border border-slate-200/50 rounded-full transition-all duration-300 overflow-hidden ${isSearchOpen ? 'w-full max-w-2xl px-4 py-2 opacity-100' : 'w-0 px-0 py-2 opacity-0'}`}>
                <Search size={18} className="text-slate-400 shrink-0" />
                <input 
                   ref={searchInputRef}
                   type="text"
                   placeholder="Buscar time ou liga..."
                   className="bg-transparent border-none outline-none w-full px-3 text-slate-800 text-sm font-medium"
                   value={searchTerm || ""}
                   onChange={(e) => onSearch && onSearch(e.target.value)}
                />
            </div>
        </div>

        {/* Actions / Right */}
        <div className="flex items-center space-x-2 md:space-x-1 shrink-0 ml-2">
          <button 
             onClick={handleSearchClick}
             className={`text-slate-500 transition-colors p-2 rounded-full hover:bg-slate-100 ${isSearchOpen && searchTerm ? 'text-[var(--color-kora-blue)]' : ''}`}
          >
            <Search size={22} />
          </button>
          
          <button onClick={toggleCart} className="text-slate-600 hover:text-[var(--color-kora-green)] transition-all p-2 rounded-full hover:bg-green-50 relative group">
            <ShoppingCart size={22} className="group-hover:scale-110 transition-transform" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-[0.4rem] py-1 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-[var(--color-kora-green)] rounded-full border-2 border-white shadow-sm">
                {totalItems}
              </span>
            )}
          </button>
        </div>

      </nav>
    </div>
  );
}
