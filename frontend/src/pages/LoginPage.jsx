import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { MdArchive, MdEmail, MdLock } from "react-icons/md";

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
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center
                          justify-center mb-3 shadow-lg">
            <MdArchive className="text-zinc-200 text-3xl" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-800 tracking-tight">ArchiFlow</h1>
          <p className="text-zinc-500 text-sm mt-1">Système de gestion des archives</p>
        </div>

        {/* Carte */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
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
              disabled={loading}
              className="w-full bg-zinc-800 text-white py-2.5 rounded-lg text-sm
                         font-semibold hover:bg-zinc-700 transition disabled:opacity-50 mt-2"
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>

          </form>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-6">
          ArchiFlow © {new Date().getFullYear()} — Accès réservé
        </p>
      </div>
    </div>
  );
}