// Boards store for managing board and post data
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { ApiService } from '@/services/api'
import { postService } from '@/services/database-simple'
import { orderBy, where, limit } from 'firebase/firestore'
import { useErrorStore } from '@/stores/error'

export const useBoardsStore = defineStore('boards', () => {
  // Get error store instance
  const errorStore = useErrorStore()

  // State
  const posts = ref([])
  const currentPost = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Board types configuration
  const boardTypes = ref([
    { id: 'notice', name: 'Notice', icon: 'mdi-bullhorn', adminOnly: true },
    { id: 'calcio', name: 'Calcio', icon: 'mdi-newspaper', adminOnly: false },
    { id: 'free', name: 'Free', icon: 'mdi-chat', adminOnly: false },
    { id: 'match', name: 'Match', icon: 'mdi-soccer', adminOnly: false },
    { id: 'squad', name: 'Squad', icon: 'mdi-account-group', adminOnly: false },
    { id: 'special', name: 'Special', icon: 'mdi-star', adminOnly: false },
    { id: 'media', name: 'Media', icon: 'mdi-play-circle', adminOnly: false },
  ])

  // Getters
  const getPostsByBoard = computed(() => (boardType) => {
    return posts.value.filter((post) => post.boardType === boardType)
  })

  const getBoardConfig = computed(() => (boardType) => {
    return boardTypes.value.find((board) => board.id === boardType)
  })

  // Actions
  async function fetchPosts(boardType = null, limitCount = 20) {
    const loadingKey = `fetch-posts-${boardType || 'all'}`
    errorStore.setLoading(loadingKey, true)
    error.value = null

    try {
      const constraints = [
        where('isDeleted', '==', false),
        orderBy('isPinned', 'desc'),
        orderBy('createdAt', 'desc'),
        limit(limitCount),
      ]

      if (boardType) {
        constraints.splice(1, 0, where('boardType', '==', boardType))
      }

      // 임시로 간단한 서비스 사용 (인덱스 생성 대기 중)
      const fetchedPosts = await postService.getPosts(boardType, { limitCount })
      posts.value = fetchedPosts
    } catch (err) {
      error.value = err.message
      errorStore.handleFirebaseError(err, `Fetch Posts - ${boardType || 'All'}`)
      console.error('Error fetching posts:', err)
    } finally {
      errorStore.setLoading(loadingKey, false)
    }
  }

  async function fetchPost(postId) {
    const loadingKey = `fetch-post-${postId}`
    errorStore.setLoading(loadingKey, true)
    error.value = null

    try {
      const post = await ApiService.getDocument('posts', postId)
      currentPost.value = post
      return post
    } catch (err) {
      error.value = err.message
      errorStore.handleFirebaseError(err, `Fetch Post - ${postId}`)
      console.error('Error fetching post:', err)
      throw err
    } finally {
      errorStore.setLoading(loadingKey, false)
    }
  }

  async function createPost(postData) {
    loading.value = true
    error.value = null

    try {
      const postId = await ApiService.addDocument('posts', {
        ...postData,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        isPinned: false,
      })

      // Refresh posts after creating
      await fetchPosts(postData.boardType)

      return postId
    } catch (err) {
      error.value = err.message
      console.error('Error creating post:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updatePost(postId, postData) {
    loading.value = true
    error.value = null

    try {
      await ApiService.updateDocument('posts', postId, postData)

      // Update current post if it's the one being edited
      if (currentPost.value?.id === postId) {
        currentPost.value = { ...currentPost.value, ...postData }
      }

      // Update in posts array
      const index = posts.value.findIndex((post) => post.id === postId)
      if (index !== -1) {
        posts.value[index] = { ...posts.value[index], ...postData }
      }
    } catch (err) {
      error.value = err.message
      console.error('Error updating post:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deletePost(postId) {
    loading.value = true
    error.value = null

    try {
      await ApiService.deleteDocument('posts', postId)

      // Remove from posts array
      posts.value = posts.value.filter((post) => post.id !== postId)

      // Clear current post if it's the one being deleted
      if (currentPost.value?.id === postId) {
        currentPost.value = null
      }
    } catch (err) {
      error.value = err.message
      console.error('Error deleting post:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  function clearCurrentPost() {
    currentPost.value = null
  }

  return {
    // State
    posts,
    currentPost,
    loading,
    error,
    boardTypes,

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
  }
})
