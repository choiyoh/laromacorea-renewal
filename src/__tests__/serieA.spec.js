import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  pickRecentResults,
  extractMatches,
  extractStandingRows,
  normalizeStandingRow,
  isRomaName,
  currentSeasonStart,
  ROMA_TEAM_ID,
} = require('../../functions/src/serieA.js')

describe('Serie A cache helpers', () => {
  it('identifies Roma by name', () => {
    expect(isRomaName('AS Roma')).toBe(true)
    expect(isRomaName('Roma')).toBe(true)
    expect(isRomaName('Atalanta')).toBe(false)
  })

  it('unwraps team matches from several envelope shapes', () => {
    const match = { id: '1', status: 'finished' }
    expect(extractMatches({ data: [match] })).toEqual([match])
    expect(extractMatches({ data: { historical: { value: [match] } } })).toEqual(
      [match],
    )
    expect(extractMatches({ data: { matches: [match] } })).toEqual([match])
  })

  it('keeps only finished current-season matches, newest first, max 5', () => {
    const now = new Date('2026-09-21T12:00:00.000Z')
    const seasonStart = currentSeasonStart(now)
    expect(seasonStart.toISOString()).toBe('2026-08-01T00:00:00.000Z')

    const matches = [
      finished('old', '2026-07-20T18:00:00.000Z', 1, 0),
      finished('m1', '2026-08-10T18:00:00.000Z', 1, 0),
      finished('m2', '2026-08-17T18:00:00.000Z', 2, 1),
      { id: 'live', status: 'live', kickoff_utc: '2026-09-20T18:00:00.000Z', home: roma(), away: other(), score: { home: 1, away: 0 } },
      finished('m3', '2026-08-24T18:00:00.000Z', 0, 0),
      finished('m4', '2026-08-31T18:00:00.000Z', 3, 1),
      finished('m5', '2026-09-14T18:00:00.000Z', 2, 2),
      finished('m6', '2026-09-19T18:00:00.000Z', 4, 0),
      { id: 'future', status: 'scheduled', kickoff_utc: '2026-09-28T18:00:00.000Z', home: roma(), away: other(), score: null },
    ]

    const recent = pickRecentResults(matches, now)
    expect(recent.map((row) => row.id)).toEqual(['m6', 'm5', 'm4', 'm3', 'm2'])
    expect(recent[0].result).toBe('W')
    expect(recent[1].result).toBe('D')
  })

  it('returns every finished season match when fewer than 5 exist', () => {
    const now = new Date('2026-08-20T12:00:00.000Z')
    const matches = [
      finished('m1', '2026-08-10T18:00:00.000Z', 1, 0),
      finished('m2', '2026-08-17T18:00:00.000Z', 0, 2),
    ]
    const recent = pickRecentResults(matches, now)
    expect(recent.map((row) => row.id)).toEqual(['m2', 'm1'])
    expect(recent[0].result).toBe('L')
  })

  it('normalizes standings and flags Roma', () => {
    const { rows } = extractStandingRows({
      data: {
        standings: [
          {
            season: '2026-27',
            rows: [
              {
                rank: 1,
                team_id: ROMA_TEAM_ID,
                team_name: 'AS Roma',
                games_played: 5,
                wins: 4,
                draws: 1,
                losses: 0,
                goals_for: 14,
                goals_against: 3,
                points: 13,
              },
            ],
          },
        ],
      },
    })

    const [roma] = rows.map(normalizeStandingRow)
    expect(roma.isRoma).toBe(true)
    expect(roma.played).toBe(5)
    expect(roma.gd).toBe(11)
    expect(roma.pts).toBe(13)
    expect(roma.shortName).toBe('Roma')
  })
})

function roma() {
  return { id: ROMA_TEAM_ID, name: 'AS Roma', short_name: 'Roma' }
}

function other() {
  return { id: 'other', name: 'Como 1907', short_name: 'Como' }
}

function finished(id, kickoff, homeScore, awayScore) {
  return {
    id,
    status: 'finished',
    kickoff_utc: kickoff,
    league: 'Serie A',
    home: roma(),
    away: other(),
    score: { home: homeScore, away: awayScore },
  }
}
