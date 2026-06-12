import {
  MdChevronLeft, MdChevronRight,
  MdFirstPage, MdLastPage,
} from "react-icons/md";

export default function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= page - delta && i <= page + delta)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white
                    border-t border-slate-200">
      {/* Info */}
      <p className="text-xs text-slate-400">
        {Math.min((page - 1) * pageSize + 1, totalItems)}–
        {Math.min(page * pageSize, totalItems)} sur {totalItems}
      </p>

      {/* Boutons */}
      <div className="flex items-center gap-1">

        {/* Première page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400
                     hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <MdFirstPage className="text-lg" />
        </button>

        {/* Page précédente */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400
                     hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <MdChevronLeft className="text-lg" />
        </button>

        {/* Numéros */}
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center
                                               text-xs text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs
                          font-medium transition
                          ${p === page
                            ? "bg-teal-700 text-white"
                            : "text-slate-600 hover:bg-slate-100"
                          }`}
            >
              {p}
            </button>
          )
        )}

        {/* Page suivante */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400
                     hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <MdChevronRight className="text-lg" />
        </button>

        {/* Dernière page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400
                     hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <MdLastPage className="text-lg" />
        </button>
      </div>
    </div>
  );
}