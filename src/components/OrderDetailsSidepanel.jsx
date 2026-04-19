"use client";
import { X, User, MapPin, Package, CreditCard, Calendar, Briefcase, CheckSquare, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function OrderDetailsSidepanel({ order, isOpen, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <>
      {/* Overlay Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* Sidepanel Drawer (Notion style) */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-slate-100 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="font-bold text-xl text-slate-800">Detalhes do Pedido</h2>
            <p className="text-xs text-slate-500 font-mono mt-1">ID: {order?.id}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        {order && (
          <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-60">
            
            {/* Affiliate Block */}
            {order.source === "Afiliado" && (
                <section className="bg-purple-50 border border-purple-200 p-4 rounded-2xl flex items-start gap-4">
                   <div className="bg-white p-3 rounded-xl text-purple-600 shadow-sm"><Briefcase size={20}/></div>
                   <div className="w-full">
                     <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-1">VENDA AFILIADO ({order.affiliateName})</p>
                     <div className="mt-3 space-y-1 text-sm bg-white p-3 rounded-xl border border-purple-100">
                        <div className="flex justify-between text-slate-500"><span>Caixa Kora:</span> <span>R$ {order.basePrice?.toFixed(2).replace('.', ',')}</span></div>
                        <div className="flex justify-between font-bold text-green-600 mt-1 pt-1 border-t border-slate-50"><span>Comissão Revendedor:</span> <span>R$ {order.commission?.toFixed(2).replace('.', ',')}</span></div>
                     </div>
                   </div>
                </section>
            )}

            {/* Status & Timing */}
            <section className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-4">
               <div className="bg-white p-3 rounded-xl text-blue-500 shadow-sm"><Calendar size={20}/></div>
               <div>
                 <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">MÉTRICAS DO PEDIDO</p>
                 <p className="font-medium text-slate-700">Status: <strong className="text-slate-900">{order.status}</strong></p>
                 <p className="text-sm text-slate-600 mt-1">
                   Criado em: {order.createdAt ? `${new Date(order.createdAt.seconds * 1000).toLocaleDateString()} às ${new Date(order.createdAt.seconds * 1000).toLocaleTimeString()}` : 'Indisponível'}
                 </p>
               </div>
            </section>

            {/* Client Data */}
            <section>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
                <User size={16} /> Dados do Contratante
              </h3>
              <div className="bg-slate-50 p-4 rounded-2xl space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">Nome:</span>
                  <span className="col-span-2 font-bold text-slate-800">{order.client.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">CPF:</span>
                  <span className="col-span-2 font-medium text-slate-800">{order.client.cpf}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">E-mail:</span>
                  <span className="col-span-2 text-slate-700">{order.client.email}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">WhatsApp:</span>
                  <span className="col-span-2 font-bold text-green-600">{order.client.phone}</span>
                </div>
              </div>
            </section>

            {/* Address */}
            <section>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
                <MapPin size={16} /> Endereço de Etiqueta (Logística)
              </h3>
              <div className="bg-slate-50 p-4 rounded-2xl space-y-3 text-sm">
                <p className="text-slate-700 font-bold">{order.client.address}, {order.client.number}</p>
                {order.client.complement && <p className="text-slate-600">Complemento: {order.client.complement}</p>}
                <p className="text-slate-600">Bairro: {order.client.neighborhood}</p>
                <p className="text-slate-600">{order.client.city} - {order.client.state}</p>
                <p className="font-bold text-slate-800 mt-2 bg-white inline-block px-3 py-1 border border-slate-200 rounded-lg">CEP: {order.client.cep}</p>
              </div>
            </section>

            {/* Items */}
            <section>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
                <Package size={16} /> Ficha de Separação (Estoque)
              </h3>
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4 transition-all hover:border-indigo-100">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-bold text-slate-800 text-base leading-snug flex-1">{item.name}</p>
                      <div className="text-right shrink-0">
                         <span className="bg-white px-3 py-1.5 border border-slate-200 rounded-xl font-black text-[var(--color-kora-blue)] text-sm shadow-sm">
                            {item.selectedSize}
                         </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                       <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                             <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Qtd</span>
                             <span className="text-sm font-bold text-slate-700">{item.quantity} un.</span>
                          </div>
                          <div className="w-px h-6 bg-slate-200 mx-1"></div>
                          <div className="flex flex-col">
                             <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Tipo</span>
                             <span className="text-sm font-bold text-slate-700">{order.type}</span>
                          </div>
                       </div>
                       
                       <a 
                          href={`/?p=${item.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-indigo-600 hover:text-white hover:bg-black hover:border-black text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 group"
                       >
                          Ver no Site <ExternalLink size={14} className="group-hover:rotate-12 transition-transform" />
                       </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        )}

        {/* Footer */}
        {order && (
          <div className="absolute bottom-0 w-full bg-white border-t border-slate-100 flex flex-col shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
             <div className="flex justify-between items-center p-6 pb-4">
                 <span className="text-slate-500 font-bold flex items-center gap-2">
                     <CreditCard size={20} /> Total Faturado
                 </span>
                 <span className="font-logo text-3xl text-[var(--color-kora-green-dark)]">
                     R$ {order.total.toFixed(2).replace('.', ',')}
                 </span>
             </div>
             
             {/* Master Action: Despacho Logístico */}
             {order.status === "Pago" && (
                <div className="px-6 pb-6 pt-2">
                   <button 
                     onClick={async () => {
                         if (!confirm("Confirmar despacho e mover para o Histórico?")) return;
                         try {
                            await updateDoc(doc(db, "orders", order.id), { status: "Concluído" });
                            alert("Pacote finalizado com sucesso!");
                            window.location.reload();
                         } catch (e) {
                            alert("Erro ao despachar o pedido.");
                         }
                     }}
                     className="w-full bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200 text-white font-bold p-4 rounded-xl transition flex justify-center items-center gap-2"
                   >
                       <CheckSquare size={20} /> Marcar como Despachado (Entregue)
                   </button>
                </div>
             )}
          </div>
        )}
        
      </div>
    </>
  );
}
