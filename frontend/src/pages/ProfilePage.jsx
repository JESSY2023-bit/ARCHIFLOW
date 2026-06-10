import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import api from "../api/axios";
import {
  MdPerson, MdEmail, MdLock, MdEdit,
  MdCheck, MdClose, MdShield,
} from "react-icons/md";
import { useToastStore } from "../store/toastStore";

export default function ProfilePage() {
  const { user, logout } = useAuthStore();

  // ── États ─────────────────────────────────────────────────────────────
  const [editInfo, setEditInfo]   = useState(false);
  const [editPwd, setEditPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const { success, error } = useToastStore();

  const [infoForm, setInfoForm] = useState({
    first_name: user?.first_name || "",
    last_name:  user?.last_name  || "",
  });

  const [pwdForm, setPwdForm] = useState({
    old_password:  "",
    new_password:  "",
    confirm:       "",
  });

 

  // ── Modifier les infos ────────────────────────────────────────────────
  const handleSaveInfo = async () => {
    setLoading(true);
    try {
      await api.patch(`/users/${user.id}/`, infoForm);
      // Met à jour le store
      useAuthStore.setState((s) => ({
        user: { ...s.user, ...infoForm },
      }));
      setEditInfo(false);
      success("Informations mises à jour ✓");
    } catch {
      error("Erreur lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  };

  // ── Changer le mot de passe ───────────────────────────────────────────
  const handleChangePwd = async () => {
    if (pwdForm.new_password !== pwdForm.confirm) {
      error("Les mots de passe ne correspondent pas.");
      return;
    }
    if (pwdForm.new_password.length < 6) {
      error("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/users/change-password/", {
        old_password: pwdForm.old_password,
        new_password: pwdForm.new_password,
      });
      setPwdForm({ old_password: "", new_password: "", confirm: "" });
      setEditPwd(false);
      success("Mot de passe modifié avec succès ✓");
    } catch (err) {
      const msg = err.response?.data?.error || "Mot de passe actuel incorrect.";
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  const roleBadge = {
    admin:   "bg-teal-50 text-teal-700 border border-teal-100",
    editeur: "bg-slate-100 text-slate-700 border border-slate-200",
    lecteur: "bg-amber-50 text-amber-700 border border-amber-100",
  };

  return (
    <div className="max-w-2xl mx-auto">

      {/* ── Titre ── */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Mon profil</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Gérez vos informations personnelles et votre mot de passe
        </p>
      </div>

      {/* ── Notifications ── */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700
                        text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <MdCheck className="text-lg flex-shrink-0" /> {success}
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600
                        text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <MdClose className="text-lg flex-shrink-0" /> {error}
        </div>
      )}

      {/* ── Avatar + rôle ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-700
                          flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {(user?.first_name || user?.email || "?")[0].toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {user?.first_name
                ? `${user.first_name} ${user.last_name}`
                : user?.email}
            </h3>
            <p className="text-sm text-slate-400">{user?.email}</p>
            <span className={`inline-block mt-1.5 text-xs font-medium px-2.5 py-1
                              rounded-full ${roleBadge[user?.role] || roleBadge["lecteur"]}`}>
              <MdShield className="inline mr-1 text-sm" />
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Informations personnelles ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <MdPerson className="text-teal-600 text-lg" />
            Informations personnelles
          </h3>
          {!editInfo && (
            <button
              onClick={() => setEditInfo(true)}
              className="flex items-center gap-1.5 text-xs text-slate-500
                         hover:text-teal-600 transition border border-slate-200
                         px-3 py-1.5 rounded-lg hover:border-teal-200"
            >
              <MdEdit className="text-sm" /> Modifier
            </button>
          )}
        </div>

        {!editInfo ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                Prénom
              </span>
              <span className="text-sm text-slate-700 font-medium">
                {user?.first_name || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                Nom
              </span>
              <span className="text-sm text-slate-700 font-medium">
                {user?.last_name || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                Email
              </span>
              <span className="text-sm text-slate-700 font-medium flex items-center gap-1">
                <MdEmail className="text-slate-400" /> {user?.email}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Prénom
                </label>
                <input
                  type="text"
                  value={infoForm.first_name}
                  onChange={(e) => setInfoForm((f) => ({ ...f, first_name: e.target.value }))}
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Nom
                </label>
                <input
                  type="text"
                  value={infoForm.last_name}
                  onChange={(e) => setInfoForm((f) => ({ ...f, last_name: e.target.value }))}
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditInfo(false)}
                className="flex-1 border border-slate-200 text-slate-600 text-sm py-2.5
                           rounded-lg hover:bg-slate-50 transition font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveInfo}
                disabled={loading}
                className="flex-1 bg-teal-700 text-white text-sm py-2.5 rounded-lg
                           hover:bg-teal-800 transition font-medium disabled:opacity-50"
              >
                {loading ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Changer le mot de passe ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <MdLock className="text-teal-600 text-lg" />
            Mot de passe
          </h3>
          {!editPwd && (
            <button
              onClick={() => setEditPwd(true)}
              className="flex items-center gap-1.5 text-xs text-slate-500
                         hover:text-teal-600 transition border border-slate-200
                         px-3 py-1.5 rounded-lg hover:border-teal-200"
            >
              <MdEdit className="text-sm" /> Modifier
            </button>
          )}
        </div>

        {!editPwd ? (
          <p className="text-sm text-slate-400">
            Votre mot de passe est masqué. Cliquez sur "Modifier" pour le changer.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Mot de passe actuel
              </label>
              <input
                type="password"
                value={pwdForm.old_password}
                onChange={(e) => setPwdForm((f) => ({ ...f, old_password: e.target.value }))}
                placeholder="••••••••"
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5
                           text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={pwdForm.new_password}
                onChange={(e) => setPwdForm((f) => ({ ...f, new_password: e.target.value }))}
                placeholder="••••••••"
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5
                           text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={pwdForm.confirm}
                onChange={(e) => setPwdForm((f) => ({ ...f, confirm: e.target.value }))}
                placeholder="••••••••"
                className={`mt-1 w-full border rounded-lg px-3 py-2.5 text-sm
                            focus:outline-none focus:ring-2 focus:ring-teal-500
                            ${pwdForm.confirm && pwdForm.new_password !== pwdForm.confirm
                              ? "border-rose-300"
                              : "border-slate-200"
                            }`}
              />
              {pwdForm.confirm && pwdForm.new_password !== pwdForm.confirm && (
                <p className="text-xs text-rose-500 mt-1">
                  Les mots de passe ne correspondent pas.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditPwd(false);
                  setPwdForm({ old_password: "", new_password: "", confirm: "" });
                }}
                className="flex-1 border border-slate-200 text-slate-600 text-sm py-2.5
                           rounded-lg hover:bg-slate-50 transition font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleChangePwd}
                disabled={loading || !pwdForm.old_password || !pwdForm.new_password}
                className="flex-1 bg-teal-700 text-white text-sm py-2.5 rounded-lg
                           hover:bg-teal-800 transition font-medium disabled:opacity-50"
              >
                {loading ? "Modification..." : "Changer le mot de passe"}
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}