"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simplified Login for Phase 2 MVP. 
    // Usually we use Firebase Auth: signInWithEmailAndPassword, but since they want to test the flow,
    // we use a hardcoded safe pass, or bypass it visually to test Phase 2.
    if (email === "admin@kora.com" && password === "admin123") {
      router.push("/gestao/financeiro");
    } else {
      alert("Acesso negado. Use admin@kora.com e admin123");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
       <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full border border-slate-100">
          <div className="flex justify-center mb-6">
             <div className="bg-[var(--color-kora-blue)] text-white p-4 rounded-full">
               <ShieldAlert size={32} />
             </div>
          </div>
          <h1 className="font-logo text-3xl text-center text-slate-800 mb-2">KORA GESTÃO</h1>
          <p className="text-center text-sm text-slate-500 mb-8">Acesso restrito para administradores.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="email" 
              required
              placeholder="E-mail" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[var(--color-kora-blue)] outline-none"
            />
            <input 
              type="password" 
              required
              placeholder="Senha" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[var(--color-kora-blue)] outline-none"
            />
            <button type="submit" className="w-full bg-[var(--color-kora-blue)] hover:bg-[var(--color-kora-blue-dark)] text-white font-bold py-3 rounded-xl transition-colors">
               Entrar no Painel
            </button>
          </form>
       </div>
    </div>
  );
}
