"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Package, TrendingUp, Users, LogOut, CheckCircle2, Clock, Eye } from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import { useRouter } from "next/navigation";
import OrderDetailsSidepanel from "@/components/OrderDetailsSidepanel";

export default function Dashboard() {
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
                        .filter(order => order.type === "Imediato" && order.status === "Pago");
        setOrders(data);
      } catch (error) {
        console.error("Error fetching orders", error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
         <div className="p-4 md:p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Visão Geral</h2>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="text-sm text-slate-500 mb-1">Receita Total</p>
                     <p className="text-3xl font-bold text-slate-800">R$ {totalRevenue.toFixed(2).replace('.', ',')}</p>
                   </div>
                   <div className="bg-green-50 p-3 rounded-xl text-[var(--color-kora-green)]"><TrendingUp size={24} /></div>
                 </div>
               </div>
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="text-sm text-slate-500 mb-1">Pedidos Realizados</p>
                     <p className="text-3xl font-bold text-slate-800">{orders.length}</p>
                   </div>
                   <div className="bg-blue-50 p-3 rounded-xl text-[var(--color-kora-blue)]"><Package size={24} /></div>
                 </div>
               </div>
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="text-sm text-slate-500 mb-1">Clientes Únicos</p>
                     <p className="text-3xl font-bold text-slate-800">{new Set(orders.map(o => o.client.cpf)).size}</p>
                   </div>
                   <div className="bg-yellow-50 p-3 rounded-xl text-[var(--color-kora-yellow-dark)]"><Users size={24} /></div>
                 </div>
               </div>
            </div>

            <h2 className="text-xl font-bold text-slate-800 mb-4">Últimos Pedidos</h2>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
               {loading ? (
                 <div className="p-8 text-center text-slate-500">Carregando pedidos...</div>
               ) : orders.length === 0 ? (
                 <div className="p-8 text-center text-slate-500">Nenhum pedido recebido ainda.</div>
               ) : (
                 <>
                   <div className="overflow-x-auto hidden md:block">
                     <table className="w-full text-left border-collapse">
                       <thead>
                         <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                           <th className="p-4 font-medium">Cliente</th>
                           <th className="p-4 font-medium">Data</th>
                           <th className="p-4 font-medium">Status</th>
                           <th className="p-4 font-medium">Total</th>
                           <th className="p-4 font-medium">Ficha</th>
                         </tr>
                       </thead>
                       <tbody>
                         {orders.map((order) => (
                           <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                             <td className="p-4">
                               <p className="font-bold text-slate-800">{order.client.name}</p>
                               <p className="text-sm text-slate-500">{order.client.phone}</p>
                             </td>
                             <td className="p-4 text-sm text-slate-600">
                                 {order.createdAt ? `${new Date(order.createdAt.seconds * 1000).toLocaleDateString('pt-BR')} ${new Date(order.createdAt.seconds * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Agora'}
                             </td>
                             <td className="p-4">
                                <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">
                                  <Clock size={12} /> {order.status}
                                </span>
                             </td>
                             <td className="p-4 font-bold text-[var(--color-kora-green-dark)]">
                               R$ {order.total.toFixed(2).replace('.', ',')}
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
                         <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
                            <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                               <div>
                                  <p className="font-bold text-slate-800 text-lg">{order.client.name}</p>
                                  <p className="text-sm text-slate-500">{order.client.phone}</p>
                               </div>
                               <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-yellow-100">
                                  <Clock size={10} /> {order.status}
                               </span>
                            </div>
                            <div className="flex justify-between items-center">
                               <p className="text-xs text-slate-400 font-mono">
                                   {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : 'Hoje'}
                               </p>
                               <p className="font-black text-lg text-[var(--color-kora-green-dark)]">
                                 R$ {order.total.toFixed(2).replace('.', ',')}
                               </p>
                            </div>
                            <button onClick={() => setSelectedOrder(order)} className="w-full mt-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold p-3 rounded-xl flex justify-center items-center gap-2 transition-colors">
                               <Eye size={18} /> Abrir Ficha
                            </button>
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
