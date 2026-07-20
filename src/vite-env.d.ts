/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_GATEWAY_URL?: string;
  readonly VITE_APP_DATA_MODE?: string;
  readonly VITE_AUTH_CLIENT_ID?: string;
  readonly VITE_APP_ENV?: string;
  readonly VITE_MOCK_SCENARIO?: string;
  readonly VITE_MOCK_AUTH_SCENARIO?: string;
  readonly VITE_MOCK_USER_ROLES?: string;
  readonly VITE_MOCK_USER_PERMISSIONS?: string;
  readonly VITE_MOCK_DELAY_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
