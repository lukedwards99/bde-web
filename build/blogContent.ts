import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import type { Blog, BlogPost } from '../src/blogTypes'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const describePath = (filePath: string, rootDirectory: string) =>
  path.relative(rootDirectory, filePath) || path.basename(filePath)

const readJson = (
  filePath: string,
  rootDirectory: string,
  issues: string[],
): Record<string, unknown> | undefined => {
  let parsed: unknown

  try {
    parsed = JSON.parse(readFileSync(filePath, 'utf8'))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    issues.push(`${describePath(filePath, rootDirectory)}: malformed JSON (${message})`)
    return undefined
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    issues.push(`${describePath(filePath, rootDirectory)}: expected a JSON object`)
    return undefined
  }

  return parsed as Record<string, unknown>
}

const requiredString = (
  record: Record<string, unknown>,
  field: string,
  filePath: string,
  rootDirectory: string,
  issues: string[],
) => {
  const value = record[field]
  if (typeof value !== 'string' || !value.trim()) {
    issues.push(`${describePath(filePath, rootDirectory)}: "${field}" must be a non-empty string`)
    return undefined
  }

  return value.trim()
}

const isRealDate = (value: string) => {
  if (!DATE_PATTERN.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value
}

const directoryEntries = (directory: string) =>
  readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))

export const loadBlogContent = (projectRoot: string): Blog[] => {
  const blogsDirectory = path.join(projectRoot, 'blogs')
  if (!existsSync(blogsDirectory)) return []

  const issues: string[] = []
  const blogs: Blog[] = []
  const seenBlogSlugs = new Set<string>()
  const trainerNames = new Map<string, { name: string; source: string }>()

  for (const blogEntry of directoryEntries(blogsDirectory)) {
    if (!blogEntry.isDirectory()) continue

    const slug = blogEntry.name
    const normalizedSlug = slug.toLocaleLowerCase('en-US')
    const blogDirectory = path.join(blogsDirectory, slug)
    const metadataPath = path.join(blogDirectory, 'blog.json')

    if (!SLUG_PATTERN.test(slug)) {
      issues.push(`${describePath(blogDirectory, projectRoot)}: folder name must be a lowercase URL slug`)
    }
    if (seenBlogSlugs.has(normalizedSlug)) {
      issues.push(`${describePath(blogDirectory, projectRoot)}: duplicate blog slug "${slug}"`)
    }
    seenBlogSlugs.add(normalizedSlug)

    if (!existsSync(metadataPath)) {
      issues.push(`${describePath(metadataPath, projectRoot)}: required file is missing`)
      continue
    }

    const metadata = readJson(metadataPath, projectRoot, issues)
    if (!metadata) continue

    const title = requiredString(metadata, 'title', metadataPath, projectRoot, issues)
    const description = requiredString(metadata, 'description', metadataPath, projectRoot, issues)
    const trainer = metadata.trainer

    if (!trainer || typeof trainer !== 'object' || Array.isArray(trainer)) {
      issues.push(`${describePath(metadataPath, projectRoot)}: "trainer" must be an object`)
      continue
    }

    const trainerRecord = trainer as Record<string, unknown>
    const trainerId = requiredString(trainerRecord, 'id', metadataPath, projectRoot, issues)
    const trainerName = requiredString(trainerRecord, 'name', metadataPath, projectRoot, issues)

    if (trainerId && !SLUG_PATTERN.test(trainerId)) {
      issues.push(`${describePath(metadataPath, projectRoot)}: trainer.id must be a lowercase URL-safe identifier`)
    }

    if (trainerId && trainerName) {
      const previous = trainerNames.get(trainerId)
      if (previous && previous.name !== trainerName) {
        issues.push(
          `${describePath(metadataPath, projectRoot)}: trainer "${trainerId}" is named "${trainerName}", `
          + `but ${previous.source} names the same trainer "${previous.name}"`,
        )
      } else if (!previous) {
        trainerNames.set(trainerId, {
          name: trainerName,
          source: describePath(metadataPath, projectRoot),
        })
      }
    }

    const posts: BlogPost[] = []
    const postsDirectory = path.join(blogDirectory, 'posts')
    const seenPostSlugs = new Set<string>()

    if (existsSync(postsDirectory)) {
      for (const postEntry of directoryEntries(postsDirectory)) {
        if (!postEntry.isFile() || path.extname(postEntry.name) !== '.json') continue

        const postSlug = path.basename(postEntry.name, '.json')
        const normalizedPostSlug = postSlug.toLocaleLowerCase('en-US')
        const postMetadataPath = path.join(postsDirectory, postEntry.name)

        if (!SLUG_PATTERN.test(postSlug)) {
          issues.push(`${describePath(postMetadataPath, projectRoot)}: filename must be a lowercase URL slug`)
        }
        if (seenPostSlugs.has(normalizedPostSlug)) {
          issues.push(`${describePath(postMetadataPath, projectRoot)}: duplicate post slug "${postSlug}"`)
        }
        seenPostSlugs.add(normalizedPostSlug)

        const postMetadata = readJson(postMetadataPath, projectRoot, issues)
        if (!postMetadata) continue

        const postTitle = requiredString(postMetadata, 'title', postMetadataPath, projectRoot, issues)
        const summary = requiredString(postMetadata, 'summary', postMetadataPath, projectRoot, issues)
        const publishedDate = requiredString(
          postMetadata,
          'publishedDate',
          postMetadataPath,
          projectRoot,
          issues,
        )
        const contentFile = requiredString(
          postMetadata,
          'contentFile',
          postMetadataPath,
          projectRoot,
          issues,
        )

        if (publishedDate && !isRealDate(publishedDate)) {
          issues.push(
            `${describePath(postMetadataPath, projectRoot)}: publishedDate must be a real date in YYYY-MM-DD format`,
          )
        }

        let content: string | undefined
        if (contentFile) {
          const isSiblingMarkdown = path.basename(contentFile) === contentFile
            && contentFile.toLocaleLowerCase('en-US').endsWith('.md')

          if (!isSiblingMarkdown) {
            issues.push(
              `${describePath(postMetadataPath, projectRoot)}: contentFile must name a sibling Markdown file`,
            )
          } else {
            const contentPath = path.join(postsDirectory, contentFile)
            if (!existsSync(contentPath) || !statSync(contentPath).isFile()) {
              issues.push(`${describePath(postMetadataPath, projectRoot)}: missing Markdown file "${contentFile}"`)
            } else {
              content = readFileSync(contentPath, 'utf8')
            }
          }
        }

        if (postTitle && summary && publishedDate && isRealDate(publishedDate) && content !== undefined) {
          posts.push({
            slug: postSlug,
            title: postTitle,
            summary,
            publishedDate,
            content,
          })
        }
      }
    }

    if (title && description && trainerId && trainerName) {
      posts.sort((a, b) =>
        b.publishedDate.localeCompare(a.publishedDate) || a.slug.localeCompare(b.slug),
      )
      blogs.push({
        slug,
        title,
        description,
        trainer: { id: trainerId, name: trainerName },
        posts,
      })
    }
  }

  if (issues.length > 0) {
    throw new Error(`Blog content validation failed:\n- ${issues.join('\n- ')}`)
  }

  return blogs.sort((a, b) => a.title.localeCompare(b.title) || a.slug.localeCompare(b.slug))
}
