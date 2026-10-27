/**
 * A page-number field: whole numbers from 0 to the book's page count. Empty is never read as 0
 * (that used to wipe reading progress); it's an error when the field is required, and "no value" otherwise.
 */
export type PageInput = { page: number | null; valid: boolean; message: string }

export function parsePageInput(raw: string, pages: number, { required }: { required: boolean }): PageInput {
  const message = `Enter a page between 0 and ${pages}.`
  const text = raw.trim()
  if (text === '') return { page: null, valid: !required, message }
  const n = Number(text)
  const valid = Number.isInteger(n) && n >= 0 && n <= pages
  return { page: valid ? n : null, valid, message }
}
