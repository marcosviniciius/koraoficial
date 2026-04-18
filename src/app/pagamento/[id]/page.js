"use client";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, ShieldCheck, Lock, CreditCard } from "lucide-react";

export default function CheckoutExclusivo() {
  const { id } = useParams();
  const router = useRouter();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      try {
        const docRef = doc(db, "orders", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Erro ao carregar link", error);
      }
      setLoading(false);
    }
    loadOrder();
  }, [id]);

  const handleMockPayment = async () => {
    setProcessing(true);
    try {
       // 1. Atualiza Status do Pedido
       const orderRef = doc(db, "orders", id);
       await updateDoc(orderRef, { status: "Pago" });

       // 2. Decrementa Estoque (Lógica de Pronta Entrega vs Encomenda)
       for (const item of order.items) {
          const productRef = doc(db, "products", item.id);
          const productSnap = await getDoc(productRef);
          
          if (productSnap.exists()) {
             const stock = productSnap.data().stock || {};
             const currentStockQty = stock[item.selectedSize] || 0;
             
             // Só decrementa se havia estoque (se for Pronta Entrega de verdade)
             // Encomendas virtuais não precisam decrementar o que não existe.
             if (currentStockQty > 0) {
                 await updateDoc(productRef, {
                    [`stock.${item.selectedSize}`]: increment(-item.quantity)
                 });
             }
          }
       }

       setSuccess(true);
    } catch (e) {
       console.error(e);
       alert("Erro ao validar pagamento");
    }
    setProcessing(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Criptografando ambiente...</div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center font-bold text-red-500">Fatura não encontrada. Verifique o link.</div>;

  if (order.status === "Pago" || success) {
     return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
           <div className="bg-white max-w-md w-full p-8 rounded-3xl shadow-xl text-center">
              <div className="bg-green-100 p-4 rounded-full inline-block mx-auto mb-6"><CheckCircle2 size={48} className="text-green-600"/></div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Pagamento Aprovado</h2>
              <p className="text-slate-600 mb-6">O seu pagamento de <strong className="text-slate-800">R$ {order.total.toFixed(2).replace('.',',')}</strong> foi recebido com sucesso e seu pedido já está sendo processado na logística Kora.</p>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm font-mono text-slate-500 mb-6 flex flex-col gap-1">
                 <span>Recibo: {order.id.toUpperCase()}</span>
                 <span>Data: {new Date().toLocaleDateString('pt-BR')}</span>
              </div>
           </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       <header className="bg-white p-4 border-b border-slate-100 flex justify-center shadow-sm">
          <h1 className="font-logo text-3xl text-[var(--color-kora-blue)]">KORA</h1>
       </header>

       <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
              
              <div className="bg-white rounded-t-3xl shadow-sm border border-slate-100 p-6">
                 <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-lg text-sm font-bold w-fit mb-4">
                    <ShieldCheck size={16} /> Checkout Seguro
                 </div>
                 
                 <h2 className="text-2xl font-bold text-slate-800 mb-4">Resumo do Pedido</h2>
                 
                 <div className="space-y-4">
                     {order.items.map((item, idx) => (
                         <div key={idx} className="flex justify-between items-center pb-4 border-b border-slate-50">
                             <div>
                                <p className="font-bold text-slate-800">{item.name}</p>
                                <p className="text-sm text-slate-500">Tam: {item.selectedSize} - Qtd: {item.quantity}</p>
                             </div>
                         </div>
                     ))}
                 </div>
                 
                 <div className="mt-6 pt-6 border-t-2 border-dashed border-slate-200">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest text-center mb-2">Total A Pagar</p>
                    <p className="text-5xl font-black text-slate-900 text-center">R$ {order.total.toFixed(2).replace('.', ',')}</p>
                 </div>
              </div>

              <div className="bg-slate-900 rounded-b-3xl p-6 shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10"><CreditCard size={100} /></div>
                 <p className="text-slate-400 text-sm mb-4 text-center">Pagamento processado via Mercado Pago.</p>
                 <button 
                   disabled={processing}
                   onClick={handleMockPayment}
                   className="w-full bg-[var(--color-kora-blue)] text-white font-bold text-lg p-5 rounded-xl flex items-center justify-center gap-3 hover:bg-blue-800 transition disabled:opacity-50"
                 >
                    {processing ? <Lock className="animate-spin" /> : <Lock />} 
                    {processing ? "Processando..." : "Quitar R$ " + order.total.toFixed(2).replace('.',',')}
                 </button>
              </div>

          </div>
       </main>

    </div>
  );
}
