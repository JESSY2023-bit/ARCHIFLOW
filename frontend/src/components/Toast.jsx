import { useEffect } from "react";
import {
  MdCheckCircle, MdError, MdInfo, MdWarning, MdClose,
} from "react-icons/md";

const STYLES = {
  success: {
    container: "bg-emerald-50 border-emerald-200 text-emerald-800",
    icon:      <MdCheckCircle className="text-emerald-500 text-xl flex-shrink-0" />,
  },
  error: {
    container: "bg-rose-50 border-rose-200 text-rose-800",
    icon:      <MdError className="text-rose-500 text-xl flex-shrink-0" />,
  },
  info: {
    container: "bg-sky-50 border-sky-200 text-sky-800",
    icon:      <MdInfo className="text-sky-500 text-xl flex-shrink-0" />,
  },
  warning: {
    container: "bg-amber-50 border-amber-200 text-amber-800",
    icon:      <MdWarning className="text-amber-500 text-xl flex-shrink-0" />,
  },
};

// ── Composant Toast individuel ─────────────────────────────────────────────
function ToastItem({ toast, onRemove }) {
  const style = STYLES[toast.type] || STYLES.info;

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg
                  text-sm font-medium max-w-sm w-full animate-slide-in
                  ${style.container}`}
    >
      {style.icon}
      <p className="flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-current opacity-50 hover:opacity-100 transition flex-shrink-0"
      >
        <MdClose className="text-lg" />
      </button>
    </div>
  );
}

// ── Conteneur des toasts ───────────────────────────────────────────────────
export default function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}