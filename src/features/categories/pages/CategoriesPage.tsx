import { useState, type FormEvent } from 'react';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Modal,
  StatusBadge,
  useToast,
} from '../../../components/ui';
import { useCategorization } from '../../demo/hooks/use-demo-data';

export function CategoriesPage() {
  const categorization = useCategorization();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#12a594');
  const [nameError, setNameError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();

    if (normalizedName.length < 2) {
      setNameError('Informe um nome com pelo menos 2 caracteres.');
      return;
    }

    const result = await categorization.createCategory({
      name: normalizedName,
      color,
    });

    if (result.ok) {
      setModalOpen(false);
      setName('');
      setNameError('');
      showToast({
        title: 'Categoria criada',
        message: 'A nova categoria foi salva nesta demonstração.',
        tone: 'success',
      });
    }
  }

  if (categorization.isLoading) {
    return <LoadingState label="Carregando categorias e regras" />;
  }

  if (categorization.error && !categorization.data) {
    return (
      <ErrorState
        actionLabel="Tentar novamente"
        description={categorization.error.message}
        onAction={categorization.reload}
      />
    );
  }

  const data = categorization.data;

  return (
    <div className="demo-page">
      <header className="demo-page__header">
        <div>
          <span className="demo-eyebrow">ORGANIZAÇÃO AUTOMÁTICA</span>
          <h1>Categorias & Regras</h1>
          <p>Uma taxonomia simples para explicar de onde vêm seus gastos.</p>
        </div>
        <Button leadingIcon="categories" onClick={() => setModalOpen(true)}>
          Nova categoria
        </Button>
      </header>

      {!data || data.categories.length === 0 ? (
        <Card as="section">
          <EmptyState
            actionLabel="Criar categoria"
            description="Crie uma categoria para começar a organizar suas movimentações."
            onAction={() => setModalOpen(true)}
            title="Nenhuma categoria criada"
          />
        </Card>
      ) : (
        <section aria-label="Categorias" className="demo-card-grid demo-card-grid--categories">
          {data.categories.map((category) => (
            <Card as="article" className="category-card" key={category.id}>
              <span
                aria-hidden="true"
                className="category-card__swatch"
                style={{ backgroundColor: category.color }}
              />
              <div>
                <h2>{category.name}</h2>
                <p className="numeric">
                  {category.transactionCount} movimentações
                </p>
              </div>
            </Card>
          ))}
        </section>
      )}

      <Card as="section" className="demo-section-card">
        <div className="demo-section-heading">
          <div>
            <span className="demo-eyebrow">REGRAS VISUAIS</span>
            <h2>Como a categorização acontece</h2>
          </div>
          <StatusBadge tone="info">Somente demonstração</StatusBadge>
        </div>
        {data?.rules.length ? (
          <ol className="demo-ledger-list">
            {data.rules.map((rule) => (
              <li key={rule.id}>
                <span>{rule.description}</span>
                <strong>{rule.categoryName}</strong>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState description="Nenhuma regra está ativa neste cenário." />
        )}
      </Card>

      <Modal
        footer={
          <>
            <Button onClick={() => setModalOpen(false)} variant="ghost">
              Cancelar
            </Button>
            <Button
              form="category-form"
              loading={categorization.isSaving}
              type="submit"
            >
              Criar categoria
            </Button>
          </>
        }
        onClose={() => setModalOpen(false)}
        open={modalOpen}
        title="Nova categoria"
      >
        <form className="demo-form" id="category-form" onSubmit={handleSubmit}>
          <Input
            autoFocus
            error={nameError}
            label="Nome"
            onChange={(event) => {
              setName(event.currentTarget.value);
              setNameError('');
            }}
            placeholder="Ex.: Pets"
            value={name}
          />
          <Input
            label="Cor de identificação"
            onChange={(event) => setColor(event.currentTarget.value)}
            type="color"
            value={color}
          />
        </form>
      </Modal>
    </div>
  );
}
