import type {
  BudgetOverview,
  CategorizationOverview,
  CreateCategoryInput,
  DemoDashboard,
  DemoImport,
  DemoImportProgress,
  DemoInsight,
  DemoNotification,
  GoalOverview,
  SaveBudgetInput,
  SaveGoalInput,
} from '../types/demo';

export interface DashboardDataSource {
  getDashboard(): Promise<DemoDashboard>;
}

export interface CategorizationDataSource {
  getCategorizationOverview(): Promise<CategorizationOverview>;
  createCategory(input: CreateCategoryInput): Promise<CategorizationOverview>;
}

export interface BudgetDataSource {
  getBudgetOverview(): Promise<BudgetOverview>;
  saveBudget(input: SaveBudgetInput): Promise<BudgetOverview>;
}

export interface ImportDataSource {
  listImports(): Promise<readonly DemoImport[]>;
  startImport(
    file: Readonly<{ name: string; size: number }>,
    onProgress: (progress: DemoImportProgress) => void,
  ): Promise<readonly DemoImport[]>;
}

export interface GoalDataSource {
  getGoalOverview(): Promise<GoalOverview>;
  saveGoal(input: SaveGoalInput): Promise<GoalOverview>;
}

export interface InsightsDataSource {
  listInsights(): Promise<readonly DemoInsight[]>;
  generateInsight(): Promise<readonly DemoInsight[]>;
}

export interface NotificationDataSource {
  listNotifications(): Promise<readonly DemoNotification[]>;
  markAllNotificationsRead(): Promise<readonly DemoNotification[]>;
}

export type DemoDataSources = Readonly<{
  dashboard: DashboardDataSource;
  categorization: CategorizationDataSource;
  budget: BudgetDataSource;
  imports: ImportDataSource;
  goals: GoalDataSource;
  insights: InsightsDataSource;
  notifications: NotificationDataSource;
}>;
