import { useNavigate } from "react-router-dom";
import { MdLock } from "react-icons/md";

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
      <div className="bg-white rounded-2xl border border-slate-200 p-10
                      text-center shadow-sm max-w-sm w-full">
        <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center
                        justify-center mx-auto mb-4">
          <MdLock className="text-rose-500 text-3xl" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Accès refusé</h2>
        <p className="text-sm text-slate-400 mb-6">
          Vous n'avez pas les droits nécessaires pour accéder à cette page.
        </p>
        <button
          onClick={() => navigate("/archives")}
          className="w-full bg-teal-700 text-white text-sm py-2.5 rounded-lg
                     hover:bg-teal-800 transition font-medium"
        >
          Retour aux archives
        </button>
      </div>
    </div>
  );
}