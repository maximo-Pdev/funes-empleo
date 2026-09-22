import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal Municipal de Empleo de Funes",
  description: "Oficina de Empleo de la Municipalidad de Funes",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR">
      <body>
        <a href="#contenido" className="sr-only focus:not-sr-only focus:block focus:p-4">Ir al contenido principal</a>
        {children}
      </body>
    </html>
  );
}
