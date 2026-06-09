import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MdArrowBack, MdDownload, MdEdit, MdDelete,
  MdPictureAsPdf, MdTableChart, MdDescription,
  MdHistory, MdInfo, MdPerson, MdCalendarToday,
  MdLabel, MdFolder, MdCheckCircle, MdClose,
  MdUploadFile, MdVisibility,
} from "react-icons/md";

// ── Données fictives ───────────────────────────────────────────────────────
const MOCK_DOCUMENTS = [
  {
    id: 1,
    name:     "Contrat_2024_ClientA.pdf",
    type:     "PDF",
    size:     "1.2 MB",
    date:     "2024-01-15",
    author:   "Alice Martin",
    category: "Contrats",
    tags:     ["contrat", "client", "2024"],
    description: "Contrat de prestation de services signé avec le Client A pour l'année 2024. Inclut les annexes tarifaires et les conditions générales.",
    versions: [
      { version: "v3", date: "2024-01-15", author: "Alice Martin",  size: "1.2 MB", note: "Version finale signée" },
      { version: "v2", date: "2024-01-10", author: "Bob Dupont",    size: "1.1 MB", note: "Corrections clauses 4 et 7" },
      { version: "v1", date: "2024-01-05", author: "Alice Martin",  size: "0.9 MB", note: "Version initiale" },
    ],
  },
  {
    id: 2,
    name:     "Rapport_Q1_2024.xlsx",
    type:     "Excel",
    size:     "0.8 MB",
    date:     "2024-02-10",
    author:   "Bob Dupont",
    category: "Finance",
    tags:     ["rapport", "finance", "Q1"],
    description: "Rapport financier du premier trimestre 2024. Contient les bilans, comptes de résultat et tableaux de bord KPI.",
    versions: [
      { version: "v2", date: "2024-02-10", author: "Bob Dupont",   size: "0.8 MB", note: "Ajout des graphiques KPI" },
      { version: "v1", date: "2024-02-05", author: "Carol Nguyen", size: "0.7 MB", note: "Version brute des données" },
    ],
  },
  {
    id: 3, name: "Note_interne_RH.docx",        type: "Word",  size: "0.3 MB", date: "2024-03-05", author: "Alice Martin",  category: "RH",       tags: ["rh", "interne"],          description: "Note interne relative aux nouvelles procédures RH.",                     versions: [{ version: "v1", date: "2024-03-05", author: "Alice Martin", size: "0.3 MB", note: "Version initiale" }] },
  { id: 4, name: "Facture_Fournisseur_B.pdf",  type: "PDF",   size: "0.5 MB", date: "2024-03-18", author: "Carol Nguyen", category: "Finance",  tags: ["facture"],                description: "Facture émise par le fournisseur B pour la commande #2024-031.",         versions: [{ version: "v1", date: "2024-03-18", author: "Carol Nguyen", size: "0.5 MB", note: "Version initiale" }] },
  { id: 5, name: "Presentation_Strategie.pdf", type: "PDF",   size: "3.1 MB", date: "2024-04-01", author: "Bob Dupont",   category: "Stratégie",tags: ["stratégie"],              description: "Présentation stratégique pour le CODIR du T2 2024.",                     versions: [{ version: "v1", date: "2024-04-01", author: "Bob Dupont",   size: "3.1 MB", note: "Version initiale" }] },
  { id: 6, name: "Budget_2024.xlsx",           type: "Excel", size: "1.5 MB", date: "2024-04-20", author: "Carol Nguyen", category: "Finance",  tags: ["finance", "budget"],      description: "Budget prévisionnel annuel 2024 validé par la direction.",               versions: [{ version: "v1", date: "2024-04-20", author: "Carol Nguyen", size: "1.5 MB", note: "Version initiale" }] },
  { id: 7, name: "Compte_rendu_reunion.docx",  type: "Word",  size: "0.2 MB", date: "2024-05-03", author: "Alice Martin", category: "Réunions", tags: ["réunion"],                description: "Compte rendu de la réunion de direction du 03/05/2024.",                 versions: [{ version: "v1", date: "2024-05-03", author: "Alice Martin", size: "0.2 MB", note: "Version initiale" }] },
  { id: 8, name: "Audit_Securite_2024.pdf",    type: "PDF",   size: "2.4 MB", date: "2024-05-22", author: "Bob Dupont",   category: "Audit",    tags: ["audit", "sécurité"],      description: "Rapport d'audit de sécurité informatique réalisé en mai 2024.",          versions: [{ version: "v1", date: "2024-05-22", author: "Bob Dupont",   size: "2.4 MB", note: "Version initiale" }] },
];

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

// ── Modal confirmation suppression ────────────────────────────────────────
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

