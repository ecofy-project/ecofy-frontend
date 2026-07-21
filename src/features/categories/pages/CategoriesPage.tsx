import { useState } from 'react';
import { Button, Card, EmptyState, StatusBadge } from '../../../components/ui';
import {
  CategorizationErrorState,
  CategoryListSkeleton,
  InlineListSkeleton,
} from '../components/CategorizationResourceState';
import { CategoryList } from '../components/CategoryList';
import { CreateCategory } from '../components/CreateCategory';
import { RuleList } from '../components/RuleList';
import { RuleWizard } from '../components/RuleWizard';
import { useCategories } from '../hooks/use-categories';
import { useRules } from '../hooks/use-rules';

export function CategoriesPage() {
  const categories = useCategories();
  const rules = useRules();
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [ruleWizardOpen, setRuleWizardOpen] = useState(false);

  function openCategoryModal() {
    categories.clearCreateError();
    setCategoryModalOpen(true);
  }

  function openRuleWizard() {
    rules.clearCreateError();
    setRuleWizardOpen(true);
  }

  const availableCategories = categories.categories ?? [];

  return (
    <div className="demo-page">
      <header className="demo-page__header">
        <div>
          <span className="demo-eyebrow">ORGANIZAÇÃO DAS TRANSAÇÕES</span>
          <h1>Categorias &amp; Regras</h1>
          <p>
            Crie categorias e monte regras que o serviço de categorização
            aplicará às suas movimentações.
          </p>
        </div>
        <Button leadingIcon="categories" onClick={openCategoryModal}>
          Nova categoria
        </Button>
      </header>

      {categories.isLoading ? (
        <CategoryListSkeleton />
      ) : categories.error ? (
        <CategorizationErrorState
          error={categories.error}
          onRetry={categories.reload}
        />
      ) : availableCategories.length === 0 ? (
        <Card as="section" className="categorization-state-card">
          <EmptyState
            actionLabel="Criar categoria"
            description="Crie uma categoria para começar a organizar suas movimentações."
            onAction={openCategoryModal}
            title="Nenhuma categoria cadastrada"
          />
        </Card>
      ) : (
        <CategoryList categories={availableCategories} />
      )}

      <Card as="section" className="demo-section-card">
        <div className="demo-section-heading">
          <div>
            <span className="demo-eyebrow">REGRAS DE CATEGORIZAÇÃO</span>
            <h2>Regras cadastradas</h2>
            <p>
              A avaliação das regras acontece no serviço de categorização, em
              segundo plano.
            </p>
          </div>
          <Button
            disabled={availableCategories.length === 0}
            onClick={openRuleWizard}
            variant="outline"
          >
            Nova regra
          </Button>
        </div>

        {rules.isLoading ? (
          <InlineListSkeleton />
        ) : rules.error ? (
          <CategorizationErrorState error={rules.error} onRetry={rules.reload} />
        ) : rules.rules && rules.rules.length > 0 ? (
          <RuleList categories={availableCategories} rules={rules.rules} />
        ) : (
          <EmptyState
            description="Nenhuma regra foi cadastrada até agora."
            title="Sem regras cadastradas"
          />
        )}

        <p className="categorization-note">
          <StatusBadge tone="info">Processamento assíncrono</StatusBadge>
          Algumas informações podem continuar sendo atualizadas em segundo
          plano.
        </p>
      </Card>

      <CreateCategory
        error={categories.createError}
        isCreating={categories.isCreating}
        onClose={() => setCategoryModalOpen(false)}
        onSubmit={categories.createCategory}
        open={categoryModalOpen}
      />

      <RuleWizard
        categories={availableCategories}
        error={rules.createError}
        isCreating={rules.isCreating}
        onClose={() => setRuleWizardOpen(false)}
        onSubmit={rules.createRule}
        open={ruleWizardOpen}
      />
    </div>
  );
}
