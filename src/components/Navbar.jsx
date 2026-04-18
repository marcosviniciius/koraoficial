"use client";
import Link from "next/link";
import { ShoppingCart, Search, Menu } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const { toggleCart, totalItems } = useCart();
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button className="text-gray-500 hover:text-[var(--color-kora-green)] transition-colors p-2">
              <Menu size={24} />
            </button>
          </div>

          {/* Logo */}
          <div className="flex-shrink-0 flex items-center justify-center flex-1 md:flex-none md:justify-start">
            <Link href="/" className="flex items-center">
              <span className="font-logo text-4xl tracking-wider text-[var(--color-kora-blue)]">
                K<span className="text-[var(--color-kora-yellow)]">O</span>RA
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:justify-center flex-1 space-x-8">
            <Link href="/" className="text-[var(--color-kora-green)] font-bold border-b-2 border-[var(--color-kora-green)] pb-1 px-1 text-sm tracking-wide">
              LANÇAMENTOS
            </Link>
            <Link href="/times" className="text-slate-600 hover:text-[var(--color-kora-blue)] font-semibold px-1 pb-1 text-sm transition-colors tracking-wide">
              TIMES NACIONAIS
            </Link>
            <Link href="/selecoes" className="text-slate-600 hover:text-[var(--color-kora-blue)] font-semibold px-1 pb-1 text-sm transition-colors tracking-wide">
              SELEÇÕES
            </Link>
            <Link href="/retro" className="text-slate-600 hover:text-[var(--color-kora-blue)] font-semibold px-1 pb-1 text-sm transition-colors tracking-wide">
              RETRÔ
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <button className="text-slate-600 hover:text-[var(--color-kora-blue)] transition-colors p-2">
              <Search size={22} />
            </button>
            <button onClick={toggleCart} className="text-slate-600 hover:text-[var(--color-kora-green)] transition-colors p-2 relative">
              <ShoppingCart size={22} />
              <span className="absolute top-1 right-0 inline-flex items-center justify-center px-[0.4rem] py-1 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-[var(--color-kora-green)] rounded-full border-2 border-white">
                {totalItems}
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
