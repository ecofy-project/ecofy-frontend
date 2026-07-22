import { Select } from '../../../components/ui';
import { insightTypes, type InsightType } from '../types/insights';
import { insightTypeLabel } from '../utils/insight-format';

type InsightFiltersProps = {
  type?: InsightType;
  disabled?: boolean;
  onChange: (type?: InsightType) => void;
};

/**
 * Recorte por tipo de insight.
 *
 * O `ms-insights` não publica filtros no contrato: os insights chegam apenas
 * dentro do bundle do dashboard. Por isso o recorte é aplicado sobre a coleção
 * recebida, com as mesmas regras em Mock Mode e API Mode, e nenhuma query
 * inexistente é enviada ao backend. O enum utilizado é o `InsightType` real.
 */
export function InsightFilters({
  disabled = false,
  onChange,
  type,
}: InsightFiltersProps) {
  return (
    <Select
      disabled={disabled}
      helperText="O recorte é aplicado sobre os insights já retornados."
      label="Tipo de análise"
      onChange={(event) => {
        const value = event.currentTarget.value;
        onChange(value ? (value as InsightType) : undefined);
      }}
      options={[
        { value: '', label: 'Todos os tipos' },
        ...insightTypes.map((item) => ({
          value: item,
          label: insightTypeLabel(item),
        })),
      ]}
      value={type ?? ''}
    />
  );
}
