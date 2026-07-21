import { useState, type FormEvent } from 'react';
import {
  Button,
  Card,
  CurrencyInput,
  DatePicker,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Modal,
  ProgressRing,
  useToast,
} from '../../../components/ui';
import { useGoals } from '../../demo/hooks/use-demo-data';
import type { DemoGoal } from '../../demo/types/demo';
import {
  formatDemoDate,
  formatDemoMoney,
  parseDemoMoney,
} from '../../demo/utils/demo-format';

type GoalForm = {
  id?: string;
  name: string;
  target: string;
  targetDate: string;
};

const emptyForm: GoalForm = { name: '', target: '', targetDate: '' };

export function GoalsPage() {
  const goals = useGoals();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<GoalForm>(emptyForm);
  const [formError, setFormError] = useState('');

  function openCreate() {
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(goal: DemoGoal) {
    setForm({
      id: goal.id,
      name: goal.name,
      target: (goal.target.cents / 100).toFixed(2).replace('.', ','),
      targetDate: goal.targetDate.slice(0, 10),
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.name.trim().length < 3 || !form.targetDate) {
      setFormError('Preencha nome, valor e data da meta.');
      return;
    }

    try {
      const result = await goals.saveGoal({
        id: form.id,
        name: form.name.trim(),
        target: parseDemoMoney(form.target, goals.data?.currency ?? 'BRL'),
        targetDate: new Date(`${form.targetDate}T12:00:00`).toISOString(),
      });

      if (result.ok) {
        setModalOpen(false);
        showToast({
          title: form.id ? 'Meta atualizada' : 'Meta criada',
          message: 'O objetivo foi salvo nesta demonstração.',
          tone: 'success',
        });
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Revise os dados da meta.',
      );
    }
  }

  if (goals.isLoading) {
    return <LoadingState label="Carregando metas" />;
  }

  if (goals.error && !goals.data) {
    return (
      <ErrorState
        actionLabel="Tentar novamente"
        description={goals.error.message}
        onAction={goals.reload}
      />
    );
  }

  return (
    <div className="demo-page">
      <header className="demo-page__header">
        <div>
          <span className="demo-eyebrow">PLANOS COM PROPÓSITO</span>
          <h1>Metas</h1>
          <p>Acompanhe objetivos com progresso, valor-alvo e horizonte definidos.</p>
        </div>
        <Button leadingIcon="goal" onClick={openCreate}>
          Nova meta
        </Button>
      </header>

      {!goals.data?.goals.length ? (
        <Card as="section">
          <EmptyState
            actionLabel="Criar meta"
            description="Defina um objetivo para começar seu planejamento."
            onAction={openCreate}
            title="Nenhuma meta criada"
          />
        </Card>
      ) : (
        <section aria-label="Metas" className="demo-card-grid demo-card-grid--goals">
          {goals.data.goals.map((goal) => {
            const progress = Math.round(
              (goal.saved.cents / goal.target.cents) * 100,
            );
            return (
              <Card as="article" className="goal-card" key={goal.id}>
                <ProgressRing label={goal.name} tone="success" value={progress} />
                <div className="goal-card__content">
                  <span className="demo-eyebrow">ATÉ {formatDemoDate(goal.targetDate).toUpperCase()}</span>
                  <h2>{goal.name}</h2>
                  <p>
                    <strong>{formatDemoMoney(goal.saved)}</strong> de{' '}
                    {formatDemoMoney(goal.target)}
                  </p>
                  <Button onClick={() => openEdit(goal)} size="sm" variant="ghost">
                    Editar meta
                  </Button>
                </div>
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
            <Button form="goal-form" loading={goals.isSaving} type="submit">
              Salvar meta
            </Button>
          </>
        }
        onClose={() => setModalOpen(false)}
        open={modalOpen}
        title={form.id ? 'Editar meta' : 'Nova meta'}
      >
        <form className="demo-form" id="goal-form" onSubmit={handleSubmit}>
          <Input
            autoFocus
            error={formError}
            label="Nome da meta"
            onChange={(event) => {
              const name = event.currentTarget.value;
              setForm((current) => ({ ...current, name }));
              setFormError('');
            }}
            placeholder="Ex.: Curso de especialização"
            value={form.name}
          />
          <CurrencyInput
            currency={goals.data?.currency}
            label="Valor-alvo"
            onChange={(event) => {
              const target = event.currentTarget.value;
              setForm((current) => ({ ...current, target }));
              setFormError('');
            }}
            placeholder="10.000,00"
            value={form.target}
          />
          <DatePicker
            label="Data-alvo"
            min={new Date().toISOString().slice(0, 10)}
            onChange={(event) => {
              const targetDate = event.currentTarget.value;
              setForm((current) => ({
                ...current,
                targetDate,
              }));
              setFormError('');
            }}
            value={form.targetDate}
          />
        </form>
      </Modal>
    </div>
  );
}
