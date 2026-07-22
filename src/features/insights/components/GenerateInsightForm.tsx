import { useState, type FormEvent } from 'react';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Select,
  useToast,
} from '../../../components/ui';
import type { ApiError } from '../../../services/errors/api-error';
import {
  readInsightsFieldErrors,
  type InsightsMutationResult,
} from '../hooks/insights-errors';
import {
  periodGranularities,
  type GenerateInsightsInput,
  type PeriodGranularity,
} from '../types/insights';
import { granularityLabel } from '../utils/insight-format';

const formId = 'generate-insights-form';
const generateFields = ['start', 'end', 'granularity'] as const;

type GenerateInsightFormProps = {
  isGenerating: boolean;
  error: ApiError | null;
  onClearError: () => void;
  onSubmit: (
    input: GenerateInsightsInput,
  ) => Promise<InsightsMutationResult<void>>;
};

/**
 * Solicita a geração de análises para um período.
 *
 * Envia exatamente os campos de `GenerateInsightsRequest` — o identificador do
 * usuário vem da sessão. Nenhum cálculo analítico acontece aqui: o frontend
 * apenas monta o request.
 */
export function GenerateInsightForm({
  error,
  isGenerating,
  onClearError,
  onSubmit,
}: GenerateInsightFormProps) {
  const { showToast } = useToast();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [granularity, setGranularity] = useState<PeriodGranularity>('MONTH');
  const [localErrors, setLocalErrors] = useState<{
    start?: string;
    end?: string;
  }>({});

  const fieldErrors = error ? readInsightsFieldErrors(error, generateFields) : {};
  const hasFieldError = Object.keys(fieldErrors).length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors: { start?: string; end?: string } = {};

    if (!start) {
      errors.start = 'Informe a data inicial.';
    }

    if (!end) {
      errors.end = 'Informe a data final.';
    }

    if (start && end && start > end) {
      errors.end = 'A data final deve ser igual ou posterior à inicial.';
    }

    setLocalErrors(errors);

    if (Object.values(errors).some(Boolean)) {
      return;
    }

    const result = await onSubmit({ start, end, granularity });

    if (!result.ok) {
      return;
    }

    showToast({
      title: 'Análises geradas',
      message: 'As novas leituras já aparecem na listagem.',
      tone: 'success',
    });
  }

  return (
    <Card as="section" className="generate-insight-card">
      <div>
        <span className="insight-eyebrow">GERAR ANÁLISES</span>
        <h2>Analisar um período</h2>
        <p>
          O serviço de insights processa o período informado e devolve as
          leituras encontradas.
        </p>
      </div>

      {error && !hasFieldError ? (
        <Alert title="Não foi possível gerar as análises" tone="danger">
          {error.message}
        </Alert>
      ) : null}

      {/* Validação em JavaScript para manter cada mensagem junto ao campo. */}
      <form
        className="generate-insight-form"
        id={formId}
        noValidate
        onSubmit={handleSubmit}
      >
        <DatePicker
          error={localErrors.start ?? fieldErrors.start}
          label="Data inicial"
          max={end || undefined}
          onChange={(event) => {
            setStart(event.currentTarget.value);
            setLocalErrors({});
            onClearError();
          }}
          value={start}
        />
        <DatePicker
          error={localErrors.end ?? fieldErrors.end}
          label="Data final"
          min={start || undefined}
          onChange={(event) => {
            setEnd(event.currentTarget.value);
            setLocalErrors({});
            onClearError();
          }}
          value={end}
        />
        <Select
          error={fieldErrors.granularity}
          label="Granularidade"
          onChange={(event) => {
            setGranularity(event.currentTarget.value as PeriodGranularity);
            onClearError();
          }}
          options={periodGranularities.map((item) => ({
            value: item,
            label: granularityLabel(item),
          }))}
          value={granularity}
        />
        <div className="generate-insight-form__actions">
          <Button form={formId} loading={isGenerating} type="submit">
            Gerar análises
          </Button>
        </div>
      </form>
    </Card>
  );
}
