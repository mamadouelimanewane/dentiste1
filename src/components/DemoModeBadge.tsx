"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { IntegrationStatus } from "@/lib/integrations/status";

// Seules les clés booléennes ont un sens ici : un tableau vide est
// « truthy » et masquerait le badge à tort.
type FeatureBooleenne = {
  [K in keyof IntegrationStatus]: IntegrationStatus[K] extends boolean ? K : never;
}[keyof IntegrationStatus];

// Le message dépend de ce qui se passe réellement quand la clé manque :
// les messages sont journalisés en « simulé », alors qu'un paiement est
// purement refusé — annoncer un « mode démo » y laisserait croire qu'un
// règlement fictif va aboutir.
const MESSAGES: Partial<Record<FeatureBooleenne, string>> = {
  payments: "API Wave / Orange Money en cours de connexion",
  video: "Téléconsultation non configurée",
};

export function DemoModeBadge({ feature }: { feature: FeatureBooleenne }) {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);

  useEffect(() => {
    fetch("/api/config/status")
      .then((res) => res.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  if (!status || status[feature]) return null;

  return (
    <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">
      <AlertTriangle className="h-3 w-3" />
      {MESSAGES[feature] || "Mode démo — clé API non configurée"}
    </div>
  );
}
