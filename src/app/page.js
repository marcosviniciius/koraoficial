"use client";
import Navbar from "@/components/Navbar";
import { ArrowRight, Star, ShieldCheck, Zap, RotateCcw, ShoppingCart, Search, X, ChevronLeft, Ruler, Tag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const router = useRouter();
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Auto-open product from URL
  const searchParams = useSearchParams();
  const pId = searchParams.get('p');

  useEffect(() => {
    if (pId && products.length > 0) {
      const target = products.find(p => p.id === pId);
      if (target) {
        setSelectedProduct(target);
      }
    }
  }, [pId, products]);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Agrupar produtos por categoria
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const cat = product.category || "Outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {});

  const categoryOrder = ["Lançamentos", "Seleções", "Brasileirão", "Premier League", "La Liga", "Série A (Itália)", "Retrô", "Outras Ligas"];
  
  const renderedCategories = Object.keys(groupedProducts).sort((a,b) => {
      const idxA = categoryOrder.indexOf(a);
      const idxB = categoryOrder.indexOf(b);
      if(idxA !== -1 && idxB !== -1) return idxA - idxB;
      if(idxA !== -1) return -1;
      if(idxB !== -1) return 1;
      return a.localeCompare(b);
  });

  const handleAddToCart = () => {
    if(!selectedProduct || !selectedSize) return;

    const stockForSize = selectedProduct.stock[selectedSize];
    const orderType = stockForSize > 0 ? 'Imediato' : 'Encomenda';

    addItem({
      ...selectedProduct,
      selectedSize,
      orderType
    });
    
    // Close Modal
    setSelectedProduct(null);
    setSelectedSize("");
  };

  if (selectedProduct) {
     const similarProducts = products.filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id).slice(0, 4);
     const stockForSize = selectedSize ? selectedProduct.stock[selectedSize] : 0;
     const isImmediate = stockForSize > 0;

     return (
        <div className="min-h-screen bg-background pb-20 font-sans animate-in fade-in duration-300">
           
           {/* Product Header */}
           <div className="sticky top-0 z-50 bg-surface border-b border-border-dim p-4 shadow-sm flex items-center gap-4">
               <button onClick={() => { setSelectedProduct(null); setSelectedSize(""); }} className="bg-slate-100 hover:bg-slate-200 p-3 rounded-full transition text-main">
                   <ChevronLeft size={20} />
               </button>
               <h2 className="font-bold text-main text-lg truncate flex-1">{selectedProduct.name}</h2>
           </div>

           <div className="max-w-5xl mx-auto px-4 py-8">
               
               <div className="flex flex-col md:flex-row gap-6 lg:gap-8 bg-surface -900 p-4 md:p-6 rounded-lg shadow-sm mb-12 border border-border-dim">
                   
                   {/* Coluna Esquerda: Imagem + Detalhes (Desktop) */}
                   <div className="w-full md:w-[65%] flex flex-col order-1 md:order-1">
                       <div className="bg-surface rounded-lg flex items-center justify-center p-0 md:p-4">
                          {selectedProduct.imageUrl ? (
                              <img src={selectedProduct.imageUrl} className="max-w-full h-auto max-h-[500px] object-contain" alt={selectedProduct.name} />
                          ) : (
                              <div className="w-full h-[400px] flex items-center justify-center font-logo text-slate-300 text-6xl">KORA</div>
                          )}
                       </div>

                       {/* Descrição Desktop */}
                       <div className="hidden md:block mt-8 border-t border-border-dim pt-8 pb-4 px-4">
                           <h3 className="text-xl font-bold text-main mb-6">O que você precisa saber sobre este produto</h3>
                           <ul className="list-disc pl-5 space-y-3 text-sm text-dim">
                               <li>Camisa importada padrão 1:1 Tailandesa Premium.</li>
                               <li>Escudos das confederações e do time bordados em alta definição.</li>
                               <li>Tecido confortável com tecnologia de respirabilidade térmica.</li>
                               <li>Garantia contra defeito de fabricação.</li>
                               <li>Acompanha tags e embalagem plástica padronizada.</li>
                           </ul>
                       </div>

                       {/* Foto da Tabela Desktop */}
                       {selectedProduct.sizeChartUrl && (
                          <div className="hidden md:block mt-4 px-4 pb-8">
                             <h3 className="text-xl font-bold text-main mb-6">Guia de Tamanhos</h3>
                             <img src={selectedProduct.sizeChartUrl} alt="Tabela de Medidas" className="w-full max-w-xl rounded-lg border border-border-dim shadow-sm" />
                          </div>
                       )}
                   </div>

                   {/* Coluna Direita: Buybox + Detalhes (Mobile) */}
                   <div className="w-full md:w-[35%] flex flex-col order-2 md:order-2">
                       <div className="border border-border-dim rounded-[8px] p-6 lg:sticky lg:top-24">
                           <h1 className="text-2xl md:text-3xl font-bold text-main mb-4 leading-tight">{selectedProduct.name}</h1>

                           <div className="mb-6">
                               <div className="flex items-end gap-2">
                                   <p className="text-4xl font-black text-main leading-none">
                                       <span className="text-xl relative top-[-6px] pr-1">R$</span>
                                       {selectedProduct.price.toFixed(2).replace('.', ',')}
                                   </p>
                               </div>
                               <p className="text-sm text-slate-500 mt-2 font-bold">em até 12x no cartão de crédito</p>
                           </div>

                           {/* Seleção de Tamanhos e Tabela */}
                           <div className="mb-6 pt-6 border-t border-border-dim">
                              <div className="flex justify-between items-center mb-3">
                                  <p className="text-base font-bold text-main">Tamanho:</p>
                              </div>
                              
                              <div className="flex flex-wrap gap-2">
                                  {['P', 'M', 'G', 'GG', 'XG', 'XGG', 'XGGG'].map(size => {
                                      const stock = selectedProduct.stock[size];
                                      const isSelected = selectedSize === size;
                                      return (
                                        <button 
                                          key={size}
                                          onClick={() => setSelectedSize(size)}
                                          className={`relative px-4 py-2 rounded-md border text-sm font-bold transition-all min-w-[2.5rem] ${
                                              isSelected 
                                              ? 'border-[#3483fa] bg-blue-50 -900/20 text-[#3483fa]' 
                                              : 'border-border-dim text-main hover:border-slate-400 bg-surface -800'
                                          }`}
                                        >
                                          {size}
                                        </button>
                                      )
                                  })}
                              </div>
                              {selectedSize && (
                                  <p className="text-sm mt-4 font-normal">
                                      {isImmediate ? (
                                         <span className="text-main font-bold text-xs"><Zap className="inline text-[#00a650] fill-[#00a650] relative top-[-1px]" size={14}/> Pronta Entrega</span>
                                      ) : (
                                         <span className="text-amber-700 font-bold border border-amber-500 bg-amber-50 px-2 py-1 rounded text-xs inline-block mt-2">Disponibilidade: 25 a 30 dias</span>
                                      )}
                                  </p>
                              )}
                           </div>

                           {/* Botão de Compra Estilo ML */}
                           <div className="mt-4 flex flex-col gap-2">
                                <button 
                                   onClick={handleAddToCart}
                                   disabled={!selectedSize}
                                   className={`w-full py-4 rounded-xl text-lg font-bold transition-all ${
                                       selectedSize 
                                       ? 'bg-[#3483fa] hover:bg-[#2968c8] text-white shadow-lg shadow-blue-500/30' 
                                       : 'bg-[#rgba(65,137,230,.15)] bg-blue-100 text-blue-300 cursor-not-allowed'
                                   }`}
                                >
                                   Comprar agora
                                </button>
                                
                                <button 
                                   onClick={handleAddToCart}
                                   disabled={!selectedSize}
                                   className={`w-full py-4 rounded-xl text-lg font-bold transition-all ${
                                       selectedSize 
                                       ? 'bg-blue-50 hover:bg-blue-100 text-[#3483fa]' 
                                       : 'hidden'
                                   }`}
                                >
                                   Adicionar ao carrinho
                                </button>
                                
                                <div className="mt-4 text-xs font-bold text-slate-500 flex items-center justify-center gap-1">
                                   <ShieldCheck size={14} className="text-[#3483fa]"/> Compra Garantida Kora Vendas
                                </div>
                            </div>
                        </div>

                        {/* Descrição Mobile e Tabela de Medidas (renderizado após a caixa de compra apenas no celular) */}
                        <div className="md:hidden mt-10 border-t border-border-dim pt-8 pb-4">
                            <h3 className="text-xl font-bold text-main mb-6">O que você precisa saber sobre este produto</h3>
                            <ul className="list-disc pl-5 space-y-3 text-sm text-dim">
                                <li>Camisa importada padrão 1:1 Tailandesa Premium.</li>
                                <li>Escudos das confederações e do time bordados em alta definição.</li>
                                <li>Tecido confortável com tecnologia de respirabilidade térmica.</li>
                                <li>Garantia contra defeito de fabricação.</li>
                                <li>Acompanha tags e embalagem plástica padronizada.</li>
                            </ul>
                        </div>

                        {/* Foto da Tabela Mobile */}
                        {selectedProduct.sizeChartUrl && (
                           <div className="md:hidden mt-6 pb-4 border-t border-slate-100 pt-6">
                              <h3 className="text-xl font-bold text-main mb-6">Guia de Tamanhos</h3>
                              <img src={selectedProduct.sizeChartUrl} alt="Tabela de Medidas" className="w-full rounded-lg border border-border-dim shadow-sm" />
                           </div>
                        )}
                   </div>
               </div>

               {/* Recomendados / Semelhantes (Fim da Página) */}
               {similarProducts.length > 0 && (
                   <div className="mt-16 border-t border-border-dim pt-12">
                       <h3 className="text-2xl font-bold text-main mb-8 border-l-4 border-[#3483fa] pl-4">Quem viu este produto também comprou</h3>
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
                                   <h4 className="font-bold text-slate-700 text-sm mb-2 leading-tight group-hover:text-[#3483fa] transition-colors">{p.name}</h4>
                                   <p className="font-light text-main text-xl">R$ {p.price.toFixed(2).replace('.', ',')}</p>
                                </div>
                            </div>
                          ))}
                       </div>
                   </div>
               )}
           </div>
        </div>
     );
  }

  return (
    <>
      <Navbar searchTerm={searchTerm} onSearch={setSearchTerm} />
      <main className="flex flex-col min-h-screen bg-background pt-20">
        


        {/* Hero Section */}
        <section className="relative w-full bg-surface -900 overflow-hidden py-16 md:py-24">
          <div className="absolute top-0 right-0 w-[40%] h-full bg-[var(--color-kora-yellow)] skew-x-[-15deg] translate-x-12 opacity-10"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Copy */}
            <div className="space-y-6">
              <span className="inline-block py-1 px-3 rounded-full bg-green-100 text-[var(--color-kora-green-dark)] font-bold text-sm tracking-wide">
                NOVA COLEÇÃO 24/25
              </span>
              <h1 className="font-logo text-5xl md:text-7xl text-[var(--color-kora-blue)] leading-[1.1]">
                VISTA SUA <br/> 
                <span className="text-[var(--color-kora-green)]">PAIXÃO</span>.
              </h1>
              <p className="text-lg text-dim max-w-lg">
                Camisas de time originais com a melhor qualidade. O seu manto sagrado está aqui na Kora. 
              </p>
              
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <a href="#vitrine" className="bg-[var(--color-kora-blue)] hover:bg-[var(--color-kora-blue-dark)] text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 text-lg transition-transform hover:-translate-y-1">
                  Ver Coleção <ArrowRight size={20} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="bg-[var(--color-kora-blue)] py-6 border-y-4 border-[var(--color-kora-yellow)] overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-8 overflow-hidden">
            <div className="animate-marquee flex items-center md:grid md:grid-cols-4 md:gap-6 text-white">
               
               {/* Bloco de Itens 1 */}
               <div className="flex shrink-0 items-center gap-12 pr-12 md:pr-0 md:gap-0 md:contents">
                  <div className="flex items-center gap-3 justify-center md:justify-start min-w-max">
                     <ShieldCheck size={28} className="text-[var(--color-kora-yellow)] shrink-0" />
                     <div>
                       <h4 className="font-bold text-sm leading-tight">Compra Segura</h4>
                       <p className="text-[10px] opacity-80">Dados criptografados</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 justify-center md:justify-start min-w-max">
                     <Zap size={28} className="text-[var(--color-kora-yellow)] shrink-0" />
                     <div>
                       <h4 className="font-bold text-sm leading-tight">Envio Expresso</h4>
                       <p className="text-[10px] opacity-80">Para pronta entrega</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 justify-center md:justify-start min-w-max">
                     <RotateCcw size={28} className="text-[var(--color-kora-yellow)] shrink-0" />
                     <div>
                       <h4 className="font-bold text-sm leading-tight">Troca Fácil</h4>
                       <p className="text-[10px] opacity-80">Até 7 dias grátis</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 justify-center md:justify-start min-w-max">
                     <Star size={28} className="text-[var(--color-kora-yellow)] shrink-0" />
                     <div>
                       <h4 className="font-bold text-sm leading-tight">Qualidade Premium</h4>
                       <p className="text-[10px] opacity-80">Garantia Kora</p>
                     </div>
                  </div>
               </div>

               {/* Bloco de Itens 2 (Apenas Mobile para Loop) */}
               <div className="flex shrink-0 items-center gap-12 pr-12 md:hidden">
                  <div className="flex items-center gap-3 justify-center min-w-max">
                     <ShieldCheck size={28} className="text-[var(--color-kora-yellow)] shrink-0" />
                     <div>
                       <h4 className="font-bold text-sm leading-tight">Compra Segura</h4>
                       <p className="text-[10px] opacity-80">Dados criptografados</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 justify-center min-w-max">
                     <Zap size={28} className="text-[var(--color-kora-yellow)] shrink-0" />
                     <div>
                       <h4 className="font-bold text-sm leading-tight">Envio Expresso</h4>
                       <p className="text-[10px] opacity-80">Para pronta entrega</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 justify-center min-w-max">
                     <RotateCcw size={28} className="text-[var(--color-kora-yellow)] shrink-0" />
                     <div>
                       <h4 className="font-bold text-sm leading-tight">Troca Fácil</h4>
                       <p className="text-[10px] opacity-80">Até 7 dias grátis</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 justify-center min-w-max">
                     <Star size={28} className="text-[var(--color-kora-yellow)] shrink-0" />
                     <div>
                       <h4 className="font-bold text-sm leading-tight">Qualidade Premium</h4>
                       <p className="text-[10px] opacity-80">Garantia Kora</p>
                     </div>
                  </div>
               </div>

            </div>
          </div>
        </section>

        {/* Dynamic Bestsellers (Products Feed) */}
        <section id="vitrine" className="py-12 md:py-20 flex-1">
          <div className="max-w-7xl mx-auto px-0 md:px-4 sm:px-6 lg:px-8">

            {loading ? (
                <div className="text-center py-20">
                    <div className="w-12 h-12 border-4 border-border-dim border-t-[var(--color-kora-green)] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500 font-bold">Acordando o sistema...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-surface rounded-3xl border border-border-dim">
                    <p className="text-slate-500 font-bold mb-2">Nenhuma camisa encontrada.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-12 md:gap-20">
                  {renderedCategories.map(category => {
                    const categoryProducts = groupedProducts[category];
                    // Duplica os itens no mobile para simular "scroll infinito" se não estiver selecionado
                    const mobileProducts = [...categoryProducts, ...categoryProducts, ...categoryProducts];
                    
                    return (
                    <div key={category} className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                       <div className="mb-6 md:mb-10 text-center md:text-left px-4 md:px-0">
                           <h3 
                             onClick={() => router.push(`/categoria/${encodeURIComponent(category)}`)}
                             className="font-logo text-2xl md:text-3xl lg:text-4xl text-[var(--color-kora-blue)] border-b-4 border-[var(--color-kora-yellow)] inline-block pb-2 uppercase cursor-pointer hover:opacity-80 transition-opacity"
                           >
                               {category}
                           </h3>
                       </div>
                       
                       {/* Mobile Carousel (Falso Infinito) */}
                       <div className="flex md:hidden overflow-x-auto snap-x snap-mandatory show-scrollbars-modern gap-4 pb-8 pt-2 px-4 w-full">
                           {mobileProducts.map((p, idx) => (
                             <div key={`${p.id}-${idx}`} onClick={() => setSelectedProduct(p)} className="snap-center shrink-0 w-[260px] sm:w-[280px] group cursor-pointer bg-surface -900 rounded-2xl overflow-hidden shadow-sm border border-border-dim transition-all hover:shadow-xl flex flex-col hover:-translate-y-1">
                               {/* Image Frame */}
                               <div className="relative w-full pt-[100%] bg-surface-hover overflow-hidden">
                                 {p.imageUrl ? (
                                    <img src={p.imageUrl} alt={p.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                 ) : (
                                    <div className="absolute inset-0 flex items-center justify-center font-logo text-dim text-2xl">KORA</div>
                                 )}
                               </div>
                               {/* Card Info */}
                               <div className="p-6 flex flex-col flex-1">
                                 <h3 className="font-bold text-main text-lg mb-2 leading-tight group-hover:text-[var(--color-kora-green)] transition-colors">{p.name}</h3>
                                 <div className="mt-auto pt-4 flex items-center justify-between border-t border-border-dim">
                                   <span className="font-bold text-2xl text-[var(--color-kora-green-dark)]">R$ {p.price.toFixed(2).replace('.', ',')}</span>
                                   <div className="bg-surface-hover text-dim p-2 rounded-lg group-hover:bg-[var(--color-kora-green)] group-hover:text-white transition-colors">
                                       <ShoppingCart size={20} />
                                   </div>
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>

                       {/* Desktop Grid / Mobile Selected Grid */}
                       <div className="hidden md:grid lg:grid-cols-4 md:gap-8 md:px-0 w-full">
                         {categoryProducts.map((p) => (
                           <div key={p.id} onClick={() => setSelectedProduct(p)} className="group cursor-pointer bg-surface -900 rounded-2xl overflow-hidden shadow-sm border border-border-dim transition-all hover:shadow-xl flex flex-col hover:-translate-y-1">
                             <div className="relative w-full pt-[100%] bg-surface-hover overflow-hidden">
                               {p.imageUrl ? (
                                  <img src={p.imageUrl} alt={p.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                               ) : (
                                  <div className="absolute inset-0 flex items-center justify-center font-logo text-dim text-2xl">KORA</div>
                               )}
                             </div>
                             <div className="p-6 flex flex-col flex-1">
                               <h3 className="font-bold text-main text-lg mb-2 leading-tight group-hover:text-[var(--color-kora-green)] transition-colors">{p.name}</h3>
                               <div className="mt-auto pt-4 flex items-center justify-between border-t border-border-dim">
                                 <span className="font-bold text-2xl text-[var(--color-kora-green-dark)]">R$ {p.price.toFixed(2).replace('.', ',')}</span>
                                 <div className="bg-surface-hover text-dim p-2 rounded-lg group-hover:bg-[var(--color-kora-green)] group-hover:text-white transition-colors">
                                     <ShoppingCart size={20} />
                                 </div>
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                  )})}
                </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
