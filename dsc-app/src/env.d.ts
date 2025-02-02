/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REACT_APP_EDITOR_KEY: string;
  readonly VITE_REACT_APP_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
