import { describe, expect, it } from 'vitest'
import { parsePageInput } from './pageInput'

describe('parsePageInput', () => {
  it('accepts whole pages from 0 to the page count', () => {
    for (const [raw, page] of [['0', 0], ['312', 312], ['518', 518], [' 42 ', 42]] as const) {
      expect(parsePageInput(raw, 518, { required: true })).toMatchObject({ page, valid: true })
    }
  })

  it('rejects out of range, decimals and text, with the message', () => {
    for (const raw of ['-5', '519', '9999', '312.5', 'abc', '1e3']) {
      expect(parsePageInput(raw, 518, { required: true })).toEqual({ page: null, valid: false, message: 'Enter a page between 0 and 518.' })
    }
  })

  it('never reads an empty field as page 0', () => {
    expect(parsePageInput('', 518, { required: true })).toMatchObject({ page: null, valid: false })
    expect(parsePageInput('   ', 518, { required: true })).toMatchObject({ page: null, valid: false })
    // Optional fields (DNF "Stopped at page"): empty is fine, and still not 0
    expect(parsePageInput('', 518, { required: false })).toMatchObject({ page: null, valid: true })
  })
})
