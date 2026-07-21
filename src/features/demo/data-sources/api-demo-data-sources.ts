import { ApiErrorException } from '../../../services/errors/api-error';
import type {
  BudgetDataSource,
  CategorizationDataSource,
  DashboardDataSource,
  GoalDataSource,
  ImportDataSource,
  InsightsDataSource,
  NotificationDataSource,
} from './demo-data-sources';

function backendContractUnavailable(): never {
  throw new ApiErrorException({
    code: 'DATA_SOURCE_NOT_CONFIGURED',
    message: 'Este recurso ainda não possui um contrato publicado no API Gateway.',
    status: 503,
  });
}

export class ApiDashboardDataSource implements DashboardDataSource {
  getDashboard = async () => backendContractUnavailable();
}

export class ApiCategorizationDataSource implements CategorizationDataSource {
  getCategorizationOverview = async () => backendContractUnavailable();
  createCategory = async () => backendContractUnavailable();
}

export class ApiBudgetDataSource implements BudgetDataSource {
  getBudgetOverview = async () => backendContractUnavailable();
  saveBudget = async () => backendContractUnavailable();
}

export class ApiImportDataSource implements ImportDataSource {
  listImports = async () => backendContractUnavailable();
  startImport = async () => backendContractUnavailable();
}

export class ApiGoalDataSource implements GoalDataSource {
  getGoalOverview = async () => backendContractUnavailable();
  saveGoal = async () => backendContractUnavailable();
}

export class ApiInsightsDataSource implements InsightsDataSource {
  listInsights = async () => backendContractUnavailable();
  generateInsight = async () => backendContractUnavailable();
}

export class ApiNotificationDataSource implements NotificationDataSource {
  listNotifications = async () => backendContractUnavailable();
  markAllNotificationsRead = async () => backendContractUnavailable();
}
