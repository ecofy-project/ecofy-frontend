import type { AuthenticatedUser } from '../../features/auth/types/auth';
import type {
  DemoActivity,
  DemoBudget,
  DemoCategory,
  DemoCategorizationRule,
  DemoGoal,
  DemoImport,
  DemoInsight,
  DemoMetric,
  DemoNotification,
} from '../../features/demo/types/demo';
import type {
  UserConnection,
  UserPreferences,
  UserProfile,
} from '../../features/users/types/user';

export const demoCredentials = Object.freeze({
  username: 'demo@ecofy.app',
  password: 'demo',
});

export type DemoState = {
  version: 1;
  user: AuthenticatedUser;
  profile: UserProfile;
  preferences: UserPreferences;
  connections: UserConnection[];
  categories: DemoCategory[];
  rules: DemoCategorizationRule[];
  budgets: DemoBudget[];
  imports: DemoImport[];
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
  const categories: DemoCategory[] = [
    { id: 'category-food', name: 'Alimentação', color: '#12a594', transactionCount: 36 },
    { id: 'category-transport', name: 'Transporte', color: '#e8a33d', transactionCount: 22 },
    { id: 'category-home', name: 'Moradia', color: '#0e9c6e', transactionCount: 8 },
    { id: 'category-leisure', name: 'Lazer', color: '#8a7be0', transactionCount: 14 },
    { id: 'category-health', name: 'Saúde', color: '#e9736b', transactionCount: 6 },
    { id: 'category-education', name: 'Educação', color: '#4f9cf0', transactionCount: 4 },
    { id: 'category-subscriptions', name: 'Assinaturas', color: '#d96ba6', transactionCount: 9 },
    { id: 'category-other', name: 'Outros', color: '#8fbf52', transactionCount: 43 },
  ];
  const budgets: DemoBudget[] = [
    { id: 'budget-food', categoryId: 'category-food', categoryName: 'Alimentação', spent: money(72000), limit: money(100000), status: 'ACTIVE' },
    { id: 'budget-transport', categoryId: 'category-transport', categoryName: 'Transporte', spent: money(38000), limit: money(60000), status: 'ACTIVE' },
    { id: 'budget-home', categoryId: 'category-home', categoryName: 'Moradia', spent: money(145000), limit: money(180000), status: 'ACTIVE' },
    { id: 'budget-leisure', categoryId: 'category-leisure', categoryName: 'Lazer', spent: money(54000), limit: money(50000), status: 'ACTIVE' },
    { id: 'budget-health', categoryId: 'category-health', categoryName: 'Saúde', spent: money(15050), limit: money(40000), status: 'PAUSED' },
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
    version: 1,
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
    rules: [
      { id: 'rule-market', description: 'Descrição contém “mercado”', categoryId: 'category-food', categoryName: 'Alimentação' },
      { id: 'rule-mobility', description: 'Descrição contém “mobilidade”', categoryId: 'category-transport', categoryName: 'Transporte' },
    ],
    budgets,
    imports: [
      {
        id: 'import-july',
        fileName: 'movimentacoes-julho-demo.csv',
        status: 'COMPLETED',
        createdAt: isoDaysFromNow(-2, 10),
        result: { totalRecords: 148, processedRecords: 148, successCount: 142, errorCount: 3, duplicateRecords: 3, publishedRecords: 142, errors: [] },
      },
      {
        id: 'import-june',
        fileName: 'movimentacoes-junho-demo.ofx',
        status: 'COMPLETED_WITH_ERRORS',
        createdAt: isoDaysFromNow(-32, 10),
        result: {
          totalRecords: 148,
          processedRecords: 148,
          successCount: 142,
          errorCount: 3,
          duplicateRecords: 3,
          publishedRecords: 142,
          errors: [
            { line: 24, message: 'Data inválida' },
            { line: 78, message: 'Valor inválido' },
            { line: 116, message: 'Categoria não reconhecida' },
          ],
        },
      },
      { id: 'import-may', fileName: 'movimentacoes-maio-demo.csv', status: 'FAILED', createdAt: isoDaysFromNow(-62, 10) },
    ],
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
