"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LogOut, AlertTriangle, MessageCircle, Receipt, Eye } from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import { useRouter } from "next/navigation";
import OrderDetailsSidepanel from "@/components/OrderDetailsSidepanel";

export default function Pendentes() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchOrders() {
      try {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs
                        .map(doc => ({ id: doc.id, ...doc.data() }))
                        .filter(order => order.status === "Aguardando Pagamento");
        setOrders(data);
      } catch (error) {
        console.error("Error fetching pendentes", error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const totalEmAberto = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
         <div className="p-4 md:p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <AlertTriangle className="text-red-500" /> Cobrança Comercial (Não Pagos)
            </h2>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="text-sm text-slate-500 mb-1">Montante Perdido na Fila</p>
                     <p className="text-3xl font-bold text-red-600">R$ {totalEmAberto.toFixed(2).replace('.', ',')}</p>
                   </div>
                   <div className="bg-red-50 p-3 rounded-xl text-red-600"><Receipt size={24} /></div>
                 </div>
               </div>
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="text-sm text-slate-500 mb-1">Carrinhos Abandonados (Cobrar)</p>
                     <p className="text-3xl font-bold text-slate-800">{orders.length} Clientes</p>
                   </div>
                   <div className="bg-slate-100 p-3 rounded-xl text-slate-500"><MessageCircle size={24} /></div>
                 </div>
               </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
               {loading ? (
                 <div className="p-8 text-center text-slate-500">Buscando dívidas...</div>
               ) : orders.length === 0 ? (
                 <div className="p-8 text-center text-slate-500 font-bold">Ótima Notícia: Todos os pedidos registrados foram pagos!</div>
               ) : (
                 <>
                   <div className="overflow-x-auto hidden md:block">
                     <table className="w-full text-left border-collapse">
                       <thead>
                         <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                           <th className="p-4 font-medium">Cliente</th>
                           <th className="p-4 font-medium">Itens Parados</th>
                           <th className="p-4 font-medium">Total</th>
                           <th className="p-4 font-medium">Ação (WhatsApp)</th>
                           <th className="p-4 font-medium">Ficha</th>
                         </tr>
                       </thead>
                       <tbody>
                         {orders.map((order) => (
                           <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors opacity-90">
                             <td className="p-4">
                               <p className="font-bold text-slate-800">{order.client.name}</p>
                               <p className="text-sm text-slate-500">{order.client.phone}</p>
                             </td>
                             <td className="p-4">
                                 <div className="space-y-1">
                                      {order.items.map((it, idx) => (
                                          <p key={idx} className="text-sm text-slate-700">
                                              <span className="font-bold">{it.quantity}x</span> {it.name} <span className="text-[var(--color-kora-blue)] font-bold">({it.selectedSize})</span>
                                          </p>
                                      ))}
                                 </div>
                             </td>
                             <td className="p-4 font-bold text-red-600">
                               R$ {order.total.toFixed(2).replace('.', ',')}
                             </td>
                             <td className="p-4">
                                <a 
                                  href={`https://wa.me/55${order.client.phone.replace(/[^0-9]/g, '')}?text=Olá ${order.client.name.split(' ')[0]}! Notamos que o seu pedido das camisas da Kora ainda está aguardando pagamento. Posso ajudar?`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                                >
                                  <MessageCircle size={16} /> Cobrar
                                </a>
                             </td>
                             <td className="p-4 text-right">
                                <button onClick={() => setSelectedOrder(order)} className="text-blue-500 hover:text-blue-700 transition-colors p-2 bg-white shadow-sm border border-slate-100 rounded-lg">
                                  <Eye size={18} />
                                </button>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                   
                   {/* Mobile Cards View */}
                   <div className="md:hidden flex flex-col p-4 gap-4 bg-slate-50">
                      {orders.map((order) => (
                         <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 opacity-90">
                            <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                               <div>
                                  <p className="font-bold text-slate-800 text-lg">{order.client.name}</p>
                                  <p className="text-sm text-slate-500">{order.client.phone}</p>
                               </div>
                               <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded-lg text-[10px] font-bold border border-red-100">
                                  Pendente
                               </span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                {order.items.map((it, idx) => (
                                    <p key={idx} className="text-sm text-slate-700">
                                        <span className="font-bold">{it.quantity}x</span> {it.name} <span className="text-[var(--color-kora-blue)] font-bold">({it.selectedSize})</span>
                                    </p>
                                ))}
                            </div>
                            <div className="flex justify-between items-center my-1">
                               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Total</p>
                               <p className="font-black text-lg text-red-600">
                                 R$ {order.total.toFixed(2).replace('.', ',')}
                               </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <a 
                                  href={`https://wa.me/55${order.client.phone.replace(/[^0-9]/g, '')}?text=Olá ${order.client.name.split(' ')[0]}! Notamos que o seu pedido das camisas da Kora ainda está aguardando pagamento. Posso ajudar?`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full bg-green-50 text-green-700 hover:bg-green-100 font-bold p-3 rounded-xl flex justify-center items-center gap-2 transition-colors border border-green-200"
                                >
                                  <MessageCircle size={16} /> Zap
                                </a>
                                <button onClick={() => setSelectedOrder(order)} className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold p-3 rounded-xl flex justify-center items-center gap-2 transition-colors">
                                   <Eye size={18} /> Ficha
                                </button>
                            </div>
                         </div>
                      ))}
                   </div>
                 </>
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
