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
    const { limitCount = 15, sortBy = 'latest', lastDoc = null } = options;
    const loadingKey = `fetch-posts-${boardType || 'all'}`;
    errorStore.setLoading(loadingKey, true);
    error.value = null;

    try {
      const result = await postService.getPostsWithPagination(boardType, {
        lastDoc,
        limitCount,
        sortBy,
      });

      posts.value = result.posts;

      // 페이지네이션 정보는 이제 컴포저블에서 직접 관리합니다.
      // 스토어는 더 이상 페이지네이션 상태를 복잡하게 추적하지 않습니다.
      pagination.value[boardType] = {
        lastDoc: result.lastDoc,
        hasMore: result.hasMore,
        totalCount: result.totalCount,
      };
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