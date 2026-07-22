import type {
  DemoDashboard,
  DemoInsight,
  DemoNotification,
  GoalOverview,
  SaveGoalInput,
} from '../types/demo';

export interface DashboardDataSource {
  getDashboard(): Promise<DemoDashboard>;
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
  goals: GoalDataSource;
  insights: InsightsDataSource;
  notifications: NotificationDataSource;
}>;
