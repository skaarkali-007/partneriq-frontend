/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_TOKEN_REFRESH_INTERVAL: string
  readonly VITE_SESSION_TIMEOUT: string
  readonly VITE_ENABLE_MFA: string
  readonly VITE_ENABLE_ANALYTICS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}