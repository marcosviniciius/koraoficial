"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc, addDoc, setDoc, serverTimestamp, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, TrendingUp, ShieldCheck, Tag, ShoppingBag, ArrowRight, X, Users, Briefcase, Lock, Star, RotateCcw, Ruler, ShoppingCart, Zap, Copy, Check, Share2, MessageCircle } from "lucide-react";
import { useImageModal } from "@/context/ImageModalContext";
import ProductGallery from "@/components/ProductGallery";
import { normalizeProductMedia } from "@/lib/productMedia";

export default function AppRevendedor() {
  const { id } = useParams();
  const router = useRouter();

  const [affiliate, setAffiliate] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Todas");

  // Dashboard States
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLogged, setIsLogged] = useState(false);
  const [affiliateOrders, setAffiliateOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);



   // Full Page Workflow
   const [selectedProduct, setSelectedProduct] = useState(null);
   const { openImage, openGallery } = useImageModal();
  
  // Billing States
  const [selectedSize, setSelectedSize] = useState("");
  const [sellingPrice, setSellingPrice] = useState("150");
  const [customerName, setCustomerName] = useState("");
  const [customerCpf, setCustomerCpf] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCep, setCustomerCep] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [customerComplement, setCustomerComplement] = useState("");
  const [customerNeighborhood, setCustomerNeighborhood] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerState, setCustomerState] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Security Gate
  const [isBillingUnlocked, setIsBillingUnlocked] = useState(false);
  const [billingPin, setBillingPin] = useState("");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [createdOrderData, setCreatedOrderData] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    async function loadApp() {
      try {
        const affDoc = await getDoc(doc(db, "affiliates", id));
        if (affDoc.exists()) {
          setAffiliate({ id: affDoc.id, ...affDoc.data() });
        } else {
          setLoading(false);
          return;
        }

        const prodSnap = await getDocs(collection(db, "products"));
        setProducts(prodSnap.docs.map((p) => normalizeProductMedia({ id: p.id, ...p.data() })));
      } catch (error) {
        console.error("Erro ao carregar app", error);
      }
      setLoading(false);
    }
    loadApp();
  }, [id]);

  const MIN_PRICE = 150;
  const isPriceInvalid = parseFloat(sellingPrice || "0") < MIN_PRICE;

  const handleOpenProduct = (p) => {
      setSelectedProduct(p);
      window.scrollTo(0,0);
      setSelectedSize("");
      setSellingPrice("150");
      setIsBillingUnlocked(false);
      setBillingPin("");
  };

  const handleBackToCatalog = () => {
      setSelectedProduct(null);
      window.scrollTo(0,0);
  };

  const handleCpfChange = async (e) => {
    let typedCpf = e.target.value.replace(/\D/g, '');
    setCustomerCpf(typedCpf);
    
    if (typedCpf.length === 11) {
      try {
        const clientDoc = await getDoc(doc(db, "clients", typedCpf));
        if (clientDoc.exists()) {
           const data = clientDoc.data();
           if(data.name) setCustomerName(data.name);
           if(data.phone) setCustomerPhone(data.phone);
           if(data.cep) setCustomerCep(data.cep);
           if(data.address) setCustomerAddress(data.address);
           if(data.number) setCustomerNumber(data.number);
           if(data.complement) setCustomerComplement(data.complement);
           if(data.neighborhood) setCustomerNeighborhood(data.neighborhood);
           if(data.city) setCustomerCity(data.city);
           if(data.state) setCustomerState(data.state);
        }
      } catch (error) {
        console.error("Erro ao buscar CPF", error);
      }
    }
  };

  const handleCreateSale = async (e) => {
    e.preventDefault();
    if (!selectedSize) return alert("Selecione um tamanho para a venda.");
    if (isPriceInvalid) return alert("O preço mínimo por peça é R$ 150,00.");
    
    setIsSubmitting(true);
    try {
       const lucro = parseFloat(sellingPrice) - MIN_PRICE;
       const orderData = {
          source: "Afiliado",
          affiliateId: affiliate.id,
          affiliateName: affiliate.name,
          type: selectedProduct?.stock?.[selectedSize] > 0 ? "Pronta Entrega" : "Encomenda",
          status: "Aguardando Pagamento do Cliente",
          createdAt: new Date(),
          basePrice: MIN_PRICE,
          commission: lucro,
          total: parseFloat(sellingPrice),
          items: [
             { ...selectedProduct, quantity: 1, selectedSize }
          ],
          client: {
             name: customerName,
             cpf: customerCpf,
             phone: customerPhone,
             cep: customerCep,
             address: customerAddress,
             number: customerNumber,
             complement: customerComplement,
             neighborhood: customerNeighborhood,
             city: customerCity,
             state: customerState
          }
       };

       const docRef = await addDoc(collection(db, "orders"), orderData);

       // Salvar/Atualizar dados do cliente na base central
       const cleanCpf = customerCpf.replace(/\D/g, '');
       if (cleanCpf.length === 11) {
           await setDoc(doc(db, "clients", cleanCpf), {
               ...orderData.client,
               cpf: cleanCpf,
               lastPurchase: serverTimestamp()
           }, { merge: true });
       }

       setCreatedOrderData({ id: docRef.id, total: parseFloat(sellingPrice), clientName: customerName, clientPhone: customerPhone });
       setIsSubmitting(false);
       
       // Limpar formulário para próxima venda
       setCustomerName(""); setCustomerCpf(""); setCustomerPhone(""); setCustomerCep("");
       setCustomerAddress(""); setCustomerNumber(""); setCustomerComplement("");
       setCustomerNeighborhood(""); setCustomerCity(""); setCustomerState("");
       setSelectedSize(""); setIsBillingUnlocked(false); setBillingPin("");
    } catch (e) {
       console.error(e);
       alert("Erro ao faturar pedido.");
       setIsSubmitting(false);
    }
  };

  const handleUnlockBilling = (e) => {
     e.preventDefault();
     if (billingPin === affiliate.password) {
         setIsBillingUnlocked(true);
         setTimeout(() => {
             document.getElementById('affiliate-checkout-form')?.scrollIntoView({ behavior: 'smooth' });
         }, 100);
     } else {
         alert("PIN de Revendedor incorreto. Verifique no seu painel gerencial.");
     }
  };

  const handleDashboardLogin = async (e) => {
     e.preventDefault();
     if(loginEmail === affiliate.email && loginPassword === affiliate.password) {
         setIsLogged(true);
         setShowLogin(false);
         setLoadingOrders(true);
         try {
             const q = query(collection(db, "orders"), where("affiliateId", "==", affiliate.id));
             const snap = await getDocs(q);
             setAffiliateOrders(snap.docs.map(d => ({id: d.id, ...d.data()})));
         } catch(error) { console.error(error); }
         setLoadingOrders(false);
     } else {
         alert("E-mail ou senha incorretos.");
     }
  };

  // -------------------------------------------------------------
  // LOADING / INVALID STATE
  // -------------------------------------------------------------
  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Carregando Acervo Premium...</div>;
  if (!affiliate) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-500 font-bold">Revendedor não encontrado. Link Inválido.</div>;

  const handleCopyLink = (orderId) => {
    const url = `${window.location.origin}/pagamento/${orderId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(orderId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // -------------------------------------------------------------
  // VIEW: SUCCESS ORDER SHARE
  // -------------------------------------------------------------
  if (createdOrderData) {
      const paymentUrl = `${window.location.origin}/pagamento/${createdOrderData.id}`;
      const waMessage = encodeURIComponent(`Olá ${createdOrderData.clientName.split(' ')[0]}! Aqui está o link para o pagamento da sua camisa Kora: ${paymentUrl}`);
      const waLink = `https://wa.me/55${createdOrderData.clientPhone.replace(/\D/g, '')}?text=${waMessage}`;

      return (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
              <div className="bg-surface -900 rounded-[2.5rem] p-8 md:p-12 max-w-lg w-full text-center shadow-2xl animate-in zoom-in duration-500 border border-border-dim">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <ShieldCheck size={40} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 mb-2">Pedido Faturado!</h2>
                  <p className="text-slate-500 mb-8 px-4 text-sm">O pedido foi registrado no sistema. Agora escolha como deseja enviar a fatura para o cliente:</p>

                  <div className="space-y-4">
                      {/* Cópia de Link */}
                      <button 
                        onClick={() => handleCopyLink(createdOrderData.id)}
                        className="w-full p-5 rounded-2xl border-2 border-slate-100 hover:border-purple-500 hover:bg-purple-50 flex items-center justify-between transition-all group"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                {copiedId === createdOrderData.id ? <Check size={20}/> : <Copy size={20}/>}
                            </div>
                            <span className="font-bold text-slate-700">Copiar Link de Pagamento</span>
                         </div>
                         {copiedId === createdOrderData.id && <span className="text-[10px] bg-purple-600 text-white px-2 py-1 rounded font-bold uppercase">Copiado!</span>}
                      </button>

                      {/* Enviar WhatsApp */}
                      <a 
                        href={waLink} target="_blank" rel="noopener noreferrer"
                        className="w-full p-5 rounded-2xl bg-[#25D366] hover:bg-[#1DA851] text-white flex items-center justify-between transition-all shadow-lg hover:shadow-[#25D366]/30"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-surface/20 rounded-xl flex items-center justify-center">
                                <MessageCircle size={20}/>
                            </div>
                            <span className="font-bold">Enviar pelo WhatsApp</span>
                         </div>
                         <ArrowRight size={20}/>
                      </a>
                  </div>

                  <div className="mt-12 flex flex-col gap-3">
                      <button 
                         onClick={() => setCreatedOrderData(null)}
                         className="text-slate-500 font-bold text-sm hover:text-main transition py-2"
                      >
                         Fazer novo pedido
                      </button>
                      <button 
                         onClick={() => { setCreatedOrderData(null); setSelectedProduct(null); }}
                         className="bg-background text-slate-400 hover:bg-slate-100 hover:text-dim font-bold p-4 rounded-xl transition-all"
                      >
                         Voltar ao Catálogo
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // -------------------------------------------------------------
  // VIEW: FULL PAGE PRODUCT DETAILS

  if (selectedProduct) {
      const similarProducts = products.filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id).slice(0, 4);
      return (
          <div className="min-h-screen bg-background pb-20 font-sans animate-in fade-in duration-300">
             
             {/* Product Header */}
             <div className="sticky top-0 z-50 bg-surface border-b border-border-dim p-4 shadow-sm flex items-center gap-4">
                 <button onClick={handleBackToCatalog} className="bg-slate-100 hover:bg-slate-200 p-3 rounded-full transition text-main">
                     <ChevronLeft size={20} />
                 </button>
                 <h2 className="font-bold text-main text-lg truncate flex-1">{selectedProduct.name}</h2>
             </div>

             <div className="max-w-5xl mx-auto px-4 py-8">
                 
                 <div className="flex flex-col md:flex-row gap-6 lg:gap-8 bg-surface -900 p-4 md:p-6 rounded-lg shadow-sm mb-12 border border-border-dim">
                     
                     {/* Coluna Esquerda: Imagem + Detalhes (Desktop) */}
                     <div className="w-full md:w-[65%] flex flex-col order-1 md:order-1">
                         <ProductGallery key={selectedProduct.id} product={selectedProduct} onOpenImage={openGallery} />

                         {/* Descrição Desktop */}
                         <div className="hidden md:block mt-8 border-t border-border-dim pt-8 pb-4 px-4">
                             <h3 className="text-xl font-bold text-main mb-6 font-logo uppercase tracking-tight">Qualidade e Detalhes Técnicos</h3>
                             <ul className="list-disc pl-5 space-y-3 text-sm text-dim">
                                 <li>Camisa importada padrão 1:1 Tailandesa Premium (A melhor do mercado).</li>
                                 <li>Escudos, logos e patrocínios em bordado ou silk de alta definição emborrachado.</li>
                                 <li>Tecido DryFit Ultra com tecnologia de respirabilidade térmica avançada.</li>
                                 <li>Acabamento reforçado nas costuras e golas com padrão de jogo.</li>
                                 <li>Acompanha tags originais da marca e embalagem plástica padronizada.</li>
                                 <li className="font-bold text-[var(--color-kora-blue)]">Garantia Kora B2B: Envio invisível e seguro para seu cliente.</li>
                             </ul>
                         </div>

                         {/* Foto da Tabela Desktop */}
                         {selectedProduct.sizeChartUrl && (
                            <div className="hidden md:block mt-4 px-4 pb-8">
                               <h3 className="text-xl font-bold text-main mb-6 font-logo uppercase tracking-tight">Guia de Medidas (Referência)</h3>
                               <img
                                   src={selectedProduct.sizeChartUrl}
                                   alt="Tabela de Medidas"
                                   className="w-full max-w-xl rounded-lg border border-border-dim shadow-sm cursor-zoom-in hover:opacity-95 transition-opacity"
                                    onClick={() => openImage(selectedProduct.sizeChartUrl, "Guia de Tamanhos")}
                                />
                            </div>
                         )}
                     </div>

                     {/* Coluna Direita: Buybox Info */}
                     <div className="w-full md:w-[35%] flex flex-col order-2 md:order-2">
                         <div className="border border-border-dim bg-surface -900 rounded-[8px] p-6 lg:sticky lg:top-24">
                             <div className="flex items-center gap-2 mb-4 bg-purple-50 -900/20 text-purple-700 -400 font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg w-fit">
                                 <Tag size={12}/> SKU: {selectedProduct.id.slice(0, 5).toUpperCase()}
                             </div>
                             <h1 className="text-2xl md:text-3xl font-bold text-main mb-4 leading-tight">{selectedProduct.name}</h1>

                             <div className="mb-6 pt-6 border-t border-border-dim">
                                <p className="text-sm text-slate-500 mb-4">Escolha o tamanho para conferir a disponibilidade real em estoque:</p>
                                <div className="flex flex-wrap gap-2">
                                    {['P', 'M', 'G', 'GG', 'XG', 'XGG', 'XGGG'].map(size => {
                                        const stock = selectedProduct.stock?.[size] || 0;
                                        const isSelected = selectedSize === size;
                                        return (
                                          <button 
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`relative px-4 py-2 rounded-md border text-sm font-bold transition-all min-w-[2.5rem] ${
                                                isSelected 
                                                ? 'border-purple-600 bg-purple-50 text-purple-600' 
                                                : 'border-slate-300 text-main hover:border-slate-400 bg-surface'
                                            }`}
                                          >
                                            {size}
                                          </button>
                                        )
                                    })}
                                </div>
                                {selectedSize && (
                                    <div className="mt-4 p-3 rounded-lg border flex items-center gap-2">
                                        {selectedProduct.stock?.[selectedSize] > 0 ? (
                                           <><Zap className="text-emerald-500 fill-emerald-500" size={16}/> <span className="text-xs font-bold text-emerald-600 uppercase">PRONTA ENTREGA (ENVIO EM 24H)</span></>
                                        ) : (
                                           <><RotateCcw className="text-amber-500" size={16}/> <span className="text-xs font-bold text-amber-600 uppercase">ENCOMENDA (25 A 30 DIAS)</span></>
                                        )}
                                    </div>
                                )}
                             </div>

                             <div className="mt-4 flex flex-col gap-2">
                                  <a 
                                     href="#faturar"
                                     className="w-full py-4 rounded-xl text-lg font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg flex items-center justify-center gap-2 transition-all"
                                  >
                                     Faturar agora <ArrowRight size={20}/>
                                  </a>
                                  
                                  <div className="mt-4 text-xs font-bold text-slate-500 flex items-center justify-center gap-1">
                                     <ShieldCheck size={14} className="text-emerald-500"/> Garantia de Entrega Kora B2B
                                  </div>
                              </div>
                         </div>

                         {/* Mobile Details */}
                         <div className="md:hidden mt-10 border-t border-border-dim pt-8 pb-4">
                             <h3 className="text-xl font-bold text-main mb-6">Informações Técnicas</h3>
                             <ul className="list-disc pl-5 space-y-3 text-sm text-dim">
                                 <li>Qualidade Thai Premium 1:1</li>
                                 <li>Tecnologia DryFit Ultra</li>
                                 <li>Escudos e Patrocínios Oficiais</li>
                                 <li>Garantia contra defeito de fábrica</li>
                             </ul>
                         </div>

                         {selectedProduct.sizeChartUrl && (
                            <div className="md:hidden mt-6 pb-4 border-t border-slate-100 pt-6">
                               <h3 className="text-xl font-bold text-main mb-6">Guia de Tamanhos</h3>
                               <img
                                   src={selectedProduct.sizeChartUrl}
                                   alt="Tabela de Medidas"
                                   className="w-full rounded-lg border border-border-dim shadow-sm cursor-zoom-in"
                                    onClick={() => openImage(selectedProduct.sizeChartUrl, "Guia de Tamanhos")}
                                />
                            </div>
                         )}
                     </div>
                 </div>

                 {/* Recomendados */}
                 {similarProducts.length > 0 && (
                     <div className="mt-16 border-t border-border-dim pt-12">
                         <h3 className="text-2xl font-bold text-main mb-8 border-l-4 border-purple-600 pl-4 font-logo uppercase">Quem viu esta camisa também comprou</h3>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                            {similarProducts.map((p) => (
                              <div key={p.id} onClick={() => { setSelectedProduct(null); setTimeout(() => setSelectedProduct(p), 50); window.scrollTo(0, 0); }} className="group cursor-pointer bg-surface rounded-2xl overflow-hidden shadow-sm border border-slate-100 transition-all hover:shadow-xl flex flex-col hover:-translate-y-1">
                                  <div className="relative w-full pt-[100%] bg-slate-100">
                                     {p.imageUrl ? (
                                        <img src={p.imageUrl} alt={p.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                     ) : (
                                        <div className="absolute inset-0 flex items-center justify-center font-logo text-slate-300 text-2xl">KORA</div>
                                     )}
                                  </div>
                                  <div className="p-4 border-t border-slate-50">
                                     <h4 className="font-bold text-slate-700 text-sm mb-2 leading-tight group-hover:text-purple-600 transition-colors uppercase">{p.name}</h4>
                                     <div className="flex items-center gap-1.5 bg-background text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2 py-1 rounded w-fit mt-2">
                                        <Tag size={10}/> {p.category}
                                     </div>
                                  </div>
                              </div>
                            ))}
                         </div>
                     </div>
                 )}

                 {/* SEÇíO DE FATURAMENTO (AQUÉM DE TUDO) */}
                 <div className="mt-20 pt-20 border-t border-dashed border-border-dim" id="faturar">
                    <div className="text-center mb-12">
                        <span className="inline-block py-1.5 px-4 rounded-full bg-slate-900  text-white font-bold text-[10px] uppercase tracking-[0.2em] mb-4">
                           Fluxo de Venda Final
                        </span>
                        <h2 className="text-4xl font-black text-main tracking-tight uppercase">Faturar Pedido</h2>
                        <p className="text-dim mt-3 max-w-md mx-auto">Insira seu PIN para liberar a precificação do cliente e gerar o link de pagamento.</p>
                    </div>

                    {!isBillingUnlocked ? (
                         <div className="max-w-md mx-auto bg-surface -900 p-10 rounded-[2rem] shadow-xl border border-border-dim text-center animate-in fade-in zoom-in duration-500">
                             <div className="w-20 h-20 bg-surface-hover -800 border border-border-dim rounded-3xl flex items-center justify-center mx-auto mb-8 text-main shadow-inner">
                                 <Lock size={32} />
                             </div>
                             
                             <form onSubmit={handleUnlockBilling} className="space-y-6">
                                 <div className="space-y-2">
                                     <label className="text-[10px] font-bold text-dim uppercase tracking-widest">Sua Senha de Acesso</label>
                                     <input 
                                         required type="password" placeholder="••••" value={billingPin} onChange={e=>setBillingPin(e.target.value)}
                                         className="w-full p-5 bg-surface-hover -800 border border-border-dim rounded-2xl font-black text-center text-3xl tracking-[0.5em] focus:border-purple-500 dark:focus:border-purple-400 focus:bg-surface outline-none transition-all text-main" 
                                     />
                                 </div>
                                 <button type="submit" className="w-full bg-slate-900  text-white font-bold p-5 rounded-2xl flex justify-center items-center gap-3 hover:bg-slate-800 transition active:scale-95 shadow-xl">
                                     Desbloquear Faturamento <ArrowRight size={20}/>
                                 </button>
                             </form>
                         </div>
                      ) : (
                         <form id="affiliate-checkout-form" onSubmit={handleCreateSale} className="max-w-4xl mx-auto bg-surface -900 p-6 md:p-12 rounded-[2.5rem] border border-border-dim space-y-12 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                            
                            <div className="flex items-center gap-4 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                                <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg active:animate-bounce">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Autenticação Concluída</p>
                                    <p className="text-sm font-bold text-main">Liberado por {affiliate.name.split(' ')[0]}</p>
                                </div>
                            </div>

                            {/* Passo 1: Tamanho Confirmado */}
                            <section>
                               <h3 className="text-sm font-bold text-main uppercase tracking-widest mb-6 flex items-center gap-3">
                                   <span className="bg-purple-600 text-white w-7 h-7 flex items-center justify-center rounded-xl text-xs shadow-md">1</span> 
                                   Tamanho Desejado
                               </h3>
                               <div className="flex flex-wrap gap-3">
                                  {['P', 'M', 'G', 'GG', 'XG', 'XGG', 'XGGG'].map(size => {
                                      const amnt = selectedProduct.stock?.[size] || 0;
                                      const isAvail = amnt > 0;
                                      return (
                                        <button 
                                          key={size} type="button" onClick={() => setSelectedSize(size)}
                                          className={`flex flex-col items-center justify-center h-20 w-24 rounded-2xl border-2 transition-all ${selectedSize === size ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-md transform -translate-y-1' : 'border-slate-100 hover:border-border-dim text-slate-400 bg-surface'}`}
                                        >
                                           <span className="font-black text-xl">{size}</span>
                                           <span className={`text-[9px] uppercase font-bold tracking-widest ${isAvail ? 'text-emerald-500' : 'text-amber-500'}`}>
                                              {isAvail ? `Pronta` : 'Prazo'}
                                           </span>
                                        </button>
                                      )
                                  })}
                               </div>
                               {!selectedSize && <p className="text-[10px] text-red-500 font-bold mt-4 animate-pulse uppercase tracking-widest">* Selecione acima para continuar.</p>}
                            </section>

                            {/* Passo 2: Precificação */}
                            <section>
                               <h3 className="text-sm font-bold text-main uppercase tracking-widest mb-6 flex items-center gap-3">
                                   <span className="bg-purple-600 text-white w-7 h-7 flex items-center justify-center rounded-xl text-xs shadow-md">2</span> 
                                   Preço Final da Venda
                               </h3>
                               
                               <div className={`p-8 rounded-3xl border-2 transition-all bg-background/50 ${isPriceInvalid ? 'border-red-400 bg-red-50/10' : 'border-indigo-100 focus-within:border-purple-500 focus-within:bg-surface'}`}>
                                   <div className="flex items-center">
                                      <span className={`text-3xl font-black mr-3 ${isPriceInvalid ? 'text-red-400' : 'text-purple-400'}`}>R$</span>
                                      <input 
                                        type="number" step="0.01" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)}
                                        className={`w-full text-6xl font-black bg-transparent outline-none py-2 ${isPriceInvalid ? 'text-red-600' : 'text-slate-900'}`}
                                      />
                                   </div>
                                   {isPriceInvalid && (
                                       <div className="mt-4 bg-red-50 p-4 rounded-2xl border border-red-200 flex items-center gap-3">
                                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"/>
                                          <p className="text-red-600 font-bold text-xs uppercase tracking-tight">O valor mínimo aceito pelo sistema Kora é R$ 150,00.</p>
                                       </div>
                                   )}
                               </div>
                            </section>

                            {/* Passo 3: Dados Cliente */}
                            <section>
                               <h3 className="text-sm font-bold text-main uppercase tracking-widest mb-6 flex items-center gap-3">
                                   <span className="bg-purple-600 text-white w-7 h-7 flex items-center justify-center rounded-xl text-xs shadow-md">3</span> 
                                   Dados do Cliente Final
                               </h3>
                               <div className="grid grid-cols-1 gap-5">
                                  <input required type="text" placeholder="Nome Completo" value={customerName} onChange={e=>setCustomerName(e.target.value)} className="w-full p-5 bg-background border border-slate-100 rounded-2xl font-bold focus:border-purple-500 focus:bg-surface outline-none transition-all shadow-sm" />
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                      <input required type="text" placeholder="CPF (Apenas números)" value={customerCpf} onChange={handleCpfChange} className="w-full p-5 bg-background border border-slate-100 rounded-2xl font-bold focus:border-purple-500 focus:bg-surface outline-none transition-all shadow-sm" />
                                      <input required type="text" placeholder="WhatsApp" value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} className="w-full p-5 bg-background border border-slate-100 rounded-2xl font-bold focus:border-purple-500 focus:bg-surface outline-none transition-all shadow-sm" />
                                  </div>
                                  
                                  <div className="bg-background p-6 rounded-[2rem] border border-slate-100 mt-4">
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 text-center">Destinatário & Logística</p>
                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                                         <input required type="text" placeholder="CEP" value={customerCep} onChange={e=>setCustomerCep(e.target.value)} className="w-full p-5 bg-surface border border-slate-100 rounded-2xl font-bold focus:border-purple-500 outline-none shadow-sm" />
                                         <input required type="text" placeholder="Rua / Avenida" value={customerAddress} onChange={e=>setCustomerAddress(e.target.value)} className="md:col-span-2 w-full p-5 bg-surface border border-slate-100 rounded-2xl font-bold focus:border-purple-500 outline-none shadow-sm" />
                                     </div>
                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                                         <input required type="text" placeholder="Nº" value={customerNumber} onChange={e=>setCustomerNumber(e.target.value)} className="w-full p-5 bg-surface border border-slate-100 rounded-2xl font-bold focus:border-purple-500 outline-none shadow-sm" />
                                         <input required type="text" placeholder="Cidade / Bairro" value={customerNeighborhood} onChange={e=>setCustomerNeighborhood(e.target.value)} className="md:col-span-2 w-full p-5 bg-surface border border-slate-100 rounded-2xl font-bold focus:border-purple-500 outline-none shadow-sm" />
                                     </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                         <input type="text" placeholder="Complemento" value={customerComplement} onChange={e=>setCustomerComplement(e.target.value)} className="w-full p-5 bg-surface border border-slate-100 rounded-2xl font-bold focus:border-purple-500 outline-none shadow-sm" />
                                         <input required type="text" placeholder="Estado (Ex: SP)" value={customerState} onChange={e=>setCustomerState(e.target.value)} className="w-full p-5 bg-surface border border-slate-100 rounded-2xl font-bold focus:border-purple-500 outline-none shadow-sm" />
                                     </div>
                                  </div>
                               </div>
                            </section>

                            {/* Submit */}
                            <div className="pt-8">
                                <button 
                                   type="submit" disabled={isSubmitting || !selectedSize || isPriceInvalid}
                                   className={`w-full text-white font-bold p-8 rounded-3xl flex justify-between items-center text-xl transition-all shadow-2xl ${isPriceInvalid || !selectedSize || isSubmitting ? 'bg-slate-300 shadow-none cursor-not-allowed opacity-50' : 'bg-slate-900 hover:bg-black hover:-translate-y-1 active:scale-95'}`}
                                 >
                                   {isSubmitting ? 'Gerando Fatura...' : 'Gerar Pedido e Link de Pagamento'} 
                                   <ShoppingCart size={28}/>
                                </button>
                                <p className="text-center text-[10px] text-slate-400 font-bold mt-6 uppercase tracking-widest">O link será gerado após clicar no botão acima.</p>
                            </div>

                         </form>
                      )}
                    </div>
                 </div>
            </div>
      );
  }

  // -------------------------------------------------------------
  // VIEW: MAIN CATALOG GRID
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-background pb-20 font-sans">
      
      {/* Header Afiliado */}
      <header className="bg-slate-900 text-white px-3 py-4 sticky top-0 z-10 shadow-lg md:px-6 md:py-6">
         <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">PORTAL DE PARCEIRO B2B</p>
              <h1 className="text-lg md:text-xl font-bold mt-1 text-slate-100">{affiliate.name}</h1>
            </div>
            <div className="flex items-center gap-2">
               {/* Re-using theme logic here if needed, but the main Navbar handles it */}
               <button onClick={() => setShowLogin(true)} className="bg-slate-800 p-2.5 md:p-3 rounded-full border border-slate-700 hover:bg-slate-700 transition active:scale-95 cursor-pointer">
                  <TrendingUp className="text-purple-400" size={18} />
               </button>
            </div>
         </div>
      </header>

      {/* Grid Catálogo */}
      <main className="max-w-6xl mx-auto px-3 py-4 md:p-8 md:mt-4">
         <h2 className="text-[2rem] leading-[0.95] md:text-3xl font-bold text-main mb-5 md:mb-6 font-logo">ACERVO KORA IMPORTADOS</h2>
         
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 mb-6 md:mb-8">
             {/* Categories Navigation */}
             <div className="flex overflow-x-auto hide-scrollbar gap-2.5 pb-2 flex-1">
                {["Todas", ...new Set(products.map(p => p.category || "Outras Ligas"))].map(cat => (
                   <button 
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-full font-bold text-xs md:text-sm transition-all border ${
                         activeCategory === cat 
                            ? 'bg-purple-600 text-white border-purple-600 shadow-md transform scale-105' 
                            : 'bg-surface text-dim border-border-dim hover:bg-background'
                      }`}
                   >
                      {cat}
                   </button>
                ))}
             </div>

             {/* Stock Filter Toggle */}
             <button 
                onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
                className={`w-full md:w-auto justify-center md:justify-start flex items-center gap-2 px-4 py-3 md:px-6 md:py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all border-2 shadow-sm active:scale-95 ${
                    showOnlyAvailable 
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-100' 
                    : 'bg-surface text-slate-500 border-slate-100 hover:border-border-dim'
                }`}
             >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${showOnlyAvailable ? 'border-white bg-surface' : 'border-border-dim bg-transparent'}`}>
                    {showOnlyAvailable && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </div>
                {showOnlyAvailable ? 'Apenas Pronta Entrega' : 'Mostrar Tudo (Acervo)'}
             </button>
          </div>

         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8">
            {products
               .filter(p => {
                    const totalStock = Object.values(p.stock || {}).reduce((s, a) => s + a, 0);
                    const stockMatch = showOnlyAvailable ? totalStock > 0 : true;
                    const categoryMatch = activeCategory === "Todas" || (p.category || "Outras Ligas") === activeCategory;
                    return stockMatch && categoryMatch;
                })
               .map(product => {
                const totalStock = Object.values(product.stock || {}).reduce((s, a) => s + a, 0);
                const hasStock = totalStock > 0;

                return (
                  <div key={product.id} onClick={() => handleOpenProduct(product)} className="bg-surface -900 rounded-[1.5rem] md:rounded-3xl overflow-hidden shadow-sm border border-border-dim hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col">
                     <div className="relative w-full pt-[100%] bg-surface-hover">
                        {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center font-logo text-slate-300 text-3xl">KORA</div>
                        )}
                        <div className="absolute top-2 left-2 md:top-3 md:left-3">
                            <span className={`px-2.5 py-1 text-[9px] md:text-xs font-bold rounded-lg uppercase tracking-[0.18em] backdrop-blur-md shadow-lg ${hasStock ? 'bg-black/80 text-white' : 'bg-surface/90 text-main'}`}>
                                {hasStock ? 'Pronta Entrega' : 'Longo Prazo'}
                            </span>
                        </div>
                     </div>
                     <div className="p-3 md:p-5 flex-1 flex flex-col justify-between">
                         <h3 className="font-bold text-[0.95rem] md:text-base text-main leading-[1.05] md:leading-tight group-hover:text-purple-600 transition-colors uppercase break-words">{product.name}</h3>
                         <div className="text-[9px] md:text-[10px] text-dim mt-2 flex items-center gap-1 font-bold uppercase tracking-[0.16em]"><Tag size={11}/> Thai Premium 1:1</div>
                     </div>
                  </div>
                )
            })}
         </div>
      </main>

       {/* Login Modal */}
       {showLogin && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-surface rounded-3xl p-8 w-full max-w-sm shadow-2xl relative">
               <button onClick={() => setShowLogin(false)} className="absolute top-4 right-4 text-slate-400 hover:text-main p-2"><X size={20}/></button>
               <div className="mb-6 text-center">
                  <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"><Lock size={32}/></div>
                  <h3 className="text-xl font-bold text-main">Acesso Restrito</h3>
                  <p className="text-sm text-slate-500 mt-1">Insira suas credenciais gerenciais B2B.</p>
               </div>
               
               <form onSubmit={handleDashboardLogin} className="space-y-4">
                  <div>
                     <label className="text-xs font-bold text-dim uppercase tracking-widest">E-mail</label>
                     <input required type="email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} className="w-full mt-1 p-4 bg-background border border-border-dim rounded-xl outline-none focus:border-purple-500 transition font-medium text-main" placeholder="Seu e-mail de acesso"/>
                  </div>
                  <div>
                     <label className="text-xs font-bold text-dim uppercase tracking-widest">Senha PIN</label>
                     <input required type="password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} className="w-full mt-1 p-4 bg-background border border-border-dim rounded-xl outline-none focus:border-purple-500 transition font-medium text-main" placeholder="Sua senha"/>
                  </div>
                  <button type="submit" className="w-full mt-2 p-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-transform active:scale-95 text-lg">
                     Acessar Meu Painel
                  </button>
               </form>
            </div>
         </div>
       )}

       {/* Dashboard Modal */}
       {isLogged && (
         <div className="fixed inset-0 z-[100] flex justify-end">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsLogged(false)} />
             <div className="relative w-full max-w-2xl h-full bg-background shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                 
                 <div className="flex items-center justify-between p-6 border-b border-indigo-100 bg-surface">
                     <div>
                         <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest"><TrendingUp size={12} className="inline mr-1"/> DASHBOARD B2B KORA</p>
                         <h2 className="font-bold text-2xl text-main leading-tight mt-1">{affiliate.name}</h2>
                     </div>
                     <button onClick={() => setIsLogged(false)} className="text-slate-400 hover:text-slate-900 transition p-2 bg-slate-100 rounded-full shadow-sm font-bold flex items-center gap-2 text-xs uppercase px-4"><X size={16} /> Fechar Painel</button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loadingOrders ? (
                       <p className="text-center text-slate-500 p-8 font-bold">Sincronizando faturamento...</p>
                    ) : (
                       <>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                                 <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Sua Comissão Concluída</p>
                                 <p className="text-2xl font-black text-emerald-800 mt-1">R$ {affiliateOrders.filter(o => o.status === "Pago" || o.status === "Concluído" || o.status === "Finalizado").reduce((a, b) => a + (b.commission || 0), 0).toFixed(2).replace('.', ',')}</p>
                                 <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase">Saldo Final</p>
                              </div>
                              <div className="bg-surface p-5 rounded-2xl shadow-sm border border-slate-100">
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">A Receber</p>
                                 <p className="text-2xl font-black text-amber-600 mt-1">R$ {affiliateOrders.filter(o => o.status === "Aguardando Pagamento do Cliente" || o.status === "Aguardando Pagamento").reduce((a, b) => a + (b.commission || 0), 0).toFixed(2).replace('.', ',')}</p>
                                 <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Boletos/Pix pendentes</p>
                              </div>
                          </div>

                          {/* Lista de Carrinhos (Cobrança Zap) */}
                          <div>
                              <h3 className="font-bold text-main mb-4 flex items-center gap-2 border-b border-border-dim pb-2"><Users size={18}/> Funil de Cobrança (Faturas Pendentes)</h3>
                              <div className="space-y-3">
                                  {affiliateOrders.filter(o => o.status === "Aguardando Pagamento do Cliente" || o.status === "Aguardando Pagamento").map((order) => (
                                      <div key={order.id} className="bg-surface p-4 rounded-xl shadow-sm border border-amber-100 flex items-center justify-between">
                                         <div>
                                            <p className="font-bold text-sm text-main">{order.client.name}</p>
                                            <p className="text-xs font-mono text-slate-400 mt-0.5">Venda de R$ {order.total?.toFixed(2).replace('.', ',')}</p>
                                         </div>
                                          <div className="flex gap-2">
                                             <button 
                                                onClick={() => handleCopyLink(order.id)}
                                                className={`p-2 rounded-lg transition border ${copiedId === order.id ? 'bg-purple-600 border-purple-600 text-white' : 'bg-background border-slate-100 text-slate-400 hover:text-purple-600 hover:border-purple-200'}`}
                                                title="Copiar Link de Pagamento"
                                             >
                                                {copiedId === order.id ? <Check size={16}/> : <Copy size={16}/>}
                                             </button>
                                             <a 
                                                href={`https://wa.me/55${order.client.phone?.replace(/\D/g, '')}?text=Oi ${order.client.name.split(' ')[0]}! Aqui está o link para o pagamento da sua camisa Kora: ${window.location.origin}/pagamento/${order.id}`}
                                                target="_blank" rel="noopener noreferrer"
                                                className="text-white bg-[#25D366] hover:bg-[#1DA851] text-xs font-bold uppercase tracking-widest py-2 px-4 rounded-lg shadow-sm transition flex items-center gap-2"
                                             >
                                                <MessageCircle size={14}/> Cobrar
                                             </a>
                                          </div>
                                      </div>
                                  ))}
                                  {affiliateOrders.filter(o => o.status === "Aguardando Pagamento do Cliente" || o.status === "Aguardando Pagamento").length === 0 && (
                                      <p className="text-sm text-slate-500 italic p-4 text-center bg-surface rounded-xl border border-dashed border-border-dim">Nenhum cliente para ser cobrado hoje.</p>
                                  )}
                              </div>
                          </div>

                          {/* Histórico Geral */}
                          <div>
                              <h3 className="font-bold text-main mb-4 flex items-center gap-2 border-b border-border-dim pb-2"><Briefcase size={18}/> Faturas Geradas (Suas Vendas)</h3>
                              <div className="space-y-3">
                                  {affiliateOrders.map((order) => (
                                      <div key={order.id} className="bg-surface p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2">
                                         <div className="flex justify-between items-start">
                                            <p className="font-bold text-sm text-main truncate pr-4">{order.client.name}</p>
                                            <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded w-fit capitalize ${order.status.includes('Pago') || order.status.includes('Concluído') || order.status.includes('Finalizado') ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                               {order.status}
                                            </span>
                                         </div>
                                         <div className="flex justify-between items-end border-t border-slate-50 pt-2">
                                            <div>
                                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Minha Comissão</p>
                                               <p className={`text-sm font-black ${order.status.includes('Pago') || order.status.includes('Concluído') || order.status.includes('Finalizado') ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                   R$ {order.commission?.toFixed(2).replace('.', ',')}
                                               </p>
                                            </div>
                                         </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                       </>
                    )}
                 </div>
             </div>
         </div>
       )}
         {/* Image modal is mounted globally via ImageModalProvider in layout.js */}
    </div>
  );
}
