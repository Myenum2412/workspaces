import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "My Workspace",
  description: "Manage tasks, teams, and workspace operations.",
};

import { Providers } from "./providers";

import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = JSON.parse(localStorage.getItem('theme-settings') || '{}');
                  if (theme.primaryColor) document.documentElement.style.setProperty('--primary', theme.primaryColor);
                  if (theme.primaryForeground) document.documentElement.style.setProperty('--primary-foreground', theme.primaryForeground);
                  if (theme.secondaryColor) document.documentElement.style.setProperty('--secondary', theme.secondaryColor);
                  if (theme.secondaryForeground) document.documentElement.style.setProperty('--secondary-foreground', theme.secondaryForeground);
                  if (theme.accentColor) document.documentElement.style.setProperty('--accent', theme.accentColor);
                  if (theme.accentForeground) document.documentElement.style.setProperty('--accent-foreground', theme.accentForeground);
                  if (theme.backgroundColor) document.documentElement.style.setProperty('--background', theme.backgroundColor);
                  if (theme.foregroundColor) document.documentElement.style.setProperty('--foreground', theme.foregroundColor);
                  if (theme.cardColor) document.documentElement.style.setProperty('--card', theme.cardColor);
                  if (theme.cardForeground) document.documentElement.style.setProperty('--card-foreground', theme.cardForeground);
                  if (theme.borderColor) document.documentElement.style.setProperty('--border', theme.borderColor);
                  if (theme.mutedColor) document.documentElement.style.setProperty('--muted', theme.mutedColor);
                  if (theme.mutedForeground) document.documentElement.style.setProperty('--muted-foreground', theme.mutedForeground);
                } catch(e) {}
              })();
            `,
          }}
        />
      <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-full flex flex-col font-poppins">
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
