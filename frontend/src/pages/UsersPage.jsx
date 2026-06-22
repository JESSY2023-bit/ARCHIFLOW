import { createElement, useState, useEffect, useCallback } from "react";
import {
  MdPersonAdd, MdSearch, MdEdit, MdDelete,
  MdPerson, MdVisibility, MdClose,
  MdCheck, MdAdminPanelSettings,
} from "react-icons/md";
import { useTranslation } from "react-i18next";
import { getUsers, updateUser, deleteUser, inviteUser } from "../api/users";
import { useToastStore } from "../store/toastStore";
import Pagination from "../components/Pagination";

const roleBadge = {
  admin:   { labelKey: "roles.admin",   cls: "bg-teal-50 text-teal-700 border border-teal-100",     icon: MdAdminPanelSettings },
  editeur: { labelKey: "roles.editeur", cls: "bg-slate-100 text-slate-700 border border-slate-200", icon: MdEdit               },
  lecteur: { labelKey: "roles.lecteur", cls: "bg-amber-50 text-amber-700 border border-amber-100",  icon: MdVisibility         },
};

const statusBadge = {
  actif:   "bg-emerald-50 text-emerald-700 border border-emerald-100",
  inactif: "bg-rose-50 text-rose-500 border border-rose-100",
};

const PAGE_SIZE = 10;

