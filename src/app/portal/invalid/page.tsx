export default function PortalInvalidPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] px-4">
      <div className="max-w-sm text-center text-white space-y-3">
        <h1 className="text-xl font-black">Lien invalide ou expiré</h1>
        <p className="text-sm text-slate-400">
          Ce lien d'accès à votre espace patient n'est plus valable. Contactez le cabinet pour en
          recevoir un nouveau.
        </p>
      </div>
    </div>
  );
}
