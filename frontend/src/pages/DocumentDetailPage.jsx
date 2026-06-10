import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MdArrowBack, MdDownload, MdDelete,
  MdPictureAsPdf, MdTableChart, MdDescription,
  MdHistory, MdInfo, MdPerson, MdCalendarToday,
  MdLabel, MdFolder, MdCheckCircle, MdClose,
  MdUploadFile, MdVisibility, MdInsertDriveFile,
} from "react-icons/md";
import { getDocument, deleteDocument, createVersion, restoreVersion } from "../api/documents";
import { useAuthStore } from "../store/authStore";
import { useToastStore } from "../store/toastStore";

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
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-base font-bold text-slate-800 mb-2">
          Supprimer ce document ?
        </h3>
        <p className="text-sm text-slate-500 mb-5">
          Cette action est irréversible. Toutes les versions seront supprimées.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 text-sm py-2.5
                       rounded-lg hover:bg-slate-50 transition font-medium">
            Annuler
          </button>
          <button onClick={onConfirm}
            className="flex-1 bg-rose-500 text-white text-sm py-2.5 rounded-lg
                       hover:bg-rose-600 transition font-medium">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal nouvelle version ─────────────────────────────────────────────────
function NewVersionModal({ docId, onClose, onSuccess }) {
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
      error("Erreur lors de l'upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-slate-800">Nouvelle version</h3>
          <button onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition">
            <MdClose className="text-xl" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Fichier
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
              Note de version
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Correction clause 4..."
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 text-sm py-2.5
                       rounded-lg hover:bg-slate-50 transition font-medium">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || loading}
            className="flex-1 bg-teal-700 text-white text-sm py-2.5 rounded-lg
                       hover:bg-teal-800 transition font-medium flex items-center
                       justify-center gap-2 disabled:opacity-40"
          >
            <MdUploadFile className="text-lg" />
            {loading ? "Upload..." : "Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────
export default function DocumentDetailPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuthStore();
  const { success, error } = useToastStore();

  const [doc, setDoc]                   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState(null);
  const [tab, setTab]                   = useState("info");
  const [showDelete, setShowDelete]     = useState(false);  // ✅ bien déclaré ici
  const [showVersion, setShowVersion]   = useState(false);
  const [activeVersion, setActiveVersion] = useState(0);

  const fetchDoc = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await getDocument(id);
      setDoc(res.data);
    } catch {
      setFetchError("Document introuvable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoc(); }, [id]);

  const handleDelete = async () => {
    try {
      await deleteDocument(id);
      success("Document supprimé.");
      navigate("/archives");
    } catch {
      error("Erreur lors de la suppression.");
      setShowDelete(false);
    }
  };

  const handleRestore = async (versionId) => {
    try {
      await restoreVersion(id, versionId);
      success("Version restaurée avec succès.");
      fetchDoc();
    } catch {
      error("Erreur lors de la restauration.");
    }
  };

  // ── Chargement ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center py-24 text-slate-400">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent
                        rounded-full animate-spin" />
        Chargement...
      </div>
    </div>
  );

  if (fetchError || !doc) return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
      <MdInsertDriveFile className="text-5xl mb-3 text-slate-300" />
      <p className="text-sm">{fetchError || "Document introuvable."}</p>
      <button onClick={() => navigate("/archives")}
        className="mt-4 text-teal-600 text-sm hover:underline">
        ← Retour aux archives
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">

      {/* ── Retour ── */}
      <button onClick={() => navigate("/archives")}
        className="flex items-center gap-2 text-sm text-slate-400
                   hover:text-teal-600 transition mb-6">
        <MdArrowBack className="text-lg" /> Retour aux archives
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
                  {doc.versions?.length || 0} version{doc.versions?.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {doc.current_version?.file && (
             <a 
                href={`http://localhost:8000${doc.current_version.file}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 border border-slate-200 text-slate-600
                           text-sm px-3 py-2 rounded-lg hover:bg-slate-50 transition"
              >
                <MdDownload className="text-lg" /> Télécharger
              </a>
            )}
            {/* ✅ Bouton supprimer visible seulement pour admin */}
            {user?.role === "admin" && (
              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-1.5 border border-rose-100 text-rose-500
                           text-sm px-3 py-2 rounded-lg hover:bg-rose-50 transition"
              >
                <MdDelete className="text-lg" /> Supprimer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Onglets ── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-4 w-fit">
        {[
          { key: "info",     label: "Informations", icon: MdInfo    },
          { key: "versions", label: "Versions",     icon: MdHistory },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                        transition
                        ${tab === key
                          ? "bg-white text-teal-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                        }`}
          >
            <Icon className="text-base" /> {label}
          </button>
        ))}
      </div>

      {/* ── Onglet Informations ── */}
      {tab === "info" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Prévisualisation + description */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <MdVisibility className="text-teal-600" /> Prévisualisation
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
                  href={`http://localhost:8000${doc.current_version.file}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-teal-700 text-white text-xs
                             px-4 py-2 rounded-lg hover:bg-teal-800 transition mt-1"
                >
                  <MdDownload className="text-sm" /> Télécharger pour ouvrir
                </a>
              )}
            </div>
            {doc.description && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Description
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">{doc.description}</p>
              </div>
            )}
          </div>

          {/* Métadonnées */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <MdInfo className="text-teal-600" /> Métadonnées
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MdPerson className="text-slate-400 text-lg mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Auteur</p>
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
                  <p className="text-xs text-slate-400">Date d'ajout</p>
                  <p className="text-sm font-medium text-slate-700">
                    {new Date(doc.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "long", year: "numeric"
                    })}
                  </p>
                </div>
              </div>
              {doc.category && (
                <div className="flex items-start gap-3">
                  <MdFolder className="text-slate-400 text-lg mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Catégorie</p>
                    <p className="text-sm font-medium text-slate-700">{doc.category.name}</p>
                  </div>
                </div>
              )}
              {doc.tags_list?.length > 0 && (
                <div className="flex items-start gap-3">
                  <MdLabel className="text-slate-400 text-lg mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Tags</p>
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
                  <p className="text-xs text-slate-400">Version actuelle</p>
                  <p className="text-sm font-medium text-teal-700 font-mono">
                    {doc.current_version?.version || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Onglet Versions ── */}
      {tab === "versions" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <MdHistory className="text-teal-600" />
              Historique des versions
            </h3>
            {["admin", "editeur"].includes(user?.role) && (
              <button
                onClick={() => setShowVersion(true)}
                className="flex items-center gap-2 bg-teal-700 text-white text-xs
                           px-3 py-1.5 rounded-lg hover:bg-teal-800 transition"
              >
                <MdUploadFile className="text-sm" /> Nouvelle version
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
                            Actuelle
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
                          {new Date(v.uploaded_at).toLocaleDateString("fr-FR")}
                        </span>
                        <span>{v.size_display}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {v.file && (
                      <a
                        href={`http://localhost:8000${v.file}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs flex items-center gap-1 border border-slate-200
                                   text-slate-500 px-2.5 py-1.5 rounded-lg hover:bg-slate-100
                                   transition"
                      >
                        <MdDownload className="text-sm" /> DL
                      </a>
                    )}
                    {!v.is_current && user?.role === "admin" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRestore(v.id); }}
                        className="text-xs flex items-center gap-1 border border-teal-100
                                   text-teal-600 px-2.5 py-1.5 rounded-lg hover:bg-teal-50
                                   transition"
                      >
                        <MdCheckCircle className="text-sm" /> Restaurer
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

    </div>
  );
}