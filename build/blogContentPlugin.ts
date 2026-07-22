import path from 'node:path'
import type { Plugin } from 'vite'
import { loadBlogContent } from './blogContent'

const VIRTUAL_MODULE_ID = 'virtual:bde-blogs'
const RESOLVED_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`

export const blogContentPlugin = (): Plugin => {
  let projectRoot = process.cwd()

  return {
    name: 'bde-blog-content',
    configResolved(config) {
      projectRoot = config.root
    },
    resolveId(id) {
      return id === VIRTUAL_MODULE_ID ? RESOLVED_MODULE_ID : undefined
    },
    load(id) {
      if (id !== RESOLVED_MODULE_ID) return undefined

      const blogs = loadBlogContent(projectRoot)
      const serializedBlogs = JSON.stringify(blogs)
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029')
      return `export default ${serializedBlogs}`
    },
    handleHotUpdate({ file, server }) {
      const blogsDirectory = `${path.join(projectRoot, 'blogs')}${path.sep}`
      if (!file.startsWith(blogsDirectory)) return

      const module = server.moduleGraph.getModuleById(RESOLVED_MODULE_ID)
      if (!module) return []

      server.moduleGraph.invalidateModule(module)
      return [module]
    },
  }
}
