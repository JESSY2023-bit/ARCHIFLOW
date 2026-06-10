import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  MdFolderOpen, MdUploadFile, MdPeople, MdTrendingUp,
} from "react-icons/md";
import { getDocuments } from "../api/documents";
import { getUsers } from "../api/users";
import { useAuthStore } from "../store/authStore";

const PIE_COLORS = ["#0f766e", "#0d9488", "#14b8a6", "#99f6e4"];

const actionBadge = {
  "Ajout":      "bg-teal-50 text-teal-700 border border-teal-100",
  "Modifié":    "bg-amber-50 text-amber-700 border border-amber-100",
  "Supprimé":   "bg-rose-50 text-rose-600 border border-rose-100",
};

function StatCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
        <Icon className="text-xl text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        {/* ✅ value ?? 0 pour éviter undefined */}
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value ?? 0}</p>
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [docs, setDocs]   = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

 useEffect(() => {
  const promises = [getDocuments()];
  
  // On appelle getUsers() seulement si admin
  if (user?.role === "admin") {
    promises.push(getUsers());
  }

  Promise.all(promises)
    .then(([docsRes, usersRes]) => {
      setDocs(docsRes.data.results || docsRes.data);
      if (usersRes) setUsers(usersRes.data.results || usersRes.data);
    })
    .catch(() => {})
    .finally(() => setLoading(false));
}, []);

  // ── Stats calculées depuis les vraies données ──────────────────────────
  const totalDocs  = docs.length;
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active).length;

  // Documents par type
  const byType = ["PDF", "Word", "Excel", "CSV"].map((type) => ({
    type,
    total: docs.filter((d) => d.file_type === type).length,
  })).filter((t) => t.total > 0);

  // Documents par auteur
  const authorMap = {};
  docs.forEach((d) => {
    const name = d.author?.first_name
      ? `${d.author.first_name}`
      : d.author?.email?.split("@")[0] || "Inconnu";
    authorMap[name] = (authorMap[name] || 0) + 1;
  });
  const byAuthor = Object.entries(authorMap).map(([name, value]) => ({ name, value }));

  // Documents par mois (6 derniers mois)
  const monthMap = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString("fr-FR", { month: "short" });
    monthMap[key] = 0;
  }
  docs.forEach((d) => {
    const date = new Date(d.created_at);
    const key  = date.toLocaleDateString("fr-FR", { month: "short" });
    if (key in monthMap) monthMap[key]++;
  });
  const uploadsByMonth = Object.entries(monthMap).map(([mois, documents]) => ({ mois, documents }));

  // Activité récente (5 derniers docs)
  const recentActivity = [...docs]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
    .map((d) => ({
      id:     d.id,
      action: "Ajout",
      doc:    d.name,
      user:   d.author?.first_name || d.author?.email?.split("@")[0] || "—",
      time:   new Date(d.created_at).toLocaleDateString("fr-FR"),
    }));

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-slate-400">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent
                        rounded-full animate-spin" />
        Chargement du tableau de bord...
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Titre ── */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Tableau de bord</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Vue d'ensemble de l'activité ArchiFlow
        </p>
      </div>

      {/* ── Cartes stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total documents"
          value={totalDocs}
          sub="dans la base"
          icon={MdFolderOpen}
          accent="bg-teal-700"
        />
        <StatCard
  label="Uploads ce mois"
  value={uploadsByMonth.length > 0
    ? (uploadsByMonth[uploadsByMonth.length - 1]?.documents ?? 0)
    : 0}
  sub="ce mois-ci"
  icon={MdUploadFile}
  accent="bg-slate-700"
/>
        <StatCard
          label="Utilisateurs"
          value={totalUsers}
          sub={`${activeUsers} actif${activeUsers > 1 ? "s" : ""}`}
          icon={MdPeople}
          accent="bg-teal-600"
        />
        <StatCard
          label="Types de fichiers"
          value={byType.length}
          sub="formats différents"
          icon={MdTrendingUp}
          accent="bg-slate-600"
        />
      </div>

      {/* ── Graphiques ligne 1 ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Aires — uploads par mois */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            Uploads par mois
          </h3>
          {uploadsByMonth.every((m) => m.documents === 0) ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
              Aucun document uploadé encore.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={uploadsByMonth}>
                <defs>
                  <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0f766e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mois" tick={{ fontSize: 12, fill: "#94a3b8" }}
                       axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }}
                       axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Area type="monotone" dataKey="documents" stroke="#0f766e"
                      strokeWidth={2} fill="url(#tealGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie — répartition par auteur */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            Documents par auteur
          </h3>
          {byAuthor.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
              Aucune donnée.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byAuthor} cx="50%" cy="50%"
                     innerRadius={55} outerRadius={80}
                     paddingAngle={3} dataKey="value">
                  {byAuthor.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8}
                        wrapperStyle={{ fontSize: 12, color: "#64748b" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Graphiques ligne 2 ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Barres — par type */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            Répartition par type
          </h3>
          {byType.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              Aucun document.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byType} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="type" tick={{ fontSize: 12, fill: "#94a3b8" }}
                       axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }}
                       axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Bar dataKey="total" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Activité récente */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Activité récente</h3>
            <button
              onClick={() => navigate("/archives")}
              className="text-xs text-teal-600 hover:underline"
            >
              Voir tout →
            </button>
          </div>

          {recentActivity.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              Aucune activité récente.
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <div key={item.id}
                  onClick={() => navigate(`/archives/${item.id}`)}
                  className="flex items-center justify-between gap-3 py-2
                             border-b border-slate-100 last:border-0 cursor-pointer
                             hover:bg-slate-50 rounded-lg px-2 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700
                                    text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {(item.user[0] || "?").toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700 font-medium truncate">{item.doc}</p>
                      <p className="text-xs text-slate-400">{item.user} · {item.time}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                                    flex-shrink-0 ${actionBadge[item.action]}`}>
                    {item.action}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}