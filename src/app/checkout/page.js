"use client";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { collection, addDoc, serverTimestamp, updateDoc, doc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import { Receipt, CreditCard } from "lucide-react";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const [formData, setFormData] = useState({
    name: "", cpf: "", email: "", phone: "",
    cep: "", address: "", number: "", complement: "", neighborhood: "", city: "", state: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Guardamos os IDs dos pedidos gerados para simular o pagamento logo depois
  const [savedOrderIds, setSavedOrderIds] = useState([]);
  const [simulandoPagamento, setSimulandoPagamento] = useState(false);
  const [pagamentoConcluido, setPagamentoConcluido] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return alert("Seu carrinho está vazio");

    setLoading(true);
    try {
      // 1. Separation of Baskets
      const itemsImediato = items.filter(i => i.orderType === 'Imediato');
      const itemsEncomenda = items.filter(i => i.orderType === 'Encomenda');
      let createdIds = [];

      const registerOrder = async (orderItems, typeLabel) => {
          if (orderItems.length === 0) return;
          const orderTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const docRef = await addDoc(collection(db, "orders"), {
            client: formData,
            items: orderItems,
            total: orderTotal,
            status: "Aguardando Pagamento",
            type: typeLabel, // 'Imediato' or 'Encomenda'
            createdAt: serverTimestamp()
          });
          createdIds.push(docRef.id);
      };

      // 2. Register Orders separately if they exist
      await registerOrder(itemsImediato, 'Imediato');
      await registerOrder(itemsEncomenda, 'Encomenda');
      
      setSavedOrderIds(createdIds);
      setSuccess(true);
    } catch (e) {
      console.error(e);
      alert("Erro ao processar pedido.");
    } finally {
      setLoading(false);
    }
  };

  const simularPagamentoMercadoPago = async () => {
      setSimulandoPagamento(true);
      try {
          // Fase 3 Simulador: Alterar documentos para "Pago"
          for (let id of savedOrderIds) {
              const orderRef = doc(db, "orders", id);
              await updateDoc(orderRef, {
                  status: "Pago"
              });
          }
          
          // Baixar Estoque dos produtos à Pronta Entrega
          const immediates = items.filter(i => i.orderType === 'Imediato');
          for (let item of immediates) {
              const productRef = doc(db, "products", item.id);
              await updateDoc(productRef, {
                  [`stock.${item.selectedSize}`]: increment(-item.quantity)
              });
          }

          clearCart();
          setPagamentoConcluido(true);
      } catch(e) {
          alert("Erro ao simular Mercado Pago: " + e.message);
      } finally {
          setSimulandoPagamento(false);
      }
  };

  if (pagamentoConcluido) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
            <CreditCard size={64} className="text-[var(--color-kora-green)] mx-auto mb-4" />
            <h2 className="font-logo text-3xl text-[var(--color-kora-blue)] mb-2">PAGAMENTO APROVADO!</h2>
            <p className="text-gray-600 mb-8">Essa tela aparecerá quando o Mercado Pago confirmar o seu PIX/Cartão.</p>
            <p className="text-sm border-t pt-4">Neste exato momento, o seu pedido foi transferido para a Aba da Logística no Painel Admin.</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
            <Receipt size={64} className="text-yellow-500 mx-auto mb-4 cursor-default animate-pulse" />
            <h2 className="font-logo text-3xl text-[var(--color-kora-blue)] mb-2">AGUARDANDO PAGAMENTO</h2>
            <p className="text-gray-600 mb-8">O seu pedido já está no sistema do lojista, mas a mercadoria só será despachada/encomendada após o acerto financeiro.</p>
            
            <div className="bg-blue-50 p-4 rounded-xl mb-8">
               <p className="text-sm font-bold text-[var(--color-kora-blue)] mb-2">Checkout Mercado Pago (Simulador)</p>
               <p className="text-xs text-blue-800">Use o botão abaixo para dizer ao nosso Banco de Dados que a compra foi quitada, para podermos testar a aba de "Pronta entrega".</p>
            </div>

            <button disabled={simulandoPagamento} onClick={simularPagamentoMercadoPago} className="w-full bg-[var(--color-kora-green)] hover:bg-[var(--color-kora-green-dark)] text-white disabled:opacity-50 font-bold py-4 rounded-xl shadow-lg transition-transform hover:-translate-y-1">
              {simulandoPagamento ? "Aprovando..." : "SIMULAR PAGAMENTO FEITO"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Form */}
          <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="font-logo text-3xl text-[var(--color-kora-blue)] mb-6">FINALIZAR COMPRA</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Data */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 border-b pb-2">Dados Pessoais (Criação de Conta)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required placeholder="Nome Completo" className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[var(--color-kora-green)] outline-none" onChange={e => setFormData({...formData, name: e.target.value})} />
                  <input required placeholder="CPF" className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[var(--color-kora-green)] outline-none" onChange={e => setFormData({...formData, cpf: e.target.value})} />
                  <input required type="email" placeholder="E-mail" className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[var(--color-kora-green)] outline-none" onChange={e => setFormData({...formData, email: e.target.value})} />
                  <input required placeholder="Telefone / WhatsApp" className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[var(--color-kora-green)] outline-none" onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 border-b pb-2">Endereço de Entrega</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input required placeholder="CEP" className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[var(--color-kora-green)] outline-none md:col-span-1" onChange={e => setFormData({...formData, cep: e.target.value})} />
                  <input required placeholder="Rua / Avenida" className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[var(--color-kora-green)] outline-none md:col-span-2" onChange={e => setFormData({...formData, address: e.target.value})} />
                  <input required placeholder="Número" className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[var(--color-kora-green)] outline-none" onChange={e => setFormData({...formData, number: e.target.value})} />
                  <input placeholder="Complemento" className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[var(--color-kora-green)] outline-none" onChange={e => setFormData({...formData, complement: e.target.value})} />
                  <input required placeholder="Bairro" className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[var(--color-kora-green)] outline-none" onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
                  <input required placeholder="Cidade" className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[var(--color-kora-green)] outline-none md:col-span-2" onChange={e => setFormData({...formData, city: e.target.value})} />
                  <input required placeholder="UF" className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[var(--color-kora-green)] outline-none" onChange={e => setFormData({...formData, state: e.target.value})} />
                </div>
              </div>

              <div className="pt-4">
                <button disabled={loading} type="submit" className="w-full bg-[var(--color-kora-green)] hover:bg-[var(--color-kora-green-dark)] disabled:opacity-50 text-white font-bold py-4 rounded-xl text-xl transition-all shadow-lg hover:shadow-xl">
                  {loading ? "Registrando Pedido..." : "Solicitar Conta"}
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 sticky top-24">
              <h3 className="font-logo text-2xl text-slate-800 mb-6">SEU PEDIDO</h3>
              {items.length === 0 ? (
                <p className="text-gray-500">Carrinho vazio.</p>
              ) : (
                <div className="space-y-4 mb-6">
                  {items.map(item => (
                    <div key={item.cartKey} className="flex justify-between items-start text-sm border-b border-slate-50 pb-2">
                      <div className="flex gap-2 items-start w-2/3">
                        <span className="font-bold text-[var(--color-kora-green)]">{item.quantity}x</span>
                        <div className="flex flex-col">
                            <span className="truncate">{item.name}</span>
                            <span className="text-xs text-slate-400">Tamanho: <strong className="text-slate-600">{item.selectedSize}</strong></span>
                            {item.orderType === 'Encomenda' && <span className="text-[10px] text-yellow-600 font-bold bg-yellow-50 px-2 py-0.5 mt-1 rounded-sm border border-yellow-100 w-max">25 a 30 dias</span>}
                        </div>
                      </div>
                      <span className="font-semibold text-slate-700 whitespace-nowrap">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="border-t border-gray-100 pt-4 flex justify-between items-center mb-6">
                <span className="font-bold text-slate-500">TOTAL</span>
                <span className="font-logo text-3xl text-[var(--color-kora-blue)]">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