// ── Page principale ────────────────────────────────────────────────────────
export default function DocumentDetailPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const doc          = MOCK_DOCUMENTS.find((d) => d.id === parseInt(id));
  const [tab, setTab]           = useState("info");       // info | versions
  const [showDelete, setShowDelete] = useState(false);
  const [activeVersion, setActiveVersion] = useState(0);

  if (!doc) return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
      <MdFolder className="text-5xl mb-3 text-slate-300" />
      <p className="text-sm">Document introuvable.</p>
      <button onClick={() => navigate("/archives")}
        className="mt-4 text-teal-600 text-sm hover:underline">
        ← Retour aux archives
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">

      {/* ── Bouton retour ── */}
      <button
        onClick={() => navigate("/archives")}
        className="flex items-center gap-2 text-sm text-slate-400
                   hover:text-teal-600 transition mb-6"
      >
        <MdArrowBack className="text-lg" />
        Retour aux archives
      </button>

      {/* ── En-tête document ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
        <div className="flex items-start justify-between gap-4">

          {/* Icône + nom */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-slate-50 rounded-xl border border-slate-200
                            flex items-center justify-center flex-shrink-0">
              {typeIcon[doc.type]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{doc.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeBadge[doc.type]}`}>
                  {doc.type}
                </span>
                <span className="text-xs text-slate-400">{doc.size}</span>
                <span className="text-xs text-slate-300">·</span>
                <span className="text-xs text-slate-400">
                  {doc.versions.length} version{doc.versions.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="flex items-center gap-1.5 border border-slate-200 text-slate-600
                               text-sm px-3 py-2 rounded-lg hover:bg-slate-50 transition">
              <MdDownload className="text-lg" /> Télécharger
            </button>
            <button className="flex items-center gap-1.5 border border-slate-200 text-slate-600
                               text-sm px-3 py-2 rounded-lg hover:bg-slate-50 transition">
              <MdEdit className="text-lg" /> Modifier
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-1.5 border border-rose-100 text-rose-500
                         text-sm px-3 py-2 rounded-lg hover:bg-rose-50 transition">
              <MdDelete className="text-lg" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Onglets ── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-4 w-fit">
        {[
          { key: "info",     label: "Informations", icon: MdInfo    },
          { key: "versions", label: "Versions",     icon: MdHistory },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                        transition
                        ${tab === key
                          ? "bg-white text-teal-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                        }`}
          >
            <Icon className="text-base" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Contenu onglet Info ── */}
      {tab === "info" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Prévisualisation */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <MdVisibility className="text-teal-600" /> Prévisualisation
            </h3>
            <div className="bg-slate-50 rounded-lg border border-slate-200 h-64
                            flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-16 h-16 bg-white rounded-xl border border-slate-200
                              flex items-center justify-center shadow-sm">
                {typeIcon[doc.type]}
              </div>
              <p className="text-sm text-slate-500 font-medium">{doc.name}</p>
              <p className="text-xs text-slate-400">
                La prévisualisation sera disponible après connexion au backend
              </p>
              <button className="flex items-center gap-2 bg-teal-700 text-white text-xs
                                 px-4 py-2 rounded-lg hover:bg-teal-800 transition mt-1">
                <MdDownload className="text-sm" /> Télécharger pour ouvrir
              </button>
            </div>

            {/* Description */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Description
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">{doc.description}</p>
            </div>
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
                  <p className="text-sm font-medium text-slate-700">{doc.author}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MdCalendarToday className="text-slate-400 text-lg mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Date d'ajout</p>
                  <p className="text-sm font-medium text-slate-700">
                    {new Date(doc.date).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "long", year: "numeric"
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MdFolder className="text-slate-400 text-lg mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Catégorie</p>
                  <p className="text-sm font-medium text-slate-700">{doc.category}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MdLabel className="text-slate-400 text-lg mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 mb-1">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.map((tag) => (
                      <span key={tag}
                        className="text-xs bg-slate-100 text-slate-600
                                   px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MdHistory className="text-slate-400 text-lg mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Version actuelle</p>
                  <p className="text-sm font-medium text-teal-700 font-mono">
                    {doc.versions[0].version}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── Contenu onglet Versions ── */}
      {tab === "versions" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center
                          justify-between">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <MdHistory className="text-teal-600" />
              Historique des versions
            </h3>
            <button className="flex items-center gap-2 bg-teal-700 text-white text-xs
                               px-3 py-1.5 rounded-lg hover:bg-teal-800 transition">
              <MdUploadFile className="text-sm" /> Nouvelle version
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {doc.versions.map((v, i) => (
              <div
                key={v.version}
                onClick={() => setActiveVersion(i)}
                className={`px-6 py-4 cursor-pointer transition
                            ${activeVersion === i ? "bg-teal-50" : "hover:bg-slate-50"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">

                    {/* Indicateur version */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center
                                    text-xs font-bold flex-shrink-0 mt-0.5
                                    ${i === 0
                                      ? "bg-teal-100 text-teal-700"
                                      : "bg-slate-100 text-slate-500"
                                    }`}>
                      {v.version}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">
                          {v.version}
                        </p>
                        {i === 0 && (
                          <span className="text-xs bg-teal-100 text-teal-700
                                           px-2 py-0.5 rounded-full font-medium">
                            Actuelle
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{v.note}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <MdPerson className="text-sm" /> {v.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <MdCalendarToday className="text-sm" />
                          {new Date(v.date).toLocaleDateString("fr-FR")}
                        </span>
                        <span>{v.size}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions version */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs flex items-center gap-1 border border-slate-200
                                 text-slate-500 px-2.5 py-1.5 rounded-lg hover:bg-slate-100
                                 transition"
                    >
                      <MdDownload className="text-sm" /> DL
                    </button>
                    {i !== 0 && (
                      <button
                        onClick={(e) => e.stopPropagation()}
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

      {/* ── Modal suppression ── */}
      {showDelete && (
        <DeleteModal
          onConfirm={() => { setShowDelete(false); navigate("/archives"); }}
          onClose={() => setShowDelete(false)}
        />
      )}

    </div>
  );
}