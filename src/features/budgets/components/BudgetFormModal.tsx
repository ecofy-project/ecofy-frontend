import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  Button,
  CurrencyInput,
  DatePicker,
  Input,
  Modal,
  Select,
  useToast,
} from '../../../components/ui';
import type { ApiError } from '../../../services/errors/api-error';
import type { Category } from '../../categories/types/categorization';
import {
  isConcurrentUpdateConflict,
  readBudgetFieldErrors,
  type BudgetMutationResult,
} from '../hooks/budget-errors';
import {
  budgetPeriodTypes,
  budgetStatuses,
  type Budget,
  type BudgetPeriodType,
  type BudgetStatus,
  type CreateBudgetInput,
  type UpdateBudgetInput,
} from '../types/budget';
import {
  budgetPeriodTypeLabel,
  budgetStatusLabel,
  formatPeriodRange,
} from '../utils/budget-labels';
import {
  BudgetAmountError,
  formatBudgetAmount,
  parseLimitAmountInput,
  toLimitAmountInput,
} from '../utils/budget-money';

const formId = 'budget-form';

/**
 * Campos observados nas respostas 400. `newLimitAmount` pertence ao contrato de
 * atualização e `limitAmount` ao de criação.
 */
const budgetFields = [
  'categoryId',
  'periodType',
  'periodStart',
  'periodEnd',
  'limitAmount',
  'newLimitAmount',
  'currency',
  'status',
] as const;

type BudgetFormState = {
  categoryId: string;
  periodType: BudgetPeriodType;
  periodStart: string;
  periodEnd: string;
  limit: string;
  currency: string;
  status: BudgetStatus;
};

type LocalErrors = Partial<Record<keyof BudgetFormState, string>>;

type BudgetFormModalProps = {
  open: boolean;
  budget: Budget | null;
  categories: readonly Category[];
  defaultCurrency: string;
  isSaving: boolean;
  error: ApiError | null;
  onClose: () => void;
  onClearError: () => void;
  onCreate: (input: CreateBudgetInput) => Promise<BudgetMutationResult<Budget>>;
  onUpdate: (
    id: string,
    input: UpdateBudgetInput,
  ) => Promise<BudgetMutationResult<Budget>>;
  onRemove: (id: string) => Promise<BudgetMutationResult<void>>;
  onRefreshBudget: (id: string) => Promise<Budget | null>;
};

function createInitialState(
  budget: Budget | null,
  defaultCurrency: string,
): BudgetFormState {
  if (budget) {
    return {
      categoryId: budget.categoryId,
      periodType: budget.periodType,
      periodStart: budget.periodStart,
      periodEnd: budget.periodEnd,
      limit: toLimitAmountInput(budget.limitAmount),
      currency: budget.currency,
      status: budget.status,
    };
  }

  return {
    categoryId: '',
    periodType: 'MONTHLY',
    periodStart: '',
    periodEnd: '',
    limit: '',
    currency: defaultCurrency,
    status: 'ACTIVE',
  };
}

/**
 * Formulário de criação e edição.
 *
 * A criação envia os campos de `CreateBudgetRequest`; a edição envia apenas o
 * que `UpdateBudgetRequest` publica (`newLimitAmount`, `currency`, `status`),
 * então categoria e período aparecem somente como contexto. O identificador do
 * usuário nunca é pedido: ele é resolvido a partir da sessão.
 */
