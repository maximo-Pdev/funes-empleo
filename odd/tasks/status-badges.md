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
| T1 | S1 S2 S3 S6 S7 | inline | tokens, variante `status`, catálogo de tonos y prueba unitaria |
| T2 | S3 S4 | inline | diez superficies administrativas |
| T3 | S3 S4 | inline | candidato: `/dashboard`, postulaciones, panel de perfil, `/account` |
| T4 | S3 S4 | inline | empresa: `/empresa`, `/empresa/ofertas`, panel de derivación |
| T5 | S4 S6 | inline | `docs/UI_GUIDELINES.md` y cierre del registro `EXTRA-074` |

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