// ── Modal invitation ───────────────────────────────────────────────────────
function InviteModal({ onClose, onSuccess }) {
  const { t } = useTranslation();
  const [form, setForm]       = useState({ email: "", role: "lecteur" });
  const [loading, setLoading] = useState(false);
  const { success, error }    = useToastStore();

  const handleInvite = async () => {
    setLoading(true);
    try {
      const res = await inviteUser(form);
      success(t("users.invite_success", { email: form.email }));
      console.log("🔗 Lien d'invitation (dev) :",
        `http://localhost:5173/set-password/${res.data.token}`);
      onSuccess();
      onClose();
    } catch (err) {
      error(err.response?.data?.error || t("users.invite_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in-scale">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-slate-800">{t("users.invite_title")}</h3>
          <button onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition">
            <MdClose className="text-xl" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("users.invite_email")}
            </label>
            <input type="email" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="jean@entreprise.com"
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5
                         text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("users.invite_role")}
            </label>
            <select value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5
                         text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="admin">{t("roles.admin")}</option>
              <option value="editeur">{t("roles.editeur")}</option>
              <option value="lecteur">{t("roles.lecteur")}</option>
            </select>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3
                          text-xs text-amber-700">
            {t("users.invite_info")}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 text-sm py-2.5
                       rounded-lg hover:bg-slate-50 transition font-medium">
            {t("actions.cancel")}
          </button>
          <button
            onClick={handleInvite}
            disabled={!form.email || loading}
            className="flex-1 bg-teal-700 text-white text-sm py-2.5 rounded-lg
                       hover:bg-teal-800 transition font-medium disabled:opacity-40"
          >
            {loading ? t("users.invite_sending") : t("users.invite_send")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal édition ──────────────────────────────────────────────────────────
function EditModal({ user, onClose, onSave }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    first_name: user.first_name || "",
    last_name:  user.last_name  || "",
    role:       user.role       || "lecteur",
    is_active:  user.is_active,
  });
  const [loading, setLoading] = useState(false);

  const handle = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(form);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in-scale">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-slate-800">{t("users.edit_title")}</h3>
          <button onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition">
            <MdClose className="text-xl" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {t("users.first_name")}
              </label>
              <input type="text" value={form.first_name}
                onChange={(e) => handle("first_name", e.target.value)}
                placeholder="Jean"
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5
                           text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {t("users.last_name")}
              </label>
              <input type="text" value={form.last_name}
                onChange={(e) => handle("last_name", e.target.value)}
                placeholder="Dupont"
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5
                           text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("profile.email")}
            </label>
            <input type="email" value={user.email} disabled
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5
                         text-sm bg-slate-50 text-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {t("users.role")}
              </label>
              <select value={form.role}
                onChange={(e) => handle("role", e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5
                           text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="admin">{t("roles.admin")}</option>
                <option value="editeur">{t("roles.editeur")}</option>
                <option value="lecteur">{t("roles.lecteur")}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {t("users.status")}
              </label>
              <select value={form.is_active ? "actif" : "inactif"}
                onChange={(e) => handle("is_active", e.target.value === "actif")}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5
                           text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="actif">{t("users.active_s")}</option>
                <option value="inactif">{t("users.inactive")}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 text-sm py-2.5
                       rounded-lg hover:bg-slate-50 transition font-medium">
            {t("actions.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-teal-700 text-white text-sm py-2.5 rounded-lg
                       hover:bg-teal-800 transition font-medium flex items-center
                       justify-center gap-2 disabled:opacity-40"
          >
            <MdCheck className="text-lg" />
            {loading ? t("profile.saving") : t("actions.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────
export default function UsersPage() {
  const { t, i18n } = useTranslation();
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterRole, setFilterRole] = useState("Tous");
  const [editModal, setEditModal]   = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [deleteId, setDeleteId]     = useState(null);
  const [page, setPage]             = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const { success, error: toastError } = useToastStore();

  // ── Chargement ────────────────────────────────────────────────────────
  const loadUsers = useCallback(() => {
    setLoading(true);
    getUsers({ page })
      .then((res) => {
        const data = res.data;
        if (data.results !== undefined) {
          setUsers(data.results);
          setTotalItems(data.count);
          setTotalPages(Math.ceil(data.count / PAGE_SIZE));
        } else {
          setUsers(data);
          setTotalItems(data.length);
          setTotalPages(1);
        }
      })
      .catch(() => toastError(t("users.error_load")))
      .finally(() => setLoading(false));
  }, [page, t, toastError]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadUsers, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadUsers]);

  // ── Filtrage local ────────────────────────────────────────────────────
  const filtered = users.filter((u) => {
    const name = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchRole   = filterRole === "Tous" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  // ── Édition ───────────────────────────────────────────────────────────
  const handleEdit = async (form) => {
    try {
      const res = await updateUser(editModal.id, form);
      setUsers((prev) => prev.map((u) => (u.id === editModal.id ? res.data : u)));
      setEditModal(null);
      success(t("users.updated"));
    } catch {
      toastError(t("users.error_update"));
    }
  };

  // ── Suppression ───────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await deleteUser(deleteId);
      setUsers((prev) => prev.filter((u) => u.id !== deleteId));
      setTotalItems((n) => n - 1);
      setDeleteId(null);
      success(t("users.deleted"));
    } catch {
      toastError(t("users.error_delete"));
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────
  const admins   = users.filter((u) => u.role === "admin").length;
  const editeurs = users.filter((u) => u.role === "editeur").length;
  const lecteurs = users.filter((u) => u.role === "lecteur").length;
  const actifs   = users.filter((u) => u.is_active).length;

  return (
    <div>

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{t("users.title")}</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {totalItems} {totalItems > 1 ? t("users.accounts") : t("users.account")} · {actifs} {actifs > 1 ? t("users.active") : t("users.active_s").toLowerCase()}
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800
                     text-white text-sm px-4 py-2 rounded-lg transition font-medium"
        >
          <MdPersonAdd className="text-lg" /> {t("users.invite")}
        </button>
      </div>

      {/* ── Cartes stats ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {[
          { label: t("users.admins"),   value: admins,   icon: MdAdminPanelSettings, cls: "bg-teal-700"  },
          { label: t("users.editors"), value: editeurs, icon: MdEdit,               cls: "bg-slate-600" },
          { label: t("users.readers"), value: lecteurs, icon: MdVisibility,         cls: "bg-slate-500" },
          { label: t("users.active"),   value: actifs,   icon: MdPerson,             cls: "bg-teal-600"  },
        ].map(({ label, value, icon, cls }) => (
          <div key={label}
            className="bg-white rounded-xl border border-slate-200 p-4
                       flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5
                       transition-all duration-200">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cls}`}>
              {createElement(icon, { className: "text-white text-lg" })}
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtres ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex gap-3">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2
                               text-slate-400 text-lg" />
          <input type="text" placeholder={t("users.search")}
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white
                     text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {["Tous", "admin", "editeur", "lecteur"].map((r) => (
            <option key={r} value={r}>
              {r === "Tous" ? t("users.all_roles") : t(`roles.${r}`)}
            </option>
          ))}
        </select>
      </div>

      {/* ── Tableau ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {[t("users.user"), t("users.role"), t("users.status"), t("users.since"), t("users.actions")].map((h) => (
                <th key={h}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-500
                             uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">

            {loading && (
              <tr>
                <td colSpan={5} className="text-center py-14 text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent
                                    rounded-full animate-spin" />
                    {t("actions.loading")}
                  </div>
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-14 text-slate-400">
                  <MdPerson className="text-4xl mx-auto mb-2 text-slate-300" />
                  {t("users.no_users")}
                </td>
              </tr>
            )}

            {!loading && filtered.map((u) => {
              const role     = roleBadge[u.role] || roleBadge["lecteur"];
              const status   = u.is_active ? "actif" : "inactif";
              return (
                <tr key={u.id} className="hover:bg-slate-50 transition">

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700
                                      text-sm flex items-center justify-center font-bold">
                        {(u.first_name || u.email || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">
                          {u.first_name ? `${u.first_name} ${u.last_name}` : u.email}
                        </p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium
                                      px-2 py-1 rounded-full ${role.cls}`}>
                      {createElement(role.icon, { className: "text-sm" })}
                      {t(role.labelKey)}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full
                                      ${statusBadge[status]}`}>
                      {u.is_active ? t("users.active_s") : t("users.inactive")}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(u.date_joined).toLocaleDateString(i18n.language === "en" ? "en-US" : "fr-FR")}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setEditModal(u)}
                        className="text-slate-400 hover:text-teal-600 transition"
                        title={t("actions.edit")}>
                        <MdEdit className="text-lg" />
                      </button>
                      <button onClick={() => setDeleteId(u.id)}
                        className="text-slate-400 hover:text-rose-500 transition"
                        title={t("actions.delete")}>
                        <MdDelete className="text-lg" />
                      </button>
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      {/* ── Modal invitation ── */}
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSuccess={loadUsers}
        />
      )}

      {/* ── Modal édition ── */}
      {editModal && (
        <EditModal
          user={editModal}
          onClose={() => setEditModal(null)}
          onSave={handleEdit}
        />
      )}

      {/* ── Confirmation suppression ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm
                          animate-fade-in-scale">
            <h3 className="text-base font-bold text-slate-800 mb-2">
              {t("users.delete_title")}
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              {t("users.delete_info")}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 border border-slate-200 text-slate-600 text-sm py-2.5
                           rounded-lg hover:bg-slate-50 transition font-medium">
                {t("actions.cancel")}
              </button>
              <button onClick={handleDelete}
                className="flex-1 bg-rose-500 text-white text-sm py-2.5 rounded-lg
                           hover:bg-rose-600 transition font-medium">
                {t("actions.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
