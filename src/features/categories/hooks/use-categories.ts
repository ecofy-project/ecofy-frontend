import { useCallback } from 'react';
import { useAppDependencies } from '../../../app/providers/AppDependenciesProvider';
import type { Category, CreateCategoryInput } from '../types/categorization';
import { useCategorizationResource } from './use-categorization-resource';

export function useCategories() {
  const { categorizationService } = useAppDependencies();
  const load = useCallback(
    () => categorizationService.listCategories(),
    [categorizationService],
  );
  const resource = useCategorizationResource<readonly Category[]>(load);
  const { mutate } = resource;

  const createCategory = useCallback(
    (input: CreateCategoryInput) =>
      mutate(
        () => categorizationService.createCategory(input),
        (current, created) => [...(current ?? []), created],
      ),
    [categorizationService, mutate],
  );

  return {
    categories: resource.data,
    error: resource.error,
    isLoading: resource.isLoading,
    isCreating: resource.isMutating,
    createError: resource.mutationError,
    clearCreateError: resource.clearMutationError,
    createCategory,
    reload: resource.reload,
  };
}
