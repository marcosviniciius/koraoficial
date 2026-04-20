"use client";
import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { ArrowRight, ShoppingCart, ChevronLeft, Ruler, ShieldCheck, Zap } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/context/CartContext";
import { useImageModal } from "@/context/ImageModalContext";
import ProductGallery from "@/components/ProductGallery";
import { normalizeProductMedia } from "@/lib/productMedia";

export default function CategoriaPage() {
  const router = useRouter();
  const routeParams = useParams();
  const { addItem } = useCart();
  
  // Extrai o nome da liga da URL resolvendo o problema de UNDEFINED
  const rawId = routeParams?.id || "";
  const categoryName = decodeURIComponent(rawId);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const { openImage, openGallery } = useImageModal();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const data = snapshot.docs.map((doc) => normalizeProductMedia({ id: doc.id, ...doc.data() }));
        // Filtra estritamente por categoria
        const filtered = data.filter(p => p.category && p.category.toLowerCase() === categoryName.toLowerCase());
        setProducts(filtered);
      } catch (error) {
        console.error("Error fetching products", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [categoryName]);

  const handleAddToCart = () => {
    if(!selectedProduct || !selectedSize) return;
    const stockForSize = selectedProduct.stock[selectedSize];
    const orderType = stockForSize > 0 ? 'Imediato' : 'Encomenda';
    
    addItem({
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      imageUrl: selectedProduct.imageUrl,
      gallery: selectedProduct.gallery,
      selectedSize,
      orderType
    });

    setSelectedProduct(null);
    setSelectedSize("");
  };

  // Se tem pesquisa pela Navbar, filtra localmente ou manda pra home (para simplificar, a pesquisa da Navbar na categoria pode redirecionar para a Home com ?q= ou apenas filtrar localmente o array já carregado. Neste caso, criamos um filtro adicional local).
  const displayedProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Renderização do Produto (Buybox Fullscreen)
  if (selectedProduct) {
     const similarProducts = products.filter(p => p.id !== selectedProduct.id).slice(0, 4);
     const stockForSize = selectedSize ? selectedProduct.stock[selectedSize] : 0;
     const isImmediate = stockForSize > 0;

     return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans animate-in fade-in duration-300">
           {/* Product Header */}
           <div className="sticky top-0 z-50 bg-white border-b border-slate-200 p-4 shadow-sm flex items-center gap-4">
               <button onClick={() => { setSelectedProduct(null); setSelectedSize(""); }} className="bg-slate-100 hover:bg-slate-200 p-3 rounded-full transition text-slate-800">
                   <ChevronLeft size={20} />
               </button>
               <h2 className="font-bold text-slate-800 text-lg truncate flex-1">{selectedProduct.name}</h2>
           </div>

           <div className="max-w-5xl mx-auto px-4 py-8">
               <div className="flex flex-col md:flex-row gap-6 lg:gap-8 bg-white p-4 md:p-6 rounded-lg shadow-sm mb-12 border border-slate-200">
                   {/* Coluna Esquerda */}
                   <div className="w-full md:w-[65%] flex flex-col order-1 md:order-1">
                        <ProductGallery key={selectedProduct.id} product={selectedProduct} onOpenImage={openGallery} />
                       <div className="hidden md:block mt-8 border-t border-slate-200 pt-8 pb-4 px-4">
                           <h3 className="text-xl font-bold text-slate-800 mb-6">O que você precisa saber sobre este produto</h3>
                           <ul className="list-disc pl-5 space-y-3 text-sm text-slate-600">
                               <li>Camisa importada padrão 1:1 Tailandesa Premium.</li>
                               <li>Escudos das confederações e do time bordados em alta definição.</li>
                               <li>Tecido confortável com tecnologia de respirabilidade térmica.</li>
                               <li>Garantia contra defeito de fabricação.</li>
                               <li>Acompanha tags e embalagem plástica padronizada.</li>
                           </ul>
                       </div>
                       {selectedProduct.sizeChartUrl && (
                          <div className="hidden md:block mt-4 px-4 pb-8">
                             <h3 className="text-xl font-bold text-slate-800 mb-6">Guia de Tamanhos</h3>
                              <img
                                src={selectedProduct.sizeChartUrl}
                                alt="Tabela de Medidas"
                                className="w-full max-w-xl rounded-lg border border-slate-200 shadow-sm cursor-zoom-in hover:opacity-95 transition-opacity"
                                onClick={() => openImage(selectedProduct.sizeChartUrl, "Guia de Tamanhos")}
                              />
                          </div>
                       )}
                   </div>

                   {/* Coluna Direita (Buybox) */}
                   <div className="w-full md:w-[35%] flex flex-col order-2 md:order-2">
                       <div className="border border-slate-200 rounded-[8px] p-6 lg:sticky lg:top-24">
                           <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 leading-tight">{selectedProduct.name}</h1>
                           <div className="mb-6">
                               <div className="flex items-end gap-2">
                                   <p className="text-4xl font-black text-slate-800 leading-none">
                                       <span className="text-xl relative top-[-6px] pr-1">R$</span>
                                       {selectedProduct.price.toFixed(2).replace('.', ',')}
                                   </p>
                               </div>
                               <p className="text-sm text-slate-500 mt-2 font-bold">em até 12x no cartão de crédito</p>
                           </div>

                           <div className="mb-6 pt-6 border-t border-slate-200">
                              <div className="flex justify-between items-center mb-3">
                                  <p className="text-base font-bold text-slate-800">Tamanho:</p>
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
                                              isSelected ? 'border-[#3483fa] bg-blue-50 text-[#3483fa]' : 'border-slate-300 text-slate-800 hover:border-slate-400 bg-white'
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
                                         <span className="text-slate-800 font-bold text-xs"><Zap className="inline text-[#00a650] fill-[#00a650] relative top-[-1px]" size={14}/> Pronta Entrega</span>
                                      ) : (
                                         <span className="text-amber-700 font-bold border border-amber-500 bg-amber-50 px-2 py-1 rounded text-xs inline-block mt-2">Disponibilidade: 25 a 30 dias</span>
                                      )}
                                  </p>
                              )}
                           </div>

                           <div className="mt-4 flex flex-col gap-2">
                                <button 
                                   onClick={handleAddToCart}
                                   disabled={!selectedSize}
                                   className={`w-full py-4 rounded-xl text-lg font-bold transition-all ${
                                       selectedSize ? 'bg-[#3483fa] hover:bg-[#2968c8] text-white shadow-lg shadow-blue-500/30' : 'bg-[#rgba(65,137,230,.15)] bg-blue-100 text-blue-300 cursor-not-allowed'
                                   }`}
                                >
                                   Comprar agora
                                </button>
                                <button 
                                   onClick={handleAddToCart}
                                   disabled={!selectedSize}
                                   className={`w-full py-4 rounded-xl text-lg font-bold transition-all ${
                                       selectedSize ? 'bg-blue-50 hover:bg-blue-100 text-[#3483fa]' : 'hidden'
                                   }`}
                                >
                                   Adicionar ao carrinho
                                </button>
                                <div className="mt-4 text-xs font-bold text-slate-500 flex items-center justify-center gap-1">
                                   <ShieldCheck size={14} className="text-[#3483fa]"/> Compra Garantida Kora Vendas
                                </div>
                            </div>
                        </div>

                        <div className="md:hidden mt-10 border-t border-slate-200 pt-8 pb-4">
                            <h3 className="text-xl font-bold text-slate-800 mb-6">O que você precisa saber sobre este produto</h3>
                            <ul className="list-disc pl-5 space-y-3 text-sm text-slate-600">
                                <li>Camisa importada padrão 1:1 Tailandesa Premium.</li>
                                <li>Escudos das confederações e do time bordados em alta definição.</li>
                                <li>Tecido confortável com tecnologia de respirabilidade térmica.</li>
                                <li>Garantia contra defeito de fabricação.</li>
                                <li>Acompanha tags e embalagem plástica padronizada.</li>
                            </ul>
                        </div>
                        {selectedProduct.sizeChartUrl && (
                           <div className="md:hidden mt-6 pb-4 border-t border-slate-100 pt-6">
                              <h3 className="text-xl font-bold text-slate-800 mb-6">Guia de Tamanhos</h3>
                              <img
                                src={selectedProduct.sizeChartUrl}
                                alt="Tabela de Medidas"
                                className="w-full rounded-lg border border-slate-200 shadow-sm cursor-zoom-in hover:opacity-95 transition-opacity"
                                onClick={() => openImage(selectedProduct.sizeChartUrl, "Guia de Tamanhos")}
                              />
                           </div>
                        )}
                   </div>
               </div>

               {/* Recomendados / Semelhantes (Fim da Página) */}
               {similarProducts.length > 0 && (
                   <div className="mt-16 border-t border-slate-200 pt-12">
                       <h3 className="text-2xl font-bold text-slate-800 mb-8 border-l-4 border-[#3483fa] pl-4">Veja mais de {categoryName}</h3>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                          {similarProducts.map((p) => (
                            <div key={p.id} onClick={() => { setSelectedProduct(null); setTimeout(() => setSelectedProduct(p), 50); window.scrollTo(0, 0); }} className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 transition-all hover:shadow-xl flex flex-col hover:-translate-y-1">
                                <div className="relative w-full pt-[100%] bg-slate-100">
                                   {p.imageUrl ? (
                                      <img src={p.imageUrl} alt={p.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                   ) : (
                                      <div className="absolute inset-0 flex items-center justify-center font-logo text-slate-300 text-2xl">KORA</div>
                                   )}
                                </div>
                                <div className="p-4 border-t border-slate-50">
                                   <h4 className="font-bold text-slate-700 text-sm mb-2 leading-tight group-hover:text-[#3483fa] transition-colors">{p.name}</h4>
                                   <p className="font-light text-slate-800 text-xl">R$ {p.price.toFixed(2).replace('.', ',')}</p>
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
      <main className="flex flex-col min-h-screen bg-slate-50 pt-28">
        <section className="py-2 flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center md:text-left flex items-center gap-4">
                <button onClick={() => router.push('/')} className="hover:bg-slate-200 p-2 rounded-full transition text-slate-400 hover:text-slate-800">
                    <ChevronLeft size={24} />
                </button>
                <h3 className="font-logo text-3xl md:text-4xl text-[var(--color-kora-blue)] border-b-4 border-[var(--color-kora-yellow)] inline-block pb-2 uppercase uppercase-shadow">
                    {categoryName} <span className="font-sans text-xl font-bold opacity-30 ml-2">({displayedProducts.length})</span>
                </h3>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-[var(--color-kora-green)] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500 font-bold">Acordando o sistema...</p>
                </div>
            ) : displayedProducts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
                    <p className="text-slate-500 font-bold mb-2">Nenhuma camisa encontrada.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 w-full mt-8">
                    {displayedProducts.map((p) => (
                    <div key={p.id} onClick={() => setSelectedProduct(p)} className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-[0_8px_20px_-10px_rgba(0,0,0,0.05)] border border-slate-100 transition-all hover:shadow-[0_20px_40px_-15px_rgba(0,191,99,0.15)] flex flex-col hover:-translate-y-1">
                        <div className="relative w-full pt-[100%] bg-slate-100 overflow-hidden">
                        {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center font-logo text-slate-300 text-2xl">KORA</div>
                        )}
                        </div>
                        <div className="p-4 md:p-6 flex flex-col flex-1">
                        <h3 className="font-bold text-slate-800 text-sm md:text-lg mb-2 leading-tight group-hover:text-[var(--color-kora-green)] transition-colors line-clamp-2">{p.name}</h3>
                        <div className="mt-auto pt-2 md:pt-4 flex items-center justify-between border-t border-slate-100">
                            <span className="font-bold text-lg md:text-2xl text-[var(--color-kora-green-dark)]">R$ {p.price.toFixed(2).replace('.', ',')}</span>
                            <div className="bg-slate-100 text-slate-400 p-2 rounded-lg group-hover:bg-[var(--color-kora-green)] group-hover:text-white transition-colors">
                                <ShoppingCart size={20} />
                            </div>
                        </div>
                        </div>
                    </div>
                    ))}
                </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
