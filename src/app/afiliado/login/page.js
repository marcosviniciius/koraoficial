"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Briefcase, Lock, User, ArrowRight } from "lucide-react";

export default function AfiliadoLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const q = query(
        collection(db, "affiliates"),
        where("email", "==", email),
        where("password", "==", password)
      );
      
      const snap = await getDocs(q);

      if (snap.empty) {
        setError("Credenciais inválidas. Verifique seu e-mail e senha.");
        setLoading(false);
        return;
      }

      // Valid Affiliate
      const affiliateData = snap.docs[0];
      
      // Save session in local storage
      localStorage.setItem("kora_affiliate_id", affiliateData.id);
      localStorage.setItem("kora_affiliate_name", affiliateData.data().name);
      
      router.push("/afiliado/dashboard");
      
    } catch (err) {
      console.error(err);
      setError("Erro no servidor ao tentar login.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
       
       <div className="text-center mb-10">
          <h1 className="font-logo text-5xl text-white mb-2 tracking-widest">KORA</h1>
          <p className="text-purple-400 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
             <Briefcase size={12} /> Portal B2B do Parceiro
          </p>
       </div>

       <div className="bg-white max-w-md w-full p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-indigo-500"></div>

          <h2 className="text-2xl font-black text-slate-800 mb-6 font-sans">Acesse seu Dashboard</h2>

          {error && (
             <div className="bg-red-50 text-red-600 text-sm font-bold p-3 rounded-xl mb-6 border border-red-100">
                {error}
             </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
             <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">E-mail de Acesso</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User size={18} className="text-slate-400"/>
                   </div>
                   <input
                     required
                     type="email"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium transition"
                     placeholder="seuemail@exemplo.com"
                   />
                </div>
             </div>

             <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Senha</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={18} className="text-slate-400"/>
                   </div>
                   <input
                     required
                     type="password"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium transition"
                     placeholder="••••••••"
                   />
                </div>
             </div>

             <button
               disabled={loading}
               type="submit"
               className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-200 transition-all disabled:opacity-70 mt-4"
             >
               {loading ? "Autenticando..." : "Entrar no Portal"} <ArrowRight size={20} />
             </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
             <p className="text-xs text-slate-400">Esqueceu sua senha? Solicite uma nova ao seu gestor Kora via WhatsApp.</p>
          </div>
       </div>

    </div>
  );
}
