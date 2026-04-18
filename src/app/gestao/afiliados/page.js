"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, query, orderBy, where, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminSidebar from "@/components/AdminSidebar";
import { Briefcase, Copy, Users, Plus, Target, CheckCircle2, Pencil, Fingerprint } from "lucide-react";

export default function AfiliadosPage() {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState(null);
  const [newName, setNewName] = useState("");
  const [newPix, setNewPix] = useState("");
  const [newPhone, setNewPhone] = useState("");
  
  const [orders, setOrders] = useState([]); // All affiliate orders to calculate commissions

  const fetchData = async () => {
    setLoading(true);
    try {
      const affSnap = await getDocs(query(collection(db, "affiliates"), orderBy("createdAt", "desc")));
      setAffiliates(affSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const ordSnap = await getDocs(query(collection(db, "orders"), where("source", "==", "Afiliado")));
      setOrders(ordSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddAffiliate = async (e) => {
    e.preventDefault();
    try {
      if (editingAffiliate) {
        const docRef = doc(db, "affiliates", editingAffiliate.id);
        await updateDoc(docRef, {
          name: newName,
          pix: newPix,
          phone: newPhone
        });
        setEditingAffiliate(null);
      } else {
        await addDoc(collection(db, "affiliates"), {
          name: newName,
          pix: newPix,
          phone: newPhone,
          createdAt: new Date()
        });
      }
      setShowAddModal(false);
      setNewName("");
      setNewPix("");
      setNewPhone("");
      fetchData();
    } catch (error) {
      alert("Erro ao salvar afiliado.");
    }
  };

  const openEdit = (aff) => {
    setEditingAffiliate(aff);
    setNewName(aff.name);
    setNewPix(aff.pix);
    setNewPhone(aff.phone);
    setShowAddModal(true);
  };

  const closeAndClear = () => {
    setShowAddModal(false);
    setEditingAffiliate(null);
    setNewName("");
    setNewPix("");
    setNewPhone("");
  };

  const calculateOwedCommission = (affiliateId) => {
    // A commissions is owed if order is Paid ("Pago"). 
    // If it's Aguardando Pagamento, it's not owed yet.
    return orders
      .filter(o => o.affiliateId === affiliateId && o.status === "Pago")
      .reduce((sum, o) => sum + (o.commission || 0), 0);
  };

  const calculatePendingSales = (affiliateId) => {
    return orders
      .filter(o => o.affiliateId === affiliateId && o.status === "Aguardando Pagamento do Cliente")
      .reduce((sum, o) => sum + (o.total || 0), 0);
  };

  const copyToClipboard = (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        alert("Link copiado! Mande no WhatsApp do revendedor.");
      } else {
        throw new Error("Clipboard API not available");
      }
    } catch (err) {
      console.warn("Falha ao copiar automaticamente:", err);
      alert("Seu navegador bloqueou a cópia automática por segurança (precisa de HTTPS). Por favor, copie o link manualmente no campo logo acima.");
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
             <Briefcase className="text-purple-600" /> Rede de Afiliados (B2B)
          </h2>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-purple-700 transition"
          >
            <Plus size={20} className="inline mr-1"/> Novo Afiliado
          </button>
        </div>

        {/* Dashboard Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
                <div>
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Afiliados Ativos</p>
                   <p className="text-4xl font-bold text-slate-800">{affiliates.length}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl text-slate-500"><Users size={32}/></div>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-6 rounded-3xl shadow-lg flex justify-between items-center text-white">
                <div>
                   <p className="text-sm font-bold text-purple-200 uppercase tracking-wider mb-1">Dívida de Comissões</p>
                   <p className="text-4xl font-bold text-white">
                     R$ {affiliates.reduce((sum, aff) => sum + calculateOwedCommission(aff.id), 0).toFixed(2).replace('.',',')}
                   </p>
                </div>
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm"><Target size={32}/></div>
            </div>
        </div>

        {/* Tabela de Afiliados */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
             {loading ? (
               <div className="p-8 text-center text-slate-500">Caregando rede...</div>
             ) : affiliates.length === 0 ? (
               <div className="p-8 text-center text-slate-500">Nenhum afiliado cadastrado.</div>
             ) : (
               <>
                 <div className="overflow-x-auto hidden md:block">
                   <table className="w-full text-left border-collapse">
                     <thead>
                       <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100 uppercase tracking-wide">
                         <th className="p-4 font-bold">Afiliado</th>
                         <th className="p-4 font-bold">Chave PIX</th>
                         <th className="p-4 font-bold">Comissões (A Pagar)</th>
                         <th className="p-4 font-bold">Vendas Aguardando</th>
                         <th className="p-4 font-bold">Link de Acesso</th>
                       </tr>
                     </thead>
                     <tbody>
                       {affiliates.map((aff) => {
                          const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                          const link = `${baseUrl}/revendedor/${aff.id}`;
                          return (
                            <tr key={aff.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                              <td className="p-4">
                                <div className="flex items-start gap-4">
                                  <div>
                                    <p className="font-bold text-slate-800 text-lg leading-none">{aff.name}</p>
                                    <div className="flex items-center gap-1.5 mt-2 bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md w-fit">
                                       <Fingerprint size={10} />
                                       <span className="text-[10px] font-mono font-bold tracking-tight uppercase">ID: {aff.id.slice(0, 8)}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 font-medium">WhatsApp: {aff.phone}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <p className="bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg font-mono text-xs inline-block text-slate-600">{aff.pix}</p>
                              </td>
                              <td className="p-4">
                                 <p className="text-lg font-black text-emerald-600">R$ {calculateOwedCommission(aff.id).toFixed(2).replace('.', ',')}</p>
                              </td>
                              <td className="p-4">
                                 <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">R$ {calculatePendingSales(aff.id).toFixed(2).replace('.', ',')}</p>
                              </td>
                              <td className="p-4">
                                 <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => copyToClipboard(link)}
                                      className="bg-[var(--color-kora-blue)] text-white hover:bg-[var(--color-kora-blue-dark)] transition p-2 rounded-lg shadow-sm"
                                      title="Copiar Link de Venda"
                                    >
                                      <Copy size={16} />
                                    </button>
                                    <button 
                                      onClick={() => openEdit(aff)}
                                      className="bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition p-2 rounded-lg shadow-sm"
                                      title="Editar Dados"
                                    >
                                      <Pencil size={16} />
                                    </button>
                                 </div>
                              </td>
                            </tr>
                          )
                       })}
                     </tbody>
                   </table>
                 </div>
                 
                 {/* Mobile Cards View */}
                 <div className="md:hidden flex flex-col p-4 gap-4 bg-slate-50">
                    {affiliates.map((aff) => {
                        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                        const link = `${baseUrl}/revendedor/${aff.id}`;
                        const owed = calculateOwedCommission(aff.id);
                        const pending = calculatePendingSales(aff.id);

                        return (
                            <div key={aff.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
                               <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                                  <div>
                                     <p className="font-bold text-slate-800 text-lg leading-tight">{aff.name}</p>
                                     <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase font-bold tracking-tighter">ID: {aff.id}</p>
                                     <p className="text-xs text-slate-500 mt-1">{aff.phone}</p>
                                  </div>
                                  <button onClick={() => openEdit(aff)} className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-slate-400">
                                      <Pencil size={18} />
                                  </button>
                               </div>
                               <div className="flex justify-between items-center text-center mt-2">
                                  <div className="bg-emerald-50 p-3 rounded-xl flex-1 mr-2 border border-emerald-100">
                                     <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">Dívida (A Pagar)</p>
                                     <p className="font-black text-lg text-emerald-700 mt-0.5">R$ {owed.toFixed(2).replace('.', ',')}</p>
                                  </div>
                                  <div className="bg-amber-50 p-3 rounded-xl flex-1 ml-2 border border-amber-100">
                                     <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest">Pendente</p>
                                     <p className="font-black text-lg text-amber-700 mt-0.5">R$ {pending.toFixed(2).replace('.', ',')}</p>
                                  </div>
                               </div>
                               <div className="flex flex-col gap-2 mt-3">
                                  <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg overflow-hidden">
                                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Link de Venda (Copie abaixo):</p>
                                     <p className="text-[10px] font-mono text-slate-600 truncate">{link}</p>
                                  </div>
                                  <button 
                                    onClick={() => copyToClipboard(link)}
                                    className="w-full bg-purple-600 text-white font-bold p-3.5 rounded-xl flex justify-center items-center gap-2 shadow-md shadow-purple-100 transition-transform active:scale-95"
                                  >
                                     <Copy size={18} /> Tentar Copiar
                                  </button>
                               </div>
                            </div>
                        )
                    })}
                 </div>
               </>
             )}
        </div>

      </div>

      {/* Modal Add Affiliate */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
              <h3 className="text-xl font-bold mb-6 text-slate-800 border-b pb-4">
                {editingAffiliate ? "Editar Dados do Parceiro" : "Cadastrar Novo Revendedor"}
              </h3>
              
              {editingAffiliate && (
                <div className="mb-6 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                   <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-2">Link Completo do Revendedor</p>
                   <div className="space-y-2">
                      <input 
                        readOnly
                        value={typeof window !== 'undefined' ? `${window.location.origin}/revendedor/${editingAffiliate.id}` : ''}
                        className="w-full text-[10px] font-mono bg-white p-3 rounded-xl border border-purple-200 text-slate-600 focus:ring-2 focus:ring-purple-400 outline-none"
                        onClick={(e) => e.target.select()}
                      />
                      <button 
                        onClick={() => copyToClipboard(typeof window !== 'undefined' ? `${window.location.origin}/revendedor/${editingAffiliate.id}` : '')}
                        className="w-full py-2 bg-purple-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                      >
                         <Copy size={14}/> Tentar Copiar Automático
                      </button>
                   </div>
                   <p className="text-[9px] text-purple-400 mt-2 leading-tight">* Como você está via IP local, a cópia automática pode falhar. Se falhar, clique no texto acima e dê "Copiar" manualmente.</p>
                </div>
              )}

              <form onSubmit={handleAddAffiliate} className="space-y-4">
                 <div>
                    <label className="text-sm font-bold text-slate-600">Nome do Parceiro</label>
                    <input required type="text" value={newName} onChange={e=>setNewName(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-500 transition"/>
                 </div>
                 <div>
                    <label className="text-sm font-bold text-slate-600">WhatsApp</label>
                    <input required type="text" value={newPhone} onChange={e=>setNewPhone(e.target.value)} placeholder="(DD) 99999-9999" className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-500 transition"/>
                 </div>
                 <div>
                    <label className="text-sm font-bold text-slate-600">Chave PIX (Para repasses)</label>
                    <input required type="text" value={newPix} onChange={e=>setNewPix(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-500 transition"/>
                 </div>
                 <div className="flex gap-3 pt-6 border-t border-slate-100">
                    <button type="button" onClick={closeAndClear} className="flex-1 p-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition">Cancelar</button>
                    <button type="submit" className="flex-1 p-3 bg-[var(--color-kora-blue)] text-white font-bold rounded-xl shadow-md transition-transform active:scale-95">
                      {editingAffiliate ? "Salvar Alterações" : "Salvar Parceiro"}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
