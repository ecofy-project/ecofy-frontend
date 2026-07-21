import { useState } from 'react';
import {
  FinancialStatusBadge,
  MetricCard,
  MoneyDisplay,
} from '../../../components/finance';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Combobox,
  CurrencyInput,
  DatePicker,
  DateRangePicker,
  DegradedState,
  Dropdown,
  DropdownItem,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  Input,
  LoadingState,
  Modal,
  Pagination,
  PasswordInput,
  Radio,
  Select,
  Skeleton,
  StatusBadge,
  Switch,
  Tooltip,
  useToast,
} from '../../../components/ui';
import { useFoundationSummary } from '../hooks/use-foundation-summary';

export function FoundationPage() {
  const { showToast } = useToast();
  const summaryState = useFoundationSummary();
  const [modalOpen, setModalOpen] = useState(false);
  const [alertVisible, setAlertVisible] = useState(true);
  const [checkboxChecked, setCheckboxChecked] = useState(true);
  const [switchChecked, setSwitchChecked] = useState(false);
  const [radioValue, setRadioValue] = useState('monthly');
  const [currency, setCurrency] = useState('BRL');
  const [amount, setAmount] = useState('1.250,00');
  const [category, setCategory] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [page, setPage] = useState(1);

  if (summaryState.isLoading) {
    return (
      <Card as="section">
        <LoadingState label="Carregando a fundação pelo Data Source" />
      </Card>
    );
  }

  if (summaryState.error && !summaryState.data) {
    const StateComponent =
      summaryState.error.status === 503 ? DegradedState : ErrorState;

    return (
      <Card as="section">
        <StateComponent
          actionLabel="Tentar novamente"
          description={summaryState.error.message}
          onAction={summaryState.reload}
        />
      </Card>
    );
  }

  const summary = summaryState.data;

  if (!summary) {
    return null;
  }

  return (
    <div className="page-stack">
      <section className="card foundation-hero" aria-labelledby="foundation-title">
        <div className="foundation-hero__copy">
          <span className="foundation-hero__eyebrow">Sistema EcoFy</span>
          <h1 className="foundation-hero__title" id="foundation-title">
            Uma linguagem visual para decisões mais tranquilas.
          </h1>
          <p className="foundation-hero__description">
            Tokens, componentes e estados compartilhados para manter a
            experiência financeira clara, acessível e consistente.
          </p>
        </div>
        <div
          aria-label="Camadas da fundação em ordem de dependência"
          className="foundation-hero__proof"
        >
          {summary.architectureLayers.length ? (
            summary.architectureLayers.map((layer, index) => (
              <div className="proof-row" key={layer}>
                <span className="proof-row__index numeric">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="proof-row__label">{layer}</span>
              </div>
            ))
          ) : (
            <div className="proof-row">
              <span className="proof-row__index">—</span>
              <span className="proof-row__label">
                Nenhuma camada neste cenário
              </span>
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="metrics-title">
        <div className="page-heading">
          <div className="page-heading__copy">
            <h2 id="metrics-title">Fundação em uso</h2>
            <p className="page-heading__description">
              Exemplos visuais validam os componentes sem representar dados
              reais da conta.
            </p>
          </div>
          <FinancialStatusBadge label={summary.statusLabel} tone="success" />
        </div>
        <div className="metrics-grid" style={{ marginTop: 'var(--space-4)' }}>
          <MetricCard
            helperText="BigInt no domínio; Intl na apresentação"
            icon={<Icon name="wallet" size={18} />}
            label="Valor demonstrativo"
            value={<MoneyDisplay value={summary.demonstrationAmount} />}
          />
          <MetricCard
            accent="info"
            helperText="Claro e escuro, com escolha persistida"
            icon={<Icon name="theme" size={18} />}
            label="Modos de tema"
            value={<span className="numeric">{summary.themeModeCount}</span>}
          />
          <MetricCard
            accent="warning"
            helperText="Mobile, tablet, desktop e desktop amplo"
            icon={<Icon name="dashboard" size={18} />}
            label="Faixas responsivas"
            value={
              <span className="numeric">{summary.responsiveRangeCount}</span>
            }
          />
        </div>
      </section>

      {alertVisible ? (
        <Alert
          onDismiss={() => setAlertVisible(false)}
          title="Ambiente de demonstração"
        >
          {summary.sourceNotice}
        </Alert>
      ) : null}

      <section aria-labelledby="components-title">
        <div className="page-heading">
          <div className="page-heading__copy">
            <h2 id="components-title">Componentes fundamentais</h2>
            <p className="page-heading__description">
              Controles reutilizáveis com estados previsíveis, foco visível e
              rótulos persistentes.
            </p>
          </div>
        </div>

        <div className="showcase-grid" style={{ marginTop: 'var(--space-4)' }}>
          <Card as="section" className="showcase-card showcase-grid__wide">
            <div className="showcase-card__header">
              <h3>Campos</h3>
              <p className="showcase-card__description">
                Entrada, seleção, moeda e datas compartilham o mesmo contrato
                visual.
              </p>
            </div>
            <div className="showcase-form">
              <Input
                helperText="Exemplo de ajuda persistente"
                label="Nome da visualização"
                placeholder="Ex.: Planejamento mensal"
              />
              <PasswordInput
                label="Campo protegido"
                placeholder="Somente demonstração"
              />
              <Select
                label="Moeda"
                onChange={(event) => setCurrency(event.currentTarget.value)}
                options={[
                  { label: 'Real brasileiro', value: 'BRL' },
                  { label: 'Dólar americano', value: 'USD' },
                  { label: 'Euro', value: 'EUR' },
                ]}
                value={currency}
              />
              <CurrencyInput
                currency={currency}
                label="Valor"
                onChange={(event) => setAmount(event.currentTarget.value)}
                value={amount}
              />
              <Combobox
                label="Categoria demonstrativa"
                onChange={(event) => setCategory(event.currentTarget.value)}
                options={['Alimentação', 'Moradia', 'Transporte']}
                placeholder="Comece a digitar"
                value={category}
              />
              <DatePicker label="Data de referência" />
              <div className="showcase-form__full">
                <DateRangePicker
                  label="Intervalo demonstrativo"
                  onChange={setDateRange}
                  value={dateRange}
                />
              </div>
            </div>
          </Card>

          <Card as="section" className="showcase-card showcase-grid__narrow">
            <div className="showcase-card__header">
              <h3>Ações e escolhas</h3>
              <p className="showcase-card__description">
                Estados de interação sem depender somente de cor.
              </p>
            </div>
            <div className="showcase-row">
              <Button onClick={() => setModalOpen(true)}>Abrir modal</Button>
              <Button
                loading={summaryState.isRefreshing}
                onClick={summaryState.reload}
                variant="secondary"
              >
                Recarregar Data Source
              </Button>
              <Dropdown
                label="Ações de exemplo"
                trigger={
                  <Button trailingIcon="chevron-down" variant="outline">
                    Mais ações
                  </Button>
                }
              >
                <DropdownItem
                  onSelect={() =>
                    showToast({
                      title: 'Ação demonstrativa',
                      message: 'Nenhuma alteração de negócio foi realizada.',
                      tone: 'info',
                    })
                  }
                >
                  Exibir toast
                </DropdownItem>
                <DropdownItem onSelect={() => setAlertVisible(true)}>
                  Restaurar aviso
                </DropdownItem>
              </Dropdown>
              <Tooltip content="Ação apenas ilustrativa">
                <IconButton icon="more" label="Opções ilustrativas" />
              </Tooltip>
            </div>
            <div className="showcase-row">
              <Checkbox
                checked={checkboxChecked}
                label="Incluir período atual"
                onChange={(event) => setCheckboxChecked(event.currentTarget.checked)}
              />
              <Switch
                checked={switchChecked}
                label="Atualização automática"
                onChange={(event) => setSwitchChecked(event.currentTarget.checked)}
              />
            </div>
            <fieldset className="field">
              <legend className="text-label">Periodicidade</legend>
              <div className="showcase-row">
                <Radio
                  checked={radioValue === 'monthly'}
                  label="Mensal"
                  name="periodicity"
                  onChange={() => setRadioValue('monthly')}
                />
                <Radio
                  checked={radioValue === 'yearly'}
                  label="Anual"
                  name="periodicity"
                  onChange={() => setRadioValue('yearly')}
                />
              </div>
            </fieldset>
            <div className="showcase-row">
              <Badge>Neutro</Badge>
              <StatusBadge tone="success">Disponível</StatusBadge>
              <StatusBadge tone="warning">Atenção</StatusBadge>
              <StatusBadge tone="danger">Indisponível</StatusBadge>
              <StatusBadge tone="info">Informativo</StatusBadge>
            </div>
          </Card>

          <Card as="section" className="showcase-card showcase-grid__narrow">
            <div className="showcase-card__header">
              <h3>Carregamento progressivo</h3>
              <p className="showcase-card__description">
                Skeletons preservam o contexto da tela.
              </p>
            </div>
            <LoadingState />
            <div className="showcase-row">
              <Skeleton circle height="2.5rem" width="2.5rem" />
              <Skeleton height="0.875rem" width="48%" />
            </div>
          </Card>

          <Card as="section" className="showcase-card showcase-grid__wide">
            <div className="showcase-card__header">
              <h3>Estado vazio e paginação</h3>
              <p className="showcase-card__description">
                Estados globais orientam o próximo passo sem inventar regras de
                domínio.
              </p>
            </div>
            <EmptyState
              actionLabel="Ação demonstrativa"
              description="Este estado está pronto para receber o contexto de uma feature futura."
              onAction={() =>
                showToast({
                  title: 'Exemplo somente',
                  message: 'A feature responsável definirá esta ação.',
                  tone: 'info',
                })
              }
              title="Sem conteúdo demonstrativo"
            />
            <Pagination
              onPageChange={setPage}
              page={page}
              totalElements={128}
              totalPages={7}
            />
          </Card>
        </div>
      </section>

      <Modal
        footer={
          <>
            <Button onClick={() => setModalOpen(false)} variant="ghost">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setModalOpen(false);
                showToast({
                  title: 'Exemplo salvo',
                  message: 'Somente o comportamento visual foi demonstrado.',
                  tone: 'success',
                });
              }}
            >
              Confirmar exemplo
            </Button>
          </>
        }
        onClose={() => setModalOpen(false)}
        open={modalOpen}
        title="Modal acessível"
      >
        <div className="showcase-card">
          <p className="page-heading__description">
            O foco fica contido neste diálogo, Escape fecha a janela e o foco
            retorna ao controle de origem.
          </p>
          <Input label="Rótulo persistente" placeholder="Conteúdo de exemplo" />
        </div>
      </Modal>
    </div>
  );
}
