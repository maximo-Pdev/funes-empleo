import { Form } from "@/components/forms/form";
import { Button, SelectField } from "@/components/ui";
import { openingMatchOrderOptions, type OpeningMatchOrder } from "@/domain/catalogs/opening-match-order";

export function OpeningMatchOrderForm({ openingReference, order, available }: {
  openingReference: string; order: OpeningMatchOrder; available: boolean;
}) {
  return <Form method="get" action={`/admin/openings/${openingReference}#opening-matches`}
    aria-label="Ordenar candidatos coincidentes" className="flex flex-wrap items-end gap-3">
    <div className="w-full max-w-sm"><SelectField id="opening-match-order" name="matchOrder"
      label="Última actualización del perfil" placeholder={null} options={openingMatchOrderOptions}
      defaultValue={order} disabled={!available} /></div>
    <Button type="submit" variant="secondary" disabled={!available}>Aplicar orden</Button>
  </Form>;
}
