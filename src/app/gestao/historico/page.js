"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Archive, CheckCircle2, Eye, Banknote } from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import { useRouter } from "next/navigation";
import OrderDetailsSidepanel from "@/components/OrderDetailsSidepanel";

export default function Historico() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchOrders() {
      try {
        const q = query(
            collection(db, "orders"),
            where("status", "==", "Concluído")
        );
        const snapshot = await getDocs(q);
        
        // Sorting manually due to indexing limitations with inequalities or multiple fields
        const data = snapshot.docs
                        .map(doc => ({ id: doc.id, ...doc.data() }))
                        .sort((a,b) => b.createdAt.seconds - a.createdAt.seconds);
                        
        setOrders(data);
      } catch (error) {
        console.error("Error fetching historico", error);
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
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Archive className="text-emerald-600" /> Histórico Final e Faturamento
            </h2>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
               <div className="bg-emerald-600 p-6 rounded-3xl shadow-lg shadow-emerald-200 flex justify-between items-center text-white">
                 <div>
                   <p className="text-sm font-bold text-emerald-100 uppercase tracking-wider mb-1">Montante Histórico Seguro</p>
                   <p className="text-4xl font-bold text-white">R$ {totalRevenue.toFixed(2).replace('.', ',')}</p>
                 </div>
                 <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm"><Banknote size={32} /></div>
               </div>
               
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
                 <div>
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Cargas Arrematadas</p>
                   <p className="text-4xl font-bold text-slate-800">{orders.length}</p>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-2xl text-slate-500"><CheckCircle2 size={32} /></div>
               </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
               {loading ? (
                 <div className="p-8 text-center text-slate-500 font-bold">Buscando documentos no arquivo...</div>
               ) : orders.length === 0 ? (
                 <div className="p-8 text-center text-slate-500 font-medium">O Arquivo Histórico está vazio. Seus pacotes despachados cairão eternamente aqui.</div>
               ) : (
                 <>
                   <div className="overflow-x-auto hidden md:block">
                     <table className="w-full text-left border-collapse">
                       <thead>
                         <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                           <th className="p-4 font-bold">Cliente Destinatário</th>
                           <th className="p-4 font-bold">Tipo</th>
                           <th className="p-4 font-bold">Data (Registro)</th>
                           <th className="p-4 font-bold">Status</th>
                           <th className="p-4 font-bold">Total Arrecadado</th>
                           <th className="p-4 font-bold">Auditoria</th>
                         </tr>
                       </thead>
                       <tbody>
                         {orders.map((order) => (
                           <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors opacity-80 hover:opacity-100 grayscale hover:grayscale-0">
                             <td className="p-4">
                               <p className="font-bold text-slate-800">{order.client.name}</p>
                               <p className="text-sm text-slate-500">{order.client.phone}</p>
                             </td>
                             <td className="p-4">
                               <span className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-bold text-slate-600">{order.type}</span>
                             </td>
                             <td className="p-4 text-sm text-slate-600 font-mono">
                                 {order.createdAt ? `${new Date(order.createdAt.seconds * 1000).toLocaleDateString('pt-BR')} ${new Date(order.createdAt.seconds * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Agora'}
                             </td>
                             <td className="p-4">
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
                                  <CheckCircle2 size={12} /> {order.status}
                                </span>
                             </td>
                             <td className="p-4 font-black text-emerald-700">
                               R$ {order.total.toFixed(2).replace('.', ',')}
                             </td>
                             <td className="p-4 text-right">
                                <button onClick={() => setSelectedOrder(order)} className="text-slate-400 hover:text-slate-700 transition-colors p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg">
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
                         <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 grayscale opacity-90 transition-all hover:grayscale-0 hover:opacity-100">
                            <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                               <div>
                                  <p className="font-bold text-slate-800 text-lg">{order.client.name}</p>
                                  <p className="text-sm text-slate-500">{order.client.phone}</p>
                               </div>
                               <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-emerald-100">
                                  <CheckCircle2 size={10} /> Concluído
                               </span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-slate-500 font-mono">
                                <span className="bg-slate-100 px-2 py-1 rounded-lg font-bold">{order.type}</span>
                                <span>{order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : 'Hoje'}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Apurado</p>
                               <p className="font-black text-xl text-emerald-700">
                                 R$ {order.total.toFixed(2).replace('.', ',')}
                               </p>
                            </div>
                            <button onClick={() => setSelectedOrder(order)} className="w-full mt-2 bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold p-3 rounded-xl flex justify-center items-center gap-2 border border-slate-200 transition-colors">
                               <Eye size={18} /> Ficha de Arquivo
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
