import React, { useEffect, useState } from "react";
import { Brain, Activity, Clock, ShieldAlert, MessageCircle, RefreshCcw, Truck, Stethoscope, Calendar, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NeuralLog {
  id: number;
  command_id: string;
  command_type: string;
  content: string;
  suggestion: string;
  status: string;
  meta_data: any;
  created_at: string;
}

export function NeuralLogsDashboard() {
  const [logs, setLogs] = useState<NeuralLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/neural-logs?limit=50");
      const data = await res.json();
      if (res.ok) setLogs(data.logs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Pas de push temps réel sur Neon (pas de service Realtime dédié) :
    // on rafraîchit par polling toutes les 5s.
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const getIconForType = (type: string) => {
    switch (type) {
      case "URGENT": return <ShieldAlert className="h-4 w-4 text-rose-500" />;
      case "WHATSAPP": return <MessageCircle className="h-4 w-4 text-emerald-500" />;
      case "LABO": return <Truck className="h-4 w-4 text-amber-500" />;
      case "CHARTING": return <Stethoscope className="h-4 w-4 text-blue-500" />;
      case "RDV": return <Calendar className="h-4 w-4 text-indigo-500" />;
      default: return <Activity className="h-4 w-4 text-slate-500" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "WHATSAPP": return "bg-emerald-100 text-emerald-700";
      case "PATIENT": return "bg-blue-100 text-blue-700";
      case "LABO": return "bg-amber-100 text-amber-700";
      case "CHARTING": return "bg-indigo-100 text-indigo-700";
      case "RADIO": return "bg-purple-100 text-purple-700";
      case "BILLING": return "bg-teal-100 text-teal-700";
      case "RDV": return "bg-cyan-100 text-cyan-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Data Brain (Temps Réel)</h3>
            <p className="text-xs text-slate-500 font-medium">Monitoring des flux NLP NeuralAssistant</p>
          </div>
        </div>
        <button 
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-colors border border-slate-200"
        >
          <RefreshCcw className={cn("h-3 w-3", loading && "animate-spin")} />
          Actualiser
        </button>
      </div>

      <div className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Texte (Requête NLP)</th>
                <th className="px-6 py-3">Action Suggerée (IA)</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Brain className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                    <p className="text-sm font-medium">Aucun log neural détecté.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isUrgent = log.meta_data?.priority === "URGENT" || log.meta_data?.priority === "High";
                  
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {log.status === "pending" ? (
                            <Clock className="h-4 w-4 text-amber-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          )}
                          <span className={cn("text-xs font-bold uppercase", log.status === "pending" ? "text-amber-600" : "text-emerald-600")}>
                            {log.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", getBadgeColor(log.command_type))}>
                          {log.command_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 min-w-[250px]">
                        <div className="flex items-center gap-2">
                          {isUrgent && <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0" />}
                          <span className={cn("font-medium", isUrgent ? "text-rose-700" : "text-slate-700")}>
                            "{log.content}"
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 min-w-[200px]">
                        <span className="text-slate-600 font-medium">
                          {log.suggestion || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-xs font-medium">
                        {new Date(log.created_at).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
