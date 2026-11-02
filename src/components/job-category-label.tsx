import {
  BriefcaseBusiness, BrushCleaning, ClipboardList, Factory, GraduationCap, HardHat,
  Headset, HeartPulse, Monitor, ShieldCheck, Store, Truck, Utensils, Warehouse, Wheat, Wrench,
} from "lucide-react";

// Presentation metadata for the catalog in 20261019203041_job_categories_matching.sql.
// Public offers expose names only; match exact catalog names rather than guessing by keywords.
const categories = [
  { code: "ADMINISTRACION", name: "Administración", icon: ClipboardList },
  { code: "ATENCION_VENTAS", name: "Atención al cliente y ventas", icon: Headset },
  { code: "COMERCIO", name: "Comercio", icon: Store },
  { code: "GASTRONOMIA_HOTELERIA", name: "Gastronomía y hotelería", icon: Utensils },
  { code: "LIMPIEZA", name: "Limpieza", icon: BrushCleaning },
  { code: "CONSTRUCCION_OFICIOS", name: "Construcción y oficios", icon: HardHat },
  { code: "MANTENIMIENTO", name: "Mantenimiento", icon: Wrench },
  { code: "PRODUCCION_INDUSTRIA", name: "Producción e industria", icon: Factory },
  { code: "LOGISTICA_DEPOSITO", name: "Logística y depósito", icon: Warehouse },
  { code: "TRANSPORTE_REPARTO", name: "Transporte y reparto", icon: Truck },
  { code: "SALUD_CUIDADOS", name: "Salud y cuidados", icon: HeartPulse },
  { code: "EDUCACION", name: "Educación", icon: GraduationCap },
  { code: "TECNOLOGIA", name: "Tecnología", icon: Monitor },
  { code: "SEGURIDAD", name: "Seguridad", icon: ShieldCheck },
  { code: "AGRO", name: "Agro", icon: Wheat },
];

export function CategoryLabels({ categories, fallback = "" }: {
  categories: readonly { name: string; code?: string }[];
  fallback?: string;
}) {
  return categories.length ? <>{categories.map((category, index) => <span key={`${category.name}-${index}`}>
    {index > 0 && ", "}<CategoryLabel name={category.name} code={category.code} />
  </span>)}</> : <>{fallback}</>;
}

export function CategoryLabel({ name, code, className = "" }: { name: string; code?: string; className?: string }) {
  const category = categories.find(category => category.code === code) ?? categories.find(category => category.name === name);
  const Icon = category?.icon ?? BriefcaseBusiness;
  return <span className={`inline-flex min-w-0 items-start gap-1.5 ${className}`}>
    <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
    <span className="min-w-0 whitespace-normal break-words">{name}</span>
  </span>;
}
