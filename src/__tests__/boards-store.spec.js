import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBoardsStore } from '@/stores/boards';

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

// Mock error store
vi.mock('@/stores/error', () => ({
  useErrorStore: vi.fn(() => ({
    setLoading: vi.fn(),
    handleFirebaseError: vi.fn(),
  })),
}));

describe('Boards Store', () => {
  let boardsStore;
  let mockApiService;
  let mockErrorStore;

  const mockPosts = [
    {
      id: 'post1',
      title: 'Test Post 1',
      content: 'Content 1',
      boardType: 'free',
      authorId: 'user1',
      createdAt: new Date(),
    },
    {
      id: 'post2',
      title: 'Test Post 2',
      content: 'Content 2',
      boardType: 'notice',
      authorId: 'admin1',
      createdAt: new Date(),
    },
  ];

  beforeEach(async () => {
    setActivePinia(createPinia());
    boardsStore = useBoardsStore();

    const { ApiService } = await import('@/services/api');
    const { useErrorStore } = await import('@/stores/error');

    mockApiService = ApiService;
    mockErrorStore = useErrorStore();

    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      expect(boardsStore.posts).toEqual([]);
      expect(boardsStore.currentPost).toBeNull();
      expect(boardsStore.loading).toBe(false);
      expect(boardsStore.error).toBeNull();
      expect(boardsStore.boardTypes).toHaveLength(7);
    });

    it('should have correct board types configuration', () => {
      const expectedBoardTypes = [
        { id: 'notice', name: 'Notice', icon: 'mdi-bullhorn', adminOnly: true },
        {
          id: 'squad',
          name: 'Squad',
          icon: 'mdi-account-group',
          adminOnly: false,
        },
        { id: 'match', name: 'Match', icon: 'mdi-soccer', adminOnly: false },
        {
          id: 'calcio',
          name: 'Calcio',
          icon: 'mdi-newspaper',
          adminOnly: false,
        },
        { id: 'free', name: 'Free', icon: 'mdi-chat', adminOnly: false },
        { id: 'special', name: 'Special', icon: 'mdi-star', adminOnly: false },
        {
          id: 'media',
          name: 'Media',
          icon: 'mdi-play-circle',
          adminOnly: false,
        },
      ];

      expect(boardsStore.boardTypes).toEqual(expectedBoardTypes);
    });
  });

  describe('getters', () => {
    beforeEach(() => {
      boardsStore.posts = mockPosts;
    });

    it('should filter posts by board type', () => {
      const freePosts = boardsStore.getPostsByBoard('free');
      const noticePosts = boardsStore.getPostsByBoard('notice');

      expect(freePosts).toHaveLength(1);
      expect(freePosts[0].id).toBe('post1');
      expect(noticePosts).toHaveLength(1);
      expect(noticePosts[0].id).toBe('post2');
    });

    it('should return empty array for non-existent board type', () => {
      const nonExistentPosts = boardsStore.getPostsByBoard('nonexistent');
      expect(nonExistentPosts).toEqual([]);
    });

    it('should get board configuration by type', () => {
      const freeBoard = boardsStore.getBoardConfig('free');
      const noticeBoard = boardsStore.getBoardConfig('notice');

      expect(freeBoard).toEqual({
        id: 'free',
        name: 'Free',
        icon: 'mdi-chat',
        adminOnly: false,
      });
      expect(noticeBoard).toEqual({
        id: 'notice',
        name: 'Notice',
        icon: 'mdi-bullhorn',
        adminOnly: true,
      });
    });

    it('should return undefined for non-existent board config', () => {
      const nonExistentBoard = boardsStore.getBoardConfig('nonexistent');
      expect(nonExistentBoard).toBeUndefined();
    });
  });

  describe('actions', () => {
    describe('fetchPosts', () => {
      it('should fetch all posts when no board type specified', async () => {
        mockApiService.getDocuments.mockResolvedValue(mockPosts);

        await boardsStore.fetchPosts();

        expect(mockApiService.getDocuments).toHaveBeenCalledWith(
          'posts',
          expect.arrayContaining([
            expect.objectContaining({
              _key: { path: { segments: ['createdAt'] } },
            }),
            expect.objectContaining({ _key: { path: { segments: ['20'] } } }),
          ]),
        );
        expect(boardsStore.posts).toEqual(mockPosts);
        expect(boardsStore.error).toBeNull();
      });

      it('should fetch posts for specific board type', async () => {
        const freePosts = [mockPosts[0]];
        mockApiService.getDocuments.mockResolvedValue(freePosts);

        await boardsStore.fetchPosts('free');

        expect(mockApiService.getDocuments).toHaveBeenCalledWith(
          'posts',
          expect.arrayContaining([
            expect.anything(), // where constraint for boardType
            expect.anything(), // orderBy constraint
            expect.anything(), // limit constraint
          ]),
        );
        expect(boardsStore.posts).toEqual(freePosts);
      });

      it('should handle fetch posts error', async () => {
        const error = new Error('Fetch failed');
        mockApiService.getDocuments.mockRejectedValue(error);

        await boardsStore.fetchPosts('free');

        expect(boardsStore.error).toBe('Fetch failed');
        expect(mockErrorStore.handleFirebaseError).toHaveBeenCalledWith(
          error,
          'Fetch Posts - free',
        );
      });

      it('should set loading state correctly', async () => {
        mockApiService.getDocuments.mockResolvedValue(mockPosts);

        const fetchPromise = boardsStore.fetchPosts('free');

        expect(mockErrorStore.setLoading).toHaveBeenCalledWith(
          'fetch-posts-free',
          true,
        );

        await fetchPromise;

        expect(mockErrorStore.setLoading).toHaveBeenCalledWith(
          'fetch-posts-free',
          false,
        );
      });
    });

    describe('fetchPost', () => {
      it('should fetch single post', async () => {
        const mockPost = mockPosts[0];
        mockApiService.getDocument.mockResolvedValue(mockPost);

        const result = await boardsStore.fetchPost('post1');

        expect(mockApiService.getDocument).toHaveBeenCalledWith(
          'posts',
          'post1',
        );
        expect(boardsStore.currentPost).toEqual(mockPost);
        expect(result).toEqual(mockPost);
      });

      it('should handle fetch post error', async () => {
        const error = new Error('Post not found');
        mockApiService.getDocument.mockRejectedValue(error);

        await expect(boardsStore.fetchPost('nonexistent')).rejects.toThrow(
          'Post not found',
        );

        expect(boardsStore.error).toBe('Post not found');
        expect(mockErrorStore.handleFirebaseError).toHaveBeenCalledWith(
          error,
          'Fetch Post - nonexistent',
        );
      });
    });

    describe('createPost', () => {
      it('should create new post', async () => {
        mockApiService.addDocument.mockResolvedValue('new-post-id');
        mockApiService.getDocuments.mockResolvedValue([
          ...mockPosts,
          { id: 'new-post-id' },
        ]);

        const postData = {
          title: 'New Post',
          content: 'New content',
          boardType: 'free',
          authorId: 'user1',
        };

        const result = await boardsStore.createPost(postData);

        expect(mockApiService.addDocument).toHaveBeenCalledWith('posts', {
          ...postData,
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
          isPinned: false,
        });
        expect(result).toBe('new-post-id');
        expect(mockApiService.getDocuments).toHaveBeenCalled(); // Refresh posts
      });

      it('should handle create post error', async () => {
        const error = new Error('Create failed');
        mockApiService.addDocument.mockRejectedValue(error);

        const postData = { title: 'New Post', boardType: 'free' };

        await expect(boardsStore.createPost(postData)).rejects.toThrow(
          'Create failed',
        );

        expect(boardsStore.error).toBe('Create failed');
        expect(boardsStore.loading).toBe(false);
      });
    });

    describe('updatePost', () => {
      beforeEach(() => {
        boardsStore.posts = [...mockPosts];
        boardsStore.currentPost = mockPosts[0];
      });

      it('should update existing post', async () => {
        mockApiService.updateDocument.mockResolvedValue();

        const updateData = { title: 'Updated Title' };

        await boardsStore.updatePost('post1', updateData);

        expect(mockApiService.updateDocument).toHaveBeenCalledWith(
          'posts',
          'post1',
          updateData,
        );
        expect(boardsStore.currentPost.title).toBe('Updated Title');
        expect(boardsStore.posts[0].title).toBe('Updated Title');
      });

      it('should handle update post error', async () => {
        const error = new Error('Update failed');
        mockApiService.updateDocument.mockRejectedValue(error);

        const updateData = { title: 'Updated Title' };

        await expect(
          boardsStore.updatePost('post1', updateData),
        ).rejects.toThrow('Update failed');

        expect(boardsStore.error).toBe('Update failed');
      });
    });

    describe('deletePost', () => {
      beforeEach(() => {
        boardsStore.posts = [...mockPosts];
        boardsStore.currentPost = mockPosts[0];
      });

      it('should delete existing post', async () => {
        mockApiService.deleteDocument.mockResolvedValue();

        await boardsStore.deletePost('post1');

        expect(mockApiService.deleteDocument).toHaveBeenCalledWith(
          'posts',
          'post1',
        );
        expect(boardsStore.posts).toHaveLength(1);
        expect(boardsStore.posts[0].id).toBe('post2');
        expect(boardsStore.currentPost).toBeNull();
      });

      it('should handle delete post error', async () => {
        const error = new Error('Delete failed');
        mockApiService.deleteDocument.mockRejectedValue(error);

        await expect(boardsStore.deletePost('post1')).rejects.toThrow(
          'Delete failed',
        );

        expect(boardsStore.error).toBe('Delete failed');
        expect(boardsStore.posts).toHaveLength(2); // Should not be modified on error
      });
    });

    describe('utility actions', () => {
      it('should clear error', () => {
        boardsStore.error = 'Some error';

        boardsStore.clearError();

        expect(boardsStore.error).toBeNull();
      });

      it('should clear current post', () => {
        boardsStore.currentPost = mockPosts[0];

        boardsStore.clearCurrentPost();

        expect(boardsStore.currentPost).toBeNull();
      });
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error');
      networkError.code = 'network-error';
      mockApiService.getDocuments.mockRejectedValue(networkError);

      await boardsStore.fetchPosts('free');

      expect(boardsStore.error).toBe('Network error');
      expect(mockErrorStore.handleFirebaseError).toHaveBeenCalledWith(
        networkError,
        'Fetch Posts - free',
      );
    });

    it('should handle permission errors gracefully', async () => {
      const permissionError = new Error('Permission denied');
      permissionError.code = 'permission-denied';
      mockApiService.addDocument.mockRejectedValue(permissionError);

      const postData = { title: 'New Post', boardType: 'notice' };

      await expect(boardsStore.createPost(postData)).rejects.toThrow(
        'Permission denied',
      );

      expect(boardsStore.error).toBe('Permission denied');
    });
  });

  describe('loading states', () => {
    it('should manage loading state for fetch operations', async () => {
      mockApiService.getDocuments.mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve(mockPosts), 100)),
      );

      const fetchPromise = boardsStore.fetchPosts('free');

      expect(mockErrorStore.setLoading).toHaveBeenCalledWith(
        'fetch-posts-free',
        true,
      );

      await fetchPromise;

      expect(mockErrorStore.setLoading).toHaveBeenCalledWith(
        'fetch-posts-free',
        false,
      );
    });

    it('should manage loading state for create operations', async () => {
      mockApiService.addDocument.mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve('new-id'), 100)),
      );
      mockApiService.getDocuments.mockResolvedValue([]);

      const createPromise = boardsStore.createPost({
        title: 'New Post',
        boardType: 'free',
      });

      expect(boardsStore.loading).toBe(true);

      await createPromise;

      expect(boardsStore.loading).toBe(false);
    });
  });
});
