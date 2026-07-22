import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDependencies } from '../../../app/providers/AppDependenciesProvider';
import type { ApiError } from '../../../services/errors/api-error';
import type { CreateGoalInput, Goal, UpdateGoalInput } from '../types/goal';
import { normalizeGoalError, type GoalMutationResult } from './goal-errors';

export function useGoals() {
  const { goalService } = useAppDependencies();
  const [goals, setGoals] = useState<readonly Goal[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<ApiError | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const loadedRef = useRef(false);

  useEffect(() => {
    let active = true;

    if (loadedRef.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    goalService
      .listGoals()
      .then((result) => {
        if (!active) {
          return;
        }

        loadedRef.current = true;
        setGoals(result);
        setError(null);
        setIsLoading(false);
        setIsRefreshing(false);
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        setError(normalizeGoalError(cause));
        setIsLoading(false);
        setIsRefreshing(false);
      });

    return () => {
      active = false;
    };
  }, [goalService, refreshToken]);

  const reload = useCallback(
    () => setRefreshToken((current) => current + 1),
    [],
  );

  const clearSaveError = useCallback(() => setSaveError(null), []);

  const runMutation = useCallback(
    async (action: () => Promise<Goal>): Promise<GoalMutationResult<Goal>> => {
      setIsSaving(true);
      setSaveError(null);

      try {
        const result = await action();
        setIsSaving(false);
        setRefreshToken((current) => current + 1);
        return { ok: true, data: result };
      } catch (cause: unknown) {
        const normalized = normalizeGoalError(cause);
        setSaveError(normalized);
        setIsSaving(false);
        return { ok: false, error: normalized };
      }
    },
    [],
  );

  const createGoal = useCallback(
    (input: CreateGoalInput) => runMutation(() => goalService.createGoal(input)),
    [goalService, runMutation],
  );

  const updateGoal = useCallback(
    (id: string, input: UpdateGoalInput) =>
      runMutation(() => goalService.updateGoal(id, input)),
    [goalService, runMutation],
  );

  return {
    goals,
    error,
    isLoading,
    isRefreshing,
    isSaving,
    saveError,
    clearSaveError,
    createGoal,
    reload,
    updateGoal,
  };
}
