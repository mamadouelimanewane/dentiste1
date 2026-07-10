"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { IntegrationStatus } from "@/lib/integrations/status";

export function DemoModeBadge({ feature }: { feature: keyof IntegrationStatus }) {
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
      Mode démo — clé API non configurée
    </div>
  );
}
