export type TransformationMetadata = {
  name?: string
  age?: number
  beforeWeight?: string
  afterWeight?: string
  about?: string
}

export type Transformation = TransformationMetadata & {
  id: string
  name: string
  before: string
  after: string
}

type TransformationDraft = TransformationMetadata & {
  before?: string
  after?: string
}

const imageModules = import.meta.glob<string>(
  './assets/transformations/*/*.webp',
  { eager: true, query: '?url', import: 'default' },
)

const metadataModules = import.meta.glob<unknown>(
  './assets/transformations/*/metadata.json',
  { eager: true, import: 'default' },
)

const titleCase = (value: string) => value
  .split(/[-_]/)
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ')

const readMetadata = (value: unknown): TransformationMetadata => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  const metadata = value as Record<string, unknown>

  return {
    ...(typeof metadata.name === 'string' && metadata.name.trim()
      ? { name: metadata.name.trim() }
      : {}),
    ...(typeof metadata.age === 'number' && Number.isFinite(metadata.age)
      ? { age: metadata.age }
      : {}),
    ...(typeof metadata.beforeWeight === 'string' && metadata.beforeWeight.trim()
      ? { beforeWeight: metadata.beforeWeight.trim() }
      : {}),
    ...(typeof metadata.afterWeight === 'string' && metadata.afterWeight.trim()
      ? { afterWeight: metadata.afterWeight.trim() }
      : {}),
    ...(typeof metadata.about === 'string' && metadata.about.trim()
      ? { about: metadata.about.trim() }
      : {}),
  }
}

const drafts = new Map<string, TransformationDraft>()

Object.entries(metadataModules).forEach(([path, metadata]) => {
  const match = path.match(/\/transformations\/([^/]+)\/metadata\.json$/)
  if (!match) return

  drafts.set(match[1], {
    ...drafts.get(match[1]),
    ...readMetadata(metadata),
  })
})

Object.entries(imageModules).forEach(([path, source]) => {
  const match = path.match(/\/transformations\/([^/]+)\/(before|after)\.webp$/)
  if (!match) return

  const [, id, phase] = match
  drafts.set(id, {
    ...drafts.get(id),
    [phase]: source,
  })
})

export const transformations: Transformation[] = Array.from(drafts.entries())
  .flatMap(([id, draft]) => {
    if (!draft.before || !draft.after) {
      if (import.meta.env.DEV) {
        console.warn(
          `Skipping transformation "${id}": both before.webp and after.webp are required.`,
        )
      }
      return []
    }

    return [{
      ...draft,
      id,
      name: draft.name || titleCase(id),
      before: draft.before,
      after: draft.after,
    }]
  })
  .sort((a, b) => a.name.localeCompare(b.name))
