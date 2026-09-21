import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import MatchInfo from '@/components/board/MatchInfo.vue'

// Mock user store
const mockUserStore = {
  isAuthenticated: true,
  user: {
    uid: 'test-user-id',
    displayName: 'Test User',
    email: 'test@example.com',
    selectedIcon: null,
    role: 'user',
  },
}

// Mock services
vi.mock('@/stores/user', () => ({
  useUserStore: () => mockUserStore,
}))

vi.mock('@/services/firebase', () => ({
  db: {},
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
}))

vi.mock('@/services/database', () => ({
  commentService: {
    getComments: vi.fn().mockResolvedValue([]),
    createComment: vi.fn().mockResolvedValue('comment-id'),
    toggleCommentLike: vi.fn().mockResolvedValue(true),
    deleteComment: vi.fn().mockResolvedValue(),
  },
}))

describe('Match Components', () => {
  let wrapper

  const sampleMatchData = {
    id: 'match-1',
    date: new Date(),
    competition: 'Serie A',
    round: '15라운드',
    status: 'scheduled',
    homeTeam: {
      name: 'AS Roma',
      logo: '/images/teams/roma.png',
    },
    awayTeam: {
      name: 'Juventus',
      logo: '/images/teams/juventus.png',
    },
    score: {
      home: 0,
      away: 0,
    },
    venue: 'Stadio Olimpico',
    referee: 'Daniele Orsato',
    weather: '맑음, 18°C',
    scorers: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('MatchInfo Component', () => {
    beforeEach(() => {
      wrapper = shallowMount(MatchInfo, {
        props: {
          matchData: sampleMatchData,
        },
      })
    })

    it('renders match information correctly', () => {
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.vm.matchData.homeTeam.name).toBe('AS Roma')
      expect(wrapper.vm.matchData.awayTeam.name).toBe('Juventus')
      expect(wrapper.vm.matchData.competition).toBe('Serie A')
    })

    it('formats match status correctly', () => {
      expect(wrapper.vm.getMatchStatusText('scheduled')).toBe('예정')
      expect(wrapper.vm.getMatchStatusText('live')).toBe('경기중')
      expect(wrapper.vm.getMatchStatusText('finished')).toBe('경기종료')
      expect(wrapper.vm.getMatchStatusText('postponed')).toBe('연기')
    })

    it('returns correct status colors', () => {
      expect(wrapper.vm.getMatchStatusColor('live')).toBe('error')
      expect(wrapper.vm.getMatchStatusColor('finished')).toBe('success')
      expect(wrapper.vm.getMatchStatusColor('postponed')).toBe('warning')
      expect(wrapper.vm.getMatchStatusColor('scheduled')).toBe('primary')
    })

    it('formats match date correctly', () => {
      const testDate = new Date('2024-12-25T15:00:00')
      const formatted = wrapper.vm.formatMatchDate(testDate)
      expect(formatted).toContain('12월')
      expect(formatted).toContain('25일')
    })

    it('formats match time correctly', () => {
      const testDate = new Date('2024-12-25T15:30:00')
      const formatted = wrapper.vm.formatMatchTime(testDate)
      // Korean locale formats as "오후 03:30" or "15:30" depending on system
      expect(formatted).toMatch(/15:30|03:30/)
    })
  })

  describe('Match Service Functions', () => {
    it('reads cached recent results from Firestore', async () => {
      const { getDoc } = await import('firebase/firestore')
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          recentResults: [
            {
              id: 'm1',
              homeTeam: { name: 'AS Roma' },
              awayTeam: { name: 'Como 1907' },
              competition: { name: 'Serie A' },
            },
          ],
          standings: [],
        }),
      })

      const { matchService } = await import('@/services/match')
      const sampleData = await matchService.getRecentResults(true)

      expect(Array.isArray(sampleData)).toBe(true)
      expect(sampleData.length).toBeGreaterThan(0)
      expect(sampleData[0]).toHaveProperty('homeTeam')
      expect(sampleData[0]).toHaveProperty('awayTeam')
      expect(sampleData[0]).toHaveProperty('competition')
    })
  })
})
