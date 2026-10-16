import type { Pace } from './book'

export type ReadingChallenge = {
  year: number
  goal: number
  read: number
}

export type CurrentlyReading = {
  bookId: string
  currentPage: number
}

export type User = {
  id: string
  name: string
  challenge: ReadingChallenge
  currentlyReading: CurrentlyReading[]
  /** Onboarding picks: drive "For you" recommendations */
  favoriteGenres: string[]
  favoriteMoods: string[]
  preferredPace: Pace
}