export function BudgetFormModal({
  budget,
  categories,
  defaultCurrency,
  error,
  isSaving,
  onClearError,
  onClose,
  onCreate,
  onRefreshBudget,
  onRemove,
  onUpdate,
  open,
}: BudgetFormModalProps) {
  const { showToast } = useToast();
  const isEditing = budget !== null;
  const [form, setForm] = useState<BudgetFormState>(() =>
    createInitialState(budget, defaultCurrency),
  );
  const [localErrors, setLocalErrors] = useState<LocalErrors>({});
  const [conflictBudget, setConflictBudget] = useState<Budget | null>(null);
  const [baseline, setBaseline] = useState<Budget | null>(budget);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(createInitialState(budget, defaultCurrency));
      setBaseline(budget);
      setLocalErrors({});
      setConflictBudget(null);
      setConfirmingRemoval(false);
    }
  }, [budget, defaultCurrency, open]);

  const fieldErrors = error ? readBudgetFieldErrors(error, budgetFields) : {};
  const limitFieldError = fieldErrors.limitAmount ?? fieldErrors.newLimitAmount;
  const hasFieldError = Object.keys(fieldErrors).length > 0;
  const showGeneralError = Boolean(error) && !hasFieldError && !conflictBudget;

  function updateField<TField extends keyof BudgetFormState>(
    field: TField,
    value: BudgetFormState[TField],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setLocalErrors((current) => ({ ...current, [field]: undefined }));
    onClearError();
  }

  function handleClose() {
    if (isSaving) {
      return;
    }

    onClose();
  }

  function validate(): { limitAmount: string; currency: string } | null {
    const errors: LocalErrors = {};

    if (!isEditing && !form.categoryId) {
      errors.categoryId = 'Selecione uma categoria.';
    }

    if (!isEditing && !form.periodStart) {
      errors.periodStart = 'Informe a data inicial.';
    }

    if (!isEditing && !form.periodEnd) {
      errors.periodEnd = 'Informe a data final.';
    }

    if (
      form.periodStart &&
      form.periodEnd &&
      form.periodStart > form.periodEnd
    ) {
      errors.periodEnd = 'A data final deve ser igual ou posterior à inicial.';
    }

    const currency = form.currency.trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(currency)) {
      errors.currency = 'Informe o código ISO da moeda, com três letras.';
    }

    let limitAmount = '';

    try {
      limitAmount = parseLimitAmountInput(form.limit, currency || 'BRL');
    } catch (cause: unknown) {
      errors.limit =
        cause instanceof BudgetAmountError
          ? cause.message
          : 'Informe um limite válido.';
    }

    setLocalErrors(errors);

    return Object.values(errors).some(Boolean)
      ? null
      : { limitAmount, currency };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (conflictBudget) {
      return;
    }

    const validated = validate();

    if (!validated) {
      return;
    }

    if (isEditing && budget) {
      const result = await onUpdate(budget.id, {
        newLimitAmount: validated.limitAmount,
        currency: validated.currency,
        status: form.status,
        ...(baseline?.version === undefined
          ? {}
          : { version: baseline.version }),
      });

      if (!result.ok) {
        if (isConcurrentUpdateConflict(result.error)) {
          const fresh = await onRefreshBudget(budget.id);

          if (fresh) {
            setConflictBudget(fresh);
          }
        }

        return;
      }

      onClose();
      showToast({
        title: 'Orçamento atualizado',
        message: 'As alterações foram salvas.',
        tone: 'success',
      });
      return;
    }

    const result = await onCreate({
      categoryId: form.categoryId,
      periodType: form.periodType,
      periodStart: form.periodStart,
      periodEnd: form.periodEnd,
      limitAmount: validated.limitAmount,
      currency: validated.currency,
      status: form.status,
    });

    if (!result.ok) {
      return;
    }

    onClose();
    showToast({
      title: 'Orçamento criado',
      message: 'O orçamento foi adicionado ao seu planejamento.',
      tone: 'success',
    });
  }

  /**
   * Resolução do conflito: os dados atuais substituem o formulário e o envio só
   * acontece depois que o usuário revisa e confirma. O PUT nunca é repetido
   * automaticamente com a versão nova.
   */
  function acceptRefreshedBudget() {
    if (!conflictBudget) {
      return;
    }

    setForm(createInitialState(conflictBudget, defaultCurrency));
    setBaseline(conflictBudget);
    setConflictBudget(null);
    setLocalErrors({});
    onClearError();
  }

  async function handleRemove() {
    if (!budget) {
      return;
    }

    if (!confirmingRemoval) {
      setConfirmingRemoval(true);
      return;
    }

    const result = await onRemove(budget.id);

    if (!result.ok) {
      setConfirmingRemoval(false);
      return;
    }

    onClose();
    showToast({
      title: 'Orçamento removido',
      message: 'O orçamento não será mais acompanhado.',
      tone: 'success',
    });
  }

  return (
    <Modal
      footer={
        <>
          {isEditing ? (
            <Button
              className="budget-form__remove"
              disabled={isSaving}
              onClick={handleRemove}
              variant="ghost"
            >
              {confirmingRemoval ? 'Confirmar remoção' : 'Remover'}
            </Button>
          ) : null}
          <Button disabled={isSaving} onClick={handleClose} variant="ghost">
            Cancelar
          </Button>
          <Button
            disabled={Boolean(conflictBudget)}
            form={formId}
            loading={isSaving}
            type="submit"
          >
            {isEditing ? 'Salvar alterações' : 'Criar orçamento'}
          </Button>
        </>
      }
      onClose={handleClose}
      open={open}
      title={isEditing ? 'Editar orçamento' : 'Novo orçamento'}
    >
      {/* A validação é feita em JavaScript para que cada mensagem fique
          associada ao seu campo, em vez de depender do balão nativo. */}
      <form
        className="budget-form"
        id={formId}
        noValidate
        onSubmit={handleSubmit}
      >
        {conflictBudget ? (
          <Alert title="Este orçamento foi alterado em outra operação" tone="warning">
            <p>
              Para não sobrescrever a alteração anterior, revise os dados atuais
              antes de enviar novamente.
            </p>
            <ul className="budget-form__conflict-values">
              <li>
                Limite atual:{' '}
                {formatBudgetAmount(
                  conflictBudget.limitAmount,
                  conflictBudget.currency,
                )}
              </li>
              <li>Status atual: {budgetStatusLabel(conflictBudget.status)}</li>
              <li>
                Período:{' '}
                {formatPeriodRange(
                  conflictBudget.periodStart,
                  conflictBudget.periodEnd,
                )}
              </li>
            </ul>
            <Button onClick={acceptRefreshedBudget} size="sm" variant="outline">
              Revisar dados atualizados
            </Button>
          </Alert>
        ) : null}

        {showGeneralError && error ? (
          <Alert
            title={
              isEditing
                ? 'Não foi possível salvar o orçamento'
                : 'Não foi possível criar o orçamento'
            }
            tone="danger"
          >
            {error.message}
          </Alert>
        ) : null}

        {isEditing && budget ? (
          <dl className="budget-form__context">
            <div>
              <dt>Categoria</dt>
              <dd>
                {categories.find((item) => item.id === budget.categoryId)
                  ?.name ?? 'Categoria não identificada'}
              </dd>
            </div>
            <div>
              <dt>Período</dt>
              <dd>
                {budgetPeriodTypeLabel(budget.periodType)} ·{' '}
                {formatPeriodRange(budget.periodStart, budget.periodEnd)}
              </dd>
            </div>
          </dl>
        ) : (
          <>
            <Select
              error={localErrors.categoryId ?? fieldErrors.categoryId}
              label="Categoria"
              onChange={(event) =>
                updateField('categoryId', event.currentTarget.value)
              }
              options={categories.map((category) => ({
                value: category.id,
                label: category.name,
              }))}
              placeholder="Selecione uma categoria"
              value={form.categoryId}
            />
            <Select
              error={fieldErrors.periodType}
              label="Tipo de período"
              onChange={(event) =>
                updateField(
                  'periodType',
                  event.currentTarget.value as BudgetPeriodType,
                )
              }
              options={budgetPeriodTypes.map((periodType) => ({
                value: periodType,
                label: budgetPeriodTypeLabel(periodType),
              }))}
              value={form.periodType}
            />
            <div className="budget-form__row">
              <DatePicker
                error={localErrors.periodStart ?? fieldErrors.periodStart}
                label="Data inicial"
                max={form.periodEnd || undefined}
                onChange={(event) =>
                  updateField('periodStart', event.currentTarget.value)
                }
                value={form.periodStart}
              />
              <DatePicker
                error={localErrors.periodEnd ?? fieldErrors.periodEnd}
                label="Data final"
                min={form.periodStart || undefined}
                onChange={(event) =>
                  updateField('periodEnd', event.currentTarget.value)
                }
                value={form.periodEnd}
              />
            </div>
          </>
        )}

        <div className="budget-form__row">
          <CurrencyInput
            currency={form.currency || defaultCurrency}
            error={localErrors.limit ?? limitFieldError}
            helperText="Valor mínimo de 0,01."
            label="Limite"
            onChange={(event) => updateField('limit', event.currentTarget.value)}
            placeholder="1.000,00"
            value={form.limit}
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
          helperText={
            isEditing
              ? undefined
              : 'Orçamentos criados sem status são ativados pelo serviço.'
          }
          label="Status"
          onChange={(event) =>
            updateField('status', event.currentTarget.value as BudgetStatus)
          }
          options={budgetStatuses.map((status) => ({
            value: status,
            label: budgetStatusLabel(status),
          }))}
          value={form.status}
        />
      </form>
    </Modal>
  );
}
