/**
 * Firestore Database Schema Definitions
 * AS 로마 한국 팬 커뮤니티 사이트
 */

// Collection: users
const userSchema = {
  uid: 'string', // Firebase Auth UID
  email: 'string',
  displayName: 'string',
  photoURL: 'string?', // Optional
  selectedIcon: 'string?', // Optional - reference to icon ID
  points: 'number', // Default: 0
  role: 'string', // 'user' | 'admin'
  createdAt: 'timestamp',
  lastLoginAt: 'timestamp',
  isActive: 'boolean', // Default: true
  profile: {
    bio: 'string?',
    favoritePlayer: 'string?',
    joinDate: 'timestamp',
  },
}

// Collection: posts
const postSchema = {
  id: 'string', // Auto-generated document ID
  boardType: 'string', // 'notice' | 'squad' | 'match' | 'calcio' | 'free' | 'special' | 'media'
  title: 'string',
  content: 'string',
  authorId: 'string', // Reference to user UID
  authorName: 'string',
  authorIcon: 'string?', // Optional - icon ID
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  viewCount: 'number', // Default: 0
  likeCount: 'number', // Default: 0
  commentCount: 'number', // Default: 0
  isPinned: 'boolean', // Default: false (admin only)
  tags: 'array', // Array of strings
  mediaUrls: 'array', // Array of Firebase Storage URLs
  isDeleted: 'boolean', // Default: false
}

// Collection: comments
const commentSchema = {
  id: 'string', // Auto-generated document ID
  postId: 'string', // Reference to post ID
  parentId: 'string?', // Optional - for nested comments
  authorId: 'string', // Reference to user UID
  authorName: 'string',
  authorIcon: 'string?', // Optional - icon ID
  content: 'string',
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  likeCount: 'number', // Default: 0
  isDeleted: 'boolean', // Default: false
  level: 'number', // Comment depth level (0 = top level, 1 = reply, etc.)
}

// Collection: icons
const iconSchema = {
  id: 'string', // Auto-generated document ID
  name: 'string',
  imageUrl: 'string', // Firebase Storage URL
  price: 'number', // Points required to purchase
  category: 'string', // 'player' | 'logo' | 'special' | 'seasonal'
  description: 'string?',
  isActive: 'boolean', // Default: true
  createdAt: 'timestamp',
  createdBy: 'string', // Admin user ID
  purchaseCount: 'number', // Default: 0
}

// Collection: points_history
const pointsHistorySchema = {
  id: 'string', // Auto-generated document ID
  userId: 'string', // Reference to user UID
  type: 'string', // 'earned' | 'spent' | 'admin_adjustment'
  amount: 'number', // Positive for earned, negative for spent
  reason: 'string', // 'post_created' | 'comment_created' | 'icon_purchase' | 'admin_bonus'
  relatedId: 'string?', // Optional - related post/comment/icon ID
  createdAt: 'timestamp',
  adminId: 'string?', // Optional - admin who made adjustment
}

// Collection: boards (게시판 설정)
const boardSchema = {
  id: 'string', // Board type identifier
  name: 'string', // Display name
  description: 'string',
  order: 'number', // Display order
  isActive: 'boolean',
  permissions: {
    read: 'array', // User roles that can read
    write: 'array', // User roles that can write
    moderate: 'array', // User roles that can moderate
  },
  settings: {
    allowMedia: 'boolean',
    allowComments: 'boolean',
    requireApproval: 'boolean',
  },
}

// Export schemas for reference
export { userSchema, postSchema, commentSchema, iconSchema, pointsHistorySchema, boardSchema }
