import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], display: "swap", variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Elite ERP CABINET DENTAIRE DU CAP VERT",
  description: "Système de Gestion Dentaire de Haute Précision",
};

import { PatientProvider } from "@/lib/context";
import { ThemeProvider } from "@/components/ThemeProvider";

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
            {children}
          </PatientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
