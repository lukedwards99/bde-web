#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const JOURNEY_SLUG = 'lukes-journey'
const EXPECTED_POSTS = 214
const MAX_TIMESTAMP_DIFFERENCE_SECONDS = 5

const readJson = (filePath) => JSON.parse(readFileSync(filePath, 'utf8'))

export const collectMedia = (record) => {
  const media = [...(record.media ?? [])]
  for (const label of record.label_values ?? []) {
    if (Array.isArray(label.media)) media.push(...label.media)
  }
  return media
}

const recordTimestamp = (record) =>
  record.timestamp ?? collectMedia(record)[0]?.creation_timestamp

export const repairInstagramEncoding = (value) =>
  value.replace(/[\u00c2-\u00f4][\u0080-\u00bf]+/g, (sequence) => {
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(
        Uint8Array.from(sequence, (character) => character.charCodeAt(0)),
      )
    } catch {
      return sequence
    }
  })

export const escapeInstagramCaption = (value) => value
  .replace(/\r\n?/g, '\n')
  .replace(/\\/g, '\\\\')
  .replace(/([`*_[\]<>])/g, '\\$1')
  .split('\n')
  .map((line) => line
    .replace(/^(\s*)(#{1,6}|>|[-+])(\s)/, '$1\\$2$3')
    .replace(/^(\s*)(\d+)\.(\s)/, '$1$2\\.$3')
    .trimEnd())
  .join('\n')
  .trim()

export const summarizeCaption = (value, maximumLength = 180) => {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maximumLength) return normalized

  const shortened = normalized.slice(0, maximumLength - 1)
  const lastSpace = shortened.lastIndexOf(' ')
  return `${shortened.slice(0, Math.max(lastSpace, maximumLength - 30)).trimEnd()}…`
}

export const chicagoDate = (timestamp) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(timestamp * 1000))
  const part = (type) => parts.find((item) => item.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export const matchInstagramPosts = (captionRecords, galleryRecords) => {
  if (captionRecords.length !== EXPECTED_POSTS || galleryRecords.length !== EXPECTED_POSTS) {
    throw new Error(
      `Expected ${EXPECTED_POSTS} caption and gallery records, received `
      + `${captionRecords.length} captions and ${galleryRecords.length} galleries.`,
    )
  }

  const availableGalleries = new Set(galleryRecords.map((_, index) => index))
  const matches = captionRecords.map((caption, captionIndex) => {
    const timestamp = recordTimestamp(caption)
    if (!Number.isFinite(timestamp)) {
      throw new Error(`Caption record ${captionIndex} has no valid timestamp.`)
    }

    const candidates = [...availableGalleries]
      .map((galleryIndex) => ({
        galleryIndex,
        difference: Math.abs(recordTimestamp(galleryRecords[galleryIndex]) - timestamp),
      }))
      .sort((a, b) => a.difference - b.difference || a.galleryIndex - b.galleryIndex)

    const best = candidates[0]
    if (!best || best.difference > MAX_TIMESTAMP_DIFFERENCE_SECONDS) {
      throw new Error(`No gallery matched caption record ${captionIndex} within five seconds.`)
    }
    if (candidates[1]?.difference === best.difference) {
      throw new Error(`Caption record ${captionIndex} has an ambiguous gallery match.`)
    }

    availableGalleries.delete(best.galleryIndex)
    return {
      caption,
      gallery: galleryRecords[best.galleryIndex],
      timestamp,
      sourceIndex: captionIndex,
    }
  })

  if (availableGalleries.size !== 0) {
    throw new Error(`${availableGalleries.size} gallery records were not matched.`)
  }

  return matches.sort(
    (a, b) => a.timestamp - b.timestamp || a.sourceIndex - b.sourceIndex,
  )
}

const hashFile = (filePath) =>
  createHash('sha256').update(readFileSync(filePath)).digest('hex')

const writeJson = (filePath, value) =>
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)

const findExportDirectory = (projectRoot, requestedDirectory) => {
  if (requestedDirectory) return path.resolve(projectRoot, requestedDirectory)

  const candidates = readdirSync(projectRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('instagram-'))
    .map((entry) => path.join(projectRoot, entry.name))

  if (candidates.length !== 1) {
    throw new Error('Pass the Instagram export directory when exactly one cannot be discovered.')
  }
  return candidates[0]
}

const assertTool = (command) => {
  const result = spawnSync(command, ['-version'], { encoding: 'utf8' })
  if (result.error || result.status !== 0) {
    throw new Error(`${command} is required to import Instagram photos.`)
  }
}

const optimizeImage = (sourcePath, outputPath) => {
  const result = spawnSync(
    'cwebp',
    ['-quiet', '-metadata', 'none', '-q', '70', '-resize', '1280', '0', sourcePath, '-o', outputPath],
    { encoding: 'utf8' },
  )
  if (result.status !== 0) {
    throw new Error(`cwebp failed for ${sourcePath}: ${result.stderr.trim()}`)
  }
}

export const importInstagramJourney = ({
  projectRoot,
  exportDirectory,
  log = console.log,
}) => {
  assertTool('cwebp')

  const activityDirectory = path.join(
    exportDirectory,
    'your_instagram_activity',
    'media',
  )
  const captions = readJson(path.join(activityDirectory, 'posts.json'))
  const galleries = readJson(path.join(activityDirectory, 'posts_1.json'))
  const matches = matchInstagramPosts(captions, galleries)

  const blogDirectory = path.join(projectRoot, 'blogs', JOURNEY_SLUG)
  const postsDirectory = path.join(blogDirectory, 'posts')
  const mediaDirectory = path.join(projectRoot, 'public', 'blog-media', JOURNEY_SLUG)

  rmSync(blogDirectory, { recursive: true, force: true })
  rmSync(mediaDirectory, { recursive: true, force: true })
  mkdirSync(postsDirectory, { recursive: true })
  mkdirSync(mediaDirectory, { recursive: true })

  writeJson(path.join(blogDirectory, 'blog.json'), {
    title: "Luke's Journey",
    description: "A chronological archive of Luke's training, bodybuilding, and personal growth.",
    trainer: {
      id: 'luke',
      name: 'Luke',
    },
  })

  let generatedImageCount = 0
  let generatedVideoCount = 0
  let imageCount = 0
  let videoCount = 0
  const emittedHashes = new Set()

  matches.forEach((match, index) => {
    const number = index + 1
    const slug = `journey-${String(number).padStart(3, '0')}`
    const title = `Luke's Journey #${number}`
    const postMediaDirectory = path.join(mediaDirectory, slug)
    mkdirSync(postMediaDirectory, { recursive: true })

    const sourceMedia = collectMedia(match.gallery)
    if (sourceMedia.length === 0) throw new Error(`${slug} contains no media.`)

    const media = sourceMedia.map((item, mediaIndex) => {
      const sourcePath = path.resolve(exportDirectory, item.uri)
      if (!sourcePath.startsWith(`${exportDirectory}${path.sep}`) || !existsSync(sourcePath)) {
        throw new Error(`${slug} references missing or unsafe media: ${item.uri}`)
      }

      const sourceExtension = path.extname(sourcePath).toLowerCase()
      const type = sourceExtension === '.mp4' ? 'video' : 'image'
      if (type === 'image' && !['.jpg', '.jpeg'].includes(sourceExtension)) {
        throw new Error(`${slug} references unsupported media: ${item.uri}`)
      }

      const hash = hashFile(sourcePath).slice(0, 16)
      const outputExtension = type === 'image' ? '.webp' : '.mp4'
      const outputName = `${hash}${outputExtension}`
      const outputPath = path.join(postMediaDirectory, outputName)

      if (type === 'image') imageCount += 1
      else videoCount += 1

      if (!existsSync(outputPath)) {
        if (type === 'image') {
          optimizeImage(sourcePath, outputPath)
          generatedImageCount += 1
        } else {
          copyFileSync(sourcePath, outputPath)
          generatedVideoCount += 1
        }
      }

      emittedHashes.add(`${hash}${outputExtension}`)
      return {
        type,
        path: `blog-media/${JOURNEY_SLUG}/${slug}/${outputName}`,
        alt: `${type === 'image' ? 'Photo' : 'Video'} ${mediaIndex + 1} of ${sourceMedia.length} from ${title}`,
      }
    })

    const captionMedia = collectMedia(match.caption)
    const rawCaption = captionMedia.find((item) => typeof item.title === 'string')?.title
    if (!rawCaption?.trim()) throw new Error(`${slug} contains no caption.`)

    const repairedCaption = repairInstagramEncoding(rawCaption).trim()
    writeJson(path.join(postsDirectory, `${slug}.json`), {
      title,
      summary: summarizeCaption(repairedCaption),
      publishedDate: chicagoDate(match.timestamp),
      contentFile: `${slug}.md`,
      media,
    })
    writeFileSync(
      path.join(postsDirectory, `${slug}.md`),
      `${escapeInstagramCaption(repairedCaption)}\n`,
    )

    log(`Imported ${slug} (${sourceMedia.length} media items)`)
  })

  const mediaCount = imageCount + videoCount
  if (mediaCount !== 1831 || imageCount !== 1820 || videoCount !== 11) {
    throw new Error(
      `Expected 1,820 image and 11 video references; found ${imageCount} images and ${videoCount} videos.`,
    )
  }
  if (
    generatedImageCount + generatedVideoCount !== 1830
    || emittedHashes.size !== 1830
  ) {
    throw new Error('Expected exactly one duplicate carousel item in the Instagram export.')
  }

  return {
    posts: matches.length,
    images: imageCount,
    videos: videoCount,
    assets: emittedHashes.size,
  }
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  const projectRoot = process.cwd()
  const exportDirectory = findExportDirectory(projectRoot, process.argv[2])
  const result = importInstagramJourney({ projectRoot, exportDirectory })
  console.log(
    `Imported ${result.posts} posts with ${result.images} image references, `
    + `${result.videos} video references, and ${result.assets} unique assets.`,
  )
}
