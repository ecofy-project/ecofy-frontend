import type { DemoDataSources } from '../data-sources/demo-data-sources';
import type { SaveGoalInput } from '../types/demo';

export class DemoService {
  constructor(private readonly dataSources: DemoDataSources) {}

  getDashboard() {
    return this.dataSources.dashboard.getDashboard();
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
