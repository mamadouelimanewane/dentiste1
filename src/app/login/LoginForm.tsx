"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signIn } from "./actions";
import { useState, useRef } from "react";
import { Eye, EyeOff, AlertCircle, ArrowRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const initialState: { error: string | null } = { error: null };

// La page de connexion affichait en clair « admin@elite.com / admin123 », et
// ces identifiants ouvraient une session ADMINISTRATEUR complète : toute
// personne atteignant l'URL prenait le contrôle du cabinet et de l'ensemble
// des dossiers médicaux. Le raccourci de démonstration n'apparaît désormais
// que si NEXT_PUBLIC_DEMO_LOGIN vaut "true" — jamais sur l'instance d'un
// cabinet réel.
const DEMO_LOGIN = process.env.NEXT_PUBLIC_DEMO_LOGIN === "true";
const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL || "";
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD || "";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-70 text-white font-bold tracking-wide transition-all shadow-[0_8px_20px_-6px_rgba(37,99,235,0.6)] hover:shadow-[0_8px_25px_-4px_rgba(37,99,235,0.7)]"
    >
      {pending ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Connexion...</span>
        </div>
      ) : (
        <>
          Se connecter
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </>
      )}
    </button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useFormState(signIn, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleDemoClick = () => {
    if (formRef.current) {
      const emailInput = formRef.current.querySelector('input[name="email"]') as HTMLInputElement;
      const passInput = formRef.current.querySelector('input[name="password"]') as HTMLInputElement;
      if (emailInput && passInput) {
        emailInput.value = DEMO_EMAIL;
        passInput.value = DEMO_PASSWORD;
      }
      formRef.current.requestSubmit();
    }
  };

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-300" htmlFor="email">
            Adresse email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="docteur@cabinet.com"
            className="w-full h-12 rounded-xl bg-slate-900 border border-slate-700 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-300" htmlFor="password">
              Mot de passe
            </label>
            {/* Le lien renvoyait vers "#" : un utilisateur ayant perdu son mot
                de passe cliquait sans que rien ne se produise. Aucune
                procédure de récupération n'existe — on le dit clairement. */}
            <span
              className="text-xs font-medium text-slate-500"
              title="Aucune récupération automatique : contactez l'administrateur du cabinet."
            >
              Oublié ? Contactez l&apos;administrateur
            </span>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full h-12 rounded-xl bg-slate-900 border border-slate-700 px-4 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {state.error && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p>{state.error}</p>
        </div>
      )}

      <div className="space-y-4 pt-2">
        <SubmitButton />

        {DEMO_LOGIN && (
        <>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#0F172A] px-3 text-slate-500 font-medium uppercase tracking-widest">
              Ou essayez
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDemoClick}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-bold transition-all"
        >
          <Zap className="h-4 w-4 text-amber-400" />
          Connexion Rapide (Démo)
        </button>
        <p className="text-center text-[10px] font-medium text-slate-600 mt-2">
          {DEMO_EMAIL} / {DEMO_PASSWORD}
        </p>
        </>
        )}
      </div>
    </form>
  );
}
