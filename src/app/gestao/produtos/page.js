"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminSidebar from "@/components/AdminSidebar";
import { ChevronLeft, ChevronRight, ImagePlus, Package, Pencil, Plus, Ruler, Search, Star, Target, Trash2, Upload } from "lucide-react";
import { SIZE_CHARTS } from "@/constants/sizeCharts";
import { getProductGallery, normalizeProductMedia } from "@/lib/productMedia";

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

const createGalleryItem = (url, index = 0, alt = "") => ({
  id: `gallery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${index}`,
  url,
  alt,
  isCover: index === 0,
  order: index,
});

const syncGalleryItems = (items = []) =>
  items
    .filter((item) => item && typeof item.url === "string" && item.url)
    .map((item, index) => ({
      ...item,
      id: item.id || createGalleryItem(item.url, index).id,
      isCover: index === 0,
      order: index,
    }));

export default function GestaoProdutos() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Geral");

  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Lançamentos");
  const [galleryItems, setGalleryItems] = useState([]);

  const [sizeChartFile, setSizeChartFile] = useState(null);
  const [existingSizeChartUrl, setExistingSizeChartUrl] = useState(null);
  const [sizeChartType, setSizeChartType] = useState("custom");

  const [stock, setStock] = useState({
    P: 0, M: 0, G: 0, GG: 0, XG: 0, XGG: 0, XGGG: 0
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "products"));
      const data = snapshot.docs.map((doc) => normalizeProductMedia({ id: doc.id, ...doc.data() }));
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

  const categories = ["Geral", "Lançamentos", "Premier League", "La Liga", "Série A (Itália)", "Brasileirão", "Seleções", "Retrô", "Outras Ligas"];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "Geral" || p.category === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    // Para novo cadastro, imagem é obrigatória. Para edição, não.
    if(!name || !price || galleryItems.length === 0) {
        alert("Preencha todos os campos e monte a galeria do produto!");
        return;
    }

    setIsUploading(true);
    try {
      let finalSizeChartUrl = existingSizeChartUrl;

      // Se houver nova foto, comprime e usa a nova. Caso contrário, mantém a antiga.
      if (sizeChartFile) {
        finalSizeChartUrl = await compressImageToBase64(sizeChartFile);
      }

      const finalGallery = syncGalleryItems(galleryItems);

      const productData = {
        name,
        price: parseFloat(price),
        category,
        imageUrl: finalGallery[0]?.url || "",
        gallery: finalGallery,
        sizeChartUrl: finalSizeChartUrl || null,
        sizeChartType: sizeChartType || "custom",
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
    setGalleryItems(syncGalleryItems(getProductGallery(product)));
    setExistingSizeChartUrl(product.sizeChartUrl || null);
    setSizeChartType(product.sizeChartType || "custom");
    setSizeChartFile(null);
    setIsAdding(true);
  };

  const closeAndClear = () => {
    setIsAdding(false);
    setEditingProduct(null);
    setName("");
    setPrice("");
    setCategory("Lançamentos");
    setGalleryItems([]);
    setSizeChartFile(null);
    setExistingSizeChartUrl(null);
    setSizeChartType("custom");
    setStock({ P: 0, M: 0, G: 0, GG: 0, XG: 0, XGG: 0, XGGG: 0 });
  };

  const handleGalleryUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setIsUploading(true);
    try {
      const newItems = [];

      for (const [index, file] of files.entries()) {
        const base64 = await compressImageToBase64(file);
        newItems.push(createGalleryItem(base64, galleryItems.length + index, name || `Imagem ${galleryItems.length + index + 1}`));
      }

      setGalleryItems((current) => syncGalleryItems([...current, ...newItems]));
    } catch (error) {
      console.error(error);
      alert("Erro ao processar as imagens da galeria.");
    } finally {
      event.target.value = "";
      setIsUploading(false);
    }
  };

  const handleRemoveGalleryItem = (targetId) => {
    setGalleryItems((current) => syncGalleryItems(current.filter((item) => item.id !== targetId)));
  };

  const handleSetCover = (targetId) => {
    setGalleryItems((current) => {
      const target = current.find((item) => item.id === targetId);
      if (!target) return current;
      return syncGalleryItems([target, ...current.filter((item) => item.id !== targetId)]);
    });
  };

  const handleMoveGalleryItem = (targetId, direction) => {
    setGalleryItems((current) => {
      const index = current.findIndex((item) => item.id === targetId);
      if (index === -1) return current;

      const nextIndex = direction === "left" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= current.length) return current;

      const reordered = [...current];
      [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
      return syncGalleryItems(reordered);
    });
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-slate-500 mb-2 block flex items-center gap-2">
                                      <ImagePlus size={16}/>
                                      Galeria do Produto
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleGalleryUpload}
                                        className="w-full border-2 border-dashed border-gray-200 p-6 rounded-xl text-center text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-[var(--color-kora-blue)] hover:file:bg-blue-100 transition-colors"
                                    />
                                    <p className="text-xs text-slate-400 mt-2">
                                      Envie quantas fotos quiser. VocíƒÂª pode reordenar, remover e definir a capa abaixo.
                                    </p>
                                </div>

                                {galleryItems.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {galleryItems.map((image, index) => (
                                            <div key={image.id} className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                                                <div className="relative aspect-square bg-slate-100">
                                                    <img src={image.url} alt={image.alt || `${name || "Produto"} ${index + 1}`} className="w-full h-full object-cover" />
                                                    {index === 0 && (
                                                        <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-950">
                                                            <Star size={10} />
                                                            Capa
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-2.5 space-y-2">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button type="button" onClick={() => handleMoveGalleryItem(image.id, "left")} disabled={index === 0} className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 px-2 py-2 text-xs font-bold text-slate-500 disabled:opacity-40">
                                                            <ChevronLeft size={14}/> Antes
                                                        </button>
                                                        <button type="button" onClick={() => handleMoveGalleryItem(image.id, "right")} disabled={index === galleryItems.length - 1} className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 px-2 py-2 text-xs font-bold text-slate-500 disabled:opacity-40">
                                                            Depois <ChevronRight size={14}/>
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button type="button" onClick={() => handleSetCover(image.id)} disabled={index === 0} className="rounded-xl bg-amber-50 px-2 py-2 text-xs font-bold text-amber-700 border border-amber-100 disabled:opacity-40">
                                                            Definir capa
                                                        </button>
                                                        <button type="button" onClick={() => handleRemoveGalleryItem(image.id)} className="rounded-xl bg-red-50 px-2 py-2 text-xs font-bold text-red-600 border border-red-100">
                                                            Remover
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        {/* Size Chart Selection */}
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Ruler size={20} className="text-[var(--color-kora-blue)]" />
                                <h4 className="font-bold text-slate-800">Guia de Tamanhos</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-bold text-slate-500 mb-1 block">Tipo de Tabela</label>
                                    <select
                                        value={sizeChartType}
                                        onChange={e => setSizeChartType(e.target.value)}
                                        className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-kora-blue)] bg-white font-bold"
                                    >
                                        <option value="custom">Personalizada (Upload de Imagem)</option>
                                        {Object.keys(SIZE_CHARTS).map(key => (
                                            <option key={key} value={key}>Tabela Padrão: {SIZE_CHARTS[key].name}</option>
                                        ))}
                                    </select>
                                </div>

                                {sizeChartType === "custom" ? (
                                    <div>
                                        <label className="text-sm font-bold text-slate-500 mb-1 block">Upload da Imagem</label>
                                        <div className="flex items-center gap-4">
                                            {editingProduct && existingSizeChartUrl && (
                                                <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                                                    <img src={existingSizeChartUrl} alt="Tabela atual" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <input
                                                type="file" accept="image/*"
                                                onChange={e => setSizeChartFile(e.target.files[0])}
                                                className="flex-1 border-2 border-dashed border-gray-200 p-2 rounded-xl text-xs text-slate-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 transition-colors"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Prévia da Tabela {SIZE_CHARTS[sizeChartType].name}</p>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-[10px]">
                                                <thead>
                                                    <tr className="border-b border-slate-100">
                                                        {SIZE_CHARTS[sizeChartType].headers.map(h => <th key={h} className="text-left py-1">{h}</th>)}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {SIZE_CHARTS[sizeChartType].rows.slice(0, 3).map((row, i) => (
                                                        <tr key={i} className="border-b border-slate-50 last:border-0">
                                                            {row.map((cell, j) => <td key={j} className="py-1">{cell}</td>)}
                                                        </tr>
                                                    ))}
                                                    <tr>
                                                        <td colSpan={SIZE_CHARTS[sizeChartType].headers.length} className="text-center pt-1 text-slate-300 italic">...e demais tamanhos</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                        <p className="text-xs text-slate-400 mt-2">Todas as imagens da galeria e da tabela são comprimidas no navegador (Base64) para caber melhor na base.</p>

                        {/* Stock Management Area */}
                        <div>
                            <label className="text-sm font-bold text-slate-500 mb-2 block flex items-center gap-2"><Target size={16}/> Quantidades em Estoque Físico (Pronta Entrega)</label>
                            <p className="text-xs text-slate-400 mb-4">Deixe &quot;0&quot; nos tamanhos que você não tem em mãos. Se estiver 0, a loja automaticamente trocará para o botão de Encomenda (Prazo de 25 a 30 dias úteis).</p>

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

            {/* Filters & Search */}
            {!isAdding && (
               <div className="mb-6 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 no-scrollbar">
                          {categories.map(cat => (
                              <button
                                  key={cat}
                                  onClick={() => setActiveTab(cat)}
                                  className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${
                                      activeTab === cat
                                      ? 'bg-[var(--color-kora-blue)] text-white border-[var(--color-kora-blue)] shadow-md shadow-blue-200'
                                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                  }`}
                              >
                                  {cat}
                              </button>
                          ))}
                      </div>

                      <div className="relative w-full md:w-72">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input
                              type="text"
                              placeholder="Buscar camisa..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-[var(--color-kora-blue)] transition-all text-sm"
                          />
                      </div>
                  </div>
               </div>
            )}

            {/* List */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
               {loading ? (
                 <div className="p-8 text-center text-slate-500">Carregando catálogo...</div>
               ) : filteredProducts.length === 0 ? (
                 <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                    <Package size={48} className="text-slate-200 mb-4" />
                    <p className="mb-4">Nenhum produto encontrado nesta visualização.</p>
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
                          {filteredProducts.map((p) => {
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
                                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 mt-1">
                                  {(p.gallery?.length || 1)} fotos na galeria
                                </p>
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
                       {filteredProducts.map((p) => {
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
                                       <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 mb-2">
                                         {(p.gallery?.length || 1)} fotos
                                       </p>
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
