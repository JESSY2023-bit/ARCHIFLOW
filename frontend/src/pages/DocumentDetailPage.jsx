import { createElement, useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MdArrowBack, MdDownload, MdDelete,
  MdPictureAsPdf, MdTableChart, MdDescription,
  MdHistory, MdInfo, MdPerson, MdCalendarToday,
  MdLabel, MdFolder, MdCheckCircle, MdClose,
  MdUploadFile, MdVisibility, MdInsertDriveFile,
} from "react-icons/md";
import {
  getDocument,
  deleteDocument,
  createVersion,
  restoreVersion,
  getDocumentAccesses,
  createDocumentAccess,
  updateDocumentAccess,
  deleteDocumentAccess,
} from "../api/documents";
import { getUsers } from "../api/users";
import { useAuthStore } from "../store/authStore";
import { useToastStore } from "../store/toastStore";
import { resolveMediaUrl } from "../config/api";

const typeIcon = {
  PDF:   <MdPictureAsPdf className="text-rose-500 text-4xl" />,
  Excel: <MdTableChart   className="text-emerald-600 text-4xl" />,
  Word:  <MdDescription  className="text-sky-500 text-4xl" />,
};

const typeBadge = {
  PDF:   "bg-rose-50 text-rose-600 border border-rose-100",
  Excel: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  Word:  "bg-sky-50 text-sky-600 border border-sky-100",
};

