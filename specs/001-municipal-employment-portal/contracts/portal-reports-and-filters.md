# EXTRA085: informes y filtros

EXTRA102: fechas de contexto visibles en PDF/XLSX DD/MM/YYYY, as_of con hora
Funes. Entradas ISO y CSV técnico conservan contrato; no cambia valores métricos.

GET /api/admin/exports/operations.pdf y operations.xlsx reciben exactamente
from,to,category opcional como CSV. Duplicados/desconocidos/fechas inválidos se
rechazan; categoría UUID heredada redirige307 a referencia opaca tras guard.
Admin activo, una llamada export_admin_metrics por descarga autorizada; sin nuevos
grants/privilegios. Error público JSON400/403; éxito200 attachment metricas.pdf o
metricas.xlsx, application/pdf o MIME oficial XLSX, private/no-store y nosniff.
CSV conserva contrato. Archivos incluyen contexto/as_of/datos actuales, etiquetas
españolas, refs opacas en lugar de UUID, precisión/0/null explicado. XLSX sin
fórmulas/links/macros; PDF paginado con texto ajustado y fuente local embebida.

Candidatos GET a /admin/candidates o /admin/atencion-presencial: term,
categoryId repetible opaco, availability, locality, eligibility, sin página.
Localidad opcional, categorías OR. Matching GET al detalle con matchOrder sin
matchPage. Servidor valida/resuelve identidades; controles cliente no consultan
datasets privados. Popup bloquea fondo, mantiene canal de scroll interior.
