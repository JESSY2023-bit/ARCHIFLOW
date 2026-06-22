import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import api from "../api/axios";
import { useTranslation } from "react-i18next";
import {
  MdPerson, MdEmail, MdLock, MdEdit,
  MdShield,
} from "react-icons/md";
import { useToastStore } from "../store/toastStore";

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

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
      success(t("profile.updated"));
    } catch {
      error(t("profile.error_update"));
    } finally {
      setLoading(false);
    }
  };

  // ── Changer le mot de passe ───────────────────────────────────────────
  const handleChangePwd = async () => {
    if (pwdForm.new_password !== pwdForm.confirm) {
      error(t("profile.pwd_mismatch"));
      return;
    }
    if (pwdForm.new_password.length < 6) {
      error(t("profile.pwd_min"));
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
      success(t("profile.pwd_changed"));
    } catch (err) {
      const msg = err.response?.data?.error || t("profile.pwd_current_invalid");
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
        <h2 className="text-xl font-bold text-slate-800">{t("profile.title")}</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          {t("profile.subtitle")}
        </p>
      </div>


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
              {user?.role ? t(`roles.${user.role}`) : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Informations personnelles ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <MdPerson className="text-teal-600 text-lg" />
            {t("profile.personal_info")}
          </h3>
          {!editInfo && (
            <button
              onClick={() => setEditInfo(true)}
              className="flex items-center gap-1.5 text-xs text-slate-500
                         hover:text-teal-600 transition border border-slate-200
                         px-3 py-1.5 rounded-lg hover:border-teal-200"
            >
              <MdEdit className="text-sm" /> {t("profile.edit")}
            </button>
          )}
        </div>

        {!editInfo ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                {t("profile.first_name")}
              </span>
              <span className="text-sm text-slate-700 font-medium">
                {user?.first_name || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                {t("profile.last_name")}
              </span>
              <span className="text-sm text-slate-700 font-medium">
                {user?.last_name || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                {t("profile.email")}
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
                  {t("profile.first_name")}
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
                  {t("profile.last_name")}
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
                {t("profile.cancel")}
              </button>
              <button
                onClick={handleSaveInfo}
                disabled={loading}
                className="flex-1 bg-teal-700 text-white text-sm py-2.5 rounded-lg
                           hover:bg-teal-800 transition font-medium disabled:opacity-50"
              >
                {loading ? t("profile.saving") : t("profile.save")}
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
            {t("profile.password")}
          </h3>
          {!editPwd && (
            <button
              onClick={() => setEditPwd(true)}
              className="flex items-center gap-1.5 text-xs text-slate-500
                         hover:text-teal-600 transition border border-slate-200
                         px-3 py-1.5 rounded-lg hover:border-teal-200"
            >
              <MdEdit className="text-sm" /> {t("profile.edit")}
            </button>
          )}
        </div>

        {!editPwd ? (
          <p className="text-sm text-slate-400">
            {t("profile.password_hidden")}
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {t("profile.current_pwd")}
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
                {t("profile.new_pwd")}
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
                {t("profile.confirm_pwd")}
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
                  {t("profile.pwd_mismatch")}
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
                {t("profile.cancel")}
              </button>
              <button
                onClick={handleChangePwd}
                disabled={loading || !pwdForm.old_password || !pwdForm.new_password}
                className="flex-1 bg-teal-700 text-white text-sm py-2.5 rounded-lg
                           hover:bg-teal-800 transition font-medium disabled:opacity-50"
              >
                {loading ? t("profile.changing_pwd") : t("profile.change_pwd")}
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
