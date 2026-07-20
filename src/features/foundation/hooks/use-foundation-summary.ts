import { useCallback, useEffect, useState } from 'react';
import { useAppDependencies } from '../../../app/providers/AppDependenciesProvider';
import {
  adaptApiError,
  ApiErrorException,
  type ApiError,
} from '../../../services/errors/api-error';
import type { FoundationSummary } from '../types/foundation-summary';

type FoundationSummaryState = {
  data: FoundationSummary | null;
  error: ApiError | null;
  isLoading: boolean;
  isRefreshing: boolean;
};

const initialState: FoundationSummaryState = {
  data: null,
  error: null,
  isLoading: true,
  isRefreshing: false,
};

export function useFoundationSummary() {
  const { foundationService } = useAppDependencies();
  const [requestVersion, setRequestVersion] = useState(0);
  const [state, setState] = useState<FoundationSummaryState>(initialState);

  useEffect(() => {
    let active = true;

    setState((current) => ({
      ...current,
      error: null,
      isLoading: current.data === null,
      isRefreshing: current.data !== null,
    }));

    foundationService
      .getSummary()
      .then((data) => {
        if (active) {
          setState({
            data,
            error: null,
            isLoading: false,
            isRefreshing: false,
          });
        }
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setState((current) => ({
          data: current.data,
          error:
            error instanceof ApiErrorException
              ? error.apiError
              : adaptApiError(error),
          isLoading: false,
          isRefreshing: false,
        }));
      });

    return () => {
      active = false;
    };
  }, [foundationService, requestVersion]);

  const reload = useCallback(() => {
    setRequestVersion((current) => current + 1);
  }, []);

  return { ...state, reload };
}
