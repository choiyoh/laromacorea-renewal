import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Firebase
vi.mock('@/services/firebase', () => ({
  db: {},
}))

// Mock Firestore functions
vi.mock('firebase/firestore', () => {
  const mockWriteBatch = vi.fn()
  const mockUpdate = vi.fn()
  const mockSet = vi.fn()
  const mockCommit = vi.fn()
  const mockGetDoc = vi.fn()
  const mockGetDocs = vi.fn()

  return {
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: mockGetDoc,
    getDocs: mockGetDocs,
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    writeBatch: vi.fn(() => ({
      update: mockUpdate,
      set: mockSet,
      commit: mockCommit,
    })),
    increment: vi.fn((value) => ({ _increment: value })),
    serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
  }
})

import { pointsService, POINT_RULES, POINT_REASONS } from '@/services/points'

// Get mocked functions for testing
const {
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  writeBatch,
} = await vi.importMock('firebase/firestore')
const mockUpdate = vi.fn()
const mockSet = vi.fn()
const mockCommit = vi.fn()

// Setup writeBatch mock to return our mock functions
writeBatch.mockReturnValue({
  update: mockUpdate,
  set: mockSet,
  commit: mockCommit,
})

describe('Points Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCommit.mockResolvedValue()
  })

  describe('awardPoints', () => {
    it('should award points to user successfully', async () => {
      const userId = 'test-user-id'
      const points = 10
      const reason = POINT_REASONS.POST_CREATED

      await pointsService.awardPoints(userId, points, reason)

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          points: { _increment: points },
          lastPointsUpdate: { _serverTimestamp: true },
        }),
      )

      expect(mockSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId,
          type: 'earned',
          amount: points,
          reason,
          relatedId: null,
          adminId: null,
          createdAt: { _serverTimestamp: true },
        }),
      )

      expect(mockCommit).toHaveBeenCalled()
    })

    it('should throw error for negative points', async () => {
      await expect(pointsService.awardPoints('user-id', -5, 'test')).rejects.toThrow(
        '포인트는 양수여야 합니다.',
      )
    })

    it('should throw error for zero points', async () => {
      await expect(pointsService.awardPoints('user-id', 0, 'test')).rejects.toThrow(
        '포인트는 양수여야 합니다.',
      )
    })
  })

  describe('deductPoints', () => {
    it('should deduct points from user successfully', async () => {
      const userId = 'test-user-id'
      const points = 5
      const reason = POINT_REASONS.ICON_PURCHASE

      // Mock user document with sufficient points
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ points: 100 }),
      })

      await pointsService.deductPoints(userId, points, reason)

      expect(mockGetDoc).toHaveBeenCalled()
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          points: { _increment: -points },
          lastPointsUpdate: { _serverTimestamp: true },
        }),
      )

      expect(mockSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId,
          type: 'spent',
          amount: -points,
          reason,
          relatedId: null,
          adminId: null,
          createdAt: { _serverTimestamp: true },
        }),
      )

      expect(mockCommit).toHaveBeenCalled()
    })

    it('should throw error when user has insufficient points', async () => {
      const userId = 'test-user-id'
      const points = 100

      // Mock user document with insufficient points
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ points: 50 }),
      })

      await expect(pointsService.deductPoints(userId, points, 'test')).rejects.toThrow(
        '포인트가 부족합니다.',
      )
    })

    it('should throw error when user does not exist', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      })

      await expect(pointsService.deductPoints('non-existent-user', 10, 'test')).rejects.toThrow(
        '사용자를 찾을 수 없습니다.',
      )
    })
  })

  describe('adminAdjustPoints', () => {
    it('should adjust points positively (bonus)', async () => {
      const userId = 'test-user-id'
      const points = 50
      const adminId = 'admin-id'
      const note = 'Special bonus'

      await pointsService.adminAdjustPoints(userId, points, adminId, note)

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          points: { _increment: points },
          lastPointsUpdate: { _serverTimestamp: true },
        }),
      )

      expect(mockSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId,
          type: 'admin_adjustment',
          amount: points,
          reason: POINT_REASONS.ADMIN_BONUS,
          note,
          adminId,
          createdAt: { _serverTimestamp: true },
        }),
      )
    })

    it('should adjust points negatively (penalty)', async () => {
      const userId = 'test-user-id'
      const points = -30
      const adminId = 'admin-id'
      const note = 'Rule violation'

      // Mock user document with sufficient points
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ points: 100 }),
      })

      await pointsService.adminAdjustPoints(userId, points, adminId, note)

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          points: { _increment: points },
          lastPointsUpdate: { _serverTimestamp: true },
        }),
      )

      expect(mockSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId,
          type: 'admin_adjustment',
          amount: points,
          reason: POINT_REASONS.ADMIN_PENALTY,
          note,
          adminId,
          createdAt: { _serverTimestamp: true },
        }),
      )
    })

    it('should throw error for zero adjustment', async () => {
      await expect(
        pointsService.adminAdjustPoints('user-id', 0, 'admin-id', 'test'),
      ).rejects.toThrow('조정할 포인트가 0입니다.')
    })
  })

  describe('autoAwardPoints', () => {
    it('should award points based on action type', async () => {
      const userId = 'test-user-id'
      const action = 'POST_CREATED'
      const relatedId = 'post-id'

      const result = await pointsService.autoAwardPoints(userId, action, relatedId)

      expect(result).toBe(true)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          points: { _increment: POINT_RULES.POST_CREATED },
        }),
      )
    })

    it('should return false for invalid action', async () => {
      const result = await pointsService.autoAwardPoints('user-id', 'INVALID_ACTION')
      expect(result).toBe(false)
    })

    it('should return false for action with zero points', async () => {
      const result = await pointsService.autoAwardPoints('user-id', 'ADMIN_BONUS')
      expect(result).toBe(false)
    })
  })

  describe('getPointsHistory', () => {
    it('should return formatted points history', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          data: () => ({
            userId: 'test-user',
            type: 'earned',
            amount: 10,
            reason: 'post_created',
            createdAt: { toDate: () => new Date('2024-01-01') },
          }),
        },
      ]

      mockGetDocs.mockResolvedValue({
        docs: mockHistory,
      })

      const result = await pointsService.getPointsHistory('test-user')

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'history-1',
        userId: 'test-user',
        type: 'earned',
        amount: 10,
        reason: 'post_created',
        createdAt: expect.any(Date),
      })
    })
  })

  describe('POINT_RULES', () => {
    it('should have correct point values', () => {
      expect(POINT_RULES.POST_CREATED).toBe(10)
      expect(POINT_RULES.COMMENT_CREATED).toBe(5)
      expect(POINT_RULES.POST_LIKED).toBe(1)
      expect(POINT_RULES.COMMENT_LIKED).toBe(1)
      expect(POINT_RULES.DAILY_LOGIN).toBe(2)
    })
  })

  describe('POINT_REASONS', () => {
    it('should have correct reason strings', () => {
      expect(POINT_REASONS.POST_CREATED).toBe('post_created')
      expect(POINT_REASONS.COMMENT_CREATED).toBe('comment_created')
      expect(POINT_REASONS.ICON_PURCHASE).toBe('icon_purchase')
      expect(POINT_REASONS.ADMIN_BONUS).toBe('admin_bonus')
      expect(POINT_REASONS.ADMIN_PENALTY).toBe('admin_penalty')
    })
  })
})
