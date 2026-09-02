import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { PORTAL_COOKIE_NAME, verifyPortalSessionToken } from "@/lib/portal-session";
import { PortalDocumentUpload } from "./PortalDocumentUpload";

export default async function PortalDocumentsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_COOKIE_NAME)!.value;
  const session = await verifyPortalSessionToken(token);

  const documents = await sql`
    select id, file_name, blob_url, mime_type, created_at, uploaded_by_patient
    from patient_documents
    where patient_id = ${session!.patientId} and visible_to_patient = true
    order by created_at desc
  `;

  // L'accueil du portail annonce "Ordonnances, devis, radios" alors que cette
  // page ne lisait que les fichiers explicitement partagés : un patient ayant
  // une ordonnance ne la voyait nulle part. On les expose donc réellement.
  const prescriptions = await sql`
    select id, medications, created_at
    from prescriptions
    where patient_id = ${session!.patientId}
    order by created_at desc
  `;

  // Les devis en brouillon ne sont pas encore présentés au patient.
  const quotes = await sql`
    select id, items, total, status, created_at
    from quotes
    where patient_id = ${session!.patientId} and status <> 'draft'
    order by created_at desc
  `;

  const QUOTE_STATUS: Record<string, string> = {
    sent: "Proposé",
    accepted: "Accepté",
    rejected: "Refusé",
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-black text-slate-900">Mes documents</h2>

      {/* ORDONNANCES */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mes ordonnances</h3>
        <div className="bg-white border border-slate-200 rounded shadow-sm divide-y divide-slate-100">
          {prescriptions.length === 0 && (
            <p className="p-5 text-sm text-slate-400">Aucune ordonnance à ce jour.</p>
          )}
          {prescriptions.map((p) => (
            <div key={p.id} className="p-4 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Ordonnance du {new Date(p.created_at).toLocaleDateString("fr-FR")}
              </p>
              <ul className="space-y-1">
                {(Array.isArray(p.medications) ? p.medications : []).map((m: any, i: number) => (
                  <li key={i} className="text-sm text-slate-800">
                    <span className="font-bold">{m.name}</span>
                    {m.dosage ? ` — ${m.dosage}` : ""}
                    {m.posology ? ` · ${m.posology}` : ""}
                    {m.duration ? ` · ${m.duration}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400">
          Respectez la posologie indiquée par votre praticien. En cas de doute ou d&apos;effet
          indésirable, contactez le cabinet.
        </p>
      </div>

      {/* DEVIS */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mes devis</h3>
        <div className="bg-white border border-slate-200 rounded shadow-sm divide-y divide-slate-100">
          {quotes.length === 0 && <p className="p-5 text-sm text-slate-400">Aucun devis à ce jour.</p>}
          {quotes.map((q) => (
            <div key={q.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Devis du {new Date(q.created_at).toLocaleDateString("fr-FR")}
                </p>
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {QUOTE_STATUS[q.status] || q.status}
                </span>
              </div>
              <ul className="space-y-1">
                {(Array.isArray(q.items) ? q.items : []).map((it: any, i: number) => (
                  <li key={i} className="text-sm text-slate-800 flex justify-between gap-4">
                    <span>
                      {it.label}
                      {it.qty > 1 ? ` × ${it.qty}` : ""}
                    </span>
                    <span className="font-bold whitespace-nowrap">
                      {(Number(it.price || 0) * Number(it.qty || 1)).toLocaleString("fr-FR")} FCFA
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-sm font-black text-slate-900 text-right">
                Total : {Number(q.total).toLocaleString("fr-FR")} FCFA
              </p>
            </div>
          ))}
        </div>
      </div>

      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pt-2">
        Fichiers échangés avec le cabinet
      </h3>

      <PortalDocumentUpload />

      <div className="bg-white border border-slate-200 rounded shadow-sm divide-y divide-slate-100">
        {documents.length === 0 && (
          <p className="p-5 text-sm text-slate-400">Aucun document partagé pour le moment.</p>
        )}
        {documents.map((doc) => (
          <div key={doc.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">{doc.file_name}</p>
              <p className="text-[10px] text-slate-400">
                {doc.uploaded_by_patient ? "Envoyé par vous" : "Partagé par le cabinet"} ·{" "}
                {new Date(doc.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <a
              href={doc.blob_url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:text-blue-700 text-xs font-bold uppercase"
            >
              Télécharger
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
