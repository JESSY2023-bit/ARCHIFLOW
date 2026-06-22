import { createElement } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import ToastContainer from "./Toast";
import { useToastStore } from "../store/toastStore";
import tenant from "../config/tenant";
import {
  MdDashboard,
  MdFolderOpen,
  MdUploadFile,
  MdPeople,
  MdLogout,
  MdAccountCircle,
  MdCategory,
} from "react-icons/md";

const ALL_NAV_ITEMS = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: MdDashboard, roles: ["admin", "editeur"] },
  { to: "/archives", labelKey: "nav.archives", icon: MdFolderOpen, roles: ["admin", "editeur", "lecteur"] },
  { to: "/categories", labelKey: "nav.categories", icon: MdCategory, roles: ["admin"] },
  { to: "/upload", labelKey: "nav.upload", icon: MdUploadFile, roles: ["admin", "editeur"] },
  { to: "/users", labelKey: "nav.users", icon: MdPeople, roles: ["admin"] },
  { to: "/profile", labelKey: "nav.profile", icon: MdAccountCircle, roles: ["admin", "editeur", "lecteur"] },
];

export default function Layout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const { toasts, remove } = useToastStore();
  const navigate = useNavigate();

  const navItems = ALL_NAV_ITEMS.filter((item) => item.roles.includes(user?.role));
  const displayName = user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user?.email || t("nav.profile");
  const roleLabel = user?.role ? t(`roles.${user.role}`) : "";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleLanguage = () => {
    const nextLanguage = i18n.language === "fr" ? "en" : "fr";
    localStorage.setItem("archiflow_language", nextLanguage);
    i18n.changeLanguage(nextLanguage);
  };

  return (
    <div className="flex h-screen bg-slate-100">
      <aside className="w-64 bg-slate-900 flex flex-col shadow-xl">
        <div className="px-6 py-5 border-b border-slate-700/50 flex items-center gap-3">
          <div
            style={{ backgroundColor: "var(--color-primary)" }}
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
          >
            <span className="text-white text-lg">{tenant.logoIcon}</span>
          </div>
          <div>
            <span className="text-white font-bold tracking-wide text-sm">{tenant.name}</span>
            <div className="text-slate-500 text-xs">{tenant.tagline}</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-0.5">
          {navItems.map(({ to, labelKey, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive ? "text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                }`
              }
              style={({ isActive }) => (isActive ? { backgroundColor: "var(--color-primary)" } : {})}
            >
              {({ isActive }) => (
                <>
                  <span className={`flex-shrink-0 transition-transform duration-150 ${isActive ? "scale-110" : ""}`}>
                    {createElement(icon, { className: "text-lg" })}
                  </span>
                  {t(labelKey)}
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-slate-700/50">
          <div
            className="flex items-center gap-3 mb-3 p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            onClick={() => navigate("/profile")}
          >
            <div
              style={{ backgroundColor: "var(--color-primary)" }}
              className="w-8 h-8 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0 shadow-lg"
            >
              {(user?.first_name || user?.email || "?")[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-medium text-slate-200 truncate">{displayName}</div>
              <div className="text-xs text-slate-500 capitalize">{roleLabel || "-"}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-rose-400 transition w-full px-2 py-1.5 rounded-lg hover:bg-slate-800"
          >
            <MdLogout className="text-sm" /> {t("nav.logout")}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-sm font-semibold text-slate-700">{tenant.name}</h1>
            <p className="text-xs text-slate-400">{tenant.tagline}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 capitalize bg-slate-100 px-2 py-1 rounded-full">
              {roleLabel}
            </span>
            <div
              style={{ backgroundColor: "var(--color-primary)" }}
              className="w-8 h-8 rounded-full text-white text-xs flex items-center justify-center font-bold cursor-pointer hover:scale-105 transition-transform shadow-lg"
              onClick={() => navigate("/profile")}
            >
              {(user?.first_name || user?.email || "?")[0].toUpperCase()}
            </div>
            <button
              onClick={toggleLanguage}
              className="text-xs border border-slate-200 text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition font-medium"
            >
              {t("nav.language")}
            </button>
          </div>
        </header>

        <div className="p-8 animate-fade-in">
          <Outlet />
        </div>
      </main>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
