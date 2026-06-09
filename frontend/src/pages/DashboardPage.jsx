import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  MdFolderOpen, MdUploadFile, MdPeople, MdTrendingUp,
} from "react-icons/md";

// ── Données fictives ───────────────────────────────────────────────────────
const uploadsByMonth = [
  { mois: "Jan", documents: 12 },
  { mois: "Fév", documents: 19 },
  { mois: "Mar", documents: 8  },
  { mois: "Avr", documents: 25 },
  { mois: "Mai", documents: 31 },
  { mois: "Jun", documents: 22 },
  { mois: "Jul", documents: 17 },
  { mois: "Aoû", documents: 29 },
];

const byType = [
  { type: "PDF",   total: 48 },
  { type: "Word",  total: 27 },
  { type: "Excel", total: 19 },
  { type: "CSV",   total: 6  },
];

const byAuthor = [
  { name: "Alice",  value: 34 },
  { name: "Bob",    value: 28 },
  { name: "Carol",  value: 22 },
  { name: "Admin",  value: 16 },
];

const recentActivity = [
  { id: 1, action: "Ajout",       doc: "Contrat_ClientA.pdf",    user: "Alice",  time: "Il y a 5 min"  },
  { id: 2, action: "Téléchargé",  doc: "Budget_2024.xlsx",       user: "Bob",    time: "Il y a 18 min" },
  { id: 3, action: "Modifié",     doc: "Note_interne_RH.docx",   user: "Carol",  time: "Il y a 1h"     },
  { id: 4, action: "Supprimé",    doc: "Ancien_rapport_Q3.pdf",  user: "Admin",  time: "Il y a 2h"     },
  { id: 5, action: "Ajout",       doc: "Audit_Securite_2024.pdf",user: "Alice",  time: "Il y a 3h"     },
];

const PIE_COLORS = ["#0f766e", "#0d9488", "#14b8a6", "#99f6e4"];

const actionBadge = {
  "Ajout":        "bg-teal-50 text-teal-700 border border-teal-100",
  "Téléchargé":   "bg-slate-100 text-slate-600 border border-slate-200",
  "Modifié":      "bg-amber-50 text-amber-700 border border-amber-100",
  "Supprimé":     "bg-rose-50 text-rose-600 border border-rose-100",
};

// ── Carte stat ─────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
        <Icon className="text-xl text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────
export default function DashboardPage() {
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
          value="100"
          sub="+8 ce mois-ci"
          icon={MdFolderOpen}
          accent="bg-teal-700"
        />
        <StatCard
          label="Uploads ce mois"
          value="29"
          sub="vs 17 le mois dernier"
          icon={MdUploadFile}
          accent="bg-slate-700"
        />
        <StatCard
          label="Utilisateurs actifs"
          value="4"
          sub="3 rôles distincts"
          icon={MdPeople}
          accent="bg-teal-600"
        />
        <StatCard
          label="Croissance"
          value="+70%"
          sub="uploads vs mois précédent"
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
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={uploadsByMonth}>
              <defs>
                <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0f766e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0f766e" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="documents"
                stroke="#0f766e"
                strokeWidth={2}
                fill="url(#tealGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie — répartition par auteur */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            Documents par auteur
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={byAuthor}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {byAuthor.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, color: "#64748b" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Graphiques ligne 2 ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Barres — par type */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            Répartition par type
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byType} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="type" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Bar dataKey="total" fill="#0f766e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activité récente */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            Activité récente
          </h3>
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div key={item.id}
                className="flex items-center justify-between gap-3
                           py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700
                                  text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {item.user[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700 font-medium truncate">
                      {item.doc}
                    </p>
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
        </div>

      </div>
    </div>
  );
}