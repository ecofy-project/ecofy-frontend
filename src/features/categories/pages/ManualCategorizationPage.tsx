import { useState } from 'react';
import { Card, EmptyState, StatusBadge, useToast } from '../../../components/ui';
import {
  CategorizationErrorState,
  InlineListSkeleton,
} from '../components/CategorizationResourceState';
import { ManualCategorizationForm } from '../components/ManualCategorizationForm';
import { useCategories } from '../hooks/use-categories';
import { useManualCategorization } from '../hooks/use-manual-categorization';
import type { ManualCategorizationInput } from '../types/categorization';

export function ManualCategorizationPage() {
  const categories = useCategories();
  const manual = useManualCategorization();
  const { showToast } = useToast();
  const [lastCategorizedName, setLastCategorizedName] = useState<string | null>(
    null,
  );

  async function handleSubmit(input: ManualCategorizationInput) {
    const result = await manual.categorizeManually(input);

    if (!result.ok) {
      return;
    }

    const categoryName = (categories.categories ?? []).find(
      (category) => category.id === input.categoryId,
    )?.name;
    setLastCategorizedName(categoryName ?? null);
    showToast({
      title: 'Categorização aplicada',
      message: 'A transação foi categorizada com sucesso.',
      tone: 'success',
    });
  }

  const isLoading = categories.isLoading || manual.isLoadingTransactions;
  const loadError = categories.error ?? manual.transactionsError;

  return (
    <div className="demo-page">
      <header className="demo-page__header">
        <div>
          <span className="demo-eyebrow">DECISÃO MANUAL</span>
          <h1>Categorização manual</h1>
          <p>
            Aplique uma categoria diretamente em uma transação quando a decisão
            automática não refletir a realidade.
          </p>
        </div>
      </header>

      <Card as="section" className="categorization-panel">
        {isLoading ? (
          <InlineListSkeleton rows={4} />
        ) : loadError ? (
          <CategorizationErrorState
            error={loadError}
            onRetry={() => {
              categories.reload();
              manual.reload();
            }}
          />
        ) : (categories.categories ?? []).length === 0 ? (
          <EmptyState
            description="Cadastre ao menos uma categoria antes de aplicar uma decisão manual."
            title="Nenhuma categoria disponível"
          />
        ) : (
          <ManualCategorizationForm
            categories={categories.categories ?? []}
            error={manual.submitError}
            isSubmitting={manual.isSubmitting}
            onSubmit={handleSubmit}
            transactions={manual.transactions}
          />
        )}
      </Card>

      <p aria-live="polite" className="categorization-note">
        {lastCategorizedName ? (
          <>
            <StatusBadge tone="success">Aplicado</StatusBadge>
            Última transação categorizada como {lastCategorizedName}. Algumas
            informações podem continuar sendo atualizadas em segundo plano.
          </>
        ) : null}
      </p>
    </div>
  );
}
