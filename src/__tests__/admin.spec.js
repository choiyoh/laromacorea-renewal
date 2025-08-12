import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AdminService } from '@/services/admin'

// Mock Firebase
vi.mock('@/services/firebase', () => ({
  db: {},
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
  writeBatch: vi.fn(),
}))

describe('Admin Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkAdminPermission', () => {
    it('should return true for admin user', async () => {
      const { getDoc } = await import('firebase/firestore')

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ role: 'admin' }),
      })

      const result = await AdminService.checkAdminPermission('admin-user-id')
      expect(result).toBe(true)
    })

    it('should return false for regular user', async () => {
      const { getDoc } = await import('firebase/firestore')

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ role: 'user' }),
      })

      const result = await AdminService.checkAdminPermission('regular-user-id')
      expect(result).toBe(false)
    })

    it('should throw error for non-existent user', async () => {
      const { getDoc } = await import('firebase/firestore')

      getDoc.mockResolvedValue({
        exists: () => false,
      })

      await expect(AdminService.checkAdminPermission('non-existent-user')).rejects.toThrow(
        '사용자를 찾을 수 없습니다.',
      )
    })
  })

  describe('createNotice', () => {
    it('should create notice for admin user', async () => {
      const { getDoc, addDoc } = await import('firebase/firestore')

      // Mock admin permission check
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ role: 'admin' }),
      })

      // Mock addDoc
      addDoc.mockResolvedValue({ id: 'notice-id' })

      const noticeData = {
        title: 'Test Notice',
        content: 'Test content',
        authorId: 'admin-id',
        authorName: 'Admin User',
      }

      const result = await AdminService.createNotice('admin-id', noticeData)
      expect(result).toBe('notice-id')
      expect(addDoc).toHaveBeenCalled()
    })

    it('should throw error for non-admin user', async () => {
      const { getDoc } = await import('firebase/firestore')

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ role: 'user' }),
      })

      const noticeData = {
        title: 'Test Notice',
        content: 'Test content',
      }

      await expect(AdminService.createNotice('user-id', noticeData)).rejects.toThrow(
        '관리자 권한이 필요합니다.',
      )
    })
  })

  describe('createIcon', () => {
    it('should create icon for admin user', async () => {
      const { getDoc, addDoc } = await import('firebase/firestore')

      // Mock admin permission check
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ role: 'admin' }),
      })

      // Mock addDoc
      addDoc.mockResolvedValue({ id: 'icon-id' })

      const iconData = {
        name: 'Test Icon',
        category: '기본',
        price: 100,
        imageUrl: 'https://example.com/icon.png',
      }

      const result = await AdminService.createIcon('admin-id', iconData)
      expect(result).toBe('icon-id')
      expect(addDoc).toHaveBeenCalled()
    })

    it('should throw error for non-admin user', async () => {
      const { getDoc } = await import('firebase/firestore')

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ role: 'user' }),
      })

      const iconData = {
        name: 'Test Icon',
        category: '기본',
        price: 100,
        imageUrl: 'https://example.com/icon.png',
      }

      await expect(AdminService.createIcon('user-id', iconData)).rejects.toThrow(
        '관리자 권한이 필요합니다.',
      )
    })
  })
})
