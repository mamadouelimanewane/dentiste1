"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const THEMES = [
  {
    key: "light",
    label: "Light",
    icon: Sun,
    title: "Thème Clair",
    color: "#F8FAFC",
    iconColor: "#f59e0b",
  },
  {
    key: "dark",
    label: "Dark",
    icon: Moon,
    title: "Thème Sombre",
    color: "#0F172A",
    iconColor: "#818cf8",
  },
  {
    key: "smart",
    label: "Smart",
    icon: Zap,
    title: "Thème Smart (Abyssal)",
    color: "#02040A",
    iconColor: "#06b6d4",
  },
];

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  if (compact) {
    const next = theme === "light" ? "dark" : theme === "dark" ? "smart" : "light";
    const current = THEMES.find(t => t.key === theme) ?? THEMES[0];
    const Icon = current.icon;
    return (
      <button
        onClick={() => setTheme(next)}
        title={`Thème actuel : ${current.title}`}
        className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all micro-bounce"
      >
        <Icon size={16} style={{ color: current.iconColor }} />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-black/10 dark:bg-white/5 backdrop-blur-md border border-white/10">
      {THEMES.map(t => {
        const Icon = t.icon;
        const isActive = theme === t.key;
        return (
          <button
            key={t.key}
            onClick={() => setTheme(t.key)}
            title={t.title}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 micro-bounce",
              isActive
                ? "bg-white/15 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Icon size={13} style={{ color: isActive ? t.iconColor : undefined }} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
