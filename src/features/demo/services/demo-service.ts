import type { DemoDataSources } from '../data-sources/demo-data-sources';
import type {
  CreateCategoryInput,
  DemoImportProgress,
  SaveBudgetInput,
  SaveGoalInput,
} from '../types/demo';

export class DemoService {
  constructor(private readonly dataSources: DemoDataSources) {}

  getDashboard() {
    return this.dataSources.dashboard.getDashboard();
  }

  getCategorizationOverview() {
    return this.dataSources.categorization.getCategorizationOverview();
  }

  createCategory(input: CreateCategoryInput) {
    return this.dataSources.categorization.createCategory(input);
  }

  getBudgetOverview() {
    return this.dataSources.budget.getBudgetOverview();
  }

  saveBudget(input: SaveBudgetInput) {
    return this.dataSources.budget.saveBudget(input);
  }

  listImports() {
    return this.dataSources.imports.listImports();
  }

  startImport(
    file: Readonly<{ name: string; size: number }>,
    onProgress: (progress: DemoImportProgress) => void,
  ) {
    return this.dataSources.imports.startImport(file, onProgress);
  }

  getGoalOverview() {
    return this.dataSources.goals.getGoalOverview();
  }

  saveGoal(input: SaveGoalInput) {
    return this.dataSources.goals.saveGoal(input);
  }

  listInsights() {
    return this.dataSources.insights.listInsights();
  }

  generateInsight() {
    return this.dataSources.insights.generateInsight();
  }

  listNotifications() {
    return this.dataSources.notifications.listNotifications();
  }

  markAllNotificationsRead() {
    return this.dataSources.notifications.markAllNotificationsRead();
  }
}
