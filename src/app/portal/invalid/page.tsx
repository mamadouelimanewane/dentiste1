import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PortalInvalidPage() {
  // La page invitait à « contacter le cabinet » sans donner le moindre moyen
  // de le joindre — sur l'écran qu'atteint précisément un patient dont le lien
  // ne fonctionne plus, et qui n'a donc plus accès à la messagerie. Le nom et
  // le téléphone sont affichés dès qu'ils sont renseignés dans Configuration.
  type Cabinet = { clinic_name?: string | null; phone?: string | null };
  let clinic: Cabinet | null = null;
  try {
    const rows = await sql`select clinic_name, phone from clinic_settings where id = true limit 1`;
    clinic = (rows[0] as Cabinet | undefined) ?? null;
  } catch {
    // Une base indisponible ne doit pas empêcher d'afficher le message.
  }

  const nomCabinet = clinic?.clinic_name?.trim() || "votre cabinet dentaire";
  const telephone = clinic?.phone?.trim() || null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] px-4">
      <div className="max-w-sm text-center text-white space-y-3">
        <h1 className="text-xl font-black">Lien invalide ou expiré</h1>
        <p className="text-sm text-slate-400">
          Ce lien d&apos;accès à votre espace patient n&apos;est plus valable. Les liens sont
          valables 24 heures et ne servent qu&apos;une fois.
        </p>
        <p className="text-sm text-slate-400">
          Demandez-en un nouveau à {nomCabinet}
          {telephone ? " :" : "."}
        </p>
        {telephone && (
          <a
            href={`tel:${telephone.replace(/\s/g, "")}`}
            className="inline-block text-base font-bold text-white underline underline-offset-4 hover:text-blue-300"
          >
            {telephone}
          </a>
        )}
      </div>
    </div>
  );
}
