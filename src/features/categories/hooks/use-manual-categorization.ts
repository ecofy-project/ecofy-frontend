import { useCallback, useEffect, useState } from 'react';
import { useAppDependencies } from '../../../app/providers/AppDependenciesProvider';
import type { ApiError } from '../../../services/errors/api-error';
import type {
  CategorizableTransaction,
  ManualCategorizationInput,
  ManualCategorizationResult,
} from '../types/categorization';
import {
  normalizeCategorizationError,
  type CategorizationMutationResult,
} from './categorization-errors';

type TransactionsState = {
  data: readonly CategorizableTransaction[] | null;
  error: ApiError | null;
  isLoading: boolean;
};

/**
 * Reúne a origem opcional de transações e o envio da categorização manual.
 * Quando a origem não enumera transações, `supportsTransactionLookup` é falso
 * e a interface passa a solicitar o identificador diretamente.
 */
export function useManualCategorization() {
  const { categorizationService } = useAppDependencies();
  const supportsTransactionLookup =
    categorizationService.supportsTransactionLookup;
  const [transactions, setTransactions] = useState<TransactionsState>({
    data: null,
    error: null,
    isLoading: supportsTransactionLookup,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ApiError | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const pending = categorizationService.listCategorizableTransactions();

    if (!pending) {
      setTransactions({ data: null, error: null, isLoading: false });
      return undefined;
    }

    let active = true;
    setTransactions((current) => ({ ...current, error: null, isLoading: true }));

    pending
      .then((data) => {
        if (active) {
          setTransactions({ data, error: null, isLoading: false });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setTransactions({
            data: null,
            error: normalizeCategorizationError(error),
            isLoading: false,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [categorizationService, version]);

  const clearSubmitError = useCallback(() => setSubmitError(null), []);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  const categorizeManually = useCallback(
    async (
      input: ManualCategorizationInput,
    ): Promise<CategorizationMutationResult<ManualCategorizationResult>> => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const data = await categorizationService.categorizeManually(input);

        setTransactions((current) =>
          current.data
            ? {
                ...current,
                data: current.data.map((transaction) =>
                  transaction.id === input.transactionId
                    ? { ...transaction, categoryId: input.categoryId }
                    : transaction,
                ),
              }
            : current,
        );
        setIsSubmitting(false);
        return { ok: true, data };
      } catch (error: unknown) {
        const normalized = normalizeCategorizationError(error);
        setSubmitError(normalized);
        setIsSubmitting(false);
        return { ok: false, error: normalized };
      }
    },
    [categorizationService],
  );

  return {
    supportsTransactionLookup,
    transactions: transactions.data,
    transactionsError: transactions.error,
    isLoadingTransactions: transactions.isLoading,
    isSubmitting,
    submitError,
    clearSubmitError,
    categorizeManually,
    reload,
  };
}
