"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, TrendingUp, ShieldCheck, Tag, ShoppingBag, ArrowRight } from "lucide-react";

export default function AppRevendedor() {
  const { id } = useParams();
  const router = useRouter();

  const [affiliate, setAffiliate] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Todas");

  // Full Page Workflow
  const [selectedProduct, setSelectedProduct] = useState(null);
  
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
        setProducts(prodSnap.docs.map(p => ({ id: p.id, ...p.data() })));
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
  };

  const handleBackToCatalog = () => {
      setSelectedProduct(null);
      window.scrollTo(0,0);
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
       alert("Pedido faturado com sucesso! Redirecionando para a fatura do cliente...");
       router.push(`/pagamento/${docRef.id}`);
       setIsSubmitting(false);
    } catch (e) {
       console.error(e);
       alert("Erro ao faturar pedido.");
       setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // LOADING / INVALID STATE
  // -------------------------------------------------------------
  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Carregando Acervo Premium...</div>;
  if (!affiliate) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-500 font-bold">Revendedor não encontrado. Link Inválido.</div>;

  // -------------------------------------------------------------
  // VIEW: FULL PAGE PRODUCT DETAILS
  // -------------------------------------------------------------
  if (selectedProduct) {
      return (
          <div className="min-h-screen bg-white pb-20 font-sans animate-in fade-in slide-in-from-right-8 duration-300">
             
             {/* Product Navbar */}
             <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-100 p-4 shadow-sm flex items-center gap-4">
                 <button onClick={handleBackToCatalog} className="bg-slate-100 hover:bg-slate-200 p-3 rounded-full transition text-slate-800">
                     <ChevronLeft size={20} />
                 </button>
                 <h2 className="font-bold text-slate-800 text-lg truncate flex-1">{selectedProduct.name}</h2>
             </div>

             <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
                 
                 {/* Product Main Presentation */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 mb-12">
                     <div className="bg-slate-100 rounded-3xl overflow-hidden shadow-sm aspect-square relative">
                        {selectedProduct.imageUrl ? (
                            <img src={selectedProduct.imageUrl} className="w-full h-full object-cover" alt="Galeria"/>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-logo text-slate-300 text-6xl">KORA</div>
                        )}
                        <span className="absolute top-4 left-4 bg-white px-3 py-1 text-xs font-bold rounded-lg shadow-sm">
                            SKU: {selectedProduct.id.slice(0, 5).toUpperCase()}
                        </span>
                     </div>
                     
                     <div className="flex flex-col justify-center">
                         <div className="flex items-center gap-2 mb-4 bg-purple-50 text-purple-700 font-bold text-xs uppercase tracking-widest px-3 py-1.5 rounded-lg w-fit">
                             <Tag size={14}/> Qualidade Thai Premium
                         </div>
                         <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-[1.1]">
                             {selectedProduct.name}
                         </h1>
                         <p className="text-slate-600 md:text-lg mb-8 leading-relaxed">
                             Tecido de alta performance esportiva (DryFit Ultra). Escudo e patrocínios perfeitamente alinhados na mesma tecnologia usada pelos clubes nas temporadas originais. Costura reforçada com respirabilidade.
                         </p>

                         <div className="space-y-4">
                             <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                 <ShieldCheck className="text-emerald-500" size={28}/>
                                 <div>
                                     <p className="text-sm font-bold text-slate-800">Garantia Kora B2B</p>
                                     <p className="text-xs text-slate-500 mt-1">Sua venda garantida com envio invisível (Dropshipping). Seu cliente recebe intacto.</p>
                                 </div>
                             </div>
                         </div>
                         
                         <a href="#faturar" className="mt-8 bg-slate-900 text-white font-bold p-5 rounded-2xl flex justify-between items-center transition shadow-xl hover:shadow-2xl hover:bg-slate-800">
                             Faturar este Produto <ShoppingBag size={20}/>
                         </a>
                     </div>
                 </div>

                 {/* Divider */}
                 <div className="w-full border-t border-slate-200 mt-16 pt-16" id="faturar">
                     <div className="text-center mb-12">
                        <h2 className="text-3xl font-black text-slate-900">Finalizar Fatura</h2>
                        <p className="text-slate-500 mt-2">Dite os valores e gere o link para seu cliente.</p>
                     </div>

                     <form id="affiliate-checkout-form" onSubmit={handleCreateSale} className="bg-slate-50 p-6 md:p-12 rounded-3xl border border-slate-200 space-y-12 shadow-sm">
                        
                        {/* Passo 1: Tamanho */}
                        <section>
                           <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                               <span className="bg-slate-900 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span> 
                               Tamanhos Disponíveis
                           </h3>
                           <div className="flex flex-wrap gap-4">
                              {['P', 'M', 'G', 'GG', 'XG', 'XGG', 'XGGG'].map(size => {
                                  const amnt = selectedProduct.stock?.[size] || 0;
                                  const isAvail = amnt > 0;
                                  return (
                                    <button 
                                      key={size} type="button" onClick={() => setSelectedSize(size)}
                                      className={`flex flex-col items-center justify-center h-20 w-full sm:w-24 rounded-2xl border-2 transition-all ${selectedSize === size ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-md transform -translate-y-1' : 'border-slate-200 hover:border-slate-300 text-slate-800 bg-white'}`}
                                    >
                                       <span className="font-black text-xl">{size}</span>
                                       <span className={`text-[10px] uppercase font-bold tracking-widest ${isAvail ? 'text-emerald-500' : 'text-amber-500'}`}>
                                          {isAvail ? `Pronta` : 'Prazo'}
                                       </span>
                                    </button>
                                  )
                              })}
                           </div>
                           {!selectedSize && <p className="text-xs text-red-500 font-bold mt-3">* Selecionar obrigatoriamente um tamanho.</p>}
                        </section>

                        {/* Passo 2: Precificação Obrigatória */}
                        <section>
                           <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                               <span className="bg-slate-900 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span> 
                               Preço Final do Cliente
                           </h3>
                           
                           <div className={`p-6 rounded-2xl border-2 transition-colors relative overflow-hidden bg-white shadow-sm ${isPriceInvalid ? 'border-red-400 focus-within:border-red-500' : 'border-indigo-100 focus-within:border-indigo-400'}`}>
                               <div className="flex items-center">
                                  <span className={`text-2xl font-bold mr-2 ${isPriceInvalid ? 'text-red-400' : 'text-indigo-400'}`}>R$</span>
                                  <input 
                                    type="number" step="0.01" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)}
                                    className={`w-full text-5xl font-black bg-transparent outline-none py-2 ${isPriceInvalid ? 'text-red-600' : 'text-indigo-900'}`}
                                  />
                               </div>
                               {isPriceInvalid && (
                                   <div className="mt-3 bg-red-50 p-3 rounded-lg border border-red-200">
                                      <p className="text-red-600 font-bold text-sm">BLOQUEADO: O valor mínimo estabelecido pela Kora é de R$ 150,00.</p>
                                   </div>
                               )}
                           </div>
                        </section>

                        {/* Passo 3: Dados Cliente */}
                        <section>
                           <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                               <span className="bg-slate-900 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">3</span> 
                               Etiqueta de Envio
                           </h3>
                           <div className="space-y-4">
                              <input required type="text" placeholder="Nome Completo do Cliente" value={customerName} onChange={e=>setCustomerName(e.target.value)} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-medium focus:border-purple-500 outline-none shadow-sm" />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <input required type="text" placeholder="CPF da Fatura" value={customerCpf} onChange={e=>setCustomerCpf(e.target.value)} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-medium focus:border-purple-500 outline-none shadow-sm" />
                                  <input required type="text" placeholder="WhatsApp do Cliente" value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-medium focus:border-purple-500 outline-none shadow-sm" />
                              </div>
                              <div className="border-t border-slate-200 pt-4 pb-2 mt-4"><p className="text-xs font-bold text-slate-400 uppercase">Endereço Logístico</p></div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <input required type="text" placeholder="CEP" value={customerCep} onChange={e=>setCustomerCep(e.target.value)} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-medium focus:border-purple-500 outline-none shadow-sm" />
                                  <input required type="text" placeholder="Rua / Avenida" value={customerAddress} onChange={e=>setCustomerAddress(e.target.value)} className="md:col-span-2 w-full p-4 bg-white border border-slate-200 rounded-xl font-medium focus:border-purple-500 outline-none shadow-sm" />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <input required type="text" placeholder="Nº da Casa" value={customerNumber} onChange={e=>setCustomerNumber(e.target.value)} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-medium focus:border-purple-500 outline-none shadow-sm" />
                                  <input required type="text" placeholder="Cidade / Bairro" value={customerNeighborhood} onChange={e=>setCustomerNeighborhood(e.target.value)} className="md:col-span-2 w-full p-4 bg-white border border-slate-200 rounded-xl font-medium focus:border-purple-500 outline-none shadow-sm" />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <input type="text" placeholder="Complemento (Ap 22)" value={customerComplement} onChange={e=>setCustomerComplement(e.target.value)} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-medium focus:border-purple-500 outline-none shadow-sm" />
                                  <input required type="text" placeholder="Estado (ex: SP)" value={customerState} onChange={e=>setCustomerState(e.target.value)} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-medium focus:border-purple-500 outline-none shadow-sm" />
                              </div>
                           </div>
                        </section>

                        {/* Submit */}
                        <div className="pt-8">
                            <button 
                               type="submit" disabled={isSubmitting || !selectedSize || isPriceInvalid}
                               className={`w-full text-white font-bold p-6 rounded-2xl flex justify-between items-center text-lg transition shadow-xl 
                                ${isPriceInvalid || !selectedSize || isSubmitting ? 'bg-slate-300 shadow-none cursor-not-allowed text-slate-500' : 'bg-purple-600 hover:bg-purple-700 hover:shadow-2xl hover:shadow-purple-300'}`}
                             >
                               {isSubmitting ? 'Travejando Fatura Local...' : 'Gerar Pedido e Mostrar Fatura do Cliente'} 
                               <ArrowRight size={24}/>
                            </button>
                        </div>

                     </form>
                 </div>
             </div>
          </div>
      );
  }

  // -------------------------------------------------------------
  // VIEW: MAIN CATALOG GRID
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      
      {/* Header Afiliado */}
      <header className="bg-slate-900 text-white p-6 sticky top-0 z-10 shadow-lg">
         <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">PORTAL DE PARCEIRO B2B</p>
              <h1 className="text-xl font-bold mt-1 text-slate-100">{affiliate.name}</h1>
            </div>
            <div className="bg-slate-800 p-3 rounded-full border border-slate-700">
               <TrendingUp className="text-purple-400" />
            </div>
         </div>
      </header>

      {/* Grid Catálogo */}
      <main className="max-w-6xl mx-auto p-4 md:p-8 mt-4">
         <h2 className="text-3xl font-bold text-slate-800 mb-6 font-logo">ACERVO KORA IMPORTADOS</h2>
         
         {/* Categories Navigation */}
         <div className="flex overflow-x-auto hide-scrollbar gap-3 mb-8 pb-2">
            {["Todas", ...new Set(products.map(p => p.category || "Outras Ligas"))].map(cat => (
               <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm transition-all border ${
                     activeCategory === cat 
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md transform scale-105' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
               >
                  {cat}
               </button>
            ))}
         </div>

         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {products
               .filter(p => activeCategory === "Todas" || (p.category || "Outras Ligas") === activeCategory)
               .map(product => {
                const totalStock = Object.values(product.stock || {}).reduce((s, a) => s + a, 0);
                const hasStock = totalStock > 0;

                return (
                  <div key={product.id} onClick={() => handleOpenProduct(product)} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col">
                     <div className="relative w-full pt-[100%] bg-slate-100">
                        {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center font-logo text-slate-300 text-3xl">KORA</div>
                        )}
                        <div className="absolute top-3 left-3">
                            <span className={`px-3 py-1 text-[10px] md:text-xs font-bold rounded-lg uppercase tracking-wider backdrop-blur-md shadow-lg ${hasStock ? 'bg-black/80 text-white' : 'bg-white/90 text-slate-800'}`}>
                                {hasStock ? 'Pronta Entrega' : 'Longo Prazo'}
                            </span>
                        </div>
                     </div>
                     <div className="p-4 md:p-5 flex-1 flex flex-col justify-between">
                         <h3 className="font-bold text-slate-800 leading-tight group-hover:text-purple-600 transition-colors">{product.name}</h3>
                         <div className="text-xs text-slate-400 mt-2 flex items-center gap-1 font-bold"><Tag size={12}/> IMPORTADA THAI 1:1</div>
                     </div>
                  </div>
                )
            })}
         </div>
      </main>

    </div>
  );
}
