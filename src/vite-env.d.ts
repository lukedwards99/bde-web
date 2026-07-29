/// <reference types="vite/client" />

declare module 'virtual:bde-blogs' {
  import type { Blog } from './blogTypes'

  const blogs: Blog[]
  export default blogs
}

interface ImportMetaEnv {
  readonly VITE_GOOGLE_FORM_URL?: string
  readonly VITE_BLOG_MEDIA_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
