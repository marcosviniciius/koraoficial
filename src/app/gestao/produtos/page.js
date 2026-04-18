"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminSidebar from "@/components/AdminSidebar";
import { LogOut, Plus, Trash2, Upload, Target, Package, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

// Função Universal para Comprimir e Converter Imagens em Texto (Base64)
const compressImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          
          // Max dimension to save Firebase DB space (600px width max)
          const MAX_WIDTH = 600;
          let width = img.width;
          let height = img.height;
          
          if (width > MAX_WIDTH) {
            height = Math.floor((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          
          // Force output to highly compressed JPEG to fit in Firestore 1MB limits
          const base64String = canvas.toDataURL("image/jpeg", 0.6);
          resolve(base64String);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
};

export default function GestaoProdutos() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Lançamentos");
  const [imageFile, setImageFile] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  
  const [stock, setStock] = useState({
    P: 0, M: 0, G: 0, GG: 0, XG: 0, XGG: 0, XGGG: 0
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "products"));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    // Para novo cadastro, imagem é obrigatória. Para edição, não.
    if(!name || !price || (!imageFile && !editingProduct)) {
        alert("Preencha todos os campos e adicione uma foto!");
        return;
    }
    
    setIsUploading(true);
    try {
      let finalImageUrl = existingImageUrl;

      // Se houver nova foto, comprime e usa a nova. Caso contrário, mantém a antiga.
      if (imageFile) {
        finalImageUrl = await compressImageToBase64(imageFile);
      }

      const productData = {
        name,
        price: parseFloat(price),
        category,
        imageUrl: finalImageUrl,
        stock: {
            P: parseInt(stock.P) || 0,
            M: parseInt(stock.M) || 0,
            G: parseInt(stock.G) || 0,
            GG: parseInt(stock.GG) || 0,
            XG: parseInt(stock.XG) || 0,
            XGG: parseInt(stock.XGG) || 0,
            XGGG: parseInt(stock.XGGG) || 0
        }
      };

      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), productData);
      } else {
        await addDoc(collection(db, "products"), productData);
      }

      // 3. Reset
      closeAndClear();
      fetchProducts();
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar produto. Provavelmente a foto é imensa demais: " + e.message);
    } finally {
      setIsUploading(false);
    }
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setCategory(product.category || "Lançamentos");
    setStock(product.stock);
    setExistingImageUrl(product.imageUrl);
    setImageFile(null); // Reset file input
    setIsAdding(true);
  };

  const closeAndClear = () => {
    setIsAdding(false);
    setEditingProduct(null);
    setName("");
    setPrice("");
    setCategory("Lançamentos");
    setImageFile(null);
    setExistingImageUrl(null);
    setStock({ P: 0, M: 0, G: 0, GG: 0, XG: 0, XGG: 0, XGGG: 0 });
  };

  const handleDelete = async (id) => {
    if(confirm("Deseja realmente deletar este produto?")) {
      try {
        await deleteDoc(doc(db, "products", id));
        fetchProducts();
      } catch (e) {
        alert("Erro ao deletar");
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <AdminSidebar />

      <div className="flex-1 overflow-y-auto">
         <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Catálogo Zero Custos</h2>
                <button 
                  onClick={() => isAdding ? closeAndClear() : setIsAdding(true)} 
                  className={`${isAdding ? 'bg-slate-200 text-slate-600' : 'bg-[var(--color-kora-green)] text-white'} px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all`}
                >
                    {isAdding ? "Cancelar" : <><Plus size={20}/> Novo Cadastro</>}
                </button>
            </div>

            {isAdding && (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8 animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-bold text-lg mb-4 text-[var(--color-kora-blue)]">
                        {editingProduct ? `Editando: ${editingProduct.name}` : "Cadastrar Nova Camisa (Foto & Estoque)"}
                    </h3>
                    <form onSubmit={handleAddSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-bold text-slate-500 mb-1 block">Nome do Produto</label>
                                <input required value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-kora-blue)]" placeholder="Ex: Camisa Real Madrid 24/25" />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-500 mb-1 block">Categoria / Liga</label>
                                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-kora-blue)] bg-white">
                                    <option value="Lançamentos">Lançamentos</option>
                                    <option value="Premier League">Premier League</option>
                                    <option value="La Liga">La Liga</option>
                                    <option value="Série A (Itália)">Série A (Itália)</option>
                                    <option value="Brasileirão">Brasileirão</option>
                                    <option value="Seleções">Seleções</option>
                                    <option value="Retrô">Retrô</option>
                                    <option value="Outras Ligas">Outras Ligas</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-500 mb-1 block">Preço de Venda (R$)</label>
                                <input required type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-kora-blue)]" placeholder="189.90" />
                            </div>
                        </div>

                        {/* File Upload Area */}
                        <div>
                            <label className="text-sm font-bold text-slate-500 mb-2 block flex items-center gap-2"><Upload size={16}/> Foto do Produto {editingProduct && "(Deixe vazio para manter a atual)"}</label>
                            {editingProduct && existingImageUrl && (
                                <div className="mb-3 w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                                    <img src={existingImageUrl} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <input 
                                required={!editingProduct} type="file" accept="image/*" 
                                onChange={e => setImageFile(e.target.files[0])} 
                                className="w-full border-2 border-dashed border-gray-200 p-6 rounded-xl text-center text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-[var(--color-kora-blue)] hover:file:bg-blue-100 transition-colors" 
                            />
                            <p className="text-xs text-slate-400 mt-2">A foto será magicamente encolhida pelo navegador e salva como texto puro para burlar a nuvem do Google.</p>
                        </div>

                        {/* Stock Management Area */}
                        <div>
                            <label className="text-sm font-bold text-slate-500 mb-2 block flex items-center gap-2"><Target size={16}/> Quantidades em Estoque Físico (Pronta Entrega)</label>
                            <p className="text-xs text-slate-400 mb-4">Deixe "0" nos tamanhos que você não tem em mãos. Se estiver 0, a loja automaticamente trocará para o botão de Encomenda (Prazo de 25 a 30 dias úteis).</p>
                            
                            <div className="flex flex-wrap gap-4">
                                {['P', 'M', 'G', 'GG', 'XG', 'XGG', 'XGGG'].map(size => (
                                    <div key={size} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3 w-28">
                                        <span className="font-bold w-6">{size}</span>
                                        <input 
                                            type="number" min="0" value={stock[size]} 
                                            onChange={e => setStock({...stock, [size]: e.target.value})}
                                            className="w-full bg-white border border-gray-200 rounded-lg p-1 text-center font-bold outline-none focus:ring-1 focus:ring-[var(--color-kora-green)]" 
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2">
                            <button disabled={isUploading} type="submit" className="w-full bg-[var(--color-kora-blue)] hover:bg-[var(--color-kora-blue-dark)] disabled:opacity-50 text-white font-bold p-4 rounded-xl transition-colors shadow-lg">
                                {isUploading ? "Processando e Salvando..." : editingProduct ? "Salvar Alterações" : "Salvar no Catálogo Oficial"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
               {loading ? (
                 <div className="p-8 text-center text-slate-500">Carregando catálogo...</div>
               ) : products.length === 0 ? (
                 <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                    <Package size={48} className="text-slate-200 mb-4" />
                    <p className="mb-4">Nenhuma camisa cadastrada até o momento.</p>
                 </div>
               ) : (
                 <>
                   <div className="overflow-x-auto hidden md:block">
                     <table className="w-full text-left border-collapse">
                       <thead>
                         <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                           <th className="p-4 font-medium">Foto</th>
                           <th className="p-4 font-medium">Produto</th>
                           <th className="p-4 font-medium">Preço</th>
                           <th className="p-4 font-medium">Estoque Híbrido</th>
                           <th className="p-4 font-medium"></th>
                         </tr>
                       </thead>
                       <tbody>
                         {products.map((p) => {
                           const hasStock = Object.values(p.stock).some(val => val > 0);
  
                           return (
                           <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                             <td className="p-4">
                                 <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                                     {p.imageUrl ? (
                                         <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                     ) : <Package className="text-slate-300" />}
                                 </div>
                             </td>
                             <td className="p-4">
                               <p className="font-bold text-slate-800">{p.name}</p>
                             </td>
                             <td className="p-4 font-bold text-[var(--color-kora-green-dark)]">
                               R$ {p.price.toFixed(2).replace('.', ',')}
                             </td>
                             <td className="p-4">
                                <div className="flex gap-2">
                                    {['P', 'M', 'G', 'GG', 'XG', 'XGG', 'XGGG'].map(size => {
                                        const quant = p.stock?.[size] || 0;
                                        return (
                                          <span key={size} className={`px-2 py-1 text-[10px] rounded-lg font-bold ${quant > 0 ? 'bg-green-100 text-green-700 border border-green-200 shadow-sm' : 'bg-slate-50 text-slate-400 border border-slate-100 opacity-60'}`}>
                                              {size}: {quant}
                                          </span>
                                        );
                                    })}
                                </div>
                             </td>
                             <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-[var(--color-kora-blue)] transition-colors p-2 bg-white shadow-sm border border-slate-100 rounded-lg" title="Editar Produto">
                                    <Pencil size={18} />
                                  </button>
                                  <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2 bg-white shadow-sm border border-slate-100 rounded-lg" title="Excluir Produto">
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                             </td>
                           </tr>
                         )})}
                       </tbody>
                     </table>
                   </div>
                   
                   {/* Mobile Cards View */}
                   <div className="md:hidden flex flex-col p-4 gap-4 bg-slate-50">
                      {products.map((p) => {
                         const hasStock = Object.values(p.stock).some(val => val > 0);
                         
                         return (
                           <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                               <div className="flex items-center gap-4">
                                  <div className="w-20 h-20 shrink-0 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
                                      {p.imageUrl ? (
                                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                      ) : <Package className="text-slate-300" />}
                                  </div>
                                  <div className="flex-1">
                                      <p className="font-bold text-slate-800 leading-tight mb-2">{p.name}</p>
                                      <p className="font-black text-lg text-[var(--color-kora-green-dark)]">
                                        R$ {p.price.toFixed(2).replace('.', ',')}
                                      </p>
                                  </div>
                               </div>
                               <div>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Grade de Estoque Físico</p>
                                  <div className="flex flex-wrap gap-2">
                                      {['P', 'M', 'G', 'GG', 'XG', 'XGG', 'XGGG'].map(size => {
                                          const quant = p.stock?.[size] || 0;
                                          return (
                                            <span key={size} className={`px-2 py-1 text-xs rounded-lg font-bold min-w-[40px] text-center ${quant > 0 ? 'bg-green-100 text-green-700 border border-green-200 shadow-sm' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                                                {size}: {quant}
                                            </span>
                                          );
                                      })}
                                  </div>
                               </div>
                               <div className="flex gap-2 mt-2">
                                  <button onClick={() => openEdit(p)} className="flex-1 text-[var(--color-kora-blue)] bg-blue-50 hover:bg-blue-100 font-bold p-3 rounded-xl flex justify-center items-center gap-2 transition-colors border border-blue-100">
                                      <Pencil size={18} /> Editar
                                  </button>
                                  <button onClick={() => handleDelete(p.id)} className="flex-1 text-red-500 bg-red-50 hover:bg-red-100 font-bold p-3 rounded-xl flex justify-center items-center gap-2 transition-colors border border-red-100">
                                      <Trash2 size={18} /> Remover
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
      </div>
    </div>
  );
}
