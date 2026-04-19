"use client";
import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminSidebar from "@/components/AdminSidebar";
import OrderDetailsSidepanel from "@/components/OrderDetailsSidepanel";
import { DollarSign, Clock, CheckCircle2, ChevronRight, Package, AlertCircle, TrendingUp, Inbox } from "lucide-react";

export default function GestaoFinanceiro() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Aguardando");
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const currentMonthISO = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthISO);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(fetchedOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const changeOrderStatus = async (orderId, newStatus) => {
      try {
         await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      } catch (e) {
         console.error("Erro ao alterar status", e);
         alert("Erro ao alterar o status do pedido.");
      }
  };

  // Filter by Month
  const filteredMonthlyOrders = orders.filter(o => {
     if(!selectedMonth) return true;
     const date = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : new Date();
     return date.toISOString().slice(0, 7) === selectedMonth;
  });

  // KPI Calculations
  const aguardandoOrders = filteredMonthlyOrders.filter(o => o.status?.includes("Aguardando Pagamento"));
  const aReceber = aguardandoOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const pagosOrders = filteredMonthlyOrders.filter(o => o.status === "Pago");
  const concluidosOrders = filteredMonthlyOrders.filter(o => o.status === "Concluído" || o.status === "Finalizado");
  
  const caixaLivre = [...pagosOrders, ...concluidosOrders].reduce((sum, o) => sum + (o.total || 0), 0);
  const lucroAfiliados = [...pagosOrders, ...concluidosOrders].filter(o => o.source === "Afiliado").reduce((sum, o) => sum + (o.commission || 0), 0);

  // Tab Filtering
  let tabOrders = [];
  if (activeTab === "Aguardando") tabOrders = aguardandoOrders;
  if (activeTab === "Preparacao") tabOrders = pagosOrders;
  if (activeTab === "Concluidos") tabOrders = concluidosOrders;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans pb-20 md:pb-0">
      <AdminSidebar />
      <div className="flex-1 p-4 md:p-8 h-screen overflow-y-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3">
                  <TrendingUp className="text-indigo-600" size={32} /> Central Financeira
               </h1>
               <p className="text-slate-500 mt-2">Visão macro do transito de caixa e pedidos.</p>
            </div>

            <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3 shrink-0">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-3">Competência:</span>
               <input 
                  type="month" 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition cursor-pointer"
               />
               {selectedMonth && (
                  <button onClick={() => setSelectedMonth('')} className="pr-3 text-slate-400 hover:text-red-500 transition text-xs font-bold uppercase tracking-widest">
                      Limpar
                  </button>
               )}
            </div>
        </div>

        {/* Financial Macros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                   <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1">Caixa Transacionado (Pago)</p>
                   <p className="text-3xl lg:text-4xl font-black">R$ {caixaLivre.toFixed(2).replace('.', ',')}</p>
                   <p className="text-xs text-indigo-300 mt-2">Dinheiro já recebido e aprovado em conta.</p>
                </div>
                <DollarSign className="absolute -right-4 -bottom-4 text-indigo-500/30" size={120} />
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
                <div>
                   <div className="text-amber-500 bg-amber-50 w-fit p-3 rounded-xl mb-3"><Clock size={24}/></div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">A Receber (Boletos/Pix Pendentes)</p>
                   <p className="text-3xl font-black text-slate-800">R$ {aReceber.toFixed(2).replace('.', ',')}</p>
                </div>
                <p className="text-xs text-slate-400 mt-2 font-medium">{aguardandoOrders.length} faturas geradas que ainda não foram pagas pelo cliente.</p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
                <div>
                   <div className="text-purple-500 bg-purple-50 w-fit p-3 rounded-xl mb-3"><CheckCircle2 size={24}/></div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Dívida Afiliados (B2B)</p>
                   <p className="text-3xl font-black text-slate-800">R$ {lucroAfiliados.toFixed(2).replace('.', ',')}</p>
                </div>
                <p className="text-xs text-slate-400 mt-2 font-medium">Repasses aos afiliados B2B pendentes ou já pagos (Referente aos pedidos Concluídos).</p>
            </div>
        </div>

        {/* Operating Tabs */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[70vh]">
            <div className="flex border-b border-slate-100 overflow-x-auto shrink-0 hide-scrollbar">
                <button 
                   onClick={() => setActiveTab("Aguardando")}
                   className={`flex-1 min-w-[160px] p-5 font-bold text-sm uppercase tracking-wide transition-all border-b-2 flex items-center justify-center gap-2 ${activeTab === "Aguardando" ? "border-amber-500 text-amber-600 bg-amber-50/30" : "border-transparent text-slate-400 hover:bg-slate-50"}`}
                >
                   <AlertCircle size={18} /> Pendentes ({aguardandoOrders.length})
                </button>
                <button 
                   onClick={() => setActiveTab("Preparacao")}
                   className={`flex-1 min-w-[160px] p-5 font-bold text-sm uppercase tracking-wide transition-all border-b-2 flex items-center justify-center gap-2 ${activeTab === "Preparacao" ? "border-indigo-500 text-indigo-600 bg-indigo-50/30" : "border-transparent text-slate-400 hover:bg-slate-50"}`}
                >
                   <Package size={18} /> Caixa Aprovado (A Preparar) ({pagosOrders.length})
                </button>
                <button 
                   onClick={() => setActiveTab("Concluidos")}
                   className={`flex-1 min-w-[160px] p-5 font-bold text-sm uppercase tracking-wide transition-all border-b-2 flex items-center justify-center gap-2 ${activeTab === "Concluidos" ? "border-emerald-500 text-emerald-600 bg-emerald-50/30" : "border-transparent text-slate-400 hover:bg-slate-50"}`}
                >
                   <CheckCircle2 size={18} /> Concluídos ({concluidosOrders.length})
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">
               {loading ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                     <Inbox size={48} className="animate-pulse" />
                     <p className="font-bold tracking-widest uppercase text-xs">Sincronizando Sistema...</p>
                  </div>
               ) : tabOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 p-8 text-center">
                     <Inbox size={48} className="opacity-50" />
                     <p className="font-bold text-slate-500">Nenhum pedido nesta fase.</p>
                  </div>
               ) : (
                  <div className="space-y-4">
                     {tabOrders.map(order => {
                         const dateStr = order.createdAt?.seconds 
                               ? new Date(order.createdAt.seconds * 1000).toLocaleString('pt-BR') 
                               : "Data Desconhecida";

                         const hasPronta = order.items?.some(i => i.orderType === 'Imediato') || order.type === 'Pronta Entrega';
                         const hasEncomenda = order.items?.some(i => i.orderType === 'Encomenda') || order.type === 'Encomenda';

                         return (
                            <div key={order.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
                                
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <p className="bg-slate-100 text-slate-600 text-[10px] font-mono font-bold px-2 py-0.5 rounded cursor-copy" title="ID do Pedido">#{order.id.slice(0,8)}</p>
                                        <span className="text-xs text-slate-400">{dateStr}</span>
                                        {order.source === 'Afiliado' && (
                                           <span className="bg-purple-100 text-purple-700 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded hidden sm:inline-block">
                                              Afiliado B2B
                                           </span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">{order.client?.name}</h3>
                                    <p className="text-sm text-slate-500 truncate flex items-center gap-2 mt-1">
                                        {hasPronta && <span className="bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest border border-blue-100">C/ Pronta Entrega</span>}
                                        {hasEncomenda && <span className="bg-orange-50 text-orange-600 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest border border-orange-100">C/ Encomenda Fb.</span>}
                                        {order.items?.length || 0} Itens
                                    </p>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 border-t border-slate-50 pt-4 md:border-0 md:pt-0">
                                    <div className="text-left md:text-right">
                                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Faturamento</p>
                                       <p className={`text-lg font-black ${order.status.includes('Pago') || order.status.includes('Concluído') ? 'text-indigo-600' : 'text-slate-800'}`}>
                                          R$ {order.total?.toFixed(2).replace('.', ',')}
                                       </p>
                                    </div>
                                    
                                    <button 
                                       onClick={() => setSelectedOrder(order)}
                                       className="bg-slate-900 hover:bg-indigo-600 text-white p-3 rounded-xl shadow-md transition-colors flex items-center gap-2 text-sm font-bold active:scale-95"
                                    >
                                       Ver Fatura <ChevronRight size={18}/>
                                    </button>
                                </div>

                                {/* Quick Actions for Aguardando */}
                                {activeTab === "Aguardando" && (
                                   <div className="w-full md:w-auto mt-2 md:mt-0 pt-2 border-t border-slate-50 flex gap-2">
                                       <button onClick={() => { if(window.confirm('Tem certeza que deseja cancelar essa fatura não paga? Ela desaparecerá do funil.')) changeOrderStatus(order.id, "Cancelado"); }} className="w-full bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 font-bold text-xs p-3 rounded-xl transition">
                                          Cancelar Fatura Pendente
                                       </button>
                                   </div>
                                )}

                                {/* Quick Actions for Preparation / 'Aprovados' */}
                                {activeTab === "Preparacao" && (
                                   <div className="w-full md:w-auto mt-2 md:mt-0 pt-2 border-t border-slate-50 flex gap-2 flex-col sm:flex-row">
                                       <button onClick={() => changeOrderStatus(order.id, "Concluído")} className="w-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs p-3 rounded-xl transition">
                                          Marcar Concluído / Enviado
                                       </button>
                                       <button onClick={() => { if(window.confirm('Tem certeza que deseja cancelar esta venda já APROVADA?')) changeOrderStatus(order.id, "Cancelado"); }} className="w-full bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 font-bold text-xs p-3 rounded-xl transition">
                                          Cancelar Venda (Estorno)
                                       </button>
                                   </div>
                                )}

                            </div>
                         )
                     })}
                  </div>
               )}
            </div>
        </div>

      </div>

      <OrderDetailsSidepanel 
         order={selectedOrder} 
         isOpen={!!selectedOrder} 
         onClose={() => setSelectedOrder(null)} 
      />
    </div>
  );
}
