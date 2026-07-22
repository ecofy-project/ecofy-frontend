export type DemoMoney = Readonly<{
  cents: number;
  currency: string;
}>;

export type DemoMetric =
  | Readonly<{
      key: 'TOTAL_SPENT' | 'INCOME';
      label: string;
      amount: DemoMoney;
      helperText: string;
    }>
  | Readonly<{
      key: 'SAVINGS_RATE';
      label: string;
      percentage: number;
      helperText: string;
    }>;

export type DemoBudgetStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

export type DemoBudget = Readonly<{
  id: string;
  categoryId: string;
  categoryName: string;
  spent: DemoMoney;
  limit: DemoMoney;
  status: DemoBudgetStatus;
}>;

export type DemoGoal = Readonly<{
  id: string;
  name: string;
  saved: DemoMoney;
  target: DemoMoney;
  targetDate: string;
}>;

export type DemoInsight = Readonly<{
  id: string;
  title: string;
  message: string;
  periodLabel: string;
  createdAt: string;
}>;

export type DemoNotification = Readonly<{
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  kind: 'budget' | 'import' | 'insight' | 'goal';
}>;

export type DemoActivity = Readonly<{
  id: string;
  title: string;
  description: string;
  createdAt: string;
  kind: 'budget' | 'import' | 'insight' | 'goal';
}>;

export type DemoDashboard = Readonly<{
  periodLabel: string;
  metrics: readonly DemoMetric[];
  budgets: readonly DemoBudget[];
  insights: readonly DemoInsight[];
  goals: readonly DemoGoal[];
  activity: readonly DemoActivity[];
}>;

export type GoalOverview = Readonly<{
  goals: readonly DemoGoal[];
  currency: string;
}>;

export type SaveGoalInput = Readonly<{
  id?: string;
  name: string;
  target: DemoMoney;
  targetDate: string;
}>;
