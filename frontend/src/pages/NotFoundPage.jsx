import { useNavigate } from "react-router-dom";
import { MdSearchOff } from "react-icons/md";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
      <div className="bg-white rounded-2xl border border-slate-200 p-10
                      text-center shadow-sm max-w-sm w-full">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center
                        justify-center mx-auto mb-4">
          <MdSearchOff className="text-slate-400 text-4xl" />
        </div>
        <h2 className="text-4xl font-bold text-slate-800 mb-1">404</h2>
        <p className="text-sm text-slate-400 mb-6">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="w-full bg-teal-700 text-white text-sm py-2.5 rounded-lg
                     hover:bg-teal-800 transition font-medium"
        >
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );
}