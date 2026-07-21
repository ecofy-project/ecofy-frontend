import { useCallback, useEffect, useState } from 'react';
import { useAppDependencies } from '../../../app/providers/AppDependenciesProvider';
import type { ApiError } from '../../../services/errors/api-error';
import type {
  CreateUserConnectionInput,
  UserConnection,
} from '../types/user';
import {
  normalizeUserError,
  type UserMutationResult,
} from './user-errors';

type ConnectionsState = {
  data: readonly UserConnection[] | null;
  error: ApiError | null;
  mutationError: ApiError | null;
  isLoading: boolean;
  isCreating: boolean;
};

export function useConnections(userId: string | undefined) {
  const { userService } = useAppDependencies();
  const [requestVersion, setRequestVersion] = useState(0);
  const [state, setState] = useState<ConnectionsState>({
    data: null,
    error: null,
    mutationError: null,
    isLoading: Boolean(userId),
    isCreating: false,
  });

  useEffect(() => {
    let active = true;

    if (!userId) {
      setState({
        data: null,
        error: null,
        mutationError: null,
        isLoading: false,
        isCreating: false,
      });
      return () => {
        active = false;
      };
    }

    setState((current) => ({ ...current, error: null, isLoading: true }));

    userService
      .listConnections(userId)
      .then((data) => {
        if (active) {
          setState({
            data,
            error: null,
            mutationError: null,
            isLoading: false,
            isCreating: false,
          });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState((current) => ({
            ...current,
            error: normalizeUserError(error),
            isLoading: false,
          }));
        }
      });

    return () => {
      active = false;
    };
  }, [requestVersion, userId, userService]);

  const createConnection = useCallback(
    async (
      input: CreateUserConnectionInput,
    ): Promise<UserMutationResult<UserConnection>> => {
      if (!userId) {
        return {
          ok: false,
          error: { message: 'A sessão atual não possui um usuário associado.' },
        };
      }

      setState((current) => ({
        ...current,
        mutationError: null,
        isCreating: true,
      }));

      try {
        const data = await userService.createConnection(userId, input);
        setState((current) => ({
          ...current,
          data: Object.freeze([...(current.data ?? []), data]),
          mutationError: null,
          isCreating: false,
        }));
        return { ok: true, data };
      } catch (error: unknown) {
        const normalized = normalizeUserError(error);
        setState((current) => ({
          ...current,
          mutationError: normalized,
          isCreating: false,
        }));
        return { ok: false, error: normalized };
      }
    },
    [userId, userService],
  );

  const clearMutationError = useCallback(() => {
    setState((current) => ({ ...current, mutationError: null }));
  }, []);

  const reload = useCallback(() => {
    setRequestVersion((current) => current + 1);
  }, []);

  return {
    ...state,
    clearMutationError,
    createConnection,
    reload,
  };
}
