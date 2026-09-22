import type { ReactNode } from "react";
import type { UserRole } from "@/domain/catalogs";

const roleLabels: Record<UserRole, string> = {
  candidate: "Área de candidatos",
  company: "Área de empresas",
  admin: "Oficina de Empleo",
};

export interface RoleShellProps {
  role: UserRole;
  title: string;
  description?: string;
  navigation?: readonly { href: string; label: string }[];
  children: ReactNode;
}

// Presentational only. Protected route layouts and every private operation must
// independently validate the current session, role, status and ownership.
export function RoleShell({ role, title, description, navigation = [], children }: RoleShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-300 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-sm font-bold text-blue-900">Municipalidad de Funes</p>
            <p className="text-sm text-slate-700">{roleLabels[role]}</p>
          </div>
          {navigation.length > 0 && (
            <nav aria-label={`Navegación de ${roleLabels[role]}`} className="flex flex-wrap gap-2">
              {navigation.map(({ href, label }) => (
                <a key={`${href}-${label}`} href={href} className="rounded-md px-3 py-2 font-medium text-blue-900 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-3 focus-visible:outline-blue-700">
                  {label}
                </a>
              ))}
            </nav>
          )}
        </div>
      </header>
      <main id="contenido" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-slate-700">{description}</p>}
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
