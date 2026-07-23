import Link from 'next/link';
import LoginForm from './LoginForm';
import { Sparkles, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-[#030712] selection:bg-blue-500/30">
      {/* Left Column - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-between p-12 border-r border-white/5">
        {/* Ambient Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 w-full h-full"
               style={{ background: 'radial-gradient(circle at 0% 0%, rgba(37,99,235,0.15) 0%, transparent 50%)' }} />
          <div className="absolute bottom-0 right-0 w-full h-full"
               style={{ background: 'radial-gradient(circle at 100% 100%, rgba(124,58,237,0.15) 0%, transparent 50%)' }} />
          <div className="absolute inset-0 opacity-[0.03]"
               style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
        </div>

        {/* Top Logo */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/40"
               style={{ background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)" }}>
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-black text-white text-xl leading-tight tracking-tight">Elite ERP Dentaire</p>
            <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mt-0.5">Cap Vert</p>
          </div>
        </div>

        {/* Center Content */}
        <div className="max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6">
            <Activity className="h-3.5 w-3.5" />
            Système connecté
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight mb-6">
            Gérez votre cabinet avec une <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">précision chirurgicale</span>.
          </h1>
          <p className="text-lg text-slate-400 font-medium leading-relaxed mb-10">
            Accédez à vos dossiers patients, votre agenda intelligent et vos analyses cliniques depuis une plateforme unique sécurisée.
          </p>
          
          <div className="space-y-4">
            {[
              "Données chiffrées de bout en bout (Neon Postgres)",
              "Conformité RGPD et secret médical",
              "Sauvegarde continue dans le cloud"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <ShieldCheck className="h-4 w-4" />
          Accès restreint au personnel autorisé
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 lg:p-12 relative">
        <div className="w-full max-w-[420px]">
          {/* Mobile Logo */}
          <div className="flex lg:hidden flex-col items-center text-center mb-10">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/40 mb-4"
                 style={{ background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)" }}>
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Elite ERP Dentaire</h1>
            <p className="text-sm text-blue-400 font-bold uppercase tracking-widest mt-1">Cap Vert</p>
          </div>

          <div className="mb-8 hidden lg:block">
            <h2 className="text-3xl font-black text-white tracking-tight">Connexion</h2>
            <p className="text-slate-400 mt-2 font-medium">Saisissez vos identifiants pour accéder au portail.</p>
          </div>

          {/* Glass Card for Form */}
          <div className="bg-[#0F172A]/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl">
            <LoginForm />
          </div>

          <div className="flex justify-center gap-6 mt-10 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <Link href="/" className="hover:text-white transition-colors">Retour au site</Link>
            <span>·</span>
            <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
            <span>·</span>
            <Link href="/confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
