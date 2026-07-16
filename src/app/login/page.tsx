import Link from 'next/link';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F172A] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">
            Elite ERP <span className="text-blue-400">Cap Vert</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Cabinet Dentaire du Cap Vert</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <LoginForm />
        </div>
      </div>
      <div className="flex gap-4 mt-8 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        <Link href="/mentions-legales" className="hover:text-slate-300">Mentions légales</Link>
        <span>·</span>
        <Link href="/confidentialite" className="hover:text-slate-300">Confidentialité</Link>
      </div>
    </div>
  );
}
