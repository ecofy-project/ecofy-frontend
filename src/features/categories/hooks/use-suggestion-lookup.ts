import { useCallback, useState } from 'react';
import { useAppDependencies } from '../../../app/providers/AppDependenciesProvider';
import type { ApiError } from '../../../services/errors/api-error';
import type { CategorizationSuggestion } from '../types/categorization';
import { normalizeCategorizationError } from './categorization-errors';

type LookupState = {
  transactionId: string | null;
  suggestion: CategorizationSuggestion | null;
  error: ApiError | null;
  isLoading: boolean;
  hasSearched: boolean;
};

const initialState: LookupState = {
  transactionId: null,
  suggestion: null,
  error: null,
  isLoading: false,
  hasSearched: false,
};

/**
 * O gateway publica a consulta de sugestão por transação
 * (`/suggestions/{transactionId}`), e não uma listagem. A busca é sob demanda.
 */
export function useSuggestionLookup() {
  const { categorizationService } = useAppDependencies();
  const [state, setState] = useState<LookupState>(initialState);

  const reset = useCallback(() => setState(initialState), []);

  const search = useCallback(
    async (transactionId: string) => {
      setState({
        transactionId,
        suggestion: null,
        error: null,
        isLoading: true,
        hasSearched: true,
      });

      try {
        const suggestion =
          await categorizationService.getSuggestionByTransaction(transactionId);
        setState({
          transactionId,
          suggestion,
          error: null,
          isLoading: false,
          hasSearched: true,
        });
      } catch (error: unknown) {
        setState({
          transactionId,
          suggestion: null,
          error: normalizeCategorizationError(error),
          isLoading: false,
          hasSearched: true,
        });
      }
    },
    [categorizationService],
  );

  return { ...state, search, reset };
}
