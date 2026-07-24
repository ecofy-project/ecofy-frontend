import { ApiAuthDataSource } from '../../features/auth/data-sources/api-auth-data-source';
import type { AuthDataSource } from '../../features/auth/data-sources/auth-data-source';
import { AuthService } from '../../features/auth/services/auth-service';
import { ApiBudgetDataSource } from '../../features/budgets/data-sources/api-budget-data-source';
import type { BudgetDataSource } from '../../features/budgets/data-sources/budget-data-source';
import { BudgetService } from '../../features/budgets/services/budget-service';
import { ApiCategorizationDataSource } from '../../features/categories/data-sources/api-categorization-data-source';
import type { CategorizationDataSource } from '../../features/categories/data-sources/categorization-data-source';
import { CategorizationService } from '../../features/categories/services/categorization-service';
import { ApiNotificationDataSource } from '../../features/notifications/data-sources/api-notification-data-source';
import type { NotificationDataSource } from '../../features/notifications/data-sources/notification-data-source';
import { NotificationService } from '../../features/notifications/services/notification-service';
import { ApiGoalDataSource } from '../../features/goals/data-sources/api-goal-data-source';
import type { GoalDataSource } from '../../features/goals/data-sources/goal-data-source';
import { GoalService } from '../../features/goals/services/goal-service';
import { ApiInsightsDataSource } from '../../features/insights/data-sources/api-insights-data-source';
import type { InsightsDataSource } from '../../features/insights/data-sources/insights-data-source';
import { InsightsService } from '../../features/insights/services/insights-service';
import { ApiImportDataSource } from '../../features/imports/data-sources/api-import-data-source';
import type { ImportDataSource } from '../../features/imports/data-sources/import-data-source';
import { ImportService } from '../../features/imports/services/import-service';
import { ApiFoundationDataSource } from '../../features/foundation/data-sources/api-foundation-data-source';
import type { FoundationDataSource } from '../../features/foundation/data-sources/foundation-data-source';
import { FoundationService } from '../../features/foundation/services/foundation-service';
import { ApiUserDataSource } from '../../features/users/data-sources/api-user-data-source';
import type { UserDataSource } from '../../features/users/data-sources/user-data-source';
import { UserService } from '../../features/users/services/user-service';
import { MockAuthDataSource } from '../../mocks/data-sources/mock-auth-data-source';
import { MockBudgetDataSource } from '../../mocks/data-sources/mock-budget-data-source';
import { MockCategorizationDataSource } from '../../mocks/data-sources/mock-categorization-data-source';
import { MockNotificationDataSource } from '../../mocks/data-sources/mock-notification-data-source';
import { MockGoalDataSource } from '../../mocks/data-sources/mock-goal-data-source';
import { MockImportDataSource } from '../../mocks/data-sources/mock-import-data-source';
import { MockInsightsDataSource } from '../../mocks/data-sources/mock-insights-data-source';
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
  insightsService: InsightsService;
  goalService: GoalService;
  notificationService: NotificationService;
  demoStore?: DemoStore;
  demoEnabled: boolean;
  sessionStore: SessionStore;
}>;

function createApiDependencies(
  gatewayUrl: string,
  authClientId: string | undefined,
  sessionStore: SessionStore,
) {
  /**
   * Renovação de sessão coordenada. `401`s concorrentes compartilham uma única
   * tentativa de refresh (voo único). Quando a renovação falha ou não há refresh
   * token, a sessão é encerrada — e a `ProtectedRoute` redireciona ao login por
   * conta própria, sem acoplar o router à camada de serviço. A referência ao
   * Data Source é diferida porque ele depende do próprio HTTP Client.
   */
  let refreshInFlight: Promise<boolean> | null = null;
  const authRef: { current: ApiAuthDataSource | null } = { current: null };

  const handleUnauthorized = (): Promise<boolean> => {
    if (refreshInFlight) {
      return refreshInFlight;
    }

    refreshInFlight = (async () => {
      const refreshToken = sessionStore.getRefreshToken();
      const auth = authRef.current;

      if (!refreshToken || !auth) {
        sessionStore.clearSession();
        return false;
      }

      try {
        sessionStore.updateTokens(await auth.refresh(refreshToken));
        return true;
      } catch {
        sessionStore.clearSession();
        return false;
      }
    })().finally(() => {
      refreshInFlight = null;
    });

    return refreshInFlight;
  };

  const httpClient = new HttpClient({
    baseUrl: gatewayUrl,
    session: {
      getAccessToken: sessionStore.getAccessToken,
      handleUnauthorized,
    },
  });
  const authDataSource = new ApiAuthDataSource(httpClient, authClientId);
  authRef.current = authDataSource;
  const currentUser = { getUserId: sessionStore.getUserId };

  return {
    authDataSource,
    foundationDataSource: new ApiFoundationDataSource(httpClient),
    userDataSource: new ApiUserDataSource(httpClient),
    categorizationDataSource: new ApiCategorizationDataSource(httpClient),
    budgetDataSource: new ApiBudgetDataSource(httpClient, currentUser),
    importDataSource: new ApiImportDataSource(httpClient),
    insightsDataSource: new ApiInsightsDataSource(httpClient, currentUser),
    goalDataSource: new ApiGoalDataSource(httpClient, currentUser),
    notificationDataSource: new ApiNotificationDataSource(
      httpClient,
      currentUser,
    ),
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
  let insightsDataSource: InsightsDataSource;
  let goalDataSource: GoalDataSource;
  let notificationDataSource: NotificationDataSource;
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
    insightsDataSource = new MockInsightsDataSource(demoStore, options);
    goalDataSource = new MockGoalDataSource(demoStore, options);
    notificationDataSource = new MockNotificationDataSource(demoStore, options);
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
    insightsDataSource = api.insightsDataSource;
    goalDataSource = api.goalDataSource;
    notificationDataSource = api.notificationDataSource;
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
    insightsService: new InsightsService(insightsDataSource),
    goalService: new GoalService(goalDataSource),
    notificationService: new NotificationService(notificationDataSource),
    ...(demoStore ? { demoStore } : {}),
    demoEnabled: config.dataMode === 'mock',
    sessionStore,
  });
}
