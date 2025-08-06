interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_ENV_CACHE_TOKEN_KEY: string;
  // Add other environment variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
