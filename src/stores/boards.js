// Boards store for managing board and post data
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { ApiService } from '@/services/api'
import { orderBy, where, limit } from 'firebase/firestore'

export const useBoardsStore = defineStore('boards', () => {
  // State
  const posts = ref([])
  const currentPost = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Board types configuration
  const boardTypes = ref([
    { id: 'notice', name: 'Notice', icon: 'mdi-bullhorn', adminOnly: true },
    { id: 'squad', name: 'Squad', icon: 'mdi-account-group', adminOnly: false },
    { id: 'match', name: 'Match', icon: 'mdi-soccer', adminOnly: false },
    { id: 'calcio', name: 'Calcio', icon: 'mdi-newspaper', adminOnly: false },
    { id: 'free', name: 'Free', icon: 'mdi-chat', adminOnly: false },
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
    loading.value = true
    error.value = null

    try {
      const constraints = [orderBy('createdAt', 'desc'), limit(limitCount)]

      if (boardType) {
        constraints.unshift(where('boardType', '==', boardType))
      }

      const fetchedPosts = await ApiService.getDocuments('posts', constraints)
      posts.value = fetchedPosts
    } catch (err) {
      error.value = err.message
      console.error('Error fetching posts:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchPost(postId) {
    loading.value = true
    error.value = null

    try {
      const post = await ApiService.getDocument('posts', postId)
      currentPost.value = post
      return post
    } catch (err) {
      error.value = err.message
      console.error('Error fetching post:', err)
      throw err
    } finally {
      loading.value = false
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