// ── Modal suppression ──────────────────────────────────────────────────────
function DeleteModal({ onConfirm, onClose }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-base font-bold text-slate-800 mb-2">
          {t("archives.delete_title")}
        </h3>
        <p className="text-sm text-slate-500 mb-5">
          {t("archives.delete_full_info")}
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 text-sm py-2.5
                       rounded-lg hover:bg-slate-50 transition font-medium">
            {t("actions.cancel")}
          </button>
          <button onClick={onConfirm}
            className="flex-1 bg-rose-500 text-white text-sm py-2.5 rounded-lg
                       hover:bg-rose-600 transition font-medium">
            {t("actions.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal nouvelle version ─────────────────────────────────────────────────
function NewVersionModal({ docId, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [file, setFile]       = useState(null);
  const [note, setNote]       = useState("");
  const [loading, setLoading] = useState(false);
  const { error } = useToastStore();

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("note", note);
      await createVersion(docId, formData);
      onSuccess();
      onClose();
    } catch {
      error(t("document.upload_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-slate-800">{t("document.new_version")}</h3>
          <button onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition">
            <MdClose className="text-xl" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("document.file")}
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files[0])}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("document.version_note")}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("document.version_note_placeholder")}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 text-sm py-2.5
                       rounded-lg hover:bg-slate-50 transition font-medium">
            {t("actions.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || loading}
            className="flex-1 bg-teal-700 text-white text-sm py-2.5 rounded-lg
                       hover:bg-teal-800 transition font-medium flex items-center
                       justify-center gap-2 disabled:opacity-40"
          >
            <MdUploadFile className="text-lg" />
            {loading ? t("upload.sending") : t("upload.send")}
          </button>
        </div>
      </div>
    </div>
  );
}

function AccessManagementModal({ documentId, onClose, onSuccess }) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { error, success } = useToastStore();

  const [users, setUsers] = useState([]);
  const [accessRules, setAccessRules] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    can_view: true,
    can_edit: false,
    can_download: false,
    can_manage_access: false,
  });

  const loadData = useCallback(async () => {
    try {
      const [usersRes, accessRes] = await Promise.all([
        getUsers(),
        getDocumentAccesses(documentId),
      ]);

      const allUsers = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.results || [];
      const allAccess = Array.isArray(accessRes.data) ? accessRes.data : accessRes.data.results || [];

      setUsers(allUsers.filter((u) => u.id !== user?.id));
      setAccessRules(allAccess);

      if (allUsers.length > 0) {
        const firstUser = allUsers.find((u) => u.id !== user?.id) || allUsers[0];
        setSelectedUserId(String(firstUser.id));
        const existing = allAccess.find((rule) => Number(rule.user) === Number(firstUser.id));
        setForm(existing ? {
          can_view: !!existing.can_view,
          can_edit: !!existing.can_edit,
          can_download: !!existing.can_download,
        } : { can_view: true, can_edit: false, can_download: false });
      }
    } catch {
      error(t("document.permissions_error_load"));
    } finally {
      setLoading(false);
    }
  }, [documentId, user?.id, t, error]);

  useEffect(() => { loadData(); }, [loadData]);

  const selectedRule = accessRules.find((rule) => Number(rule.user) === Number(selectedUserId));

  useEffect(() => {
    // keep form in sync when selectedRule changes
    if (selectedRule) {
      setForm({
        can_view: !!selectedRule.can_view,
        can_edit: !!selectedRule.can_edit,
        can_download: !!selectedRule.can_download,
        can_manage_access: !!selectedRule.can_manage_access,
      });
    }
  }, [selectedRule]);

  const handleUserChange = (nextUserId) => {
    setSelectedUserId(nextUserId);
    const existing = accessRules.find((rule) => Number(rule.user) === Number(nextUserId));
    setForm(existing ? {
      can_view: !!existing.can_view,
      can_edit: !!existing.can_edit,
      can_download: !!existing.can_download,
    } : { can_view: true, can_edit: false, can_download: false });
  };

  const handleToggle = (key) => {
    setForm((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      const payload = {
        user: Number(selectedUserId),
        can_view: !!form.can_view,
        can_edit: !!form.can_edit,
        can_download: !!form.can_download,
      };

      if (selectedRule) {
        await updateDocumentAccess(documentId, selectedRule.id, payload);
      } else {
        await createDocumentAccess(documentId, payload);
      }

      success(t("document.permissions_saved"));
      await loadData();
      onSuccess();
      onClose();
    } catch (err) {
      error(err?.response?.data?.error || t("document.permissions_error_save"));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (ruleId) => {
    try {
      await deleteDocumentAccess(documentId, ruleId);
      success(t("document.permissions_removed"));
      await loadData();
      onSuccess();
    } catch {
      error(t("document.permissions_error_remove"));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-800">{t("document.permissions")}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <MdClose className="text-xl" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {loading ? (
            <div className="text-sm text-slate-500">{t("actions.loading")}</div>
          ) : (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {t("document.permissions_user")}
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => handleUserChange(e.target.value)}
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name || u.email} {u.last_name ? ` ${u.last_name}` : ""} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                {[
                  { key: "can_view", label: t("document.permissions_view") },
                  { key: "can_edit", label: t("document.permissions_edit") },
                  { key: "can_download", label: t("document.permissions_download") },
                                { key: "can_manage_access", label: t("document.permissions_manage_access") },
                              ].map(({ key, label }) => (
                  <label key={key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                    <span className="text-sm text-slate-600">{label}</span>
                    <button
                      type="button"
                      onClick={() => handleToggle(key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${form[key] ? "bg-teal-600" : "bg-slate-300"}`}
                      aria-label={label}
                    >
                      <span
                       className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${form[key] ? "translate-x-5" : "translate-x-1"}`}
                      />
                    </button>
                  </label>
                ))}
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("document.permissions_current")}
                </div>
                <div className="divide-y divide-slate-100">
                  {accessRules.length === 0 ? (
                    <div className="px-4 py-5 text-sm text-slate-500">{t("document.permissions_none")}</div>
                  ) : (
                    accessRules.map((rule) => {
                      const userName = rule.user_detail
                       ? `${rule.user_detail.first_name || ""} ${rule.user_detail.last_name || ""}`.trim() || rule.user_detail.email
                       : rule.user;

                      return (
                       <div key={rule.id} className="flex items-center justify-between gap-3 px-4 py-3">
                         <div>
                           <p className="text-sm font-medium text-slate-700">{userName}</p>
                           <div className="flex flex-wrap gap-2 mt-1 text-[11px]">
                             {rule.can_view && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{t("document.permissions_view")}</span>}
                             {rule.can_edit && <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">{t("document.permissions_edit")}</span>}
                             {rule.can_download && <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{t("document.permissions_download")}</span>}
                             {rule.can_manage_access && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{t("document.permissions_manage_access")}</span>}
                           </div>
                         </div>
                         <button
                           type="button"
                           onClick={() => handleRemove(rule.id)}
                           className="text-xs px-2.5 py-1.5 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 transition"
                         >
                           {t("actions.delete")}
                         </button>
                       </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 border-t border-slate-200 p-5">
          <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 text-sm py-2.5 rounded-lg hover:bg-slate-50 transition font-medium">
            {t("actions.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedUserId || saving || loading}
            className="flex-1 bg-teal-700 text-white text-sm py-2.5 rounded-lg hover:bg-teal-800 transition font-medium disabled:opacity-40"
          >
            {saving ? t("actions.saving") : t("actions.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────
export default function DocumentDetailPage() {
  const { t, i18n } = useTranslation();
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuthStore();
  const { success, error } = useToastStore();

  const [doc, setDoc]                   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState(null);
  const [tab, setTab]                   = useState("info");
  const [showDelete, setShowDelete]     = useState(false);
  const [showVersion, setShowVersion]   = useState(false);
  const [showAccessManager, setShowAccessManager] = useState(false);
  const [activeVersion, setActiveVersion] = useState(0);

  const fetchDoc = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await getDocument(id);
      setDoc(res.data);
    } catch {
      setFetchError(t("document.not_found"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => { fetchDoc(); }, [fetchDoc]);

  const handleDelete = async () => {
    try {
      await deleteDocument(id);
      success(t("document.deleted"));
      navigate("/archives");
    } catch {
      error(t("archives.delete_error"));
      setShowDelete(false);
    }
  };

  const handleRestore = async (versionId) => {
    try {
      await restoreVersion(id, versionId);
      success(t("document.restored"));
      fetchDoc();
    } catch {
      error(t("document.restore_error"));
    }
  };

  const canManageAccess = user?.role === "admin" || Number(user?.id) === Number(doc?.author?.id) || (doc?.access_rules || []).some(r => Number(r.user) === Number(user?.id) && r.can_manage_access);

  // ── Chargement ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center py-24 text-slate-400">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent
                        rounded-full animate-spin" />
        {t("actions.loading")}
      </div>
    </div>
  );

  if (fetchError || !doc) return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
      <MdInsertDriveFile className="text-5xl mb-3 text-slate-300" />
      <p className="text-sm">{fetchError || t("document.not_found")}</p>
      <button onClick={() => navigate("/archives")}
        className="mt-4 text-teal-600 text-sm hover:underline">
        {t("document.back_archives")}
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">

      {/* ── Retour ── */}
      <button onClick={() => navigate("/archives")}
        className="flex items-center gap-2 text-sm text-slate-400
                   hover:text-teal-600 transition mb-6">
        <MdArrowBack className="text-lg" /> {t("document.back_archives")}
      </button>

      {/* ── En-tête ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-slate-50 rounded-xl border border-slate-200
                            flex items-center justify-center flex-shrink-0">
              {typeIcon[doc.file_type] || typeIcon["PDF"]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{doc.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                                  ${typeBadge[doc.file_type] || typeBadge["PDF"]}`}>
                  {doc.file_type}
                </span>
                <span className="text-xs text-slate-400">
                  {doc.current_version?.size_display || "—"}
                </span>
                <span className="text-xs text-slate-300">·</span>
                <span className="text-xs text-slate-400">
                  {doc.versions?.length || 0} {t("document.versions")}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {doc.current_version?.file && (
             <a 
                href={resolveMediaUrl(doc.current_version.file)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 border border-slate-200 text-slate-600
                           text-sm px-3 py-2 rounded-lg hover:bg-slate-50 transition"
              >
                <MdDownload className="text-lg" /> {t("document.download")}
              </a>
            )}
            {/* ✅ Bouton supprimer visible seulement pour admin */}
            {user?.role === "admin" && (
              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-1.5 border border-rose-100 text-rose-500
                           text-sm px-3 py-2 rounded-lg hover:bg-rose-50 transition"
              >
                <MdDelete className="text-lg" /> {t("document.delete")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Onglets ── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-4 w-fit">
        {[
          { key: "info",     label: t("document.info_tab"), icon: MdInfo    },
          { key: "versions", label: t("document.versions_tab"),     icon: MdHistory },
        ].map(({ key, label, icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                        transition
                        ${tab === key
                          ? "bg-white text-teal-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                        }`}
          >
            {createElement(icon, { className: "text-base" })} {label}
          </button>
        ))}
      </div>

      {/* ── Onglet Informations ── */}
      {tab === "info" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Prévisualisation + description */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <MdVisibility className="text-teal-600" /> {t("document.preview")}
            </h3>
            <div className="bg-slate-50 rounded-lg border border-slate-200 h-64
                            flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-16 h-16 bg-white rounded-xl border border-slate-200
                              flex items-center justify-center shadow-sm">
                {typeIcon[doc.file_type] || typeIcon["PDF"]}
              </div>
              <p className="text-sm text-slate-500 font-medium">{doc.name}</p>
              {doc.current_version?.file && (
                <a
                  href={resolveMediaUrl(doc.current_version.file)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-teal-700 text-white text-xs
                             px-4 py-2 rounded-lg hover:bg-teal-800 transition mt-1"
                >
                  <MdDownload className="text-sm" /> {t("document.download_open")}
                </a>
              )}
            </div>
            {doc.description && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  {t("document.description")}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">{doc.description}</p>
              </div>
            )}
          </div>

          {/* Métadonnées */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <MdInfo className="text-teal-600" /> {t("document.metadata")}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MdPerson className="text-slate-400 text-lg mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">{t("archives.author")}</p>
                  <p className="text-sm font-medium text-slate-700">
                    {doc.author?.first_name
                      ? `${doc.author.first_name} ${doc.author.last_name}`
                      : doc.author?.email || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MdCalendarToday className="text-slate-400 text-lg mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">{t("document.added_date")}</p>
                  <p className="text-sm font-medium text-slate-700">
                    {new Date(doc.created_at).toLocaleDateString(i18n.language === "en" ? "en-US" : "fr-FR", {
                      day: "numeric", month: "long", year: "numeric"
                    })}
                  </p>
                </div>
              </div>
              {doc.category && (
                <div className="flex items-start gap-3">
                  <MdFolder className="text-slate-400 text-lg mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">{t("document.category")}</p>
                    <p className="text-sm font-medium text-slate-700">{doc.category.name}</p>
                  </div>
                </div>
              )}
              {doc.tags_list?.length > 0 && (
                <div className="flex items-start gap-3">
                  <MdLabel className="text-slate-400 text-lg mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 mb-1">{t("document.tags")}</p>
                    <div className="flex flex-wrap gap-1">
                      {doc.tags_list.map((tag) => (
                        <span key={tag}
                          className="text-xs bg-slate-100 text-slate-600
                                     px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <MdHistory className="text-slate-400 text-lg mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">{t("document.current_version")}</p>
                  <p className="text-sm font-medium text-teal-700 font-mono">
                    {doc.current_version?.version || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {canManageAccess && (
            <div className="xl:col-span-3 bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <MdPerson className="text-teal-600" /> {t("document.permissions")}
                </h3>
                <button
                  onClick={() => setShowAccessManager(true)}
                  className="bg-teal-700 text-white text-xs px-3 py-2 rounded-lg hover:bg-teal-800 transition"
                >
                  {t("document.permissions_manage")}
                </button>
              </div>

              {(!doc.access_rules || doc.access_rules.length === 0) ? (
                <p className="text-sm text-slate-500">{t("document.permissions_none")}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {doc.access_rules.map((rule) => {
                    const userName = rule.user_detail
                      ? `${rule.user_detail.first_name || ""} ${rule.user_detail.last_name || ""}`.trim() || rule.user_detail.email
                      : "—";

                    return (
                      <div key={rule.id} className="border border-slate-200 rounded-xl p-3">
                        <p className="text-sm font-semibold text-slate-700">{userName}</p>
                        <div className="flex flex-wrap gap-2 mt-2 text-[11px]">
                          {rule.can_view && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{t("document.permissions_view")}</span>}
                          {rule.can_edit && <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">{t("document.permissions_edit")}</span>}
                          {rule.can_download && <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{t("document.permissions_download")}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Onglet Versions ── */}
      {tab === "versions" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <MdHistory className="text-teal-600" />
              {t("document.version_history")}
            </h3>
            {["admin", "editeur"].includes(user?.role) && (
              <button
                onClick={() => setShowVersion(true)}
                className="flex items-center gap-2 bg-teal-700 text-white text-xs
                           px-3 py-1.5 rounded-lg hover:bg-teal-800 transition"
              >
                <MdUploadFile className="text-sm" /> {t("document.new_version")}
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {(doc.versions || []).map((v, i) => (
              <div
                key={v.id}
                onClick={() => setActiveVersion(i)}
                className={`px-6 py-4 cursor-pointer transition
                            ${activeVersion === i ? "bg-teal-50" : "hover:bg-slate-50"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center
                                    text-xs font-bold flex-shrink-0 mt-0.5
                                    ${v.is_current
                                      ? "bg-teal-100 text-teal-700"
                                      : "bg-slate-100 text-slate-500"
                                    }`}>
                      {v.version}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">{v.version}</p>
                        {v.is_current && (
                          <span className="text-xs bg-teal-100 text-teal-700
                                           px-2 py-0.5 rounded-full font-medium">
                            {t("document.current")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{v.note || "—"}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <MdPerson className="text-sm" />
                          {v.uploaded_by?.first_name || v.uploaded_by?.email || "—"}
                        </span>
                        <span className="flex items-center gap-1">
                          <MdCalendarToday className="text-sm" />
                          {new Date(v.uploaded_at).toLocaleDateString(i18n.language === "en" ? "en-US" : "fr-FR")}
                        </span>
                        <span>{v.size_display}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {v.file && (
                      <a
                        href={resolveMediaUrl(v.file)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs flex items-center gap-1 border border-slate-200
                                   text-slate-500 px-2.5 py-1.5 rounded-lg hover:bg-slate-100
                                   transition"
                      >
                        <MdDownload className="text-sm" /> {t("document.download")}
                      </a>
                    )}
                    {!v.is_current && user?.role === "admin" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRestore(v.id); }}
                        className="text-xs flex items-center gap-1 border border-teal-100
                                   text-teal-600 px-2.5 py-1.5 rounded-lg hover:bg-teal-50
                                   transition"
                      >
                        <MdCheckCircle className="text-sm" /> {t("document.restore")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showDelete && (
        <DeleteModal
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
        />
      )}
      {showVersion && (
        <NewVersionModal
          docId={id}
          onClose={() => setShowVersion(false)}
          onSuccess={fetchDoc}
        />
      )}
      {showAccessManager && (
        <AccessManagementModal
          documentId={id}
          onClose={() => setShowAccessManager(false)}
          onSuccess={fetchDoc}
        />
      )}

    </div>
  );
}
