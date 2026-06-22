import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdClose,
  MdCheck,
  MdFolder,
  MdSearch,
} from "react-icons/md";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api/documents";
import { useToastStore } from "../store/toastStore";

function CategoryModal({ category, onClose, onSave }) {
  const { t } = useTranslation();
  const [name, setName] = useState(category?.name || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSave(name.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-fade-in-scale">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-slate-800">
            {category ? t("categories.edit_title") : t("categories.create_title")}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <MdClose className="text-xl" />
          </button>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {t("categories.name_label")}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder={t("categories.placeholder")}
            autoFocus
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 text-sm py-2.5 rounded-lg hover:bg-slate-50 transition font-medium">
            {t("actions.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || loading}
            className="flex-1 bg-teal-700 text-white text-sm py-2.5 rounded-lg hover:bg-teal-800 transition font-medium flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <MdCheck className="text-lg" />
            {loading ? t("profile.saving") : category ? t("actions.edit") : t("actions.create")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const { success, error } = useToastStore();

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data.results || res.data))
      .catch(() => error(t("categories.error_load")))
      .finally(() => setLoading(false));
  }, [error, t]);

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const saveCategory = async (name) => {
    try {
      if (modal === "add") {
        const res = await createCategory({ name });
        setCategories((prev) => [...prev, res.data]);
        success(t("categories.created", { name }));
      } else {
        const res = await updateCategory(modal.id, { name });
        setCategories((prev) => prev.map((c) => (c.id === modal.id ? res.data : c)));
        success(t("categories.renamed", { name }));
      }
      setModal(null);
    } catch {
      error(t("categories.error_save"));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCategory(deleteId);
      setCategories((prev) => prev.filter((c) => c.id !== deleteId));
      setDeleteId(null);
      success(t("categories.deleted"));
    } catch {
      error(t("categories.error_delete"));
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{t("categories.title")}</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {categories.length} {categories.length > 1 ? t("categories.categories_pl") : t("categories.category")}
          </p>
        </div>
        <button
          onClick={() => setModal("add")}
          className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm px-4 py-2 rounded-lg transition font-medium"
        >
          <MdAdd className="text-lg" /> {t("categories.new")}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div className="relative">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
          <input
            type="text"
            placeholder={t("categories.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading && (
          <div className="py-16 text-center text-slate-400">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              {t("actions.loading")}
            </div>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center text-slate-400">
            <MdFolder className="text-4xl mx-auto mb-2 text-slate-300" />
            <p className="text-sm">{search ? t("categories.no_results") : t("categories.no_categories")}</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {[t("categories.name"), t("categories.documents"), t("categories.actions")].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0">
                        <MdFolder className="text-teal-600 text-lg" />
                      </div>
                      <span className="font-medium text-slate-800">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">
                      {cat.document_count ?? "-"} doc{cat.document_count > 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => setModal(cat)} className="text-slate-400 hover:text-teal-600 transition" title={t("actions.edit")}>
                        <MdEdit className="text-lg" />
                      </button>
                      <button onClick={() => setDeleteId(cat.id)} className="text-slate-400 hover:text-rose-500 transition" title={t("actions.delete")}>
                        <MdDelete className="text-lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && <CategoryModal category={modal === "add" ? null : modal} onClose={() => setModal(null)} onSave={saveCategory} />}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm animate-fade-in-scale">
            <h3 className="text-base font-bold text-slate-800 mb-2">{t("categories.delete_title")}</h3>
            <p className="text-sm text-slate-500 mb-5">{t("categories.delete_info")}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-slate-200 text-slate-600 text-sm py-2.5 rounded-lg hover:bg-slate-50 transition font-medium">
                {t("actions.cancel")}
              </button>
              <button onClick={handleDelete} className="flex-1 bg-rose-500 text-white text-sm py-2.5 rounded-lg hover:bg-rose-600 transition font-medium">
                {t("actions.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
