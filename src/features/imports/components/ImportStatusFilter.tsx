import { Select } from '../../../components/ui';
import { importJobStatuses, type ImportJobStatus } from '../types/import';
import { importStatusLabel } from '../utils/import-labels';

type ImportStatusFilterProps = {
  status?: ImportJobStatus;
  disabled?: boolean;
  onChange: (status?: ImportJobStatus) => void;
};

/**
 * Filtro com os status confirmados pelo domínio. "Todos" é apenas o estado
 * visual do controle: quando selecionado, nenhum parâmetro `status` é enviado.
 */
export function ImportStatusFilter({
  disabled = false,
  onChange,
  status,
}: ImportStatusFilterProps) {
  return (
    <Select
      disabled={disabled}
      label="Status"
      onChange={(event) => {
        const value = event.currentTarget.value;
        onChange(value ? (value as ImportJobStatus) : undefined);
      }}
      options={[
        { value: '', label: 'Todos' },
        ...importJobStatuses.map((item) => ({
          value: item,
          label: importStatusLabel(item),
        })),
      ]}
      value={status ?? ''}
    />
  );
}
