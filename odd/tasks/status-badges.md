# Badge de estado unificado

Objetivo: reusar `Badge` como indicador de estado en todas las superficies donde
se muestra un estado del dominio.
Rama: `feature/status-badges`. Estrategia de entrega: `ask-on-risk` (un solo PR,
~19 archivos acotados). Runner: `vitest run` + `npm run lint` / `typecheck` /
`build`.

## Specs

- **S1 — Forma.** El componente es «un rectángulo con los bordes laterales
  redondos» (`border-radius: 999px`), alto 26px, con «un círculo en la izquierda
  de color y a la derecha el texto que indique el estado». Punto de 7px,
  separación de 7px, texto de 12px semibold.
- **S2 — Capas de color.** «Los colores están en el fondo más clarito, en el
  círculo interior el color real y un borde con el color real también». El
  texto usa el mismo color real del estado.
- **S3 — Tonos.** Mapeo aprobado el 2026-10-25: verde `#0B7A3B` (activo,
  publicado, contratado, válido, disponible), rojo `#B3251A` (rechazado,
  suspendido, bloqueado, fallido, no se presentó, consentimiento retirado),
  ámbar `#9A6B00` (pendiente, verificación pendiente, correcciones
  solicitadas, necesita actualización, esperando respuesta, vencido por
  política, confirmando, pendiente de confirmación), azul `#1358A5` (en
  revisión, preentrevista, preseleccionada, cargado, listo para confirmar,
  programada), violeta `#5758D6` (derivada, entrevista empresarial), gris
  `#5B6472` (borrador, pausada, cerrada, cancelada, archivada, retirada, no
  seleccionada, sin respuesta empresarial, no disponible, sin informar).
  Los cerrados usan gris; el rojo queda reservado a lo que la Oficina debe
  mirar.
- **S4 — Ubicuidad.** «Quiero que esos estados aparezcan en todos lados y
  páginas donde correspondan»: 19 superficies enumeradas y aprobadas — diez
  páginas administrativas, panel del candidato (postulaciones, resumen, perfil),
  `/account`, `/empresa`, `/empresa/ofertas`, panel de derivación y el preview
  de importación.
- **S5 — Excluidos.** No se usan badges en `<select>` de filtro ni de decisión,
  en el historial de moderación ni en la línea de auditoría (siguen como texto),
  en las páginas públicas de ofertas (solo listan publicadas) ni en las filas de
  importación (no muestran estado hoy).
- **S6 — Un solo catálogo.** El mapeo estado → tono vive en
  `src/domain/presentation/status-tone.ts`. Se eliminan los mapas de etiquetas
  locales duplicados de `admin/empresas` y `admin/imports`.
- **S7 — Compatibilidad.** Las variantes `default`, `secondary` y `outline` de
  `Badge` conservan su contrato, medidas y usos existentes (categorías y
  modalidad en páginas públicas). Las pruebas que afirman el marcado viejo de
  estado se actualizan en el mismo trabajo.

## Tasks

| ID | Specs | Ruta | Estado |
|---|---|---|---|
| T1 | S1 S2 S3 S6 S7 | inline | completado — `e050e72`, `d2466ea` (alto por variante) |
| T2 | S3 S4 | inline | completado — `bfc764d` |
| T3 | S3 S4 | inline | completado — `1f1b2bd` |
| T4 | S3 S4 | inline | completado — `5c4a572`, `ae0c1b0` (prueba de páginas) |
| T5 | S4 S6 | inline | documentación escrita; sin commit porque esos archivos ya traen cambios ajenos sin confirmar |

## Log

- **L1 (pedido original, verbatim):** «Quiero usar este componente de shadcn
  para indicar distintos estados @url:`https://ui.shadcn.com/docs/components/base/badge`,
  pero quiero que lo modifiques un poco. Quiero que al final quede un
  rectangulo con los bordes laterales redondos con un círculo en la izquierda de
  color y a la derecha el texto que indique el estado (por ejemplo, activo,
  inactivo, en espera). Que cada estado corresponda a un color apropiado (rojo,
  verde, azul, amarillo, etc.). Que los colores estén en el fondo más clarito,
  en el círculo interior el color real y un borde con el color real también.
  Mandame una imagen de cómo se vería.»
- **L2 (segundo pedido, verbatim):** «Esa imagen no corresponde a lo que estamos
  hablando pero con el .html que mandaste lo veo y me encanta. Quiero que esos
  estados aparezcan en todos lados y páginas donde correspondan. Primero
  enuméralos y yo verifico.»
- **L3 (aprobación, verbatim):** «Así está perfecto, no cambio nada»
- **L4 (evidencia):** el proyecto ya tiene `src/components/ui/badge.tsx` con
  `default|secondary|outline` y `cn` sin `tailwind-merge`, por lo que la base no
  puede declarar padding que la variante `status` necesite contradecir: el
  padding pasa a cada variante.
- **L5 (desvíos decididos durante la implementación, sin ampliar alcance):**
  (a) la disponibilidad del candidato también usa badge en `/admin/candidates`
  y en el detalle, porque el mismo dato ya lo usa en `/admin/atencion-presencial`
  y el catálogo de tonos aprobado incluye `Disponibilidad`; (b) en
  `/admin/empresas` las etiquetas locales eran femeninas («Incompleta/Activa») y
  al eliminarlas rige el catálogo compartido («Incompleto/Activo»), que es el
  mismo que ya usa `/empresa`; (c) el tono del perfil del candidato ahora sigue
  el catálogo aprobado (`draft` gris, `consent_withdrawn` rojo) en lugar del
  punto propio verde/ámbar; (d) el aviso azul de estado vigente en el historial
  de la participación pasó a fondo neutro para que el color lo aporte el badge.
- **L6 (verificación observada, 2026-10-25):** suite completa `vitest run`
  1190/1190 en 93 archivos. Pruebas nuevas: catálogo de tonos (3), contrato del
  badge (4), badge sobre páginas reales de administración (3 estados) y de
  empresa (borrador y publicada), más la actualización del contrato de
  `profile-presentation`. `npx tsc --noEmit` sin errores propios: los únicos
  tres errores del proyecto están en `tests/components/home-registration-
  navigation.test.tsx`, trabajo en curso ajeno. `npm run build` PASS con
  `tests` excluido del `tsconfig` (restaurado sin diferencias). `eslint` limpio
  sobre los archivos del cambio; `npm run lint` completo falla solo por
  `src/features/accounts/components/resend-verification.tsx`, archivo sin
  seguimiento de la otra sesión. Comprobación real del CSS compilado en el
  servidor de desarrollo: 26px de alto, punto de 7×7, borde de 1px y texto en
  el color del estado (`rgb(11,122,59)` para verde), fondo `rgb(233,246,238)`.
