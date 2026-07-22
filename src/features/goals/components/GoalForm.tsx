import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  Button,
  CurrencyInput,
  Input,
  Modal,
  Select,
  useToast,
} from '../../../components/ui';
import type { ApiError } from '../../../services/errors/api-error';
import { readGoalFieldErrors, type GoalMutationResult } from '../hooks/goal-errors';
import {
  goalStatuses,
  type CreateGoalInput,
  type Goal,
  type GoalStatus,
  type UpdateGoalInput,
} from '../types/goal';
import {
  GoalAmountError,
  goalStatusLabel,
  parseGoalTargetInput,
  toGoalTargetInput,
} from '../utils/goal-format';

const formId = 'goal-form';
const goalFields = ['name', 'targetCents', 'currency', 'status'] as const;

type GoalFormState = {
  name: string;
  target: string;
  currency: string;
  status: GoalStatus;
};

type LocalErrors = Partial<Record<keyof GoalFormState, string>>;

type GoalFormProps = {
  open: boolean;
  goal: Goal | null;
  defaultCurrency: string;
  isSaving: boolean;
  error: ApiError | null;
  onClose: () => void;
  onClearError: () => void;
  onCreate: (input: CreateGoalInput) => Promise<GoalMutationResult<Goal>>;
  onUpdate: (
    id: string,
    input: UpdateGoalInput,
  ) => Promise<GoalMutationResult<Goal>>;
};

function createInitialState(
  goal: Goal | null,
  defaultCurrency: string,
): GoalFormState {
  return goal
    ? {
        name: goal.name,
        target: toGoalTargetInput(goal.targetCents),
        currency: goal.currency,
        status: goal.status,
      }
    : { name: '', target: '', currency: defaultCurrency, status: 'ACTIVE' };
}

/**
 * Formulário de criação e edição. Envia somente os campos publicados por
 * `CreateGoalRequest` e `UpdateGoalRequest`; o identificador do usuário vem da
 * sessão e nunca é pedido.
 */
export function GoalForm({
  defaultCurrency,
  error,
  goal,
  isSaving,
  onClearError,
  onClose,
  onCreate,
  onUpdate,
  open,
}: GoalFormProps) {
  const { showToast } = useToast();
  const isEditing = goal !== null;
  const [form, setForm] = useState<GoalFormState>(() =>
    createInitialState(goal, defaultCurrency),
  );
  const [localErrors, setLocalErrors] = useState<LocalErrors>({});

  useEffect(() => {
    if (open) {
      setForm(createInitialState(goal, defaultCurrency));
      setLocalErrors({});
    }
  }, [defaultCurrency, goal, open]);

  const fieldErrors = error ? readGoalFieldErrors(error, goalFields) : {};
  const hasFieldError = Object.keys(fieldErrors).length > 0;

  function updateField<TField extends keyof GoalFormState>(
    field: TField,
    value: GoalFormState[TField],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setLocalErrors((current) => ({ ...current, [field]: undefined }));
    onClearError();
  }

  function validate(): { targetCents: number; currency: string } | null {
    const errors: LocalErrors = {};
    const name = form.name.trim();

    if (!name) {
      errors.name = 'Informe o nome da meta.';
    } else if (name.length > 120) {
      errors.name = 'O nome deve ter no máximo 120 caracteres.';
    }

    const currency = form.currency.trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(currency)) {
      errors.currency = 'Informe o código ISO da moeda, com três letras.';
    }

    let targetCents = 0;

    try {
      targetCents = parseGoalTargetInput(form.target, currency || 'BRL');
    } catch (cause: unknown) {
      errors.target =
        cause instanceof GoalAmountError
          ? cause.message
          : 'Informe um valor alvo válido.';
    }

    setLocalErrors(errors);

    return Object.values(errors).some(Boolean)
      ? null
      : { targetCents, currency };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validated = validate();

    if (!validated) {
      return;
    }

    const result =
      isEditing && goal
        ? await onUpdate(goal.id, {
            name: form.name.trim(),
            targetCents: validated.targetCents,
            currency: validated.currency,
            status: form.status,
          })
        : await onCreate({
            name: form.name.trim(),
            targetCents: validated.targetCents,
            currency: validated.currency,
            status: form.status,
          });

    if (!result.ok) {
      return;
    }

    onClose();
    showToast({
      title: isEditing ? 'Meta atualizada' : 'Meta criada',
      message: 'O objetivo foi salvo.',
      tone: 'success',
    });
  }

  return (
    <Modal
      footer={
        <>
          <Button disabled={isSaving} onClick={onClose} variant="ghost">
            Cancelar
          </Button>
          <Button form={formId} loading={isSaving} type="submit">
            {isEditing ? 'Salvar alterações' : 'Criar meta'}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      title={isEditing ? 'Editar meta' : 'Nova meta'}
    >
      {/* Validação em JavaScript para manter cada mensagem junto ao campo. */}
      <form className="goal-form" id={formId} noValidate onSubmit={handleSubmit}>
        {error && !hasFieldError ? (
          <Alert
            title={
              isEditing
                ? 'Não foi possível salvar a meta'
                : 'Não foi possível criar a meta'
            }
            tone="danger"
          >
            {error.message}
          </Alert>
        ) : null}

        <Input
          autoFocus
          error={localErrors.name ?? fieldErrors.name}
          label="Nome"
          maxLength={120}
          onChange={(event) => updateField('name', event.currentTarget.value)}
          placeholder="Ex.: Reserva de emergência"
          value={form.name}
        />

        <div className="goal-form__row">
          <CurrencyInput
            currency={form.currency || defaultCurrency}
            error={localErrors.target ?? fieldErrors.targetCents}
            helperText="O valor alvo deve ser maior que zero."
            label="Valor alvo"
            onChange={(event) =>
              updateField('target', event.currentTarget.value)
            }
            placeholder="10.000,00"
            value={form.target}
          />
          <Input
            error={localErrors.currency ?? fieldErrors.currency}
            helperText="Código ISO com três letras."
            label="Moeda"
            maxLength={3}
            onChange={(event) =>
              updateField('currency', event.currentTarget.value.toUpperCase())
            }
            value={form.currency}
          />
        </div>

        <Select
          error={fieldErrors.status}
          label="Status"
          onChange={(event) =>
            updateField('status', event.currentTarget.value as GoalStatus)
          }
          options={goalStatuses.map((status) => ({
            value: status,
            label: goalStatusLabel(status),
          }))}
          value={form.status}
        />
      </form>
    </Modal>
  );
}
