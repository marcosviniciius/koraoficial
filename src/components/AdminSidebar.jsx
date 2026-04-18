"use client";
import { Package, TrendingUp, LogOut, Clock, AlertCircle, Briefcase, Archive, Menu, X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
      { href: '/gestao/dashboard', icon: Package, label: 'Pronta Entrega', activeClass: 'bg-blue-50 text-[var(--color-kora-blue)]' },
      { href: '/gestao/encomendas', icon: Clock, label: 'Encomendas', activeClass: 'bg-yellow-50 text-yellow-700' },
      { href: '/gestao/pendentes', icon: AlertCircle, label: 'Aguardando Pagto', activeClass: 'bg-red-50 text-red-600' },
      { href: '/gestao/afiliados', icon: Briefcase, label: 'Afiliados B2B', activeClass: 'bg-purple-50 text-purple-600' },
      { href: '/gestao/historico', icon: Archive, label: 'Histórico Final', activeClass: 'bg-emerald-50 text-emerald-600' },
      { href: '/gestao/produtos', icon: TrendingUp, label: 'Produtos', activeClass: 'bg-blue-50 text-[var(--color-kora-blue)]' },
  ];

  return (
    <>
      {/* Mobile Top Header (100% Mobile-First) */}
      <div className="md:hidden bg-white w-full border-b border-slate-100 p-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
         <div className="flex items-center gap-3">
             <button onClick={() => setIsOpen(true)} className="p-2 -ml-2 text-slate-800 hover:bg-slate-100 rounded-lg">
                 <Menu size={24} />
             </button>
             <h1 className="font-logo text-2xl text-[var(--color-kora-blue)] tracking-wider">KORA</h1>
         </div>
         <button onClick={() => router.push('/gestao')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
             <LogOut size={20} />
         </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
         <div className="md:hidden fixed inset-0 z-50 flex">
             <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)}></div>
             <div className="relative w-72 bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left-full duration-200">
                 <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h1 className="font-logo text-2xl text-[var(--color-kora-blue)]">KORA</h1>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Logística Mobile</p>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full">
                        <X size={20}/>
                    </button>
                 </div>
                 <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    {navLinks.map(link => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                           <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${isActive ? link.activeClass : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}>
                               <Icon size={20} /> {link.label}
                           </Link>
                        )
                    })}
                 </nav>
             </div>
         </div>
      )}

      {/* Desktop Sidebar (Intact) */}
      <div className="w-64 bg-white border-r border-slate-100 flex-col hidden md:flex h-screen sticky top-0 shrink-0 shadow-sm z-30">
           <div className="p-6 border-b border-slate-100 bg-slate-50/50">
             <h1 className="font-logo text-3xl text-[var(--color-kora-blue)] tracking-wider">KORA</h1>
             <p className="text-xs text-slate-400 uppercase font-bold mt-1 tracking-widest">Painel de Gestão</p>
           </div>
           <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {navLinks.map(link => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                     <Link key={link.href} href={link.href} className={`w-full flex items-center gap-3 p-3 rounded-xl font-medium transition-colors ${isActive ? link.activeClass : 'text-slate-600 hover:bg-slate-50'}`}>
                         <Icon size={20} /> {link.label}
                     </Link>
                  )
              })}
           </nav>
           <div className="p-4 border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
              <button onClick={() => router.push('/gestao')} className="w-full flex items-center justify-center gap-2 text-red-500 bg-red-50 hover:bg-red-100 p-3 rounded-xl font-bold transition-colors">
                 <LogOut size={20} /> Finalizar Sessão
              </button>
           </div>
      </div>
    </>
  );
}
