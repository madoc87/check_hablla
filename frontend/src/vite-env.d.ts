/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_SECRET_TOKEN: string
  // Adicione outras variáveis de ambiente aqui
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}