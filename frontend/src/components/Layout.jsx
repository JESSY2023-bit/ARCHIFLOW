import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  MdDashboard, MdFolderOpen, MdUploadFile,
  MdPeople, MdLogout, MdArchive, MdAccountCircle,
} from "react-icons/md";
import ToastContainer from "./Toast";
import { useToastStore } from "../store/toastStore";

// ✅ navItems SANS filtre ici — le filtre se fait dans le composant
const ALL_NAV_ITEMS = [
  { to: "/dashboard", label: "Tableau de bord", icon: MdDashboard,     roles: ["admin", "editeur"] },
  { to: "/archives",  label: "Archives",         icon: MdFolderOpen,    roles: ["admin", "editeur", "lecteur"] },
  { to: "/upload",    label: "Déposer",           icon: MdUploadFile,    roles: ["admin", "editeur"] },
  { to: "/users",     label: "Utilisateurs",      icon: MdPeople,        roles: ["admin"] },
  { to: "/profile",   label: "Mon profil",        icon: MdAccountCircle, roles: ["admin", "editeur", "lecteur"] },
];

export default function Layout() {
  // ✅ useAuthStore appelé DANS le composant
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
const { toasts, remove } = useToastStore();

  // ✅ Filtre ici, dans le corps du composant
  const navItems = ALL_NAV_ITEMS.filter((item) =>
    item.roles.includes(user?.role)
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-slate-100">

      {/* ── Sidebar ── */}
      <aside className="w-64 bg-slate-900 flex flex-col">

        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-700 flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
            <MdArchive className="text-slate-200 text-lg" />
          </div>
          <div>
            <span className="text-white font-bold tracking-wide text-sm">ArchiFlow</span>
            <div className="text-slate-500 text-xs">Gestion documentaire</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                 ${isActive
                   ? "bg-slate-700 text-white"
                   : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                 }`
              }
            >
              <Icon className="text-lg flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Profil + Déconnexion */}
        <div className="px-4 py-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-600 text-slate-200
                            text-xs flex items-center justify-center font-bold flex-shrink-0">
              {(user?.first_name || user?.email || "?")[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-medium text-slate-200 truncate">
                {user?.first_name
                  ? `${user.first_name} ${user.last_name}`
                  : user?.email || "Utilisateur"}
              </div>
              <div className="text-xs text-slate-500 capitalize">{user?.role || "—"}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-slate-500
                       hover:text-rose-400 transition w-full"
          >
            <MdLogout className="text-sm" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Contenu principal ── */}
      <main className="flex-1 overflow-y-auto">

        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-8 py-4
                           flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-slate-700">ArchiFlow</h1>
            <p className="text-xs text-slate-400">Système de gestion des archives</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 capitalize">{user?.role || ""}</span>
            <div className="w-8 h-8 rounded-full bg-slate-700 text-white text-xs
                            flex items-center justify-center font-bold">
              {(user?.first_name || user?.email || "?")[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>
<div className="flex h-screen bg-slate-100">
    {/* ... tout le reste ... */}

    {/* ✅ Toast notifications */}
    <ToastContainer toasts={toasts} onRemove={remove} />
  </div>
);
    </div>
  );
}