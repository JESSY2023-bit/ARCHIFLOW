import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdUploadFile, MdInsertDriveFile, MdPictureAsPdf,
  MdTableChart, MdDescription, MdClose,
  MdCheckCircle, MdError,
} from "react-icons/md";
import { createDocument } from "../api/documents";
import  { useAuthStore } from "../store/authStore";
import { useToastStore } from "../store/toastStore";

const formatSize = (bytes) => {
  if (bytes < 1024)            return `${bytes} B`;
  if (bytes < 1024 * 1024)     return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (name) => {
  const ext = name.split(".").pop().toLowerCase();
  if (ext === "pdf")                        return <MdPictureAsPdf className="text-rose-500 text-2xl" />;
  if (["xlsx", "xls", "csv"].includes(ext)) return <MdTableChart   className="text-emerald-600 text-2xl" />;
  if (["doc", "docx"].includes(ext))        return <MdDescription  className="text-sky-500 text-2xl" />;
  return <MdInsertDriveFile className="text-slate-400 text-2xl" />;
};

const getFileType = (name) => {
  const ext = name.split(".").pop().toLowerCase();
  if (ext === "pdf")                        return "PDF";
  if (["xlsx", "xls"].includes(ext))        return "Excel";
  if (["doc", "docx"].includes(ext))        return "Word";
  if (ext === "csv")                        return "CSV";
  return "Other";
};

const ALLOWED = ["pdf", "doc", "docx", "xlsx", "xls", "csv"];

const validate = (file) => {
  const ext = file.name.split(".").pop().toLowerCase();
  if (!ALLOWED.includes(ext))        return "Format non supporté.";
  if (file.size > 20 * 1024 * 1024)  return "Fichier trop lourd (max 20 MB).";
  return null;
};

export default function UploadPage() {
  const [files, setFiles]       = useState([]);
  const [dragging, setDragging] = useState(false);
  const inputRef                = useRef();
  const navigate                = useNavigate();
  const { success, error } = useToastStore();

  const addFiles = useCallback((incoming) => {
    const newFiles = Array.from(incoming).map((file) => ({
      id:       Math.random().toString(36).slice(2),
      file,
      error:    validate(file),
      status:   "idle",
      progress: 0,
      tags:     "",
      category: "",
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const remove = (id) =>
    setFiles((prev) => prev.filter((f) => f.id !== id));

  const updateField = (id, field, value) =>
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );

  // ── Upload réel vers l'API ─────────────────────────────────────────────
  const uploadFile = async (fileObj) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileObj.id ? { ...f, status: "uploading", progress: 30 } : f))
    );
    try {
      const formData = new FormData();
      formData.append("file",      fileObj.file);
      formData.append("name",      fileObj.file.name);
      formData.append("file_type", getFileType(fileObj.file.name));
      if (fileObj.tags)     formData.append("tags",        fileObj.tags);
      if (fileObj.category) formData.append("description", fileObj.category);

      setFiles((prev) =>
        prev.map((f) => (f.id === fileObj.id ? { ...f, progress: 70 } : f))
      );
    
      await createDocument(formData);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id ? { ...f, status: "done", progress: 100 } : f
        )
      );
      success(`"${fileObj.file.name}" uploadé avec succès.`);
    } catch (err) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id ? { ...f, status: "error", progress: 0 } : f
        )
      );
      error(`Erreur lors de l'envoi de "${fileObj.file.name}".`);
    }
  };

  const uploadAll = () => {
    files
      .filter((f) => !f.error && f.status === "idle")
      .forEach((f) => uploadFile(f));
  };

  const validCount     = files.filter((f) => !f.error && f.status === "idle").length;
  const doneCount      = files.filter((f) => f.status === "done").length;
  const uploadingCount = files.filter((f) => f.status === "uploading").length;
  const errorCount     = files.filter((f) => f.status === "error").length;

  return (
    <div className="max-w-3xl mx-auto">

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Déposer des documents</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Formats acceptés : PDF, Word, Excel, CSV — 20 MB max
          </p>
        </div>
        {doneCount > 0 && (
          <button
            onClick={() => navigate("/archives")}
            className="text-sm text-teal-600 hover:underline"
          >
            Voir les archives →
          </button>
        )}
      </div>

      {/* ── Zone de dépôt ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
                    transition select-none
                    ${dragging
                      ? "border-teal-500 bg-teal-50"
                      : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                    }`}
      >
        <MdUploadFile className="text-5xl text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">
          Glissez vos fichiers ici ou{" "}
          <span className="text-teal-700 underline">parcourir</span>
        </p>
        <p className="text-xs text-slate-400 mt-1">PDF, DOCX, XLSX, CSV</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* ── Liste des fichiers ── */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">

          {/* Résumé */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {files.length} fichier{files.length > 1 ? "s" : ""} —{" "}
              {doneCount > 0    && `${doneCount} envoyé${doneCount > 1 ? "s" : ""} ✅ `}
              {uploadingCount > 0 && `${uploadingCount} en cours... `}
              {errorCount > 0   && `${errorCount} en erreur ❌`}
            </p>
            {validCount > 0 && (
              <button
                onClick={uploadAll}
                className="bg-teal-700 text-white text-sm px-4 py-2 rounded-lg
                           hover:bg-teal-800 transition font-medium"
              >
                Envoyer {validCount} fichier{validCount > 1 ? "s" : ""}
              </button>
            )}
          </div>

          {/* Cartes */}
          {files.map((f) => (
            <div
              key={f.id}
              className={`bg-white border rounded-xl p-4 transition
                          ${f.error || f.status === "error" ? "border-rose-200"
                          : f.status === "done"              ? "border-emerald-200"
                          : "border-slate-200"}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {getFileIcon(f.file.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {f.file.name}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {f.status === "done"  && <MdCheckCircle className="text-emerald-500 text-lg" />}
                      {(f.error || f.status === "error") && <MdError className="text-rose-400 text-lg" />}
                      {f.status === "idle" && !f.error && (
                        <button
                          onClick={() => remove(f.id)}
                          className="text-slate-300 hover:text-rose-400 transition"
                        >
                          <MdClose className="text-lg" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-0.5">{formatSize(f.file.size)}</p>

                  {f.error && (
                    <p className="text-xs text-rose-500 mt-1">{f.error}</p>
                  )}

                  {f.status === "error" && (
                    <p className="text-xs text-rose-500 mt-1">
                      Erreur lors de l'envoi. Réessayez.
                    </p>
                  )}

                  {!f.error && f.status === "idle" && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Catégorie (ex: RH, Finance...)"
                        value={f.category}
                        onChange={(e) => updateField(f.id, "category", e.target.value)}
                        className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5
                                   text-xs focus:outline-none focus:ring-1 focus:ring-teal-400"
                      />
                      <input
                        type="text"
                        placeholder="Tags (ex: contrat, 2024)"
                        value={f.tags}
                        onChange={(e) => updateField(f.id, "tags", e.target.value)}
                        className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5
                                   text-xs focus:outline-none focus:ring-1 focus:ring-teal-400"
                      />
                    </div>
                  )}

                  {f.status === "uploading" && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-600 rounded-full transition-all duration-500"
                          style={{ width: `${f.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{f.progress}%</p>
                    </div>
                  )}

                  {f.status === "done" && (
                    <p className="text-xs text-emerald-600 mt-1 font-medium">
                      Envoyé avec succès ✓
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}