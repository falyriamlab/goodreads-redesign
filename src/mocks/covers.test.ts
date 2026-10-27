import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { coverSrcSets, largeCoverUrl } from '@/lib/covers'
import { books } from './books'

// Covers are self-hosted: Open Library's redirect chain left them gray for seconds on a first visit
describe('covers', () => {
  it('every cover is a same-origin file in public/covers, in M and L', () => {
    const withCover = books.filter((b) => b.coverUrl !== null)
    expect(withCover.length).toBeGreaterThan(0)
    for (const b of withCover) {
      expect(b.coverUrl).toMatch(/^\/covers\/\d{13}\.jpg$/)
      expect(fs.existsSync(path.join(process.cwd(), 'public', b.coverUrl!)), b.coverUrl!).toBe(true)
      const large = largeCoverUrl(b.coverUrl!)
      expect(large).toMatch(/^\/covers\/l\/\d{13}\.jpg$/)
      expect(fs.existsSync(path.join(process.cwd(), 'public', large)), large).toBe(true)
    }
  })

  it('every cover has its WebP sizes (180, 240, 333) for the srcset', () => {
    for (const b of books.filter((x) => x.coverUrl !== null)) {
      const { webp } = coverSrcSets(b.coverUrl!)!
      for (const entry of webp.split(', ')) {
        const file = entry.split(' ')[0]
        expect(fs.existsSync(path.join(process.cwd(), 'public', file)), file).toBe(true)
      }
    }
  })
})
