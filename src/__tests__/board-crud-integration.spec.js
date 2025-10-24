import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBoardsStore } from '@/stores/boards';
import { useUserStore } from '@/stores/user';
import { postService, commentService } from '@/services/database';

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
}));

// Mock Firebase instance
vi.mock('@/services/firebase', () => ({
  db: {},
}));

// Mock points service
vi.mock('@/services/points', () => ({
  pointsService: {
    autoAwardPoints: vi.fn(),
    deductPoints: vi.fn(),
  },
}));

// Mock API service
vi.mock('@/services/api', () => ({
  ApiService: {
    getDocuments: vi.fn(),
    getDocument: vi.fn(),
    addDocument: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
    getDocRef: vi.fn(),
  },
}));

describe('Board CRUD Integration Tests', () => {
  let boardsStore;
  let userStore;
  let mockFirestore;
  let mockPointsService;
  let mockApiService;

  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'user',
    points: 100,
  };

  const mockAdminUser = {
    uid: 'admin-user-id',
    email: 'admin@example.com',
    displayName: 'Admin User',
    role: 'admin',
    points: 500,
  };

  beforeEach(async () => {
    setActivePinia(createPinia());
    boardsStore = useBoardsStore();
    userStore = useUserStore();

    // Import mocked modules
    mockFirestore = await import('firebase/firestore');
    mockPointsService = (await import('@/services/points')).pointsService;
    mockApiService = (await import('@/services/api')).ApiService;

    // Set default user
    userStore.setUser(mockUser);

    vi.clearAllMocks();
  });

  describe('Post Creation Flow', () => {
    it('should create post in free board as regular user', async () => {
      const postData = {
        title: 'Test Post',
        content: '<p>Test content</p>',
        boardType: 'free',
        tags: ['test', 'post'],
        mediaUrls: [],
      };

      const expectedPostId = 'new-post-id';

      // Mock Firestore responses
      mockFirestore.addDoc.mockResolvedValue({ id: expectedPostId });

      // Execute post creation
      const postId = await postService.createPost({
        ...postData,
        authorId: mockUser.uid,
        authorName: mockUser.displayName,
        authorIcon: null,
      });

      // Verify Firestore calls
      expect(mockFirestore.addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: 'Test Post',
          content: '<p>Test content</p>',
          boardType: 'free',
          authorId: 'test-user-id',
          authorName: 'Test User',
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
          isPinned: false,
          isDeleted: false,
        }),
      );

      // Verify points awarded
      expect(mockPointsService.autoAwardPoints).toHaveBeenCalledWith(
        'test-user-id',
        'POST_CREATED',
        expectedPostId,
      );

      expect(postId).toBe(expectedPostId);
    });

    it('should create notice post as admin user', async () => {
      userStore.setUser(mockAdminUser);

      const postData = {
        title: 'Important Notice',
        content: '<p>This is an important notice</p>',
        boardType: 'notice',
        isPinned: true,
      };

      const expectedPostId = 'notice-post-id';
      mockFirestore.addDoc.mockResolvedValue({ id: expectedPostId });

      const postId = await postService.createPost({
        ...postData,
        authorId: mockAdminUser.uid,
        authorName: mockAdminUser.displayName,
        authorIcon: null,
      });

      expect(mockFirestore.addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: 'Important Notice',
          boardType: 'notice',
          authorId: 'admin-user-id',
          isPinned: true,
        }),
      );

      expect(postId).toBe(expectedPostId);
    });

    it('should create media post with attachments', async () => {
      const postData = {
        title: 'Roma Highlights',
        content: '<p>Check out these highlights</p>',
        boardType: 'media',
        mediaUrls: [
          'https://example.com/video1.mp4',
          'https://example.com/image1.jpg',
        ],
      };

      const expectedPostId = 'media-post-id';
      mockFirestore.addDoc.mockResolvedValue({ id: expectedPostId });

      const postId = await postService.createPost({
        ...postData,
        authorId: mockUser.uid,
        authorName: mockUser.displayName,
        authorIcon: null,
      });

      expect(mockFirestore.addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: 'Roma Highlights',
          boardType: 'media',
          mediaUrls: [
            'https://example.com/video1.mp4',
            'https://example.com/image1.jpg',
          ],
        }),
      );

      expect(postId).toBe(expectedPostId);
    });
  });

  describe('Post Reading Flow', () => {
    it('should fetch posts for specific board', async () => {
      const mockPosts = [
        {
          id: 'post1',
          title: 'Post 1',
          boardType: 'free',
          isPinned: false,
          createdAt: new Date(),
        },
        {
          id: 'post2',
          title: 'Post 2',
          boardType: 'free',
          isPinned: true,
          createdAt: new Date(),
        },
      ];

      mockFirestore.getDocs.mockResolvedValue({
        docs: mockPosts.map((post) => ({
          id: post.id,
          data: () => post,
        })),
      });

      const posts = await postService.getPosts('free');

      expect(mockFirestore.query).toHaveBeenCalled();
      expect(mockFirestore.where).toHaveBeenCalledWith(
        'boardType',
        '==',
        'free',
      );
      expect(mockFirestore.where).toHaveBeenCalledWith(
        'isDeleted',
        '==',
        false,
      );
      expect(mockFirestore.orderBy).toHaveBeenCalledWith('isPinned', 'desc');
      expect(mockFirestore.orderBy).toHaveBeenCalledWith('createdAt', 'desc');

      expect(posts).toEqual(mockPosts);
    });

    it('should fetch single post and increment view count', async () => {
      const mockPost = {
        id: 'post-id',
        title: 'Test Post',
        content: 'Test content',
        viewCount: 10,
        authorId: 'author-id',
      };

      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        id: 'post-id',
        data: () => mockPost,
      });

      const post = await postService.getPost('post-id');

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(expect.anything(), {
        viewCount: mockFirestore.increment(1),
      });

      expect(post).toEqual({ id: 'post-id', ...mockPost });
    });

    it('should search posts by query', async () => {
      const mockPosts = [
        {
          id: 'post1',
          title: 'Roma Victory',
          content: 'Great match against Milan',
          boardType: 'match',
        },
        {
          id: 'post2',
          title: 'Transfer News',
          content: 'New player signing',
          boardType: 'squad',
        },
      ];

      mockFirestore.getDocs.mockResolvedValue({
        docs: mockPosts.map((post) => ({
          id: post.id,
          data: () => post,
        })),
      });

      const searchResults = await postService.searchPosts('roma', {
        boardType: null,
        sortBy: 'latest',
      });

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].title).toBe('Roma Victory');
    });
  });

  describe('Post Update Flow', () => {
    it('should update post by author', async () => {
      const updateData = {
        title: 'Updated Title',
        content: '<p>Updated content</p>',
        tags: ['updated', 'post'],
      };

      await postService.updatePost('post-id', updateData);

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...updateData,
          updatedAt: { _serverTimestamp: true },
        }),
      );
    });

    it('should update post by admin', async () => {
      userStore.setUser(mockAdminUser);

      const updateData = {
        title: 'Admin Updated Title',
        isPinned: true,
      };

      await postService.updatePost('post-id', updateData);

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...updateData,
          updatedAt: { _serverTimestamp: true },
        }),
      );
    });
  });

  describe('Post Deletion Flow', () => {
    it('should soft delete post', async () => {
      await postService.deletePost('post-id');

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          isDeleted: true,
          updatedAt: { _serverTimestamp: true },
        }),
      );
    });
  });

  describe('Post Like System', () => {
    it('should add like to post', async () => {
      // Mock like doesn't exist (adding like)
      mockFirestore.getDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      // Mock post document
      mockFirestore.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ authorId: 'post-author-id' }),
      });

      const mockBatch = {
        set: vi.fn(),
        update: vi.fn(),
        commit: vi.fn(),
      };
      mockFirestore.writeBatch.mockReturnValue(mockBatch);

      const isLiked = await postService.togglePostLike('post-id', 'user-id');

      expect(mockBatch.set).toHaveBeenCalled();
      expect(mockBatch.update).toHaveBeenCalledWith(expect.anything(), {
        likeCount: mockFirestore.increment(1),
      });
      expect(mockBatch.commit).toHaveBeenCalled();
      expect(mockPointsService.autoAwardPoints).toHaveBeenCalledWith(
        'post-author-id',
        'POST_LIKED',
        'post-id',
      );
      expect(isLiked).toBe(true);
    });

    it('should remove like from post', async () => {
      // Mock like exists (removing like)
      mockFirestore.getDoc.mockResolvedValueOnce({
        exists: () => true,
      });

      // Mock post document
      mockFirestore.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ authorId: 'post-author-id' }),
      });

      const mockBatch = {
        delete: vi.fn(),
        update: vi.fn(),
        commit: vi.fn(),
      };
      mockFirestore.writeBatch.mockReturnValue(mockBatch);

      const isLiked = await postService.togglePostLike('post-id', 'user-id');

      expect(mockBatch.delete).toHaveBeenCalled();
      expect(mockBatch.update).toHaveBeenCalledWith(expect.anything(), {
        likeCount: mockFirestore.increment(-1),
      });
      expect(mockBatch.commit).toHaveBeenCalled();
      expect(isLiked).toBe(false);
    });
  });

  describe('Comment System Integration', () => {
    it('should create comment and update post comment count', async () => {
      const commentData = {
        postId: 'post-id',
        content: 'Great post!',
        authorId: 'commenter-id',
        authorName: 'Commenter',
      };

      const mockBatch = {
        set: vi.fn(),
        update: vi.fn(),
        commit: vi.fn(),
      };
      mockFirestore.writeBatch.mockReturnValue(mockBatch);

      const mockCommentRef = { id: 'new-comment-id' };
      mockFirestore.doc.mockReturnValue(mockCommentRef);

      const commentId = await commentService.createComment(commentData);

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
      );

      expect(mockBatch.update).toHaveBeenCalledWith(expect.anything(), {
        commentCount: mockFirestore.increment(1),
      });

      expect(mockBatch.commit).toHaveBeenCalled();
      expect(mockPointsService.autoAwardPoints).toHaveBeenCalledWith(
        'commenter-id',
        'COMMENT_CREATED',
        'new-comment-id',
      );

      expect(commentId).toBe('new-comment-id');
    });

    it('should create reply comment', async () => {
      const replyData = {
        postId: 'post-id',
        parentId: 'parent-comment-id',
        content: 'Reply to comment',
        authorId: 'replier-id',
        authorName: 'Replier',
      };

      const mockBatch = {
        set: vi.fn(),
        update: vi.fn(),
        commit: vi.fn(),
      };
      mockFirestore.writeBatch.mockReturnValue(mockBatch);

      const mockCommentRef = { id: 'reply-comment-id' };
      mockFirestore.doc.mockReturnValue(mockCommentRef);

      await commentService.createComment(replyData);

      expect(mockBatch.set).toHaveBeenCalledWith(
        mockCommentRef,
        expect.objectContaining({
          ...replyData,
          level: 1, // Reply level
        }),
      );
    });

    it('should fetch comments for post', async () => {
      const mockComments = [
        {
          id: 'comment1',
          postId: 'post-id',
          content: 'First comment',
          authorName: 'User 1',
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'comment2',
          postId: 'post-id',
          content: 'Second comment',
          authorName: 'User 2',
          createdAt: new Date('2024-01-02'),
        },
      ];

      mockFirestore.getDocs.mockResolvedValue({
        docs: mockComments.map((comment) => ({
          id: comment.id,
          data: () => comment,
        })),
      });

      const comments = await commentService.getComments('post-id');

      expect(mockFirestore.where).toHaveBeenCalledWith(
        'postId',
        '==',
        'post-id',
      );
      expect(mockFirestore.where).toHaveBeenCalledWith(
        'isDeleted',
        '==',
        false,
      );
      expect(mockFirestore.orderBy).toHaveBeenCalledWith('createdAt', 'asc');

      expect(comments).toEqual(mockComments);
    });

    it('should delete comment and update post comment count', async () => {
      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn(),
      };
      mockFirestore.writeBatch.mockReturnValue(mockBatch);

      await commentService.deleteComment('comment-id', 'post-id');

      expect(mockBatch.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          isDeleted: true,
          updatedAt: { _serverTimestamp: true },
        }),
      );

      expect(mockBatch.update).toHaveBeenCalledWith(expect.anything(), {
        commentCount: mockFirestore.increment(-1),
      });

      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('Board Store Integration', () => {
    it('should integrate with boards store for post management', async () => {
      const mockPosts = [
        { id: 'post1', title: 'Post 1', boardType: 'free' },
        { id: 'post2', title: 'Post 2', boardType: 'free' },
      ];

      mockApiService.getDocuments.mockResolvedValue(mockPosts);

      await boardsStore.fetchPosts('free');

      expect(mockApiService.getDocuments).toHaveBeenCalledWith(
        'posts',
        expect.arrayContaining([
          expect.anything(), // where constraint
          expect.anything(), // orderBy constraint
          expect.anything(), // limit constraint
        ]),
      );

      expect(boardsStore.posts).toEqual(mockPosts);
    });

    it('should create post through boards store', async () => {
      const postData = {
        title: 'New Post',
        content: 'New content',
        boardType: 'free',
        authorId: 'user-id',
      };

      mockApiService.addDocument.mockResolvedValue('new-post-id');
      mockApiService.getDocuments.mockResolvedValue([
        ...boardsStore.posts,
        { id: 'new-post-id', ...postData },
      ]);

      const postId = await boardsStore.createPost(postData);

      expect(mockApiService.addDocument).toHaveBeenCalledWith('posts', {
        ...postData,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        isPinned: false,
      });

      expect(postId).toBe('new-post-id');
      expect(mockApiService.getDocuments).toHaveBeenCalled(); // Refresh posts
    });
  });

  describe('Error Handling', () => {
    it('should handle post creation errors', async () => {
      const error = new Error('Permission denied');
      mockFirestore.addDoc.mockRejectedValue(error);

      const postData = {
        title: 'Test Post',
        content: 'Test content',
        boardType: 'notice', // Admin only board
        authorId: 'user-id',
      };

      await expect(postService.createPost(postData)).rejects.toThrow(
        'Permission denied',
      );
    });

    it('should handle post fetch errors', async () => {
      const error = new Error('Network error');
      mockFirestore.getDocs.mockRejectedValue(error);

      await expect(postService.getPosts('free')).rejects.toThrow(
        'Network error',
      );
    });

    it('should handle comment creation errors', async () => {
      const error = new Error('Validation error');
      mockFirestore.writeBatch.mockReturnValue({
        set: vi.fn(),
        update: vi.fn(),
        commit: vi.fn().mockRejectedValue(error),
      });

      const commentData = {
        postId: 'post-id',
        content: 'Test comment',
        authorId: 'user-id',
      };

      await expect(commentService.createComment(commentData)).rejects.toThrow(
        'Validation error',
      );
    });
  });
});
