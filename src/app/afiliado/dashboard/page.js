"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, orderBy, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LogOut, Copy, Briefcase, User, LineChart, Target, DollarSign, Users, Award } from "lucide-react";

export default function AfiliadoDashboard() {
  const router = useRouter();
  const [affiliateId, setAffiliateId] = useState(null);
  const [affiliateName, setAffiliateName] = useState("");
  const [affiliatePix, setAffiliatePix] = useState("");
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem("kora_affiliate_id");
    const name = localStorage.getItem("kora_affiliate_name");
    
    if (!id) {
       router.push("/afiliado/login");
       return;
    }

    setAffiliateId(id);
    setAffiliateName(name || "Parceiro Kora");
    
    // Fetch Affiliate Data and Orders
    const loadDashboard = async () => {
       try {
           const affDoc = await getDoc(doc(db, "affiliates", id));
           if(affDoc.exists()) setAffiliatePix(affDoc.data().pix);

           const q = query(
              collection(db, "orders"),
              where("affiliateId", "==", id)
           );
           const snap = await getDocs(q);
           
           // Sort manually since we didn't add a composite index for where+orderBy
           const fetchedOrders = snap.docs.map(d => ({id: d.id, ...d.data()}));
           fetchedOrders.sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds);
           
           setOrders(fetchedOrders);
       } catch (error) {
           console.error("Erro ao carregar dados", error);
       }
       setLoading(false);
    };

    loadDashboard();
  }, [router]);

  const handleLogout = () => {
      localStorage.removeItem("kora_affiliate_id");
      localStorage.removeItem("kora_affiliate_name");
      router.push("/afiliado/login");
  };

  const copyToClipboard = (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        alert("Seu Link Exclusivo foi copiado!");
      } else {
        throw new Error("Clipboard API not available");
      }
    } catch (err) {
      alert("Cópia automática bloqueada. Acesse o admin via HTTPS ou copie manualmente da aba de navegação.");
    }
  };

  if (loading) {
     return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-purple-600">Carregando painel de vendas...</div>
  }

  const owedCommissions = orders
        .filter(o => o.status === "Pago")
        .reduce((sum, o) => sum + (o.commission || 0), 0);
        
  const pendingSales = orders
        .filter(o => o.status === "Aguardando Pagamento do Cliente")
        .reduce((sum, o) => sum + (o.total || 0), 0);

  // Extrair lista de clientes únicos por CPF
  const uniqueClients = orders.filter((order, index, self) => 
     index === self.findIndex((t) => t.client.cpf === order.client.cpf)
  );

  const saleLink = typeof window !== 'undefined' ? `${window.location.origin}/revendedor/${affiliateId}` : '';

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
       
       {/* Top Header */}
       <header className="bg-purple-700 text-white p-6 shadow-md rounded-b-3xl mb-8">
           <div className="max-w-4xl mx-auto flex justify-between items-center">
              <div>
                 <p className="text-xs text-purple-300 font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><Award size={14}/> Portal do Parceiro</p>
                 <h1 className="text-2xl font-black leading-none">{affiliateName}</h1>
              </div>
              <button 
                 onClick={handleLogout}
                 className="bg-purple-800 hover:bg-purple-900 p-3 rounded-full transition-colors text-purple-200"
                 title="Sair da Conta"
              >
                 <LogOut size={20} />
              </button>
           </div>
       </header>

       <main className="max-w-4xl mx-auto px-4 md:px-8 space-y-8">
           
           {/* Sale Link Area */}
           <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1">
                 <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><Briefcase size={20} className="text-purple-600"/> Seu Link de Vendas</h2>
                 <p className="text-sm text-slate-500 mb-4">Envie este link para o cliente final. Você define o preço de venda na hora de gerar a fatura dele.</p>
                 <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl overflow-hidden text-xs font-mono text-slate-600 truncate">
                    {saleLink}
                 </div>
              </div>
              <button 
                onClick={() => copyToClipboard(saleLink)}
                className="w-full md:w-auto h-fit bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-200 transition-all shrink-0"
              >
                 <Copy size={20} /> Copiar Meu Link
              </button>
           </section>

           {/* Metrics Grid */}
           <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-3xl shadow-lg border border-emerald-400 text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-6 opacity-20"><DollarSign size={80}/></div>
                 <p className="text-xs font-bold text-emerald-200 uppercase tracking-widest mb-1 relative z-10">Saldo Disponível para Saque</p>
                 <h3 className="text-4xl font-black mt-2 relative z-10">R$ {owedCommissions.toFixed(2).replace('.',',')}</h3>
                 <p className="text-sm text-emerald-100 mt-2 relative z-10">* Comissões de pedidos que já constam como Pagos.</p>
                 <div className="mt-4 bg-emerald-800/40 p-3 rounded-xl text-xs font-mono text-emerald-100 border border-emerald-600/50 relative z-10">
                    Sua Chave PIX: {affiliatePix || 'Não cadastrada'}
                 </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
                 <div>
                    <div className="text-amber-500 bg-amber-50 w-fit p-3 rounded-xl mb-4"><Target size={24}/></div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Vendas Pendentes</p>
                    <h3 className="text-3xl font-black text-slate-800">R$ {pendingSales.toFixed(2).replace('.',',')}</h3>
                 </div>
                 <p className="text-sm text-slate-500 mt-4 leading-relaxed">Faturas geradas pela sua conta mas que o cliente final ainda não realizou o pagamento via PIX/Cartão.</p>
              </div>
           </section>

           <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
               {/* Left Col: Order History */}
               <section className="md:col-span-7 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><LineChart size={20} className="text-indigo-600"/> Histórico de Faturas</h3>
                  
                  <div className="space-y-4">
                      {orders.length === 0 ? (
                         <p className="text-slate-500 italic text-center p-6 bg-slate-50 rounded-2xl">Você ainda não gerou nenhuma venda.</p>
                      ) : (
                         orders.slice(0, 15).map(order => (
                            <div key={order.id} className="border border-slate-100 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                   <div>
                                      <p className="font-bold text-slate-800">{order.items?.[0]?.name} {order.items?.length > 1 && `+${order.items.length -1}`}</p>
                                      <p className="text-xs text-slate-500 mt-1">Cliente: <strong className="text-slate-700">{order.client?.name}</strong></p>
                                   </div>
                                   <div className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded w-max text-right ${order.status === 'Pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                      {order.status}
                                   </div>
                                </div>
                                <div className="flex justify-between items-end border-t border-slate-100 pt-3">
                                   <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor do Pedido</p>
                                      <p className="text-sm font-black text-slate-800">R$ {order.total?.toFixed(2).replace('.', ',')}</p>
                                   </div>
                                   <div className="text-right">
                                      <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Sua Comissão</p>
                                      <p className="text-sm font-black text-purple-600">R$ {order.commission?.toFixed(2).replace('.', ',')}</p>
                                   </div>
                                </div>
                            </div>
                         ))
                      )}
                  </div>
               </section>

               {/* Right Col: Clients */}
               <section className="md:col-span-5 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 auto-rows-max">
                   <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Users size={20} className="text-blue-600"/> Seus Clientes</h3>
                   <div className="space-y-3">
                      {uniqueClients.length === 0 ? (
                          <p className="text-slate-500 italic text-center p-6 bg-slate-50 rounded-2xl">Nenhum cliente atrelado.</p>
                      ) : (
                         uniqueClients.map(order => (
                             <div key={order.client.cpf} className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                                 <div className="w-10 h-10 bg-blue-100 text-blue-500 rounded-full flex justify-center items-center font-bold">
                                    {order.client.name.charAt(0).toUpperCase()}
                                 </div>
                                 <div className="flex-1 truncate">
                                    <p className="font-bold text-sm text-slate-800 truncate">{order.client.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{order.client.phone}</p>
                                 </div>
                             </div>
                         ))
                      )}
                   </div>
               </section>
           </div>
           
       </main>
    </div>
  );
}
