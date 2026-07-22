import { ApiAuthDataSource } from '../../features/auth/data-sources/api-auth-data-source';
import type { AuthDataSource } from '../../features/auth/data-sources/auth-data-source';
import { AuthService } from '../../features/auth/services/auth-service';
import { ApiBudgetDataSource } from '../../features/budgets/data-sources/api-budget-data-source';
import type { BudgetDataSource } from '../../features/budgets/data-sources/budget-data-source';
import { BudgetService } from '../../features/budgets/services/budget-service';
import { ApiCategorizationDataSource } from '../../features/categories/data-sources/api-categorization-data-source';
import type { CategorizationDataSource } from '../../features/categories/data-sources/categorization-data-source';
import { CategorizationService } from '../../features/categories/services/categorization-service';
import {
  ApiDashboardDataSource,
  ApiGoalDataSource,
  ApiInsightsDataSource,
  ApiNotificationDataSource,
} from '../../features/demo/data-sources/api-demo-data-sources';
import { ApiImportDataSource } from '../../features/imports/data-sources/api-import-data-source';
import type { ImportDataSource } from '../../features/imports/data-sources/import-data-source';
import { ImportService } from '../../features/imports/services/import-service';
import type { DemoDataSources } from '../../features/demo/data-sources/demo-data-sources';
import { DemoService } from '../../features/demo/services/demo-service';
import { ApiFoundationDataSource } from '../../features/foundation/data-sources/api-foundation-data-source';
import type { FoundationDataSource } from '../../features/foundation/data-sources/foundation-data-source';
import { FoundationService } from '../../features/foundation/services/foundation-service';
import { ApiUserDataSource } from '../../features/users/data-sources/api-user-data-source';
import type { UserDataSource } from '../../features/users/data-sources/user-data-source';
import { UserService } from '../../features/users/services/user-service';
import { MockAuthDataSource } from '../../mocks/data-sources/mock-auth-data-source';
import { MockBudgetDataSource } from '../../mocks/data-sources/mock-budget-data-source';
import { MockCategorizationDataSource } from '../../mocks/data-sources/mock-categorization-data-source';
import {
  MockDashboardDataSource,
  MockGoalDataSource,
  MockInsightsDataSource,
  MockNotificationDataSource,
} from '../../mocks/data-sources/mock-demo-data-sources';
import { MockImportDataSource } from '../../mocks/data-sources/mock-import-data-source';
import { MockFoundationDataSource } from '../../mocks/data-sources/mock-foundation-data-source';
import { MockUserDataSource } from '../../mocks/data-sources/mock-user-data-source';
import { createDemoPersistence, DemoStore } from '../../mocks/demo/demo-store';
import { getFrontendConfig } from '../../services/config/env';
import { HttpClient } from '../../services/http';
import { createSessionPersistence } from '../../services/session/session-storage';
import { SessionStore } from '../../services/session/session-store';

export type AppDependencies = Readonly<{
  authService: AuthService;
  foundationService: FoundationService;
  userService: UserService;
  categorizationService: CategorizationService;
  budgetService: BudgetService;
  importService: ImportService;
  demoService: DemoService;
  demoStore?: DemoStore;
  demoEnabled: boolean;
  sessionStore: SessionStore;
}>;

function createApiDependencies(
  gatewayUrl: string,
  authClientId: string | undefined,
  sessionStore: SessionStore,
) {
  const httpClient = new HttpClient({
    baseUrl: gatewayUrl,
    session: { getAccessToken: sessionStore.getAccessToken },
  });
  const demoDataSources: DemoDataSources = {
    dashboard: new ApiDashboardDataSource(),
    goals: new ApiGoalDataSource(),
    insights: new ApiInsightsDataSource(),
    notifications: new ApiNotificationDataSource(),
  };

  return {
    authDataSource: new ApiAuthDataSource(httpClient, authClientId),
    foundationDataSource: new ApiFoundationDataSource(httpClient),
    userDataSource: new ApiUserDataSource(httpClient),
    categorizationDataSource: new ApiCategorizationDataSource(httpClient),
    budgetDataSource: new ApiBudgetDataSource(httpClient, {
      getUserId: sessionStore.getUserId,
    }),
    importDataSource: new ApiImportDataSource(httpClient),
    demoDataSources,
  };
}

export function createAppDependencies(): AppDependencies {
  const config = getFrontendConfig();
  const sessionStore = new SessionStore(
    createSessionPersistence(config.dataMode === 'mock' ? 'local' : 'session'),
  );

  let authDataSource: AuthDataSource;
  let foundationDataSource: FoundationDataSource;
  let userDataSource: UserDataSource;
  let categorizationDataSource: CategorizationDataSource;
  let budgetDataSource: BudgetDataSource;
  let importDataSource: ImportDataSource;
  let demoDataSources: DemoDataSources;
  let demoStore: DemoStore | undefined;

  if (config.dataMode === 'mock') {
    demoStore = new DemoStore(createDemoPersistence());
    const options = {
      scenario: config.mockScenario,
      delayMs: config.mockDelayMs,
    };
    authDataSource = new MockAuthDataSource(demoStore, {
      scenario: config.mockAuthScenario,
      delayMs: config.mockDelayMs,
      roles: config.mockUserRoles,
      permissions: config.mockUserPermissions,
    });
    foundationDataSource = new MockFoundationDataSource(options);
    userDataSource = new MockUserDataSource(demoStore, options);
    categorizationDataSource = new MockCategorizationDataSource(
      demoStore,
      options,
    );
    budgetDataSource = new MockBudgetDataSource(demoStore, options);
    importDataSource = new MockImportDataSource(demoStore, options);
    demoDataSources = {
      dashboard: new MockDashboardDataSource(demoStore, options),
      goals: new MockGoalDataSource(demoStore, options),
      insights: new MockInsightsDataSource(demoStore, options),
      notifications: new MockNotificationDataSource(demoStore, options),
    };
  } else {
    if (!config.apiGatewayUrl) {
      throw new Error('O API Gateway é obrigatório no modo API.');
    }

    const api = createApiDependencies(
      config.apiGatewayUrl,
      config.authClientId,
      sessionStore,
    );
    authDataSource = api.authDataSource;
    foundationDataSource = api.foundationDataSource;
    userDataSource = api.userDataSource;
    categorizationDataSource = api.categorizationDataSource;
    budgetDataSource = api.budgetDataSource;
    importDataSource = api.importDataSource;
    demoDataSources = api.demoDataSources;
  }

  return Object.freeze({
    authService: new AuthService(authDataSource),
    foundationService: new FoundationService(foundationDataSource),
    userService: new UserService(userDataSource),
    categorizationService: new CategorizationService(categorizationDataSource),
    budgetService: new BudgetService(budgetDataSource),
    importService: new ImportService(importDataSource, {
      maxFileSizeBytes: config.maxImportFileSizeBytes,
    }),
    demoService: new DemoService(demoDataSources),
    ...(demoStore ? { demoStore } : {}),
    demoEnabled: config.dataMode === 'mock',
    sessionStore,
  });
}
