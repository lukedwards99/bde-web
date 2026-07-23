import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { preparePagesArtifact } from './preparePagesArtifact.mjs'

test('shares media between production and development and enforces the size guard', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'bde-pages-artifact-'))
  const production = path.join(root, 'production')
  const development = path.join(root, 'development')

  try {
    mkdirSync(path.join(production, 'blog-media'), { recursive: true })
    mkdirSync(path.join(development, 'blog-media'), { recursive: true })
    writeFileSync(path.join(production, 'index.html'), 'production')
    writeFileSync(path.join(production, 'blog-media', 'production.webp'), 'production media')
    writeFileSync(path.join(development, 'index.html'), 'development')
    writeFileSync(path.join(development, 'blog-media', 'development.webp'), 'development media')

    const size = preparePagesArtifact({
      productionDirectory: production,
      developmentDirectory: development,
      limitBytes: 1_000,
    })

    assert.ok(size > 0)
    assert.equal(existsSync(path.join(production, 'blog-media', 'production.webp')), true)
    assert.equal(existsSync(path.join(production, 'blog-media', 'development.webp')), true)
    assert.equal(existsSync(path.join(production, 'dev', 'blog-media')), false)
    assert.equal(existsSync(path.join(production, 'dev', 'index.html')), true)

    assert.throws(() => preparePagesArtifact({
      productionDirectory: production,
      developmentDirectory: development,
      limitBytes: 1,
    }), /configured limit/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
