import { useState, type FormEvent } from 'react';
import { Alert, Button, Input, Select } from '../../../components/ui';
import type { ApiError } from '../../../services/errors/api-error';
import { formatCurrency, fromCents } from '../../../services/money/money';
import type {
  CategorizableTransaction,
  Category,
  ManualCategorizationInput,
} from '../types/categorization';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ManualCategorizationFormProps = {
  categories: readonly Category[];
  transactions: readonly CategorizableTransaction[] | null;
  isSubmitting: boolean;
  error: ApiError | null;
  onSubmit: (input: ManualCategorizationInput) => Promise<unknown>;
};

function describeTransaction(transaction: CategorizableTransaction) {
  const amount = formatCurrency(
    fromCents(transaction.amountCents, transaction.currency),
  );
  const date = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(transaction.transactionDate));

  return `${date} · ${transaction.description} · ${amount}`;
}

/**
 * Coleta `transactionId`, `categoryId` e o `rationale` opcional de
 * `ManualCategorizationRequest`. Quando a origem de dados não enumera
 * transações, o identificador é informado diretamente.
 */
export function ManualCategorizationForm({
  categories,
  error,
  isSubmitting,
  onSubmit,
  transactions,
}: ManualCategorizationFormProps) {
  const [transactionId, setTransactionId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [rationale, setRationale] = useState('');
  const [transactionError, setTransactionError] = useState('');
  const [categoryError, setCategoryError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTransactionId = transactionId.trim();
    const invalidTransaction = transactions
      ? !normalizedTransactionId
      : !uuidPattern.test(normalizedTransactionId);

    setTransactionError(
      invalidTransaction
        ? transactions
          ? 'Selecione uma transação.'
          : 'Informe o identificador da transação no formato UUID.'
        : '',
    );
    setCategoryError(categoryId ? '' : 'Selecione uma categoria.');

    if (invalidTransaction || !categoryId) {
      return;
    }

    await onSubmit({
      transactionId: normalizedTransactionId,
      categoryId,
      ...(rationale.trim() ? { rationale: rationale.trim() } : {}),
    });
  }

  return (
    <form className="categorization-form" onSubmit={handleSubmit}>
      {error ? (
        <Alert title="Não foi possível categorizar" tone="danger">
          {error.message}
        </Alert>
      ) : null}

      {transactions ? (
        <Select
          error={transactionError}
          label="Transação"
          onChange={(event) => setTransactionId(event.currentTarget.value)}
          options={transactions.map((transaction) => ({
            value: transaction.id,
            label: describeTransaction(transaction),
          }))}
          placeholder="Selecione uma transação"
          value={transactionId}
        />
      ) : (
        <Input
          error={transactionError}
          helperText="Este ambiente não publica listagem de transações; informe o identificador recebido da importação."
          label="Identificador da transação"
          onChange={(event) => setTransactionId(event.currentTarget.value)}
          placeholder="00000000-0000-0000-0000-000000000000"
          value={transactionId}
        />
      )}

      <Select
        error={categoryError}
        label="Categoria"
        onChange={(event) => setCategoryId(event.currentTarget.value)}
        options={categories.map((category) => ({
          value: category.id,
          label: category.name,
        }))}
        placeholder="Selecione uma categoria"
        value={categoryId}
      />

      <Input
        helperText="Registre o motivo da decisão manual, se quiser."
        label="Motivo"
        onChange={(event) => setRationale(event.currentTarget.value)}
        optional
        placeholder="Ex.: compra classificada incorretamente"
        value={rationale}
      />

      <div className="categorization-form__actions">
        <Button loading={isSubmitting} type="submit">
          Confirmar categorização
        </Button>
      </div>
    </form>
  );
}
