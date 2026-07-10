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

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-black text-slate-900">Mes documents</h2>

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
