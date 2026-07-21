import { useCallback } from 'react';
import { useAppDependencies } from '../../../app/providers/AppDependenciesProvider';
import type { CategorizationRule, CreateRuleInput } from '../types/categorization';
import { useCategorizationResource } from './use-categorization-resource';

export function useRules() {
  const { categorizationService } = useAppDependencies();
  const load = useCallback(
    () => categorizationService.listRules(),
    [categorizationService],
  );
  const resource = useCategorizationResource<readonly CategorizationRule[]>(load);
  const { mutate } = resource;

  const createRule = useCallback(
    (input: CreateRuleInput) =>
      mutate(
        () => categorizationService.createRule(input),
        (current, created) => [...(current ?? []), created],
      ),
    [categorizationService, mutate],
  );

  return {
    rules: resource.data,
    error: resource.error,
    isLoading: resource.isLoading,
    isCreating: resource.isMutating,
    createError: resource.mutationError,
    clearCreateError: resource.clearMutationError,
    createRule,
    reload: resource.reload,
  };
}
