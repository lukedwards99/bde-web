import assert from 'node:assert/strict'
import test from 'node:test'
import {
  chicagoDate,
  collectMedia,
  escapeInstagramCaption,
  matchInstagramPosts,
  repairInstagramEncoding,
  summarizeCaption,
} from './importInstagramJourney.mjs'

const makeRecords = () => Array.from({ length: 214 }, (_, index) => ({
  timestamp: 1_700_000_000 + index * 10,
  label_values: [{
    media: [{
      uri: `media/posts/${index}.jpg`,
      creation_timestamp: 1_700_000_000 + index * 10,
      title: `Caption ${index}`,
    }],
  }],
}))

test('matches all 214 caption and gallery records within the export timestamp tolerance', () => {
  const captions = makeRecords()
  const galleries = makeRecords().reverse().map((record) => ({
    media: collectMedia(record).map((item) => ({
      ...item,
      creation_timestamp: item.creation_timestamp - 4,
    })),
  }))

  const matches = matchInstagramPosts(captions, galleries)
  assert.equal(matches.length, 214)
  assert.equal(collectMedia(matches[0].gallery)[0].uri, 'media/posts/0.jpg')
  assert.equal(collectMedia(matches[213].gallery)[0].uri, 'media/posts/213.jpg')
})

test('rejects incomplete exports', () => {
  assert.throws(() => matchInstagramPosts(makeRecords().slice(1), makeRecords()), /Expected 214/)
})

test('repairs encoded punctuation and preserves plain Instagram caption formatting', () => {
  assert.equal(repairInstagramEncoding('âProgressâ â itâs working'), '“Progress” — it’s working')
  assert.equal(
    escapeInstagramCaption('# Heading-like text\n\n1. Not a Markdown list'),
    '\\# Heading-like text\n\n1\\. Not a Markdown list',
  )
})

test('creates Chicago dates and concise summaries', () => {
  assert.equal(chicagoDate(1_684_807_200), '2023-05-22')
  assert.match(summarizeCaption('word '.repeat(100)), /…$/)
})
