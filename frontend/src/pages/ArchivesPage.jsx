import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdSearch, MdFilterList, MdClose, MdAdd,
  MdPictureAsPdf, MdTableChart, MdDescription,
  MdInsertDriveFile, MdDownload, MdDelete, MdVisibility,
} from "react-icons/md";
import { getDocuments, deleteDocument } from "../api/documents";
import { useAuthStore } from "../store/authStore";
import { useToastStore } from "../store/toastStore";
import Pagination from "../components/Pagination";

const typeIcon = {
  PDF:   <MdPictureAsPdf className="text-rose-500 text-xl" />,
  Excel: <MdTableChart   className="text-emerald-600 text-xl" />,
  Word:  <MdDescription  className="text-sky-500 text-xl" />,
};

const typeBadge = {
  PDF:   "bg-rose-50 text-rose-600 border border-rose-100",
  Excel: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  Word:  "bg-sky-50 text-sky-600 border border-sky-100",
};

function DeleteModal({ docName, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-base font-bold text-slate-800 mb-2">
          Supprimer ce document ?
        </h3>
        <p className="text-sm text-slate-500 mb-1">
          Vous êtes sur le point de supprimer :
        </p>
        <p className="text-sm font-medium text-slate-700 mb-3 truncate">
          📄 {docName}
        </p>
        <p className="text-xs text-rose-400 mb-5">
          ⚠️ Cette action est irréversible.
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

export default function ArchivesPage() {
  const [documents, setDocuments]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState("");
  const [searchInput, setSearchInput] = useState(""); // ✅ valeur brute input
  const [filterType, setFilterType] = useState("Tous");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage]             = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;
  const navigate  = useNavigate();
  const { user }  = useAuthStore();
  const { success, error: toastError } = useToastStore();

  // ── Debounce recherche (500ms) ─────────────────────────────────────────
  const debounceRef = useRef(null);
  const handleSearchInput = (val) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 500);
  };

  // ── Chargement ────────────────────────────────────────────────────────
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page };
      if (search)                params.search = search;
      if (filterType !== "Tous") params.type   = filterType;
      const res = await getDocuments(params);
      const data = res.data;
      // Support pagination DRF (results) ou tableau simple
      if (data.results !== undefined) {
        setDocuments(data.results);
        setTotalItems(data.count);
        setTotalPages(Math.ceil(data.count / PAGE_SIZE));
      } else {
        setDocuments(data);
        setTotalItems(data.length);
        setTotalPages(1);
      }
    } catch {
      setError("Impossible de charger les documents.");
    } finally {
      setLoading(false);
    }
  }, [search, filterType, page]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  // ── Suppression ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument(deleteTarget.id);
      success("Document supprimé avec succès.");
      fetchDocuments();
    } catch {
      toastError("Erreur lors de la suppression.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setFilterType("Tous");
    setPage(1);
  };

  const types = ["Tous", "PDF", "Excel", "Word"];

  return (
    <div>

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Archives</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {totalItems} document{totalItems > 1 ? "s" : ""}
          </p>
        </div>
        {["admin", "editeur"].includes(user?.role) && (
          <button
            onClick={() => navigate("/upload")}
            className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800
                       text-white text-sm px-4 py-2 rounded-lg transition font-medium"
          >
            <MdAdd className="text-lg" /> Nouveau document
          </button>
        )}
      </div>

      {/* ── Filtres ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2
                                  text-slate-400 text-lg" />
            <input
              type="text"
              placeholder="Rechercher par nom ou tag..."
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <MdFilterList className="text-slate-400 text-lg" />
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {types.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          {(searchInput || filterType !== "Tous") && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-sm text-slate-400
                         hover:text-rose-500 transition px-2"
            >
              <MdClose className="text-base" /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* ── Tableau ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Nom", "Type", "Taille", "Date", "Auteur", "Actions"].map((h) => (
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
                <td colSpan={6} className="text-center py-16 text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent
                                    rounded-full animate-spin" />
                    Chargement...
                  </div>
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={6} className="text-center py-16 text-rose-400">{error}</td>
              </tr>
            )}

            {!loading && !error && documents.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-16 text-slate-400">
                  <MdInsertDriveFile className="text-4xl mx-auto mb-2 text-slate-300" />
                  Aucun document trouvé.
                </td>
              </tr>
            )}

            {!loading && !error && documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50 transition">

                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span>{typeIcon[doc.file_type] || typeIcon["PDF"]}</span>
                    <div>
                      <div className="font-medium text-slate-800">{doc.name}</div>
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {(doc.tags_list || []).map((tag) => (
                          <span key={tag}
                            className="text-xs bg-slate-100 text-slate-500
                                       px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full
                                    ${typeBadge[doc.file_type] || typeBadge["PDF"]}`}>
                    {doc.file_type}
                  </span>
                </td>

                <td className="px-4 py-3 text-slate-500">
                  {doc.current_version?.size_display || "—"}
                </td>

                <td className="px-4 py-3 text-slate-500">
                  {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700
                                    text-xs flex items-center justify-center font-bold">
                      {(doc.author?.first_name || doc.author?.email || "?")[0].toUpperCase()}
                    </div>
                    <span className="text-slate-700">
                      {doc.author?.first_name
                        ? `${doc.author.first_name} ${doc.author.last_name}`
                        : doc.author?.email || "—"}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate(`/archives/${doc.id}`)}
                      className="text-slate-400 hover:text-teal-600 transition"
                      title="Voir"
                    >
                      <MdVisibility className="text-lg" />
                    </button>
                    {doc.current_version?.file && (
                      
                     <a   href={`http://localhost:8000${doc.current_version.file}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-teal-600 transition"
                        title="Télécharger"
                      >
                        <MdDownload className="text-lg" />
                      </a>
                    )}
                    {user?.role === "admin" && (
                      <button
                        onClick={() => setDeleteTarget({ id: doc.id, name: doc.name })}
                        className="text-slate-400 hover:text-rose-500 transition"
                        title="Supprimer"
                      >
                        <MdDelete className="text-lg" />
                      </button>
                    )}
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>

        {/*  Pagination */}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      {/* ── Modal suppression ── */}
      {deleteTarget && (
        <DeleteModal
          docName={deleteTarget.name}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

    </div>
  );
}