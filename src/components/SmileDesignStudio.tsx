"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Smile, Camera, AlertTriangle, Images } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatient } from "@/lib/context";

interface PatientImage {
  id: string;
  blob_url: string;
  type: string | null;
  notes: string | null;
  created_at: string;
}

// Comparateur avant / après sur les clichés réellement importés dans le
// dossier du patient (module Imagerie).
//
// La version précédente de cet écran était entièrement fictive : le bouton
// « Lancer le Smile Studio » n'était qu'un setTimeout de 2,5 s, sans image
// d'entrée ni traitement, et affichait comme « avant / après » deux icônes
// génériques. Elle présentait en outre des données inventées et identiques
// pour tous les patients — « Architecture Gingivale : Optimisation +1.2mm »,
// « Vita Master OM3 », « Optimisé par DeepSmile AI » — et surtout un
// « +42% Score Confiance » qui aurait pu servir d'argument de vente pour un
// traitement esthétique. Aucune simulation n'est réalisée ici.
export function SmileDesignStudio() {
  const { currentPatient } = usePatient();
  const [images, setImages] = useState<PatientImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [leftId, setLeftId] = useState<string | null>(null);
  const [rightId, setRightId] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);

  const load = useCallback(async () => {
    if (!currentPatient) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/patient-images?patientId=${currentPatient.id}`);
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        // Un échec autre que 403 laissait la galerie vide en silence : le
        // praticien concluait que le patient n'avait aucun cliché.
        setErreur(data?.error || "Clichés non chargés — ne concluez pas que ce dossier est vide.");
        return;
      }
      {
        setErreur(null);
        const list: PatientImage[] = data.images || [];
        setImages(list);
        // Par défaut : le plus ancien à gauche, le plus récent à droite.
        if (list.length >= 2) {
          const sorted = [...list].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          setLeftId(sorted[0].id);
          setRightId(sorted[sorted.length - 1].id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [currentPatient]);

  useEffect(() => {
    load();
  }, [load]);

  const left = useMemo(() => images.find((i) => i.id === leftId) || null, [images, leftId]);
  const right = useMemo(() => images.find((i) => i.id === rightId) || null, [images, rightId]);

  const legend = (img: PatientImage | null) =>
    img
      ? `${img.type || "Cliché"} — ${new Date(img.created_at).toLocaleDateString("fr-FR")}`
      : "Aucun cliché sélectionné";

  if (!currentPatient) {
    return (
      <div className="bg-white border border-slate-200 rounded-sm p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[400px] shadow-sm">
        <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
          <Smile className="h-10 w-10 text-blue-400" />
        </div>
        <h2 className="text-lg font-black text-slate-800 tracking-tight">Comparaison de clichés</h2>
        <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
          Sélectionnez un patient pour comparer deux photographies de son dossier.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-900 text-white rounded flex items-center justify-center">
            <Images className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-tighter">
              Comparaison de clichés
            </h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
              {currentPatient.name}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-sm">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-900 leading-relaxed">
            <strong>Aucune simulation esthétique n&apos;est réalisée.</strong> Cet écran superpose
            deux photographies réellement présentes au dossier du patient afin de constater une
            évolution. Il ne génère aucune projection de résultat et ne doit pas être présenté au
            patient comme un aperçu de traitement.
          </p>
        </div>
      </div>

      {erreur && (
        <div className="mb-4 rounded-sm border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800 leading-relaxed">
          {erreur}
        </div>
      )}
      {forbidden ? (
        <div className="bg-white border border-slate-200 rounded-sm p-10 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-700">Accès restreint</p>
          <p className="text-xs text-slate-500 mt-2">
            Votre profil ne dispose pas de l&apos;autorisation de consulter l&apos;imagerie des patients.
          </p>
        </div>
      ) : loading ? (
        <div className="bg-white border border-slate-200 rounded-sm p-10 text-center text-sm text-slate-400 shadow-sm">
          Chargement des clichés...
        </div>
      ) : images.length < 2 ? (
        <div className="bg-white border border-slate-200 rounded-sm p-12 text-center space-y-3 shadow-sm">
          <Camera className="h-10 w-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">
            {images.length === 0
              ? "Aucun cliché au dossier de ce patient."
              : "Un seul cliché au dossier : il en faut deux pour comparer."}
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Les photographies s&apos;importent depuis le module Imagerie. La comparaison devient
            possible dès que le dossier contient au moins deux clichés.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-3">
            <div className="bg-slate-900 border border-slate-800 rounded-sm shadow-xl relative overflow-hidden min-h-[460px] flex">
              {/* Cliché de gauche (dessous) */}
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                {left && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={left.blob_url} alt={legend(left)} className="max-h-full max-w-full object-contain" />
                )}
                <p className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-sm">
                  {legend(left)}
                </p>
              </div>

              {/* Cliché de droite (dessus, révélé par le curseur) */}
              <div
                className="absolute inset-0 flex items-center justify-center bg-black"
                style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
              >
                {right && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={right.blob_url} alt={legend(right)} className="max-h-full max-w-full object-contain" />
                )}
                <p className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-sm">
                  {legend(right)}
                </p>
              </div>

              <div className="absolute top-0 bottom-0 w-0.5 bg-blue-400 z-20" style={{ left: `${sliderPos}%` }} />
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(parseInt(e.target.value))}
                aria-label="Position du curseur de comparaison"
                className="absolute inset-x-0 bottom-4 mx-auto w-2/3 z-30 cursor-ew-resize"
              />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {[
              { titre: "Cliché de gauche", value: leftId, set: setLeftId },
              { titre: "Cliché de droite", value: rightId, set: setRightId },
            ].map((col) => (
              <div key={col.titre} className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-100">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{col.titre}</h4>
                </div>
                <div className="max-h-[190px] overflow-y-auto divide-y divide-slate-100">
                  {images.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => col.set(img.id)}
                      className={cn(
                        "w-full text-left p-3 flex items-center gap-3 transition-colors",
                        col.value === img.id ? "bg-blue-50" : "hover:bg-slate-50"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.blob_url} alt="" className="h-10 w-10 object-cover rounded-sm border border-slate-200" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 truncate">{img.type || "Cliché"}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                          {new Date(img.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
