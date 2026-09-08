import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], display: "swap", variable: "--font-outfit" });

// Aucune balise de partage n'était déclarée : un lien envoyé sur WhatsApp —
// le canal principal ici — s'affichait sans titre lisible ni description,
// réduit à son adresse. Et la description tenait de la formule publicitaire
// (« Haute Précision ») plutôt que de dire ce que le logiciel fait.
export const metadata: Metadata = {
  title: "Cabinet Dentaire du Cap Vert",
  description:
    "Logiciel du cabinet : dossiers patients, agenda, soins, devis et facturation.",
  openGraph: {
    title: "Cabinet Dentaire du Cap Vert",
    description:
      "Logiciel du cabinet : dossiers patients, agenda, soins, devis et facturation.",
    locale: "fr_SN",
    type: "website",
  },
  robots: {
    // Un logiciel de cabinet n'a pas vocation à être indexé : la page
    // d'accueil est une porte d'entrée pour le personnel, pas une vitrine
    // publique à référencer.
    index: false,
    follow: false,
  },
};

import { PatientProvider } from "@/lib/context";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/lib/ToastContext";
import { GlobalShortcuts } from "@/components/GlobalShortcuts";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${outfit.variable}`} suppressHydrationWarning>
      <body className={`${outfit.className} bg-background text-foreground antialiased selection:bg-blue-500/30 transition-colors duration-300`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          themes={['light', 'dark', 'smart']}
        >
          <PatientProvider>
            <ToastProvider>
              <GlobalShortcuts />
              {children}
            </ToastProvider>
          </PatientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
