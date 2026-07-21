import { useCallback, useEffect, useState } from 'react';
import { useAppDependencies } from '../../../app/providers/AppDependenciesProvider';
import type { ApiError } from '../../../services/errors/api-error';
import type { UserPreferences } from '../types/user';
import {
  normalizeUserError,
  type UserMutationResult,
} from './user-errors';

type PreferencesState = {
  data: UserPreferences | null;
  error: ApiError | null;
  isLoading: boolean;
  isSaving: boolean;
};

export function usePreferences(userId: string | undefined) {
  const { userService } = useAppDependencies();
  const [requestVersion, setRequestVersion] = useState(0);
  const [state, setState] = useState<PreferencesState>({
    data: null,
    error: null,
    isLoading: Boolean(userId),
    isSaving: false,
  });

  useEffect(() => {
    let active = true;

    if (!userId) {
      setState({ data: null, error: null, isLoading: false, isSaving: false });
      return () => {
        active = false;
      };
    }

    setState((current) => ({ ...current, error: null, isLoading: true }));

    userService
      .getPreferences(userId)
      .then((data) => {
        if (active) {
          setState({ data, error: null, isLoading: false, isSaving: false });
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

  const updatePreferences = useCallback(
    async (
      preferences: UserPreferences,
    ): Promise<UserMutationResult<UserPreferences>> => {
      if (!userId) {
        return {
          ok: false,
          error: { message: 'A sessão atual não possui um usuário associado.' },
        };
      }

      setState((current) => ({ ...current, error: null, isSaving: true }));

      try {
        const data = await userService.updatePreferences(userId, {
          preferences,
        });
        setState((current) => ({
          ...current,
          data,
          error: null,
          isSaving: false,
        }));
        return { ok: true, data };
      } catch (error: unknown) {
        const normalized = normalizeUserError(error);
        setState((current) => ({
          ...current,
          error: normalized,
          isSaving: false,
        }));
        return { ok: false, error: normalized };
      }
    },
    [userId, userService],
  );

  const reload = useCallback(() => {
    setRequestVersion((current) => current + 1);
  }, []);

  return { ...state, reload, updatePreferences };
}
