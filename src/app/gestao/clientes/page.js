"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminSidebar from "@/components/AdminSidebar";
import { Users, DollarSign, Calendar, MapPin, Search, ChevronRight, X, Phone, Tag, Trash2 } from "lucide-react";

export default function GestaoClientes() {
  const [clients, setClients] = useState([]);
  const [rawOrders, setRawOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    async function loadData() {
       try {
          const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
          const snap = await getDocs(q);
          const fetchedOrders = snap.docs.map(d => ({id: d.id, ...d.data()}));
          setRawOrders(fetchedOrders);

          const clientMap = {};
          fetchedOrders.forEach(order => {
              if(!order.client || !order.client.cpf) return;
              const cpf = order.client.cpf.replace(/\D/g, '');
              const timestamp = order.createdAt ? order.createdAt.seconds * 1000 : Date.now();
              const date = new Date(timestamp);

              if(!clientMap[cpf]) {
                  clientMap[cpf] = {
                      cpf,
                      name: order.client.name,
                      phone: order.client.phone,
                      email: order.client.email || '',
                      address: order.client,
                      totalSpent: 0,
                      ordersCount: 0,
                      lastPurchase: date,
                      origins: new Set(),
                      orders: []
                  };
              }

              // Update data
              clientMap[cpf].totalSpent += order.total || 0;
              clientMap[cpf].ordersCount += 1;
              clientMap[cpf].orders.push(order);
              if (order.source === "Afiliado") {
                 clientMap[cpf].origins.add(`Parceiro: ${order.affiliateName || 'B2B'}`);
              } else {
                 clientMap[cpf].origins.add('Loja / Orgânico');
              }
              if (date > clientMap[cpf].lastPurchase) {
                 clientMap[cpf].lastPurchase = date;
                 // Maintain the most recent address
                 clientMap[cpf].address = order.client; 
              }
          });

          // Convert obj map to array and sort by Total Spent
          const clientsArray = Object.values(clientMap).sort((a,b) => b.totalSpent - a.totalSpent);
          setClients(clientsArray);

       } catch (error) {
          console.error("Erro ao carregar clientes", error);
       }
       setLoading(false);
    }
    loadData();
  }, []);

  const handleDeleteClient = async (clientData) => {
     if(!window.confirm(`ATENÇÃO FATAL: Deseja realmente excluir TODOS os dados e HISTÓRICO DE COMPRAS de ${clientData.name}?\nIsso vai apagar a ficha dele e deletar todas faturas dele do seu caixa.`)) return;

     setLoading(true);
     try {
         // 1. Delete from clients collection if exists
         const cleanCpf = clientData.cpf.replace(/\D/g, '');
         if (cleanCpf) {
            await deleteDoc(doc(db, "clients", cleanCpf));
         }

         // 2. Deletar todos os pedidos atrelados para remover a receita
         const qOrders = query(collection(db, "orders"), where("client.cpf", "==", clientData.cpf));
         const snap = await getDocs(qOrders);
         
         const promises = snap.docs.map(d => {
             return deleteDoc(doc(db, "orders", d.id));
         });
         await Promise.all(promises);

         alert("Cliente e histórico financeiro excluídos com sucesso!");
         window.location.reload();
     } catch (e) {
         console.error("Erro ao excluir", e);
         alert("Erro ao excluir cliente.");
         setLoading(false);
     }
  };

  const totalRevenue = clients.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgTicket = clients.length > 0 ? totalRevenue / clients.length : 0;

  const filteredClients = clients.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.cpf.includes(searchTerm) || 
      c.phone.includes(searchTerm)
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
         <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
               <Users className="text-indigo-600" /> CRM Kora (Gestão de Clientes)
            </h2>
            <p className="text-slate-500 mt-1">Conheça, engaje e aumente o LTV dos seus compradores.</p>
         </div>

         {/* KPIs */}
         <div className="grid grid-cols-1 md:max-w-sm gap-6 mb-8">
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
                 <div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total de Únicos</p>
                    <p className="text-4xl font-black text-slate-800">{clients.length}</p>
                 </div>
                 <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600"><Users size={32}/></div>
             </div>
         </div>

         <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">
             
             {/* Search */}
             <div className="flex justify-between items-center mb-6">
                 <div className="relative w-full max-w-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <Search size={18} className="text-slate-400"/>
                    </div>
                    <input 
                       type="text" 
                       placeholder="Buscar por nome, CPF ou Telefone..." 
                       value={searchTerm}
                       onChange={e=>setSearchTerm(e.target.value)}
                       className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-indigo-500 transition"
                    />
                 </div>
             </div>

             {loading ? (
                <div className="p-12 text-center text-slate-500 font-medium">Analisando base de dados...</div>
             ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100 uppercase tracking-wide">
                             <th className="p-4 font-bold">Cliente</th>
                             <th className="p-4 font-bold">Contato</th>
                             <th className="p-4 font-bold">Origem Principal</th>
                             <th className="p-4 font-bold">Valor Total (LTV)</th>
                             <th className="p-4 font-bold">Ação</th>
                          </tr>
                       </thead>
                       <tbody>
                          {filteredClients.map(c => (
                             <tr key={c.cpf} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                <td className="p-4">
                                   <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex justify-center items-center font-black">
                                         {c.name.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                         <p className="font-bold text-slate-800 text-base">{c.name}</p>
                                         <p className="text-xs text-slate-400 mt-0.5">CPF: {c.cpf}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="p-4">
                                   <p className="font-medium text-slate-700">{c.phone}</p>
                                   <p className="text-xs text-slate-400">{c.email || 'S/ Email'}</p>
                                </td>
                                <td className="p-4">
                                   <div className="flex flex-col gap-1">
                                      {Array.from(c.origins).map((org, i) => (
                                         <span key={i} className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 w-fit">{org}</span>
                                      ))}
                                   </div>
                                </td>
                                <td className="p-4">
                                   <p className="text-lg font-black text-emerald-600">R$ {c.totalSpent.toFixed(2).replace('.', ',')}</p>
                                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{c.ordersCount} compras</p>
                                </td>
                                <td className="p-4 text-right">
                                   <button 
                                     onClick={() => setSelectedClient(c)}
                                     className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition p-2.5 rounded-xl shadow-sm text-sm font-bold flex items-center gap-1"
                                   >
                                      Histórico <ChevronRight size={16}/>
                                   </button>
                                </td>
                             </tr>
                          ))}
                          {filteredClients.length === 0 && (
                             <tr><td colSpan="5" className="p-8 text-center text-slate-500">Nenhum cliente encontrado.</td></tr>
                          )}
                       </tbody>
                    </table>
                </div>
             )}
         </div>
      </div>

      {/* Sidepanel do Cliente */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex justify-end">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedClient(null)}></div>
           <div className="relative w-full max-w-md h-full bg-slate-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200">
              
              <div className="flex items-center justify-between p-6 border-b border-indigo-100 bg-white shadow-sm z-10">
                 <div>
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1"><Users size={12}/> Ficha do Cliente</p>
                    <h2 className="font-bold text-2xl text-slate-800 leading-tight mt-1 truncate max-w-[280px]">{selectedClient.name}</h2>
                    <div className="flex gap-2 items-center mt-1">
                        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded font-mono font-bold">CPF: {selectedClient.cpf}</span>
                    </div>
                 </div>
                 <div className="flex gap-2">
                     <button onClick={() => handleDeleteClient(selectedClient)} className="text-red-400 hover:bg-red-50 hover:text-red-600 transition p-2 bg-white rounded-full" title="Excluir Cliente Permanentemente">
                        <Trash2 size={20} />
                     </button>
                     <button onClick={() => setSelectedClient(null)} className="text-slate-400 hover:bg-slate-100 transition p-2 bg-white rounded-full">
                        <X size={20} />
                     </button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                 
                 {/* Contacts & Address */}
                 <div className="p-6 bg-white border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-sm mb-4 uppercase tracking-widest border-b border-slate-100 pb-2">Contatos & Logística</h3>
                    
                    <div className="mb-4">
                       <a 
                          href={`https://wa.me/55${selectedClient.phone.replace(/\D/g, '')}`} 
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 bg-green-50 p-3 rounded-xl border border-green-100 text-green-700 hover:bg-green-100 transition"
                       >
                          <Phone size={18}/>
                          <div>
                             <p className="text-xs font-bold uppercase tracking-widest opacity-70">Chamar no WhatsApp</p>
                             <p className="font-bold text-sm">{selectedClient.phone}</p>
                          </div>
                       </a>
                    </div>

                    <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-600">
                       <MapPin size={20} className="text-slate-400 shrink-0 mt-0.5"/>
                       <div>
                          <p className="font-bold text-slate-800">{selectedClient.address.address}, {selectedClient.address.number}</p>
                          <p>{selectedClient.address.neighborhood} - {selectedClient.address.compement || ''}</p>
                          <p>{selectedClient.address.city} - {selectedClient.address.state}</p>
                          <p className="font-mono mt-1 font-bold text-xs bg-white px-2 py-0.5 inline-block rounded border border-slate-200">CEP: {selectedClient.address.cep}</p>
                       </div>
                    </div>
                 </div>

                 {/* Order Timeline */}
                 <div className="p-6">
                    <h3 className="font-bold text-slate-800 text-sm mb-6 uppercase tracking-widest border-b border-slate-200 pb-2 flex items-center justify-between">
                       Histórico (Linha do Tempo)
                       <span className="bg-indigo-600 text-white text-[10px] px-2 py-1 rounded-full">LTV MÁX: R$ {selectedClient.totalSpent.toFixed(2).replace('.', ',')}</span>
                    </h3>
                    
                    <div className="space-y-4">
                       {selectedClient.orders.map((o, i) => (
                           <div key={o.id} className="relative pl-6 pb-2">
                               <div className="absolute top-0 left-0 w-2 h-2 rounded-full bg-indigo-500 mt-2"></div>
                               {i !== selectedClient.orders.length -1 && <div className="absolute top-2 left-[3px] w-[2px] h-full bg-slate-200"></div>}
                               
                               <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                                   <div className="flex justify-between items-start mb-2">
                                      <p className="font-bold text-sm text-slate-800">Moeda Local (R$ {o.total.toFixed(2).replace('.', ',')})</p>
                                      <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded w-max text-right ${o.status === 'Concluído' ? 'bg-emerald-100 text-emerald-700' : o.status === 'Pago' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                         {o.status}
                                      </span>
                                   </div>
                                   <p className="text-xs text-slate-400 font-mono mb-3">#ID: {o.id.toUpperCase()}</p>
                                   
                                   <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                                      {o.items?.map((it, idx) => (
                                          <p key={idx} className="text-xs text-slate-700"><span className="font-bold">{it.quantity}x</span> {it.name} <span className="font-bold text-indigo-500">[{it.selectedSize}]</span></p>
                                      ))}
                                   </div>
                               </div>
                           </div>
                       ))}
                    </div>
                 </div>

              </div>
           </div>
        </div>
      )}
    </div>
  );
}
