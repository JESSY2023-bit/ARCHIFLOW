import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MdLock, MdCheck } from "react-icons/md";
import { validateToken, setPassword } from "../api/users";
import tenant from "../config/tenant";

export default function SetPasswordPage() {
  const { t } = useTranslation();
  const { token }   = useParams();
  const navigate    = useNavigate();
  const [info, setInfo]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(false);
  const [form, setForm]         = useState({ password: "", confirm: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    validateToken(token)
      .then((res) => setInfo(res.data))
      .catch((err) => setError(err.response?.data?.error || t("set_password.invalid_or_expired")))
      .finally(() => setLoading(false));
  }, [token, t]);

  const handleSubmit = async () => {
    if (form.password !== form.confirm) {
      setError(t("set_password.pwd_mismatch"));
      return;
    }
    if (form.password.length < 6) {
      setError(t("set_password.pwd_min"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await setPassword({ token, password: form.password, confirm: form.confirm });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || t("set_password.create_error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md">

        {/* Logo */}
       <div style={{ backgroundColor: "var(--color-accent)" }}
  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
  <span className="text-2xl">{tenant.logoIcon}</span>
</div>
<h1 className="text-2xl font-bold text-slate-800 tracking-tight">{tenant.name}</h1>
<p className="text-slate-500 text-sm mt-1">{t("set_password.title")}</p>


        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

          {/* Chargement */}
          {loading && (
            <div className="text-center py-8 text-slate-400">
              <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent
                              rounded-full animate-spin mx-auto mb-3" />
              {t("set_password.verifying")}
            </div>
          )}

          {/* Erreur token */}
          {!loading && error && !success && (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center
                              justify-center mx-auto mb-3">
                <span className="text-rose-500 text-xl">✕</span>
              </div>
              <p className="text-rose-600 font-medium mb-2">{t("set_password.invalid")}</p>
              <p className="text-slate-400 text-sm mb-6">{error}</p>
              <button onClick={() => navigate("/login")}
                className="text-teal-600 text-sm hover:underline">
                {t("set_password.back_login")}
              </button>
            </div>
          )}

          {/* Succès */}
          {success && (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center
                              justify-center mx-auto mb-3">
                <MdCheck className="text-emerald-500 text-2xl" />
              </div>
              <p className="text-emerald-700 font-medium mb-2">{t("set_password.success")}</p>
              <p className="text-slate-400 text-sm mb-6">
                {t("set_password.success_msg")}
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-teal-700 text-white py-2.5 rounded-lg text-sm
                           font-semibold hover:bg-teal-800 transition"
              >
                {t("set_password.login")}
              </button>
            </div>
          )}

          {/* Formulaire */}
          {!loading && info && !success && (
            <div>
              <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
                <p className="text-xs text-slate-400 mb-1">{t("set_password.invited_as")}</p>
                <p className="text-sm font-semibold text-slate-700">{info.email}</p>
                <span className="text-xs bg-teal-50 text-teal-700 border border-teal-100
                                 px-2 py-0.5 rounded-full font-medium capitalize mt-1 inline-block">
                  {info.role}
                </span>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 text-sm
                                p-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {t("set_password.new_pwd")}
                  </label>
                  <div className="relative mt-1">
                    <MdLock className="absolute left-3 top-1/2 -translate-y-1/2
                                       text-slate-400 text-lg" />
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5
                                 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {t("set_password.confirm_pwd")}
                  </label>
                  <div className="relative mt-1">
                    <MdLock className="absolute left-3 top-1/2 -translate-y-1/2
                                       text-slate-400 text-lg" />
                    <input
                      type="password"
                      value={form.confirm}
                      onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                      placeholder="••••••••"
                      className={`w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm
                                  focus:outline-none focus:ring-2 focus:ring-teal-500
                                  ${form.confirm && form.password !== form.confirm
                                    ? "border-rose-300"
                                    : "border-slate-200"
                                  }`}
                    />
                  </div>
                  {form.confirm && form.password !== form.confirm && (
                    <p className="text-xs text-rose-500 mt-1">
                      {t("set_password.pwd_mismatch")}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !form.password || !form.confirm}
                  className="w-full bg-teal-700 text-white py-2.5 rounded-lg text-sm
                             font-semibold hover:bg-teal-800 transition disabled:opacity-50 mt-2"
                >
                  {submitting ? t("set_password.creating") : t("set_password.create")}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">{tenant.footerText}</p>
      </div>
    </div>
  );
}
