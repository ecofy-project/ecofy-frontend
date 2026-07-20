import { ApiAuthDataSource } from '../../features/auth/data-sources/api-auth-data-source';
import type { AuthDataSource } from '../../features/auth/data-sources/auth-data-source';
import { AuthService } from '../../features/auth/services/auth-service';
import { ApiFoundationDataSource } from '../../features/foundation/data-sources/api-foundation-data-source';
import type { FoundationDataSource } from '../../features/foundation/data-sources/foundation-data-source';
import { FoundationService } from '../../features/foundation/services/foundation-service';
import { MockAuthDataSource } from '../../mocks/data-sources/mock-auth-data-source';
import { MockFoundationDataSource } from '../../mocks/data-sources/mock-foundation-data-source';
import { getFrontendConfig } from '../../services/config/env';
import { resolveDataSource } from '../../services/data-source';
import { HttpClient } from '../../services/http';
import { createSessionStoragePersistence } from '../../services/session/session-storage';
import { SessionStore } from '../../services/session/session-store';

export type AppDependencies = Readonly<{
  authService: AuthService;
  foundationService: FoundationService;
  sessionStore: SessionStore;
}>;

export function createAppDependencies(): AppDependencies {
  const config = getFrontendConfig();
  const sessionStore = new SessionStore(createSessionStoragePersistence());
  const httpClient = new HttpClient({
    baseUrl: config.apiGatewayUrl,
    session: {
      getAccessToken: sessionStore.getAccessToken,
    },
  });
  const authDataSource = resolveDataSource<AuthDataSource>(config.dataMode, {
    mock: () =>
      new MockAuthDataSource({
        scenario: config.mockAuthScenario,
        delayMs: config.mockDelayMs,
        roles: config.mockUserRoles,
        permissions: config.mockUserPermissions,
      }),
    api: () => new ApiAuthDataSource(httpClient, config.authClientId),
  });
  const foundationDataSource = resolveDataSource<FoundationDataSource>(
    config.dataMode,
    {
      mock: () =>
        new MockFoundationDataSource({
          scenario: config.mockScenario,
          delayMs: config.mockDelayMs,
        }),
      api: () =>
        new ApiFoundationDataSource(httpClient),
    },
  );

  return Object.freeze({
    authService: new AuthService(authDataSource),
    foundationService: new FoundationService(foundationDataSource),
    sessionStore,
  });
}
