import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { MdArchive, MdEmail, MdLock } from "react-icons/md";
import tenant from "../config/tenant";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const { login }               = useAuthStore();
  const navigate                = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100">
      <div className="w-full max-w-md">

        {/* Logo */}
<div style={{ backgroundColor: "var(--color-accent)" }}
  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
  <span className="text-2xl">{tenant.logoIcon}</span>
</div>
<h1 className="text-2xl font-bold text-slate-800 tracking-tight">{tenant.name}</h1>
<p className="text-slate-500 text-sm mt-1">{tenant.tagline}</p>


        {/* Carte */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 animate-fade-in-scale">
          <h2 className="text-base font-semibold text-zinc-700 mb-6">
            Connexion à votre espace
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm
                            p-3 rounded-lg mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Adresse email
              </label>
              <div className="relative mt-1">
                <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2
                                    text-zinc-400 text-lg" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="vous@entreprise.com"
                  className="w-full border border-zinc-200 rounded-lg pl-9 pr-3 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Mot de passe
              </label>
              <div className="relative mt-1">
                <MdLock className="absolute left-3 top-1/2 -translate-y-1/2
                                   text-zinc-400 text-lg" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full border border-zinc-200 rounded-lg pl-9 pr-3 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>
            </div>

            <button
  type="submit"
  style={{ backgroundColor: "var(--color-primary)" }}
  className="w-full text-white py-2.5 rounded-lg text-sm font-semibold
             hover:opacity-90 transition disabled:opacity-50 mt-2"
>
  {loading ? "Connexion en cours..." : "Se connecter"}
</button>

          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
  {tenant.footerText}
</p>
      </div>
    </div>
  );
}