// Boards store for managing board and post data
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { postService } from '@/services/database';
import { useErrorStore } from '@/stores/error';

export const useBoardsStore = defineStore('boards', () => {
  // Get error store instance
  const errorStore = useErrorStore();

  // State
  const posts = ref([]);
  const currentPost = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const pagination = ref({});

  // Board types configuration
  const boardTypes = ref([
    { id: 'notice', name: 'Notice', icon: 'mdi-bullhorn', adminOnly: true },
    { id: 'calcio', name: 'Calcio', icon: 'mdi-newspaper', adminOnly: false },
    { id: 'free', name: 'Free', icon: 'mdi-chat', adminOnly: false },
    { id: 'match', name: 'Match', icon: 'mdi-soccer', adminOnly: false },
    {
      id: 'squad',
      name: 'Squad',
      icon: 'mdi-account-group',
      adminOnly: false,
    },
    { id: 'special', name: 'Special', icon: 'mdi-star', adminOnly: false },
    { id: 'media', name: 'Media', icon: 'mdi-play-circle', adminOnly: false },
  ]);

  // Getters
  const getPostsByBoard = computed(() => (boardType) => {
    return posts.value.filter((post) => post.boardType === boardType);
  });

  const getBoardConfig = computed(() => (boardType) => {
    return boardTypes.value.find((board) => board.id === boardType);
  });

  // Actions
  async function fetchPosts(boardType = null, options = {}) {
    const { page = 1, limitCount = 15, sortBy = 'latest' } = options;
    const loadingKey = `fetch-posts-${boardType || 'all'}`;
    errorStore.setLoading(loadingKey, true);
    error.value = null;

    try {
      if (boardType) {
        const boardPagination = pagination.value[boardType];
        const isNextPage = page === (boardPagination?.currentPage || 0) + 1;

        let startAfterCursor = null;

        if (isNextPage) {
          startAfterCursor = boardPagination.cursors[page - 1];
        } else {
          // 페이지 점프 시 커서 캐시 초기화
          if (pagination.value[boardType]) {
            pagination.value[boardType].cursors = { 1: null };
          }
          startAfterCursor = await postService.getCursorForPage(
            boardType,
            page,
            limitCount,
            sortBy,
          );
        }

        if (startAfterCursor === 'invalid-page') {
          posts.value = [];
          if (pagination.value[boardType]) {
            pagination.value[boardType].totalCount = 0;
            pagination.value[boardType].totalPages = 0;
          }
          return;
        }

        const result = await postService.getPostsWithPagination(boardType, {
          lastDoc: startAfterCursor,
          limitCount,
          sortBy,
        });

        posts.value = result.posts;

        if (!pagination.value[boardType]) {
          pagination.value[boardType] = {
            cursors: { 1: null },
            currentPage: 0,
            totalCount: 0,
            totalPages: 0,
          };
        }

        const currentBoardPagination = pagination.value[boardType];
        currentBoardPagination.cursors[page] = result.lastDoc;
        currentBoardPagination.currentPage = page;
        currentBoardPagination.totalCount = result.totalCount;
        currentBoardPagination.totalPages = Math.ceil(
          result.totalCount / limitCount,
        );
      } else {
        const fetchedPosts = await postService.getPosts(boardType, {
          limitCount,
          sortBy,
        });
        posts.value = fetchedPosts;
      }
    } catch (err) {
      error.value = err.message;
      errorStore.handleFirebaseError(
        err,
        `Fetch Posts - ${boardType || 'All'}`,
      );
      console.error('Error fetching posts:', err);
    } finally {
      errorStore.setLoading(loadingKey, false);
    }
  }

  async function fetchPost(postId) {
    const loadingKey = `fetch-post-${postId}`;
    errorStore.setLoading(loadingKey, true);
    error.value = null;

    try {
      const post = await postService.getPost(postId);
      currentPost.value = post;
      return post;
    } catch (err) {
      error.value = err.message;
      errorStore.handleFirebaseError(err, `Fetch Post - ${postId}`);
      console.error('Error fetching post:', err);
      throw err;
    } finally {
      errorStore.setLoading(loadingKey, false);
    }
  }

  async function createPost(postData) {
    loading.value = true;
    error.value = null;

    try {
      const postId = await postService.createPost(postData);

      // Refresh posts after creating
      await fetchPosts(postData.boardType);

      return postId;
    } catch (err) {
      error.value = err.message;
      console.error('Error creating post:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updatePost(postId, postData) {
    loading.value = true;
    error.value = null;

    try {
      await postService.updatePost(postId, postData);

      // Update current post if it's the one being edited
      if (currentPost.value?.id === postId) {
        currentPost.value = { ...currentPost.value, ...postData };
      }

      // Update in posts array
      const index = posts.value.findIndex((post) => post.id === postId);
      if (index !== -1) {
        posts.value[index] = { ...posts.value[index], ...postData };
      }
    } catch (err) {
      error.value = err.message;
      console.error('Error updating post:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deletePost(postId) {
    loading.value = true;
    error.value = null;

    try {
      await postService.deletePost(postId);

      // Remove from posts array
      posts.value = posts.value.filter((post) => post.id !== postId);

      // Clear current post if it's the one being deleted
      if (currentPost.value?.id === postId) {
        currentPost.value = null;
      }
    } catch (err) {
      error.value = err.message;
      console.error('Error deleting post:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function clearError() {
    error.value = null;
  }

  function clearCurrentPost() {
    currentPost.value = null;
  }

  return {
    // State
    posts,
    currentPost,
    loading,
    error,
    boardTypes,
    pagination,

    // Getters
    getPostsByBoard,
    getBoardConfig,

    // Actions
    fetchPosts,
    fetchPost,
    createPost,
    updatePost,
    deletePost,
    clearError,
    clearCurrentPost,
  };
});