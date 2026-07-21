import { useState, type FormEvent } from 'react';
import {
  Button,
  Card,
  CurrencyInput,
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
  ProgressBar,
  Select,
  StatusBadge,
  useToast,
} from '../../../components/ui';
import type { BadgeTone } from '../../../components/ui';
import { useBudgets } from '../../demo/hooks/use-demo-data';
import type { DemoBudget, DemoBudgetStatus } from '../../demo/types/demo';
import { formatDemoMoney, parseDemoMoney } from '../../demo/utils/demo-format';

type BudgetFormState = {
  id?: string;
  categoryId: string;
  limit: string;
  status: DemoBudgetStatus;
};

const emptyForm: BudgetFormState = {
  categoryId: '',
  limit: '',
  status: 'ACTIVE',
};

function usedPercentage(budget: DemoBudget) {
  return budget.limit.cents > 0
    ? Math.round((budget.spent.cents / budget.limit.cents) * 100)
    : 0;
}

function budgetTone(budget: DemoBudget): BadgeTone {
  const used = usedPercentage(budget);
  if (budget.status === 'PAUSED') return 'paused';
  if (budget.status === 'ARCHIVED') return 'neutral';
  if (used > 100) return 'danger';
  if (used >= 80) return 'near-limit';
  return 'success';
}

function statusLabel(status: DemoBudgetStatus) {
  return { ACTIVE: 'Ativo', PAUSED: 'Pausado', ARCHIVED: 'Arquivado' }[status];
}

export function BudgetsPage() {
  const budgets = useBudgets();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<BudgetFormState>(emptyForm);
  const [formError, setFormError] = useState('');

  function openCreate() {
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(budget: DemoBudget) {
    setForm({
      id: budget.id,
      categoryId: budget.categoryId,
      limit: (budget.limit.cents / 100).toFixed(2).replace('.', ','),
      status: budget.status,
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.categoryId) {
      setFormError('Selecione uma categoria.');
      return;
    }

    try {
      const result = await budgets.saveBudget({
        ...form,
        limit: parseDemoMoney(form.limit, budgets.data?.currency ?? 'BRL'),
      });

      if (result.ok) {
        setModalOpen(false);
        showToast({
          title: form.id ? 'Orçamento atualizado' : 'Orçamento criado',
          message: 'O planejamento foi salvo somente nesta demonstração.',
          tone: 'success',
        });
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Informe um limite válido.',
      );
    }
  }

  if (budgets.isLoading) {
    return <LoadingState label="Carregando orçamentos" />;
  }

  if (budgets.error && !budgets.data) {
    return (
      <ErrorState
        actionLabel="Tentar novamente"
        description={budgets.error.message}
        onAction={budgets.reload}
      />
    );
  }

  return (
    <div className="demo-page">
      <header className="demo-page__header">
        <div>
          <span className="demo-eyebrow">PLANEJAMENTO DO MÊS</span>
          <h1>Orçamentos</h1>
          <p>Limites claros para gastar com intenção, sem perder o contexto.</p>
        </div>
        <Button leadingIcon="wallet" onClick={openCreate}>
          Novo orçamento
        </Button>
      </header>

      {!budgets.data?.budgets.length ? (
        <Card as="section">
          <EmptyState
            actionLabel="Criar orçamento"
            description="Defina um limite por categoria para acompanhar sua evolução."
            onAction={openCreate}
            title="Nenhum orçamento ativo"
          />
        </Card>
      ) : (
        <section aria-label="Orçamentos" className="demo-card-grid demo-card-grid--budgets">
          {budgets.data.budgets.map((budget) => {
            const used = usedPercentage(budget);
            const tone = budgetTone(budget);
            return (
              <Card as="article" className="budget-card" key={budget.id}>
                <div className="budget-card__heading">
                  <div>
                    <span className="demo-eyebrow">{statusLabel(budget.status)}</span>
                    <h2>{budget.categoryName}</h2>
                  </div>
                  <StatusBadge tone={tone}>{used}%</StatusBadge>
                </div>
                <div className="budget-card__amounts">
                  <strong>{formatDemoMoney(budget.spent)}</strong>
                  <span>de {formatDemoMoney(budget.limit)}</span>
                </div>
                <ProgressBar
                  label={`${budget.categoryName}: ${used}% utilizado`}
                  tone={tone}
                  value={used}
                />
                <Button onClick={() => openEdit(budget)} size="sm" variant="ghost">
                  Editar limite
                </Button>
              </Card>
            );
          })}
        </section>
      )}

      <Modal
        footer={
          <>
            <Button onClick={() => setModalOpen(false)} variant="ghost">
              Cancelar
            </Button>
            <Button form="budget-form" loading={budgets.isSaving} type="submit">
              Salvar orçamento
            </Button>
          </>
        }
        onClose={() => setModalOpen(false)}
        open={modalOpen}
        title={form.id ? 'Editar orçamento' : 'Novo orçamento'}
      >
        <form className="demo-form" id="budget-form" onSubmit={handleSubmit}>
          <Select
            label="Categoria"
            onChange={(event) => {
              const categoryId = event.currentTarget.value;
              setForm((current) => ({
                ...current,
                categoryId,
              }));
              setFormError('');
            }}
            options={(budgets.data?.categories ?? []).map((category) => ({
              label: category.name,
              value: category.id,
            }))}
            placeholder="Selecione"
            value={form.categoryId}
          />
          <CurrencyInput
            currency={budgets.data?.currency}
            error={formError}
            label="Limite"
            onChange={(event) => {
              const limit = event.currentTarget.value;
              setForm((current) => ({
                ...current,
                limit,
              }));
              setFormError('');
            }}
            placeholder="1.000,00"
            value={form.limit}
          />
          <Select
            label="Status"
            onChange={(event) => {
              const status = event.currentTarget.value as DemoBudgetStatus;
              setForm((current) => ({
                ...current,
                status,
              }));
            }}
            options={[
              { value: 'ACTIVE', label: 'Ativo' },
              { value: 'PAUSED', label: 'Pausado' },
              { value: 'ARCHIVED', label: 'Arquivado' },
            ]}
            value={form.status}
          />
        </form>
      </Modal>
    </div>
  );
}
