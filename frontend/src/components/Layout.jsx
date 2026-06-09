import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  MdDashboard,
  MdFolderOpen,
  MdUploadFile,
  MdPeople,
  MdLogout,
  MdArchive,
} from "react-icons/md";

const navItems = [
  { to: "/dashboard", label: "Tableau de bord", icon: MdDashboard },
  { to: "/archives",  label: "Archives",         icon: MdFolderOpen },
  { to: "/upload",    label: "Déposer",           icon: MdUploadFile },
  { to: "/users",     label: "Utilisateurs",      icon: MdPeople },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-zinc-100">

      {/* ── Sidebar ── */}
      <aside className="w-64 bg-zinc-900 flex flex-col">

        {/* Logo */}
        <div className="px-6 py-5 border-b border-zinc-700 flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-600 rounded-lg flex items-center justify-center">
            <MdArchive className="text-zinc-200 text-lg" />
          </div>
          <div>
            <span className="text-white font-bold tracking-wide text-sm">ArchiFlow</span>
            <div className="text-zinc-500 text-xs">Gestion documentaire</div>
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
                   ? "bg-zinc-700 text-white"
                   : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                 }`
              }
            >
              <Icon className="text-lg flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Profil + Déconnexion */}
        <div className="px-4 py-4 border-t border-zinc-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-zinc-600 text-zinc-200 text-xs
                            flex items-center justify-center font-bold flex-shrink-0">
              {(user?.name || user?.email || "?")[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-medium text-zinc-200 truncate">
                {user?.name || user?.email || "Utilisateur"}
              </div>
              <div className="text-xs text-zinc-500 capitalize">{user?.role || "—"}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-zinc-500
                       hover:text-red-400 transition w-full"
          >
            <MdLogout className="text-sm" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Contenu principal ── */}
      <main className="flex-1 overflow-y-auto">

        {/* Topbar */}
        <header className="bg-white border-b border-zinc-200 px-8 py-4
                           flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-zinc-700">ArchiFlow</h1>
            <p className="text-xs text-zinc-400">Système de gestion des archives</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 capitalize">
              {user?.role || ""}
            </span>
            <div className="w-8 h-8 rounded-full bg-zinc-700 text-white text-xs
                            flex items-center justify-center font-bold">
              {(user?.name || user?.email || "?")[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>

    </div>
  );
}