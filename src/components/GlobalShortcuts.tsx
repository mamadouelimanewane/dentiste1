"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/ToastContext";
import { usePatient } from "@/lib/context";

export function GlobalShortcuts() {
  const router = useRouter();
  const { toast } = useToast();
  const { setCurrentPatient } = usePatient();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Ctrl + N : Nouveau Dossier
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setCurrentPatient(null);
        localStorage.setItem("dentiste_lite_step", "3"); // 3 = Nouveau Dossier
        localStorage.setItem("dentiste_home_view", "workflow");
        router.push("/dashboard");
        toast("Mode création de dossier ouvert", "info");
      }

      // Ctrl + K : Retour Accueil / Portail
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        localStorage.setItem("dentiste_home_view", "portal");
        router.push("/dashboard/apps");
        toast("Portail des applications", "info");
      }
      
      // Ctrl + E : Urgence / Action Rapide
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        // L'événement n'était écouté nulle part : le raccourci annonçait un
        // menu qui ne s'ouvrait jamais. On ouvre l'écran d'accueil, où se
        // fait l'enregistrement d'un patient qui arrive en urgence.
        router.push("/dashboard");
        toast("Urgence — écran d'enregistrement", "success");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, toast, setCurrentPatient]);

  return null;
}
