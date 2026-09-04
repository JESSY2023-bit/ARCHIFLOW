import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdSearch, MdFilterList, MdClose, MdAdd,
  MdPictureAsPdf, MdTableChart, MdDescription,
  MdInsertDriveFile, MdDownload, MdDelete, MdCalendarToday,
  MdKeyboardArrowDown, MdChevronLeft, MdChevronRight, MdCheck,
} from "react-icons/md";
import { getDocuments, getCategories, deleteDocument } from "../api/documents";
import { useAuthStore } from "../store/authStore";
import { useToastStore } from "../store/toastStore";
import Pagination from "../components/Pagination";
import { resolveMediaUrl } from "../config/api";

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

function formatFilterDate(value, language) {
  if (!value) return "";
  return new Date(`${value}T00:00:00`).toLocaleDateString(
    language === "en" ? "en-US" : "fr-FR",
    { day: "2-digit", month: "2-digit", year: "numeric" },
  );
}

function FilterSelect({ value, options, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <div className="relative min-w-40">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`w-full flex items-center justify-between gap-3 rounded-lg border px-3 py-2
                   text-sm text-left transition ${open
                     ? "border-teal-500 ring-2 ring-teal-100"
                     : "border-slate-200 hover:border-slate-300"}`}
      >
        <span className={selected ? "text-slate-700" : "text-slate-400"}>
          {selected?.label || placeholder}
        </span>
        <MdKeyboardArrowDown className={`text-lg text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-full min-w-48 overflow-hidden
                        rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              onClick={() => { onChange(option.value); setOpen(false); }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left
                         text-sm text-slate-600 transition hover:bg-teal-50 hover:text-teal-700"
            >
              {option.label}
              {option.value === value && <MdCheck className="text-teal-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DateFilter({ value, min, max, label, language, onChange }) {
  const [open, setOpen] = useState(false);
  const initialDate = value ? new Date(`${value}T00:00:00`) : new Date();
  const [month, setMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const leadingDays = (firstDay.getDay() + 6) % 7;
  const monthLabel = month.toLocaleDateString(language === "en" ? "en-US" : "fr-FR", {
    month: "long",
    year: "numeric",
  });
  const weekdays = language === "en"
    ? ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
    : ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

  const selectDay = (day) => {
    const selected = new Date(month.getFullYear(), month.getMonth(), day);
    const iso = [
      selected.getFullYear(),
      String(selected.getMonth() + 1).padStart(2, "0"),
      String(selected.getDate()).padStart(2, "0"),
    ].join("-");
    if ((!min || iso >= min) && (!max || iso <= max)) {
      onChange(iso);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex min-w-36 items-center gap-2 rounded-lg border px-3 py-2 text-sm transition
                   ${open ? "border-teal-500 ring-2 ring-teal-100" : "border-slate-200 hover:border-slate-300"}`}
      >
        <MdCalendarToday className="text-base text-slate-400" />
        <span className={value ? "text-slate-700" : "text-slate-400"}>
          {value ? formatFilterDate(value, language) : label}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-slate-200
                        bg-white p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-teal-700">
              <MdChevronLeft className="text-xl" />
            </button>
            <span className="text-sm font-semibold capitalize text-slate-700">{monthLabel}</span>
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-teal-700">
              <MdChevronRight className="text-xl" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400">
            {weekdays.map((day) => <span key={day} className="py-1">{day}</span>)}
            {Array.from({ length: leadingDays }).map((_, index) => <span key={`empty-${index}`} />)}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const selected = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const disabled = (min && selected < min) || (max && selected > max);
              return (
                <button type="button" key={day} disabled={disabled} onClick={() => selectDay(day)}
                  className={`rounded-lg py-1.5 text-xs transition ${disabled
                    ? "cursor-not-allowed text-slate-200"
                    : selected === value
                      ? "bg-teal-700 font-semibold text-white"
                      : "text-slate-600 hover:bg-teal-50 hover:text-teal-700"}`}>
                  {day}
                </button>
              );
            })}
          </div>
          {value && (
            <button type="button" onClick={() => { onChange(""); setOpen(false); }}
              className="mt-3 w-full border-t border-slate-100 pt-2 text-xs font-medium text-slate-400 hover:text-rose-500">
              Effacer
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DeleteModal({ docName, onConfirm, onClose, t }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-base font-bold text-slate-800 mb-2">
          {t("archives.delete_title")}
        </h3>
        <p className="text-sm text-slate-500 mb-1">
          {t("archives.delete_about")}
        </p>
        <p className="text-sm font-medium text-slate-700 mb-3 truncate">
          📄 {docName}
        </p>
        <p className="text-xs text-rose-400 mb-5">
          {t("archives.irreversible")}
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

export default function ArchivesPage() {
  const { t, i18n } = useTranslation();
  const [documents, setDocuments]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState("");
  const [searchInput, setSearchInput] = useState(""); // valeur brute input
  const [filterType, setFilterType] = useState("Tous");
  const [filterCategory, setFilterCategory] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categories, setCategories] = useState([]);
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
      if (filterCategory) params.category = filterCategory;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
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
      setError(t("archives.loading_error"));
    } finally {
      setLoading(false);
    }
  }, [search, filterType, filterCategory, dateFrom, dateTo, page, t]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);
  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data.results || res.data))
      .catch(() => setCategories([]));
  }, []);

  // ── Suppression ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument(deleteTarget.id);
      success(t("archives.deleted"));
      fetchDocuments();
    } catch {
      toastError(t("archives.delete_error"));
    } finally {
      setDeleteTarget(null);
    }
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setFilterType("Tous");
    setFilterCategory("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const types = ["Tous", "PDF", "Excel", "Word"];

  return (
    <div>

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2>{t("archives.title")}</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {totalItems} {totalItems > 1 ? t("archives.documents_pl") : t("archives.documents")}
          </p>
        </div>
        {["admin", "editeur"].includes(user?.role) && (
          <button
            onClick={() => navigate("/upload")}
            className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800
                       text-white text-sm px-4 py-2 rounded-lg transition font-medium"
          >
            <MdAdd className="text-lg" /> {t("archives.new_document")}
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
              placeholder={t("archives.search")}
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <MdFilterList className="text-slate-400 text-lg" />
          <FilterSelect
            value={filterType}
            onChange={(value) => { setFilterType(value); setPage(1); }}
            placeholder={t("archives.all_types")}
            options={types.map((type) => ({
              value: type,
              label: type === "Tous" ? t("archives.all_types") : type,
            }))}
          />
          <FilterSelect
            value={filterCategory}
            onChange={(value) => { setFilterCategory(value); setPage(1); }}
            placeholder={t("archives.all_categories")}
            options={[
              { value: "", label: t("archives.all_categories") },
              ...categories.map((category) => ({ value: String(category.id), label: category.name })),
            ]}
          />
          <DateFilter
            value={dateFrom}
            max={dateTo || undefined}
            label={t("archives.from")}
            language={i18n.language}
            onChange={(value) => { setDateFrom(value); setPage(1); }}
          />
          <DateFilter
            value={dateTo}
            min={dateFrom || undefined}
            label={t("archives.to")}
            language={i18n.language}
            onChange={(value) => { setDateTo(value); setPage(1); }}
          />
          {(searchInput || filterType !== "Tous" || filterCategory || dateFrom || dateTo) && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-sm text-slate-400
                         hover:text-rose-500 transition px-2"
            >
              <MdClose className="text-base" /> {t("archives.reset")}
            </button>
          )}
        </div>
      </div>

      {/* ── Tableau ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {[t("archives.name"), t("archives.type"), t("archives.size"),
  t("archives.date"), t("archives.author"), t("archives.actions")].map((h) => (
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
  <>
    {[...Array(5)].map((_, i) => (
      <tr key={i}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="skeleton w-6 h-6 rounded-full" />
            <div className="skeleton h-4 w-48 rounded" />
          </div>
        </td>
        <td className="px-4 py-3"><div className="skeleton h-4 w-12 rounded-full" /></td>
        <td className="px-4 py-3"><div className="skeleton h-4 w-16 rounded" /></td>
        <td className="px-4 py-3"><div className="skeleton h-4 w-20 rounded" /></td>
        <td className="px-4 py-3"><div className="skeleton h-4 w-24 rounded" /></td>
        <td className="px-4 py-3"><div className="skeleton h-4 w-16 rounded" /></td>
      </tr>
    ))}
  </>
)}

            {!loading && error && (
              <tr>
                <td colSpan={6} className="text-center py-16 text-rose-400">{t("archives.loading_error")}</td>
              </tr>
            )}

            {!loading && !error && documents.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-16 text-slate-400">
                  <MdInsertDriveFile className="text-4xl mx-auto mb-2 text-slate-300" />
                  {t("archives.no_documents")}
                </td>
              </tr>
            )}

            {!loading && !error && documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => navigate(`/archives/${doc.id}`)}>

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
                  {new Date(doc.created_at).toLocaleDateString(i18n.language === "en" ? "en-US" : "fr-FR")}
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
                    {doc.current_version?.file && (
                     <a
                       href={resolveMediaUrl(doc.current_version.file)}
                       target="_blank"
                       rel="noreferrer"
                       onClick={(e) => e.stopPropagation()}
                       className="text-slate-400 hover:text-teal-600 transition"
                       title={t("archives.download")}
                     >
                       <MdDownload className="text-lg" />
                     </a>
                    )}
                    {user?.role === "admin" && (
                     <button
                       onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: doc.id, name: doc.name }); }}
                       className="text-slate-400 hover:text-rose-500 transition"
                       title={t("actions.delete")}
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
          t={t}
        />
      )}

    </div>
  );
}
