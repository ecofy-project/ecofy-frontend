import type { AuthenticatedUser } from '../../features/auth/types/auth';
import type {
  Budget,
  BudgetConsumption,
} from '../../features/budgets/types/budget';
import type {
  CategorizableTransaction,
  CategorizationRule,
  CategorizationSuggestion,
  Category,
} from '../../features/categories/types/categorization';
import type {
  DemoActivity,
  DemoBudget,
  DemoGoal,
  DemoInsight,
  DemoMetric,
  DemoNotification,
} from '../../features/demo/types/demo';
import type {
  ImportError,
  ImportJob,
} from '../../features/imports/types/import';
import type {
  UserConnection,
  UserPreferences,
  UserProfile,
} from '../../features/users/types/user';

export const demoCredentials = Object.freeze({
  username: 'demo@ecofy.app',
  password: 'demo',
});

/** Erro por linha guardado no Mock Storage, vinculado ao job correspondente. */
export type DemoImportJobError = ImportError & { importJobId: string };

export type DemoState = {
  version: 4;
  user: AuthenticatedUser;
  profile: UserProfile;
  preferences: UserPreferences;
  connections: UserConnection[];
  categories: Category[];
  rules: CategorizationRule[];
  transactions: CategorizableTransaction[];
  suggestions: CategorizationSuggestion[];
  /** Projeção usada pelo resumo do dashboard. */
  budgets: DemoBudget[];
  /** Orçamentos no contrato de `ms-budgeting`, usados pela feature de budgets. */
  budgetRecords: Budget[];
  /** Consumos prontos, como o backend os publica em `/budgets/overview`. */
  budgetConsumptions: BudgetConsumption[];
  /** Metadados de importação. Nenhum arquivo ou conteúdo é armazenado. */
  importJobs: ImportJob[];
  importJobErrors: DemoImportJobError[];
  metrics: DemoMetric[];
  goals: DemoGoal[];
  insights: DemoInsight[];
  notifications: DemoNotification[];
  activity: DemoActivity[];
};

function isoDaysFromNow(days: number, hour = 12) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function money(cents: number) {
  return { cents, currency: 'BRL' } as const;
}

/** Datas `LocalDate` (`YYYY-MM-DD`), no formato aceito pelo budgeting. */
function localDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function currentMonthPeriod() {
  const now = new Date();
  return {
    periodStart: localDate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))),
    periodEnd: localDate(new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0))),
  };
}

function currentWeekPeriod() {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()),
  );
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { periodStart: localDate(start), periodEnd: localDate(end) };
}

