"use client";
import Navbar from "@/components/Navbar";
import { ArrowRight, Star, ShieldCheck, Zap, RotateCcw, ShoppingCart, Search, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Home() {
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

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

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

  return (
    <>
      <Navbar />
      <main className="flex flex-col min-h-screen bg-slate-50">
        
        {/* Modal Tabela de Tamanho e Compra */}
        {selectedProduct && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center md:p-4 bg-white md:bg-transparent">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm hidden md:block" onClick={() => setSelectedProduct(null)}/>
             <div className="relative bg-white w-full h-full md:h-auto md:max-w-2xl md:rounded-3xl overflow-y-auto md:overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in slide-in-from-bottom-full md:zoom-in-95 duration-200">
                <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 bg-white/80 backdrop-blur-md p-3 rounded-full hover:bg-white text-slate-800 transition z-10 shadow-sm border border-slate-100">
                   <X size={20}/>
                </button>
                
                {/* Modal Image */}
                <div className="w-full md:w-1/2 bg-slate-100 flex items-center justify-center h-[350px] md:h-auto relative shrink-0">
                    {selectedProduct.imageUrl ? (
                        <img src={selectedProduct.imageUrl} className="w-full h-full object-cover" alt={selectedProduct.name} />
                    ) : (
                        <span className="font-logo text-slate-300 text-3xl">KORA</span>
                    )}
                </div>

                {/* Modal Details */}
                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col bg-white">
                   <p className="text-xs font-bold text-[var(--color-kora-blue)] uppercase tracking-wider mb-2">{selectedProduct.category}</p>
                   <h2 className="text-2xl md:text-2xl font-bold text-slate-800 mb-2 leading-tight">{selectedProduct.name}</h2>
                   <p className="text-3xl font-black text-[var(--color-kora-green-dark)] mb-6">R$ {selectedProduct.price.toFixed(2).replace('.', ',')}</p>

                   <div className="mb-8 flex-1">
                      <p className="text-sm font-bold text-slate-600 mb-3 block">Escolha o Tamanho:</p>
                      <div className="flex flex-wrap gap-2 md:gap-3">
                          {['P', 'M', 'G', 'GG', 'XG'].map(size => {
                              const stock = selectedProduct.stock[size];
                              const isSelected = selectedSize === size;
                              return (
                                <button 
                                  key={size}
                                  onClick={() => setSelectedSize(size)}
                                  className={`relative px-4 md:px-4 py-3 rounded-xl border-2 font-black transition-all ${
                                      isSelected 
                                      ? 'border-[var(--color-kora-green)] bg-green-50 text-[var(--color-kora-green-dark)]' 
                                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                  }`}
                                >
                                  {size}
                                  {stock === 0 && (
                                     <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 border-2 border-white px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider">Demanda</span>
                                  )}
                                </button>
                              )
                          })}
                      </div>
                   </div>

                   {/* Dynamic Button based on size selection */}
                   {selectedSize ? (
                      selectedProduct.stock[selectedSize] > 0 ? (
                         <button onClick={handleAddToCart} className="w-full bg-[var(--color-kora-green)] hover:bg-[var(--color-kora-green-dark)] text-white font-bold py-4 md:py-4 rounded-2xl text-lg flex justify-center items-center gap-2 transform transition-all shadow-lg active:scale-95 mb-4 md:mb-0">
                            <ShoppingCart size={20} /> Comprar Agora
                         </button>
                      ) : (
                         <button onClick={handleAddToCart} className="w-full bg-slate-800 hover:bg-slate-900 text-yellow-400 font-bold py-4 rounded-2xl flex flex-col justify-center items-center transition-all shadow-lg border border-yellow-500/20 active:scale-95 mb-4 md:mb-0">
                            <span className="text-lg flex items-center gap-2"><ShoppingCart size={20}/> Reservar Encomenda</span>
                            <span className="text-[10px] uppercase tracking-widest opacity-80 font-bold mt-1">Prazo de 25 a 30 dias úteis</span>
                         </button>
                      )
                   ) : (
                      <button disabled className="w-full bg-slate-100 text-slate-400 font-bold py-4 rounded-2xl text-lg flex justify-center items-center gap-2 cursor-not-allowed mb-4 md:mb-0">
                         Selecione o Tamanho
                      </button>
                   )}

                </div>
             </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="relative w-full bg-white overflow-hidden py-16 md:py-24">
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
              <p className="text-lg text-slate-600 max-w-lg">
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
        <section className="bg-[var(--color-kora-blue)] py-8 border-y-4 border-[var(--color-kora-yellow)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-white text-center md:text-left">
               <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
                  <ShieldCheck size={28} className="text-[var(--color-kora-yellow)]" />
                  <div>
                    <h4 className="font-bold text-sm">Compra Segura</h4>
                    <p className="text-xs opacity-80">Dados criptografados</p>
                  </div>
               </div>
               <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
                  <Zap size={28} className="text-[var(--color-kora-yellow)]" />
                  <div>
                    <h4 className="font-bold text-sm">Envio Expresso</h4>
                    <p className="text-xs opacity-80">Para pronta entrega</p>
                  </div>
               </div>
               <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
                  <RotateCcw size={28} className="text-[var(--color-kora-yellow)]" />
                  <div>
                    <h4 className="font-bold text-sm">Troca Fácil</h4>
                    <p className="text-xs opacity-80">Até 7 dias grátis</p>
                  </div>
               </div>
               <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
                  <Star size={28} className="text-[var(--color-kora-yellow)]" />
                  <div>
                    <h4 className="font-bold text-sm">Qualidade Premium</h4>
                    <p className="text-xs opacity-80">Garantia Kora</p>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* Dynamic Bestsellers (Products Feed) */}
        <section id="vitrine" className="py-20 flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
              <h2 className="font-logo text-4xl text-[var(--color-kora-blue)] border-b-4 border-[var(--color-kora-yellow)] inline-block pb-2">O QUE TEMOS HOJE</h2>
              
              <div className="relative w-full md:w-72">
                  <input 
                      type="text" 
                      placeholder="Buscar por time..."
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white border border-gray-200 text-slate-800 rounded-full py-3 px-5 pr-12 focus:outline-none focus:ring-2 focus:ring-[var(--color-kora-green)]" 
                  />
                  <Search className="absolute right-4 top-3 text-gray-400" size={20}/>
              </div>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-[var(--color-kora-green)] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500 font-bold">Acordando o sistema...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
                    <p className="text-slate-500 font-bold mb-2">Nenhuma camisa encontrada.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {filteredProducts.map((p) => (
                    <div key={p.id} onClick={() => setSelectedProduct(p)} className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] border border-slate-100 transition-all hover:shadow-[0_20px_40px_-15px_rgba(0,191,99,0.15)] flex flex-col h-full hover:-translate-y-1">
                      
                      {/* Image Frame */}
                      <div className="relative w-full pt-[100%] bg-slate-100 overflow-hidden">
                        {p.imageUrl ? (
                           <img src={p.imageUrl} alt={p.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                           <div className="absolute inset-0 flex items-center justify-center font-logo text-slate-300 text-2xl">KORA</div>
                        )}
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[var(--color-kora-blue)] shadow-sm">
                          {p.category}
                        </div>
                      </div>
                      
                      {/* Card Info */}
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="font-bold text-slate-800 text-lg mb-2 leading-tight group-hover:text-[var(--color-kora-green)] transition-colors">{p.name}</h3>
                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                          <span className="font-bold text-2xl text-[var(--color-kora-green-dark)]">R$ {p.price.toFixed(2).replace('.', ',')}</span>
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
