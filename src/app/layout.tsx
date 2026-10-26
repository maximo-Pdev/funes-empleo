import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal Municipal de Empleo de Funes",
  description: "Oficina de Empleo de la Municipalidad de Funes",
  icons: { icon: "/brand/funes-navbar-seal.png" },
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