export function createDemoSeed(): DemoState {
  const user: AuthenticatedUser = {
    id: 'demo-user-001',
    email: 'demo@ecofy.app',
    fullName: 'Marina Eco',
    status: 'DEMO_ACTIVE',
    emailVerified: true,
    roles: [],
    permissions: [],
  };
  const profile: UserProfile = {
    fullName: user.fullName,
    email: user.email,
    phone: '+55 11 90000-0000',
  };
  const categories: Category[] = [
    { id: 'category-food', name: 'Alimentação', color: '#12a594', active: true },
    { id: 'category-transport', name: 'Transporte', color: '#e8a33d', active: true },
    { id: 'category-home', name: 'Moradia', color: '#0e9c6e', active: true },
    { id: 'category-leisure', name: 'Lazer', color: '#8a7be0', active: true },
    { id: 'category-health', name: 'Saúde', color: '#e9736b', active: true },
    { id: 'category-education', name: 'Educação', color: '#4f9cf0', active: true },
    { id: 'category-subscriptions', name: 'Assinaturas', color: '#d96ba6', active: true },
    { id: 'category-other', name: 'Outros', active: true },
  ];
  const rules: CategorizationRule[] = [
    {
      id: 'rule-market',
      categoryId: 'category-food',
      name: 'Compras de mercado',
      status: 'ACTIVE',
      priority: 10,
      conditions: [
        { field: 'description', operator: 'CONTAINS', value: 'mercado', weight: 2 },
      ],
      createdAt: isoDaysFromNow(-20, 9),
      updatedAt: isoDaysFromNow(-20, 9),
    },
    {
      id: 'rule-mobility',
      categoryId: 'category-transport',
      name: 'Mobilidade urbana',
      status: 'ACTIVE',
      priority: 20,
      conditions: [
        { field: 'merchant', operator: 'STARTS_WITH', value: 'mobilidade', weight: 1 },
      ],
      createdAt: isoDaysFromNow(-18, 9),
      updatedAt: isoDaysFromNow(-18, 9),
    },
    {
      id: 'rule-high-rent',
      categoryId: 'category-home',
      name: 'Aluguel acima de 1000',
      status: 'INACTIVE',
      priority: 30,
      conditions: [
        { field: 'description', operator: 'CONTAINS', value: 'aluguel' },
        { field: 'amount', operator: 'AMOUNT_GREATER_THAN', value: '1000' },
      ],
      createdAt: isoDaysFromNow(-15, 9),
      updatedAt: isoDaysFromNow(-15, 9),
    },
  ];
  const marketTransactionId = '1f0a2f6c-5d1c-4a9a-9d61-2b6f5a8c1001';
  const subscriptionTransactionId = '1f0a2f6c-5d1c-4a9a-9d61-2b6f5a8c1003';
  const transactions: CategorizableTransaction[] = [
    {
      id: marketTransactionId,
      description: 'MERCADO CENTRAL LTDA',
      transactionDate: isoDaysFromNow(-3, 12),
      amountCents: 18790,
      currency: 'BRL',
      categoryId: 'category-food',
    },
    {
      id: '1f0a2f6c-5d1c-4a9a-9d61-2b6f5a8c1002',
      description: 'MOBILIDADE URBANA APP',
      transactionDate: isoDaysFromNow(-4, 12),
      amountCents: 2450,
      currency: 'BRL',
    },
    {
      id: subscriptionTransactionId,
      description: 'ASSINATURA STREAMING',
      transactionDate: isoDaysFromNow(-6, 12),
      amountCents: 3990,
      currency: 'BRL',
    },
    {
      id: '1f0a2f6c-5d1c-4a9a-9d61-2b6f5a8c1004',
      description: 'FARMACIA BEM ESTAR',
      transactionDate: isoDaysFromNow(-8, 12),
      amountCents: 8615,
      currency: 'BRL',
    },
    {
      id: '1f0a2f6c-5d1c-4a9a-9d61-2b6f5a8c1005',
      description: 'PAGAMENTO ALUGUEL',
      transactionDate: isoDaysFromNow(-10, 12),
      amountCents: 145000,
      currency: 'BRL',
      categoryId: 'category-home',
    },
  ];
  const suggestions: CategorizationSuggestion[] = [
    {
      id: 'suggestion-market',
      transactionId: marketTransactionId,
      categoryId: 'category-food',
      ruleId: 'rule-market',
      status: 'APPLIED_AUTO',
      score: 60,
      rationale: 'Regra “Compras de mercado” correspondeu à descrição.',
    },
    {
      id: 'suggestion-subscription',
      transactionId: subscriptionTransactionId,
      status: 'UNMATCHED',
      score: 0,
    },
  ];
  const budgets: DemoBudget[] = [
    { id: 'budget-food', categoryId: 'category-food', categoryName: 'Alimentação', spent: money(72000), limit: money(100000), status: 'ACTIVE' },
    { id: 'budget-transport', categoryId: 'category-transport', categoryName: 'Transporte', spent: money(38000), limit: money(60000), status: 'ACTIVE' },
    { id: 'budget-home', categoryId: 'category-home', categoryName: 'Moradia', spent: money(145000), limit: money(180000), status: 'ACTIVE' },
    { id: 'budget-leisure', categoryId: 'category-leisure', categoryName: 'Lazer', spent: money(54000), limit: money(50000), status: 'ACTIVE' },
    { id: 'budget-health', categoryId: 'category-health', categoryName: 'Saúde', spent: money(15050), limit: money(40000), status: 'PAUSED' },
  ];
  const monthly = currentMonthPeriod();
  const weekly = currentWeekPeriod();
  const budgetCreatedAt = isoDaysFromNow(-25, 9);
  /**
   * Orçamentos e consumos são dados prontos, coerentes entre si e com o resumo
   * do dashboard. O frontend nunca deriva consumo a partir de transações.
   */
  const budgetRecords: Budget[] = [
    {
      id: 'budget-food',
      categoryId: 'category-food',
      periodType: 'MONTHLY',
      ...monthly,
      limitAmount: '1000.00',
      currency: 'BRL',
      status: 'ACTIVE',
      version: 1,
      createdAt: budgetCreatedAt,
      updatedAt: budgetCreatedAt,
    },
    {
      id: 'budget-transport',
      categoryId: 'category-transport',
      periodType: 'MONTHLY',
      ...monthly,
      limitAmount: '600.00',
      currency: 'BRL',
      status: 'ACTIVE',
      version: 1,
      createdAt: isoDaysFromNow(-24, 9),
      updatedAt: isoDaysFromNow(-24, 9),
    },
    {
      id: 'budget-home',
      categoryId: 'category-home',
      periodType: 'MONTHLY',
      ...monthly,
      limitAmount: '1800.00',
      currency: 'BRL',
      status: 'ACTIVE',
      version: 2,
      createdAt: isoDaysFromNow(-23, 9),
      updatedAt: isoDaysFromNow(-9, 9),
    },
    {
      id: 'budget-leisure',
      categoryId: 'category-leisure',
      periodType: 'MONTHLY',
      ...monthly,
      limitAmount: '500.00',
      currency: 'BRL',
      status: 'ACTIVE',
      version: 1,
      createdAt: isoDaysFromNow(-22, 9),
      updatedAt: isoDaysFromNow(-22, 9),
    },
    {
      id: 'budget-health',
      categoryId: 'category-health',
      periodType: 'MONTHLY',
      ...monthly,
      limitAmount: '400.00',
      currency: 'BRL',
      status: 'PAUSED',
      version: 3,
      createdAt: isoDaysFromNow(-21, 9),
      updatedAt: isoDaysFromNow(-5, 9),
    },
    {
      id: 'budget-education',
      categoryId: 'category-education',
      periodType: 'MONTHLY',
      ...monthly,
      limitAmount: '350.00',
      currency: 'BRL',
      status: 'ARCHIVED',
      version: 4,
      createdAt: isoDaysFromNow(-20, 9),
      updatedAt: isoDaysFromNow(-2, 9),
    },
    {
      id: 'budget-subscriptions',
      categoryId: 'category-subscriptions',
      periodType: 'WEEKLY',
      ...weekly,
      limitAmount: '120.00',
      currency: 'BRL',
      status: 'ACTIVE',
      version: 1,
      createdAt: isoDaysFromNow(-19, 9),
      updatedAt: isoDaysFromNow(-19, 9),
    },
    {
      id: 'budget-other',
      categoryId: 'category-other',
      periodType: 'CUSTOM',
      ...monthly,
      limitAmount: '300.00',
      currency: 'BRL',
      status: 'ACTIVE',
      version: 1,
      createdAt: isoDaysFromNow(-18, 9),
      updatedAt: isoDaysFromNow(-18, 9),
    },
  ];
  const budgetConsumptions: BudgetConsumption[] = [
    { budgetId: 'budget-food', consumedAmount: '720.00', limitAmount: '1000.00', percentage: 72 },
    { budgetId: 'budget-transport', consumedAmount: '380.00', limitAmount: '600.00', percentage: 63.3 },
    { budgetId: 'budget-home', consumedAmount: '1450.00', limitAmount: '1800.00', percentage: 80.6 },
    { budgetId: 'budget-leisure', consumedAmount: '540.00', limitAmount: '500.00', percentage: 108 },
    { budgetId: 'budget-health', consumedAmount: '150.50', limitAmount: '400.00', percentage: 37.6 },
    { budgetId: 'budget-education', consumedAmount: '350.00', limitAmount: '350.00', percentage: 100 },
    { budgetId: 'budget-subscriptions', consumedAmount: '39.90', limitAmount: '120.00', percentage: 33.3 },
    { budgetId: 'budget-other', consumedAmount: '300.00', limitAmount: '300.00', percentage: 100 },
  ];
  /**
   * Histórico demonstrativo de importações, com contadores coerentes e todos os
   * status do domínio. Nenhum arquivo é guardado: apenas metadados do job.
   */
  const importJobs: ImportJob[] = [
    {
      id: 'import-job-completed',
      importFileId: 'import-file-completed',
      status: 'COMPLETED',
      totalRecords: 148,
      processedRecords: 148,
      successCount: 148,
      errorCount: 0,
      createdAt: isoDaysFromNow(-2, 10),
      startedAt: isoDaysFromNow(-2, 10),
      finishedAt: isoDaysFromNow(-2, 10),
      updatedAt: isoDaysFromNow(-2, 10),
    },
    {
      id: 'import-job-partial',
      importFileId: 'import-file-partial',
      status: 'COMPLETED_WITH_ERRORS',
      totalRecords: 148,
      processedRecords: 148,
      successCount: 145,
      errorCount: 3,
      createdAt: isoDaysFromNow(-9, 10),
      startedAt: isoDaysFromNow(-9, 10),
      finishedAt: isoDaysFromNow(-9, 10),
      updatedAt: isoDaysFromNow(-9, 10),
    },
    {
      id: 'import-job-running',
      importFileId: 'import-file-running',
      status: 'RUNNING',
      totalRecords: 148,
      processedRecords: 96,
      successCount: 94,
      errorCount: 2,
      createdAt: isoDaysFromNow(-1, 9),
      startedAt: isoDaysFromNow(-1, 9),
      updatedAt: isoDaysFromNow(-1, 9),
    },
    {
      id: 'import-job-pending',
      importFileId: 'import-file-pending',
      status: 'PENDING',
      totalRecords: 0,
      processedRecords: 0,
      successCount: 0,
      errorCount: 0,
      createdAt: isoDaysFromNow(0, 8),
      updatedAt: isoDaysFromNow(0, 8),
    },
    {
      id: 'import-job-failed',
      importFileId: 'import-file-failed',
      status: 'FAILED',
      totalRecords: 0,
      processedRecords: 0,
      successCount: 0,
      errorCount: 1,
      createdAt: isoDaysFromNow(-32, 10),
      startedAt: isoDaysFromNow(-32, 10),
      finishedAt: isoDaysFromNow(-32, 10),
      updatedAt: isoDaysFromNow(-32, 10),
    },
    {
      id: 'import-job-april',
      importFileId: 'import-file-april',
      status: 'COMPLETED',
      totalRecords: 96,
      processedRecords: 96,
      successCount: 96,
      errorCount: 0,
      createdAt: isoDaysFromNow(-62, 10),
      startedAt: isoDaysFromNow(-62, 10),
      finishedAt: isoDaysFromNow(-62, 10),
      updatedAt: isoDaysFromNow(-62, 10),
    },
    {
      id: 'import-job-march',
      importFileId: 'import-file-march',
      status: 'COMPLETED_WITH_ERRORS',
      totalRecords: 112,
      processedRecords: 112,
      successCount: 110,
      errorCount: 2,
      createdAt: isoDaysFromNow(-92, 10),
      startedAt: isoDaysFromNow(-92, 10),
      finishedAt: isoDaysFromNow(-92, 10),
      updatedAt: isoDaysFromNow(-92, 10),
    },
  ];
  const importJobErrors: DemoImportJobError[] = [
    {
      id: 'import-error-partial-1',
      importJobId: 'import-job-partial',
      lineNumber: 24,
      errorType: 'PARSE_ERROR',
      message: 'Data em formato não reconhecido.',
      createdAt: isoDaysFromNow(-9, 10),
    },
    {
      id: 'import-error-partial-2',
      importJobId: 'import-job-partial',
      lineNumber: 78,
      errorType: 'VALIDATION_ERROR',
      message: 'Valor da movimentação ausente.',
      createdAt: isoDaysFromNow(-9, 10),
    },
    {
      id: 'import-error-partial-3',
      importJobId: 'import-job-partial',
      lineNumber: 116,
      errorType: 'VALIDATION_ERROR',
      message: 'Descrição excede o tamanho permitido.',
      createdAt: isoDaysFromNow(-9, 10),
    },
    {
      id: 'import-error-failed-1',
      importJobId: 'import-job-failed',
      errorType: 'PARSE_ERROR',
      message: 'O cabeçalho do arquivo não pôde ser interpretado.',
      createdAt: isoDaysFromNow(-32, 10),
    },
    {
      id: 'import-error-march-1',
      importJobId: 'import-job-march',
      lineNumber: 41,
      errorType: 'VALIDATION_ERROR',
      message: 'Valor da movimentação ausente.',
      createdAt: isoDaysFromNow(-92, 10),
    },
    {
      id: 'import-error-march-2',
      importJobId: 'import-job-march',
      lineNumber: 87,
      errorType: 'UNKNOWN',
      message: 'Não foi possível processar este registro.',
      createdAt: isoDaysFromNow(-92, 10),
    },
  ];
  const insights: DemoInsight[] = [
    {
      id: 'insight-leisure',
      title: 'Lazer pede uma pausa',
      message: 'O orçamento de lazer ultrapassou o limite em 8%. Rever os próximos gastos pode devolver margem ao mês.',
      periodLabel: 'ESTE MÊS',
      createdAt: isoDaysFromNow(-1, 10),
    },
    {
      id: 'insight-savings',
      title: 'Economia em ritmo estável',
      message: 'Sua taxa de economia permanece em 18,4% no período demonstrativo.',
      periodLabel: 'ÚLTIMOS 30 DIAS',
      createdAt: isoDaysFromNow(-2, 15),
    },
    {
      id: 'insight-transport',
      title: 'Transporte com margem',
      message: 'Ainda há R$ 220,00 disponíveis no orçamento de transporte até o fim do período.',
      periodLabel: 'PROJEÇÃO',
      createdAt: isoDaysFromNow(-3, 9),
    },
  ];
  const goals: DemoGoal[] = [
    { id: 'goal-emergency', name: 'Reserva de emergência', saved: money(840000), target: money(1500000), targetDate: isoDaysFromNow(240) },
    { id: 'goal-travel', name: 'Viagem de fim de ano', saved: money(520000), target: money(800000), targetDate: isoDaysFromNow(150) },
  ];
  const notifications: DemoNotification[] = [
    { id: 'notification-budget', title: 'Limite de lazer alcançado', message: 'O orçamento de Lazer chegou a 108% do valor definido.', createdAt: isoDaysFromNow(0, 9), read: false, kind: 'budget' },
    { id: 'notification-insight', title: 'Novo insight disponível', message: 'Uma nova leitura sobre sua taxa de economia está pronta.', createdAt: isoDaysFromNow(-1, 16), read: false, kind: 'insight' },
    { id: 'notification-import', title: 'Importação concluída', message: '142 movimentações demonstrativas foram publicadas.', createdAt: isoDaysFromNow(-2, 11), read: false, kind: 'import' },
    { id: 'notification-goal', title: 'Meta avançou', message: 'A meta Viagem de fim de ano alcançou 65%.', createdAt: isoDaysFromNow(-4, 14), read: true, kind: 'goal' },
  ];

  return {
    version: 4,
    user,
    profile,
    preferences: {
      DEFAULT_CURRENCY: 'BRL',
      LOCALE: 'pt-BR',
      TIMEZONE: 'America/Sao_Paulo',
      DATE_FORMAT: 'dd/MM/yyyy',
      THEME: 'system',
      NOTIFY_CHANNELS: 'email',
    },
    connections: [
      { type: 'MANUAL', provider: 'OTHER' },
      { type: 'CSV_IMPORT', provider: 'OTHER' },
    ],
    categories,
    rules,
    transactions,
    suggestions,
    budgets,
    budgetRecords,
    budgetConsumptions,
    importJobs,
    importJobErrors,
    metrics: [
      { key: 'TOTAL_SPENT', label: 'Total gasto', amount: money(324050), helperText: 'No período demonstrativo' },
      { key: 'INCOME', label: 'Receitas', amount: money(680000), helperText: 'Entradas no período' },
      { key: 'SAVINGS_RATE', label: 'Taxa de economia', percentage: 18.4, helperText: 'Estável nos últimos 30 dias' },
    ],
    goals,
    insights,
    notifications,
    activity: [
      { id: 'activity-import', title: 'Importação concluída', description: '142 movimentações demonstrativas foram publicadas.', createdAt: isoDaysFromNow(-2, 10), kind: 'import' },
      { id: 'activity-budget', title: 'Orçamento atualizado', description: 'O limite de Lazer está sendo acompanhado de perto.', createdAt: isoDaysFromNow(-3, 18), kind: 'budget' },
      { id: 'activity-insight', title: 'Insight gerado', description: 'Uma nova leitura sobre economia foi adicionada.', createdAt: isoDaysFromNow(-4, 11), kind: 'insight' },
      { id: 'activity-goal', title: 'Meta criada', description: 'A meta Viagem de fim de ano entrou no planejamento.', createdAt: isoDaysFromNow(-8, 9), kind: 'goal' },
    ],
  };
}
