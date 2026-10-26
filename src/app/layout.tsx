import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal Municipal de Empleo de Funes",
  description: "Oficina de Empleo de la Municipalidad de Funes",
  icons: { icon: { url: "/brand/funes-favicon-white.png?v=white-emblem-1", type: "image/png", sizes: "256x256" } },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR">
      <body>
        {children}
      </body>
    </html>
  );
}
