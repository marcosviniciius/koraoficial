"use client";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, ShieldCheck, Lock, CreditCard } from "lucide-react";

export default function CheckoutExclusivo() {
  const { id } = useParams();
  const router = useRouter();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      try {
        const idList = id.split(',');
        const loadedOrders = [];
        
        for (const orderId of idList) {
          const docRef = doc(db, "orders", orderId.trim());
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            loadedOrders.push({ id: docSnap.id, ...docSnap.data() });
          }
        }
        
        setOrders(loadedOrders);
      } catch (error) {
        console.error("Erro ao carregar link", error);
      }
      setLoading(false);
    }
    loadOrders();
  }, [id]);

  const totalCalculated = orders.reduce((sum, o) => sum + o.total, 0);
  const allItems = orders.flatMap(o => o.items);
  const allPaid = orders.length > 0 && orders.every(o => o.status === "Pago" || o.status === "Concluído");

  const handlePayment = async () => {
    setProcessing(true);
    try {
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: id })
        });

        const data = await response.json();

        if (data.init_point) {
            window.location.href = data.init_point;
        } else {
            throw new Error(data.error || "Erro ao gerar link de pagamento");
        }
    } catch (e) {
        console.error(e);
        alert(e.message || "Erro ao conectar com Mercado Pago");
    } finally {
        setProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center font-bold text-dim">Criptografando ambiente...</div>;
  if (orders.length === 0) return <div className="min-h-screen bg-background flex items-center justify-center font-bold text-red-500">Fatura não encontrada. Verifique o link.</div>;

  if (allPaid || success) {
     return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
           <div className="bg-surface dark:bg-slate-900 max-w-md w-full p-8 rounded-3xl shadow-xl text-center border border-border-dim">
              <div className="bg-emerald-100 dark:bg-emerald-900/20 p-4 rounded-full inline-block mx-auto mb-6"><CheckCircle2 size={48} className="text-emerald-600"/></div>
              <h2 className="text-2xl font-bold text-main mb-2">Pagamento Aprovado</h2>
              <p className="text-dim mb-6">O seu pagamento de <strong className="text-main">R$ {totalCalculated.toFixed(2).replace('.',',')}</strong> foi recebido com sucesso e seu pedido já está sendo processado na logística Kora.</p>
              <div className="bg-background border border-border-dim p-4 rounded-xl text-sm font-mono text-dim mb-6 flex flex-col gap-1">
                 <span>Recibo: {id.split(',')[0].toUpperCase()}...</span>
                 <span>Data: {new Date().toLocaleDateString('pt-BR')}</span>
              </div>
           </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
       <header className="bg-surface dark:bg-slate-900 p-4 border-b border-border-dim flex justify-center shadow-sm">
          <h1 className="font-logo text-3xl text-[var(--color-kora-blue)]">KORA</h1>
       </header>

       <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
              
              <div className="bg-surface dark:bg-slate-900 rounded-t-3xl shadow-sm border border-border-dim p-6">
                 <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-lg text-sm font-bold w-fit mb-4">
                    <ShieldCheck size={16} /> Checkout Seguro
                 </div>
                 
                 <h2 className="text-2xl font-bold text-main mb-4">Resumo do Pedido</h2>
                 
                 <div className="space-y-4">
                     {allItems.map((item, idx) => (
                         <div key={idx} className="flex justify-between items-center pb-4 border-b border-border-dim">
                             <div>
                                <p className="font-bold text-main">{item.name}</p>
                                <p className="text-sm text-dim">Tam: {item.selectedSize} - Qtd: {item.quantity}</p>
                             </div>
                         </div>
                     ))}
                 </div>
                 
                 <div className="mt-6 pt-6 border-t-2 border-dashed border-border-dim">
                    <p className="text-sm font-bold text-dim uppercase tracking-widest text-center mb-2">Total A Pagar</p>
                    <p className="text-5xl font-black text-main text-center">R$ {totalCalculated.toFixed(2).replace('.', ',')}</p>
                 </div>
              </div>

              <div className="bg-slate-900 dark:bg-black rounded-b-3xl p-6 shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10 text-white"><CreditCard size={100} /></div>
                 <p className="text-slate-400 text-sm mb-4 text-center">Pagamento oficial via Mercado Pago.</p>
                 <button 
                   disabled={processing}
                   onClick={handlePayment}
                   className="w-full bg-[var(--color-kora-blue)] text-white font-bold text-lg p-5 rounded-xl flex items-center justify-center gap-3 hover:bg-blue-800 transition disabled:opacity-50 active:scale-95 shadow-lg shadow-blue-900/40 relative z-10"
                 >
                    {processing ? <Lock className="animate-spin" /> : <Lock />} 
                    {processing ? "Gerando Link Seguro..." : "Pagar Agora R$ " + totalCalculated.toFixed(2).replace('.',',')}
                 </button>
                 <div className="mt-6 flex items-center justify-center gap-6 grayscale opacity-30">
                    <img src="https://logodownload.org/wp-content/uploads/2019/06/mercado-pago-logo-0.png" className="h-4" alt="Mercado Pago" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Logo_Pix.png/1200px-Logo_Pix.png" className="h-4" alt="Pix" />
                 </div>
              </div>

          </div>
       </main>

    </div>
  );
}

