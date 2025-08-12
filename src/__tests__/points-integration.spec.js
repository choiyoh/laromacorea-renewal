import { describe, it, expect } from 'vitest'
import { POINT_RULES, POINT_REASONS } from '@/services/points'

describe('Points System Integration', () => {
  describe('Point Rules', () => {
    it('should have correct point values for different actions', () => {
      expect(POINT_RULES.POST_CREATED).toBe(10)
      expect(POINT_RULES.COMMENT_CREATED).toBe(5)
      expect(POINT_RULES.POST_LIKED).toBe(1)
      expect(POINT_RULES.COMMENT_LIKED).toBe(1)
      expect(POINT_RULES.DAILY_LOGIN).toBe(2)
      expect(POINT_RULES.ADMIN_BONUS).toBe(0)
    })
  })

  describe('Point Reasons', () => {
    it('should have correct reason strings', () => {
      expect(POINT_REASONS.POST_CREATED).toBe('post_created')
      expect(POINT_REASONS.COMMENT_CREATED).toBe('comment_created')
      expect(POINT_REASONS.POST_LIKED).toBe('post_liked')
      expect(POINT_REASONS.COMMENT_LIKED).toBe('comment_liked')
      expect(POINT_REASONS.ICON_PURCHASE).toBe('icon_purchase')
      expect(POINT_REASONS.DAILY_LOGIN).toBe('daily_login')
      expect(POINT_REASONS.ADMIN_BONUS).toBe('admin_bonus')
      expect(POINT_REASONS.ADMIN_PENALTY).toBe('admin_penalty')
      expect(POINT_REASONS.ADMIN_ADJUSTMENT).toBe('admin_adjustment')
    })
  })

  describe('Point System Logic', () => {
    it('should validate point rules are positive for earning actions', () => {
      expect(POINT_RULES.POST_CREATED).toBeGreaterThan(0)
      expect(POINT_RULES.COMMENT_CREATED).toBeGreaterThan(0)
      expect(POINT_RULES.POST_LIKED).toBeGreaterThan(0)
      expect(POINT_RULES.COMMENT_LIKED).toBeGreaterThan(0)
      expect(POINT_RULES.DAILY_LOGIN).toBeGreaterThan(0)
    })

    it('should have reasonable point values', () => {
      // Posts should give more points than comments
      expect(POINT_RULES.POST_CREATED).toBeGreaterThan(POINT_RULES.COMMENT_CREATED)

      // Comments should give more points than likes
      expect(POINT_RULES.COMMENT_CREATED).toBeGreaterThan(POINT_RULES.POST_LIKED)
      expect(POINT_RULES.COMMENT_CREATED).toBeGreaterThan(POINT_RULES.COMMENT_LIKED)

      // All point values should be reasonable (not too high)
      expect(POINT_RULES.POST_CREATED).toBeLessThanOrEqual(50)
      expect(POINT_RULES.COMMENT_CREATED).toBeLessThanOrEqual(25)
    })
  })
})
