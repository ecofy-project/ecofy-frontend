import { useCallback, useEffect, useState } from 'react';
import { useAppDependencies } from '../../../app/providers/AppDependenciesProvider';
import {
  adaptApiError,
  ApiErrorException,
  type ApiError,
} from '../../../services/errors/api-error';
import type {
  BudgetOverview,
  DemoDashboard,
  DemoImport,
  DemoImportProgress,
  DemoInsight,
  DemoNotification,
  GoalOverview,
  SaveBudgetInput,
  SaveGoalInput,
} from '../types/demo';

type ResourceState<T> = {
  data: T | null;
  error: ApiError | null;
  isLoading: boolean;
  isSaving: boolean;
};

type MutationResult<T> =
  | Readonly<{ ok: true; data: T }>
  | Readonly<{ ok: false; error: ApiError }>;

function normalizeDemoError(error: unknown) {
  return error instanceof ApiErrorException
    ? error.apiError
    : adaptApiError(error);
}

function useDemoResource<T>(loader: () => Promise<T>) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    error: null,
    isLoading: true,
    isSaving: false,
  });

  useEffect(() => {
    let active = true;
    setState((current) => ({
      ...current,
      error: null,
      isLoading: current.data === null,
    }));
    loader()
      .then((data) => {
        if (active) {
          setState({ data, error: null, isLoading: false, isSaving: false });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState((current) => ({
            ...current,
            error: normalizeDemoError(error),
            isLoading: false,
          }));
        }
      });

    return () => {
      active = false;
    };
  }, [loader, version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  const mutate = useCallback(
    async (action: () => Promise<T>): Promise<MutationResult<T>> => {
      setState((current) => ({ ...current, error: null, isSaving: true }));

      try {
        const data = await action();
        setState({ data, error: null, isLoading: false, isSaving: false });
        return { ok: true, data };
      } catch (error: unknown) {
        const normalized = normalizeDemoError(error);
        setState((current) => ({
          ...current,
          error: normalized,
          isSaving: false,
        }));
        return { ok: false, error: normalized };
      }
    },
    [],
  );

  return { ...state, reload, mutate };
}

export function useDashboard() {
  const { demoService } = useAppDependencies();
  const load = useCallback(() => demoService.getDashboard(), [demoService]);
  return useDemoResource<DemoDashboard>(load);
}

export function useBudgets() {
  const { demoService } = useAppDependencies();
  const load = useCallback(
    () => demoService.getBudgetOverview(),
    [demoService],
  );
  const resource = useDemoResource<BudgetOverview>(load);
  const mutate = resource.mutate;
  const saveBudget = useCallback(
    (input: SaveBudgetInput) =>
      mutate(() => demoService.saveBudget(input)),
    [demoService, mutate],
  );
  return { ...resource, saveBudget };
}

export function useImports() {
  const { demoService } = useAppDependencies();
  const [progress, setProgress] = useState<DemoImportProgress | null>(null);
  const load = useCallback(() => demoService.listImports(), [demoService]);
  const resource = useDemoResource<readonly DemoImport[]>(load);
  const mutate = resource.mutate;
  const startImport = useCallback(
    async (file: Readonly<{ name: string; size: number }>) => {
      setProgress({ phase: 'uploading', percent: 0 });
      const result = await mutate(() =>
        demoService.startImport(file, setProgress),
      );
      setProgress(null);
      return result;
    },
    [demoService, mutate],
  );
  return { ...resource, progress, startImport };
}

export function useGoals() {
  const { demoService } = useAppDependencies();
  const load = useCallback(
    () => demoService.getGoalOverview(),
    [demoService],
  );
  const resource = useDemoResource<GoalOverview>(load);
  const mutate = resource.mutate;
  const saveGoal = useCallback(
    (input: SaveGoalInput) =>
      mutate(() => demoService.saveGoal(input)),
    [demoService, mutate],
  );
  return { ...resource, saveGoal };
}

export function useInsights() {
  const { demoService } = useAppDependencies();
  const load = useCallback(() => demoService.listInsights(), [demoService]);
  const resource = useDemoResource<readonly DemoInsight[]>(load);
  const mutate = resource.mutate;
  const generateInsight = useCallback(
    () => mutate(() => demoService.generateInsight()),
    [demoService, mutate],
  );
  return { ...resource, generateInsight };
}

export function useNotifications() {
  const { demoService } = useAppDependencies();
  const load = useCallback(
    () => demoService.listNotifications(),
    [demoService],
  );
  const resource = useDemoResource<readonly DemoNotification[]>(load);
  const mutate = resource.mutate;
  const markAllRead = useCallback(
    () => mutate(() => demoService.markAllNotificationsRead()),
    [demoService, mutate],
  );
  return { ...resource, markAllRead };
}
