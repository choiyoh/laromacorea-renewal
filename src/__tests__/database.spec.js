import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  postService,
  commentService,
  userService,
  iconService,
  boardService,
} from '@/services/database'

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  increment: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
  writeBatch: vi.fn(),
}))

// Mock Firebase instance
vi.mock('@/services/firebase', () => ({
  db: {},
}))

// Mock points service
vi.mock('@/services/points', () => ({
  pointsService: {
    awardPoints: vi.fn(),
    deductPoints: vi.fn(),
    autoAwardPoints: vi.fn(),
  },
}))

describe('Database Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('userService', () => {
    it('should get user by uid', async () => {
      const { getDoc } = await import('firebase/firestore')
      const mockUserData = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        points: 100,
      }

      getDoc.mockResolvedValue({
        exists: () => true,
        id: 'test-uid',
        data: () => mockUserData,
      })

      const result = await userService.getUser('test-uid')

      expect(result).toEqual({ id: 'test-uid', ...mockUserData })
      expect(getDoc).toHaveBeenCalled()
    })

    it('should return null for non-existent user', async () => {
      const { getDoc } = await import('firebase/firestore')

      getDoc.mockResolvedValue({
        exists: () => false,
      })

      const result = await userService.getUser('non-existent-uid')

      expect(result).toBeNull()
    })

    it('should update user data', async () => {
      const { updateDoc, serverTimestamp } = await import('firebase/firestore')
      const updateData = { displayName: 'Updated Name' }

      await userService.updateUser('test-uid', updateData)

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...updateData,
          updatedAt: { _serverTimestamp: true },
        }),
      )
    })
  })

  describe('postService', () => {
    it('should get posts by board type', async () => {
      const { getDocs, query, collection, where, orderBy, limit } = await import(
        'firebase/firestore'
      )
      const mockPosts = [
        { id: 'post1', title: 'Post 1', boardType: 'free' },
        { id: 'post2', title: 'Post 2', boardType: 'free' },
      ]

      getDocs.mockResolvedValue({
        docs: mockPosts.map((post) => ({
          id: post.id,
          data: () => post,
        })),
      })

      const result = await postService.getPosts('free')

      expect(query).toHaveBeenCalled()
      expect(where).toHaveBeenCalledWith('boardType', '==', 'free')
      expect(where).toHaveBeenCalledWith('isDeleted', '==', false)
      expect(orderBy).toHaveBeenCalledWith('isPinned', 'desc')
      expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc')
      expect(limit).toHaveBeenCalledWith(20)
      expect(result).toEqual(mockPosts)
    })

    it('should filter posts by search query', async () => {
      const { getDocs } = await import('firebase/firestore')
      const mockPosts = [
        { id: 'post1', title: 'Roma Victory', content: 'Great match!', boardType: 'free' },
        { id: 'post2', title: 'Milan Loss', content: 'Bad game', boardType: 'free' },
      ]

      getDocs.mockResolvedValue({
        docs: mockPosts.map((post) => ({
          id: post.id,
          data: () => post,
        })),
      })

      const result = await postService.getPosts('free', { searchQuery: 'roma' })

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Roma Victory')
    })

    it('should create new post', async () => {
      const { addDoc, serverTimestamp } = await import('firebase/firestore')
      const { pointsService } = await import('@/services/points')

      addDoc.mockResolvedValue({ id: 'new-post-id' })

      const postData = {
        title: 'New Post',
        content: 'Post content',
        boardType: 'free',
        authorId: 'author-id',
      }

      const result = await postService.createPost(postData)

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...postData,
          createdAt: { _serverTimestamp: true },
          updatedAt: { _serverTimestamp: true },
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
          isPinned: false,
          isDeleted: false,
        }),
      )
      expect(pointsService.autoAwardPoints).toHaveBeenCalledWith(
        'author-id',
        'POST_CREATED',
        'new-post-id',
      )
      expect(result).toBe('new-post-id')
    })

    it('should get single post and increment view count', async () => {
      const { getDoc, updateDoc, increment } = await import('firebase/firestore')
      const mockPost = {
        id: 'post-id',
        title: 'Test Post',
        content: 'Test content',
        viewCount: 10,
      }

      getDoc.mockResolvedValue({
        exists: () => true,
        id: 'post-id',
        data: () => mockPost,
      })

      const result = await postService.getPost('post-id')

      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { viewCount: increment(1) })
      expect(result).toEqual({ id: 'post-id', ...mockPost })
    })

    it('should return null for non-existent post', async () => {
      const { getDoc } = await import('firebase/firestore')

      getDoc.mockResolvedValue({
        exists: () => false,
      })

      const result = await postService.getPost('non-existent-id')

      expect(result).toBeNull()
    })

    it('should update post', async () => {
      const { updateDoc, serverTimestamp } = await import('firebase/firestore')
      const updateData = { title: 'Updated Title' }

      await postService.updatePost('post-id', updateData)

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...updateData,
          updatedAt: { _serverTimestamp: true },
        }),
      )
    })

    it('should soft delete post', async () => {
      const { updateDoc, serverTimestamp } = await import('firebase/firestore')

      await postService.deletePost('post-id')

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          isDeleted: true,
          updatedAt: { _serverTimestamp: true },
        }),
      )
    })

    it('should toggle post like', async () => {
      const { getDoc, writeBatch } = await import('firebase/firestore')
      const { pointsService } = await import('@/services/points')

      // Mock like document doesn't exist (adding like)
      getDoc.mockResolvedValueOnce({
        exists: () => false,
      })

      // Mock post document
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ authorId: 'post-author' }),
      })

      const mockBatch = {
        set: vi.fn(),
        update: vi.fn(),
        commit: vi.fn(),
      }
      writeBatch.mockReturnValue(mockBatch)

      const result = await postService.togglePostLike('post-id', 'user-id')

      expect(mockBatch.set).toHaveBeenCalled()
      expect(mockBatch.update).toHaveBeenCalled()
      expect(mockBatch.commit).toHaveBeenCalled()
      expect(pointsService.autoAwardPoints).toHaveBeenCalledWith(
        'post-author',
        'POST_LIKED',
        'post-id',
      )
      expect(result).toBe(true)
    })

    it('should check post like status', async () => {
      const { getDoc } = await import('firebase/firestore')

      getDoc.mockResolvedValue({
        exists: () => true,
      })

      const result = await postService.checkPostLike('post-id', 'user-id')

      expect(result).toBe(true)
    })
  })

  describe('commentService', () => {
    it('should get comments for post', async () => {
      const { getDocs, query, collection, where, orderBy } = await import('firebase/firestore')
      const mockComments = [
        { id: 'comment1', content: 'Comment 1', postId: 'post-id' },
        { id: 'comment2', content: 'Comment 2', postId: 'post-id' },
      ]

      getDocs.mockResolvedValue({
        docs: mockComments.map((comment) => ({
          id: comment.id,
          data: () => comment,
        })),
      })

      const result = await commentService.getComments('post-id')

      expect(where).toHaveBeenCalledWith('postId', '==', 'post-id')
      expect(where).toHaveBeenCalledWith('isDeleted', '==', false)
      expect(orderBy).toHaveBeenCalledWith('createdAt', 'asc')
      expect(result).toEqual(mockComments)
    })

    it('should create comment', async () => {
      const { writeBatch, doc, collection, serverTimestamp, increment } = await import(
        'firebase/firestore'
      )
      const { pointsService } = await import('@/services/points')

      const mockBatch = {
        set: vi.fn(),
        update: vi.fn(),
        commit: vi.fn(),
      }
      writeBatch.mockReturnValue(mockBatch)

      const mockCommentRef = { id: 'new-comment-id' }
      doc.mockReturnValue(mockCommentRef)

      const commentData = {
        postId: 'post-id',
        content: 'New comment',
        authorId: 'author-id',
      }

      const result = await commentService.createComment(commentData)

      expect(mockBatch.set).toHaveBeenCalledWith(
        mockCommentRef,
        expect.objectContaining({
          ...commentData,
          createdAt: { _serverTimestamp: true },
          updatedAt: { _serverTimestamp: true },
          likeCount: 0,
          isDeleted: false,
          level: 0,
        }),
      )
      expect(mockBatch.update).toHaveBeenCalledWith(expect.anything(), {
        commentCount: increment(1),
      })
      expect(mockBatch.commit).toHaveBeenCalled()
      expect(pointsService.autoAwardPoints).toHaveBeenCalledWith(
        'author-id',
        'COMMENT_CREATED',
        'new-comment-id',
      )
      expect(result).toBe('new-comment-id')
    })

    it('should update comment', async () => {
      const { updateDoc, serverTimestamp } = await import('firebase/firestore')

      await commentService.updateComment('comment-id', 'Updated content')

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          content: 'Updated content',
          updatedAt: { _serverTimestamp: true },
        }),
      )
    })

    it('should soft delete comment', async () => {
      const { writeBatch, increment, serverTimestamp } = await import('firebase/firestore')

      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn(),
      }
      writeBatch.mockReturnValue(mockBatch)

      await commentService.deleteComment('comment-id', 'post-id')

      expect(mockBatch.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          isDeleted: true,
          updatedAt: { _serverTimestamp: true },
        }),
      )
      expect(mockBatch.update).toHaveBeenCalledWith(expect.anything(), {
        commentCount: increment(-1),
      })
      expect(mockBatch.commit).toHaveBeenCalled()
    })
  })

  describe('iconService', () => {
    it('should get active icons', async () => {
      const { getDocs, query, collection, where, orderBy } = await import('firebase/firestore')
      const mockIcons = [
        { id: 'icon1', name: 'Icon 1', isActive: true, category: 'basic' },
        { id: 'icon2', name: 'Icon 2', isActive: true, category: 'premium' },
      ]

      getDocs.mockResolvedValue({
        docs: mockIcons.map((icon) => ({
          id: icon.id,
          data: () => icon,
        })),
      })

      const result = await iconService.getActiveIcons()

      expect(where).toHaveBeenCalledWith('isActive', '==', true)
      expect(orderBy).toHaveBeenCalledWith('category', 'asc')
      expect(orderBy).toHaveBeenCalledWith('price', 'asc')
      expect(result).toEqual(mockIcons)
    })

    it('should purchase icon', async () => {
      const { writeBatch, doc, serverTimestamp, increment } = await import('firebase/firestore')
      const { pointsService } = await import('@/services/points')

      const mockBatch = {
        set: vi.fn(),
        update: vi.fn(),
        commit: vi.fn(),
      }
      writeBatch.mockReturnValue(mockBatch)

      await iconService.purchaseIcon('user-id', 'icon-id', 100)

      expect(pointsService.deductPoints).toHaveBeenCalledWith(
        'user-id',
        100,
        'icon_purchase',
        'icon-id',
      )
      expect(mockBatch.set).toHaveBeenCalled()
      expect(mockBatch.update).toHaveBeenCalledWith(expect.anything(), {
        purchaseCount: increment(1),
      })
      expect(mockBatch.commit).toHaveBeenCalled()
    })

    it('should get user purchased icons', async () => {
      const { getDocs, collection } = await import('firebase/firestore')
      const mockPurchasedIcons = [
        { id: 'icon1', iconId: 'icon1', purchasedAt: new Date() },
        { id: 'icon2', iconId: 'icon2', purchasedAt: new Date() },
      ]

      getDocs.mockResolvedValue({
        docs: mockPurchasedIcons.map((icon) => ({
          id: icon.id,
          data: () => icon,
        })),
      })

      const result = await iconService.getUserPurchasedIcons('user-id')

      expect(collection).toHaveBeenCalledWith(
        expect.anything(),
        'users',
        'user-id',
        'purchased_icons',
      )
      expect(result).toEqual(mockPurchasedIcons)
    })
  })

  describe('boardService', () => {
    it('should get active boards', async () => {
      const { getDocs, query, collection, where, orderBy } = await import('firebase/firestore')
      const mockBoards = [
        { id: 'notice', name: 'Notice', isActive: true, order: 1 },
        { id: 'free', name: 'Free', isActive: true, order: 2 },
      ]

      getDocs.mockResolvedValue({
        docs: mockBoards.map((board) => ({
          id: board.id,
          data: () => board,
        })),
      })

      const result = await boardService.getActiveBoards()

      expect(where).toHaveBeenCalledWith('isActive', '==', true)
      expect(orderBy).toHaveBeenCalledWith('order', 'asc')
      expect(result).toEqual(mockBoards)
    })

    it('should get single board', async () => {
      const { getDoc } = await import('firebase/firestore')
      const mockBoard = {
        id: 'free',
        name: 'Free Board',
        isActive: true,
      }

      getDoc.mockResolvedValue({
        exists: () => true,
        id: 'free',
        data: () => mockBoard,
      })

      const result = await boardService.getBoard('free')

      expect(result).toEqual({ id: 'free', ...mockBoard })
    })

    it('should return null for non-existent board', async () => {
      const { getDoc } = await import('firebase/firestore')

      getDoc.mockResolvedValue({
        exists: () => false,
      })

      const result = await boardService.getBoard('non-existent')

      expect(result).toBeNull()
    })
  })
})
