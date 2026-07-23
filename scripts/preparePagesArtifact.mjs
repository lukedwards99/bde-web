#!/usr/bin/env node

import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  rmSync,
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_LIMIT_BYTES = 900 * 1024 * 1024

export const directorySize = (directory) => {
  if (!existsSync(directory)) return 0
  return readdirSync(directory, { withFileTypes: true }).reduce((total, entry) => {
    const entryPath = path.join(directory, entry.name)
    return total + (entry.isDirectory() ? directorySize(entryPath) : lstatSync(entryPath).size)
  }, 0)
}

export const preparePagesArtifact = ({
  productionDirectory,
  developmentDirectory,
  limitBytes = DEFAULT_LIMIT_BYTES,
}) => {
  if (!existsSync(productionDirectory) || !existsSync(developmentDirectory)) {
    throw new Error('Both production and development build directories must exist.')
  }

  const productionMedia = path.join(productionDirectory, 'blog-media')
  const developmentMedia = path.join(developmentDirectory, 'blog-media')
  if (existsSync(developmentMedia)) {
    mkdirSync(productionMedia, { recursive: true })
    cpSync(developmentMedia, productionMedia, { recursive: true, force: true })
    rmSync(developmentMedia, { recursive: true, force: true })
  }

  const nestedDevelopment = path.join(productionDirectory, 'dev')
  rmSync(nestedDevelopment, { recursive: true, force: true })
  cpSync(developmentDirectory, nestedDevelopment, { recursive: true })

  const sizeBytes = directorySize(productionDirectory)
  if (sizeBytes >= limitBytes) {
    throw new Error(
      `GitHub Pages artifact is ${(sizeBytes / 1024 / 1024).toFixed(1)} MB; `
      + `the configured limit is ${(limitBytes / 1024 / 1024).toFixed(0)} MB.`,
    )
  }

  return sizeBytes
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  const productionDirectory = path.resolve(process.argv[2] ?? '')
  const developmentDirectory = path.resolve(process.argv[3] ?? '')
  const sizeBytes = preparePagesArtifact({ productionDirectory, developmentDirectory })
  console.log(`Pages artifact prepared: ${(sizeBytes / 1024 / 1024).toFixed(1)} MB`)
}
