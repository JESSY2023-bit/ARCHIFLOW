import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import ToastContainer from "./Toast";
import { useToastStore } from "../store/toastStore";
import tenant from "../config/tenant";
import {
  MdDashboard, MdFolderOpen, MdUploadFile,
  MdPeople, MdLogout, MdAccountCircle, MdCategory,
} from "react-icons/md";

const ALL_NAV_ITEMS = [
  { to: "/dashboard",  label: "Tableau de bord", icon: MdDashboard,     roles: ["admin", "editeur"] },
  { to: "/archives",   label: "Archives",         icon: MdFolderOpen,    roles: ["admin", "editeur", "lecteur"] },
  { to: "/categories", label: "Catégories",       icon: MdCategory,      roles: ["admin"] },
  { to: "/upload",     label: "Déposer",           icon: MdUploadFile,    roles: ["admin", "editeur"] },
  { to: "/users",      label: "Utilisateurs",      icon: MdPeople,        roles: ["admin"] },
  { to: "/profile",    label: "Mon profil",        icon: MdAccountCircle, roles: ["admin", "editeur", "lecteur"] },
];

export default function Layout() {
  const { user, logout }   = useAuthStore();
  const { toasts, remove } = useToastStore();
  const navigate           = useNavigate();

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
      <aside className="w-64 bg-slate-900 flex flex-col shadow-xl">

        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-700/50 flex items-center gap-3">
          <div
            style={{ backgroundColor: "var(--color-primary)" }}
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
          >
            <span className="text-white text-lg">{tenant.logoIcon}</span>
          </div>
          <div>
            <span className="text-white font-bold tracking-wide text-sm">
              {tenant.name}
            </span>
            <div className="text-slate-500 text-xs">{tenant.tagline}</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                 transition-all duration-150
                 ${isActive
                   ? "text-white"
                   : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                 }`
              }
              style={({ isActive }) =>
                isActive ? { backgroundColor: "var(--color-primary)" } : {}
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`flex-shrink-0 transition-transform duration-150
                                    ${isActive ? "scale-110" : ""}`}>
                    <Icon className="text-lg" />
                  </span>
                  {label}
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Profil + Déconnexion */}
        <div className="px-4 py-4 border-t border-slate-700/50">
          <div
            className="flex items-center gap-3 mb-3 p-2 rounded-xl hover:bg-slate-800
                       transition cursor-pointer"
            onClick={() => navigate("/profile")}
          >
            <div
              style={{ backgroundColor: "var(--color-primary)" }}
              className="w-8 h-8 rounded-full text-white text-xs flex items-center
                         justify-center font-bold flex-shrink-0 shadow-lg"
            >
              {(user?.first_name || user?.email || "?")[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-medium text-slate-200 truncate">
                {user?.first_name
                  ? `${user.first_name} ${user.last_name}`
                  : user?.email || "Utilisateur"}
              </div>
              <div className="text-xs text-slate-500 capitalize">
                {user?.role || "—"}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-slate-500
                       hover:text-rose-400 transition w-full px-2 py-1.5
                       rounded-lg hover:bg-slate-800"
          >
            <MdLogout className="text-sm" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Contenu principal ── */}
      <main className="flex-1 overflow-y-auto">

        {/* Topbar */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200
                           px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-sm font-semibold text-slate-700">{tenant.name}</h1>
            <p className="text-xs text-slate-400">{tenant.tagline}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 capitalize bg-slate-100
                             px-2 py-1 rounded-full">
              {user?.role || ""}
            </span>
            <div
              style={{ backgroundColor: "var(--color-primary)" }}
              className="w-8 h-8 rounded-full text-white text-xs flex items-center
                         justify-center font-bold cursor-pointer hover:scale-105
                         transition-transform shadow-lg"
              onClick={() => navigate("/profile")}
            >
              {(user?.first_name || user?.email || "?")[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page */}
        <div className="p-8 animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={remove} />

    </div>
  );
}