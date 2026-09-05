"use client";

import React, { useState } from "react";
import { KeyRound, X, Check, AlertTriangle } from "lucide-react";

// Changement de son propre mot de passe.
//
// L'écran de création d'utilisateur promettait « il pourra le changer
// ensuite » alors que rien ne le permettait : chaque membre du personnel
// gardait indéfiniment le mot de passe communiqué de vive voix le premier
// jour. Cet écran rend la promesse vraie.
export function ChangerMotDePasse() {
  const [ouvert, setOuvert] = useState(false);
  const [actuel, setActuel] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  const fermer = () => {
    setOuvert(false);
    setActuel(""); setNouveau(""); setConfirmation("");
    setErreur(null); setSucces(false);
  };

  const soumettre = async () => {
    setErreur(null);
    // Vérifié ici pour éviter un aller-retour, et revérifié côté serveur.
    if (nouveau !== confirmation) {
      setErreur("Les deux saisies du nouveau mot de passe ne correspondent pas.");
      return;
    }
    setEnvoi(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motDePasseActuel: actuel, nouveauMotDePasse: nouveau }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Changement impossible.");
      setSucces(true);
      setActuel(""); setNouveau(""); setConfirmation("");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOuvert(true)}
        title="Changer mon mot de passe"
        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
      >
        <KeyRound className="h-4 w-4" />
      </button>

      {ouvert && (
        <div className="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
                Changer mon mot de passe
              </h3>
              <button onClick={fermer} className="text-slate-400 hover:text-slate-900">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {succes ? (
                <div className="flex items-start gap-2 text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-3">
                  <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  Mot de passe changé. Il sera demandé à votre prochaine connexion.
                </div>
              ) : (
                <>
                  {erreur && (
                    <div className="flex items-start gap-2 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded p-3">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      {erreur}
                    </div>
                  )}
                  {[
                    { libelle: "Mot de passe actuel", valeur: actuel, set: setActuel },
                    { libelle: "Nouveau mot de passe", valeur: nouveau, set: setNouveau },
                    { libelle: "Confirmer le nouveau", valeur: confirmation, set: setConfirmation },
                  ].map((champ) => (
                    <div key={champ.libelle}>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                        {champ.libelle}
                      </label>
                      <input
                        type="password"
                        value={champ.valeur}
                        onChange={(e) => champ.set(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-sm text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                  <p className="text-[10px] text-slate-400">
                    Au moins 10 caractères. Choisissez-en un que vous n&apos;utilisez nulle part ailleurs.
                  </p>
                </>
              )}
            </div>

            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={fermer}
                className="px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-200 transition-colors"
              >
                {succes ? "Fermer" : "Annuler"}
              </button>
              {!succes && (
                <button
                  onClick={soumettre}
                  disabled={envoi || !actuel || !nouveau || !confirmation}
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40 transition-colors"
                >
                  {envoi ? "Enregistrement…" : "Changer"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
