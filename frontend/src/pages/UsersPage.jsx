import { useState, useEffect } from "react";
import {
  MdPersonAdd, MdSearch, MdEdit, MdDelete,
  MdPerson, MdVisibility, MdClose,
  MdCheck, MdAdminPanelSettings,
} from "react-icons/md";
import { getUsers, createUser, updateUser, deleteUser } from "../api/users";
import { useToastStore } from "../store/toastStore";
import Pagination from "../components/Pagination";

const roleBadge = {
  admin:   { label: "Admin",   cls: "bg-teal-50 text-teal-700 border border-teal-100",     icon: MdAdminPanelSettings },
  editeur: { label: "Éditeur", cls: "bg-slate-100 text-slate-700 border border-slate-200", icon: MdEdit               },
  lecteur: { label: "Lecteur", cls: "bg-amber-50 text-amber-700 border border-amber-100",  icon: MdVisibility         },
};

const statusBadge = {
  actif:   "bg-emerald-50 text-emerald-700 border border-emerald-100",
  inactif: "bg-rose-50 text-rose-500 border border-rose-100",
};

const PAGE_SIZE = 10;

// ── Modal ajout / édition ──────────────────────────────────────────────────
function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState(
    user
      ? { first_name: user.first_name, last_name: user.last_name,
          email: user.email, role: user.role, is_active: user.is_active }
      : { first_name: "", last_name: "", email: "", role: "lecteur", is_active: true }
  );
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-slate-800">
            {user ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
          </h3>
          <button onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition">
            <MdClose className="text-xl" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Prénom
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
                Nom
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
              Adresse email
            </label>
            <input type="email" value={form.email}
              onChange={(e) => handle("email", e.target.value)}
              placeholder="jean@entreprise.com"
              disabled={!!user}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5
                         text-sm focus:outline-none focus:ring-2 focus:ring-teal-500
                         disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Rôle
              </label>
              <select value={form.role}
                onChange={(e) => handle("role", e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5
                           text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="admin">Admin</option>
                <option value="editeur">Éditeur</option>
                <option value="lecteur">Lecteur</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Statut
              </label>
              <select value={form.is_active ? "actif" : "inactif"}
                onChange={(e) => handle("is_active", e.target.value === "actif")}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5
                           text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 text-sm py-2.5
                       rounded-lg hover:bg-slate-50 transition font-medium">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!form.email || loading}
            className="flex-1 bg-teal-700 text-white text-sm py-2.5 rounded-lg
                       hover:bg-teal-800 transition font-medium flex items-center
                       justify-center gap-2 disabled:opacity-40"
          >
            <MdCheck className="text-lg" />
            {loading ? "Enregistrement..." : user ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterRole, setFilterRole] = useState("Tous");
  const [modal, setModal]           = useState(null);
  const [deleteId, setDeleteId]     = useState(null);
  const [page, setPage]             = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const { success, error: toastError } = useToastStore();

  // ── Chargement ────────────────────────────────────────────────────────
  useEffect(() => {
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
      .catch(() => toastError("Erreur chargement utilisateurs"))
      .finally(() => setLoading(false));
  }, [page]);

  // ── Filtrage local ────────────────────────────────────────────────────
  const filtered = users.filter((u) => {
    const name = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchRole   = filterRole === "Tous" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  // ── CRUD ──────────────────────────────────────────────────────────────
  const saveUser = async (form) => {
    try {
      if (modal === "add") {
        const res = await createUser({
          ...form,
          username: form.email,
          password: "archiflow2024",
        });
        setUsers((prev) => [...prev, res.data]);
        setTotalItems((n) => n + 1);
        success(`Utilisateur créé ! Mot de passe par défaut : archiflow2024`);
      } else {
        const res = await updateUser(modal.id, form);
        setUsers((prev) => prev.map((u) => (u.id === modal.id ? res.data : u)));
        success("Utilisateur mis à jour avec succès.");
      }
      setModal(null);
    } catch {
      toastError("Erreur lors de la sauvegarde.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(deleteId);
      setUsers((prev) => prev.filter((u) => u.id !== deleteId));
      setTotalItems((n) => n - 1);
      setDeleteId(null);
      success("Utilisateur supprimé.");
    } catch {
      toastError("Erreur lors de la suppression.");
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
          <h2 className="text-xl font-bold text-slate-800">Utilisateurs</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {totalItems} compte{totalItems > 1 ? "s" : ""} · {actifs} actif{actifs > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setModal("add")}
          className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800
                     text-white text-sm px-4 py-2 rounded-lg transition font-medium"
        >
          <MdPersonAdd className="text-lg" /> Nouvel utilisateur
        </button>
      </div>

      {/* ── Cartes stats ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Admins",   value: admins,   icon: MdAdminPanelSettings, cls: "bg-teal-700"  },
          { label: "Éditeurs", value: editeurs, icon: MdEdit,               cls: "bg-slate-600" },
          { label: "Lecteurs", value: lecteurs, icon: MdVisibility,         cls: "bg-slate-500" },
          { label: "Actifs",   value: actifs,   icon: MdPerson,             cls: "bg-teal-600"  },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label}
            className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cls}`}>
              <Icon className="text-white text-lg" />
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
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
          <input type="text" placeholder="Rechercher un utilisateur..."
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
              {r === "Tous" ? "Tous les rôles" : r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* ── Tableau ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Utilisateur", "Rôle", "Statut", "Membre depuis", "Actions"].map((h) => (
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
                    Chargement...
                  </div>
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-14 text-slate-400">
                  <MdPerson className="text-4xl mx-auto mb-2 text-slate-300" />
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            )}

            {!loading && filtered.map((u) => {
              const role     = roleBadge[u.role] || roleBadge["lecteur"];
              const RoleIcon = role.icon;
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
                      <RoleIcon className="text-sm" />
                      {role.label}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full
                                      ${statusBadge[status]}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(u.date_joined).toLocaleDateString("fr-FR")}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setModal(u)}
                        className="text-slate-400 hover:text-teal-600 transition"
                        title="Modifier">
                        <MdEdit className="text-lg" />
                      </button>
                      <button onClick={() => setDeleteId(u.id)}
                        className="text-slate-400 hover:text-rose-500 transition"
                        title="Supprimer">
                        <MdDelete className="text-lg" />
                      </button>
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      {/* ── Modal ajout / édition ── */}
      {modal && (
        <UserModal
          user={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSave={saveUser}
        />
      )}

      {/* ── Confirmation suppression ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-base font-bold text-slate-800 mb-2">
              Supprimer l'utilisateur ?
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 border border-slate-200 text-slate-600 text-sm py-2.5
                           rounded-lg hover:bg-slate-50 transition font-medium">
                Annuler
              </button>
              <button onClick={handleDelete}
                className="flex-1 bg-rose-500 text-white text-sm py-2.5 rounded-lg
                           hover:bg-rose-600 transition font-medium">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}