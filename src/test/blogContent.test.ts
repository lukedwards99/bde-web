// @vitest-environment node
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { loadBlogContent } from '../../build/blogContent'

const temporaryDirectories: string[] = []

const makeProject = () => {
  const root = mkdtempSync(path.join(tmpdir(), 'bde-blog-content-'))
  temporaryDirectories.push(root)
  return root
}

const addBlog = (
  root: string,
  slug: string,
  metadata: Record<string, unknown>,
  posts: Array<{
    slug: string
    metadata: Record<string, unknown>
    content?: string
  }> = [],
) => {
  const blogDirectory = path.join(root, 'blogs', slug)
  const postsDirectory = path.join(blogDirectory, 'posts')
  mkdirSync(postsDirectory, { recursive: true })
  writeFileSync(path.join(blogDirectory, 'blog.json'), JSON.stringify(metadata))

  for (const post of posts) {
    writeFileSync(path.join(postsDirectory, `${post.slug}.json`), JSON.stringify(post.metadata))
    if (post.content !== undefined && typeof post.metadata.contentFile === 'string') {
      writeFileSync(path.join(postsDirectory, post.metadata.contentFile), post.content)
    }
  }
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('loadBlogContent', () => {
  it('allows a missing or empty blogs directory', () => {
    const missingRoot = makeProject()
    expect(loadBlogContent(missingRoot)).toEqual([])

    const emptyRoot = makeProject()
    mkdirSync(path.join(emptyRoot, 'blogs'))
    expect(loadBlogContent(emptyRoot)).toEqual([])
  })

  it('loads Markdown and applies deterministic blog and post ordering', () => {
    const root = makeProject()
    addBlog(root, 'zebra-notes', {
      title: 'Zebra Notes',
      description: 'Last alphabetically.',
      trainer: { id: 'luke', name: 'Luke' },
    }, [
      {
        slug: 'older',
        metadata: {
          title: 'Older', summary: 'Older post.', publishedDate: '2026-01-01', contentFile: 'older.md',
        },
        content: 'Older body.',
      },
      {
        slug: 'newer-b',
        metadata: {
          title: 'Newer B', summary: 'New post.', publishedDate: '2026-02-01', contentFile: 'newer-b.md',
        },
        content: 'Newer body B.',
      },
      {
        slug: 'newer-a',
        metadata: {
          title: 'Newer A', summary: 'New post.', publishedDate: '2026-02-01', contentFile: 'newer-a.md',
        },
        content: 'Newer body A.',
      },
    ])
    addBlog(root, 'alpha-notes', {
      title: 'Alpha Notes',
      description: 'First alphabetically.',
      trainer: { id: 'luke', name: 'Luke' },
    })

    const blogs = loadBlogContent(root)

    expect(blogs.map((blog) => blog.title)).toEqual(['Alpha Notes', 'Zebra Notes'])
    expect(blogs[1].posts.map((post) => post.slug)).toEqual(['newer-a', 'newer-b', 'older'])
    expect(blogs[1].posts[0].content).toBe('Newer body A.')
  })

  it('reports malformed metadata, invalid dates, missing Markdown, and trainer conflicts together', () => {
    const root = makeProject()
    addBlog(root, 'first-blog', {
      title: 'First Blog',
      description: 'First.',
      trainer: { id: 'luke', name: 'Luke' },
    }, [{
      slug: 'bad-date',
      metadata: {
        title: 'Bad date', summary: 'Invalid.', publishedDate: '2026-02-30', contentFile: 'missing.md',
      },
    }])
    addBlog(root, 'second-blog', {
      title: 'Second Blog',
      description: 'Second.',
      trainer: { id: 'luke', name: 'Lucas' },
    })
    const brokenDirectory = path.join(root, 'blogs', 'broken-blog')
    mkdirSync(brokenDirectory, { recursive: true })
    writeFileSync(path.join(brokenDirectory, 'blog.json'), '{not json')

    expect(() => loadBlogContent(root)).toThrowError(/Blog content validation failed/)

    try {
      loadBlogContent(root)
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      expect(message).toContain('malformed JSON')
      expect(message).toContain('publishedDate must be a real date')
      expect(message).toContain('missing Markdown file "missing.md"')
      expect(message).toContain('names the same trainer "Luke"')
    }
  })

  it('rejects unsafe content references and non-URL-safe slugs', () => {
    const root = makeProject()
    addBlog(root, 'safe-blog', {
      title: 'Safe Blog',
      description: 'Safe.',
      trainer: { id: 'Trainer One', name: 'Trainer' },
    }, [{
      slug: 'Unsafe Post',
      metadata: {
        title: 'Unsafe', summary: 'Unsafe.', publishedDate: '2026-01-01', contentFile: '../outside.md',
      },
    }])

    expect(() => loadBlogContent(root)).toThrowError(/contentFile must name a sibling Markdown file/)
    expect(() => loadBlogContent(root)).toThrowError(/filename must be a lowercase URL slug/)
    expect(() => loadBlogContent(root)).toThrowError(/trainer.id must be a lowercase URL-safe identifier/)
  })

  it('loads validated media and rejects unsafe or missing public assets', () => {
    const root = makeProject()
    const assetDirectory = path.join(root, 'public', 'blog-media', 'safe-blog', 'post-one')
    mkdirSync(assetDirectory, { recursive: true })
    writeFileSync(path.join(assetDirectory, '0123456789abcdef.webp'), 'image')

    addBlog(root, 'safe-blog', {
      title: 'Safe Blog',
      description: 'Safe.',
      trainer: { id: 'luke', name: 'Luke' },
    }, [{
      slug: 'post-one',
      metadata: {
        title: 'Post one',
        summary: 'Post with media.',
        publishedDate: '2026-01-01',
        contentFile: 'post-one.md',
        media: [{
          type: 'image',
          path: 'blog-media/safe-blog/post-one/0123456789abcdef.webp',
          alt: 'Training photo',
        }],
      },
      content: 'Body.',
    }])

    expect(loadBlogContent(root)[0].posts[0].media).toEqual([{
      type: 'image',
      path: 'blog-media/safe-blog/post-one/0123456789abcdef.webp',
      alt: 'Training photo',
    }])

    const metadataPath = path.join(root, 'blogs', 'safe-blog', 'posts', 'post-one.json')
    const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'))
    metadata.media[0].path = '../unsafe.webp'
    writeFileSync(metadataPath, JSON.stringify(metadata))
    expect(() => loadBlogContent(root)).toThrowError(/safe content-hashed blog-media path/)

    metadata.media[0].path = 'blog-media/safe-blog/post-one/fedcba9876543210.webp'
    writeFileSync(metadataPath, JSON.stringify(metadata))
    expect(() => loadBlogContent(root)).toThrowError(/references missing public asset/)
  })
})
