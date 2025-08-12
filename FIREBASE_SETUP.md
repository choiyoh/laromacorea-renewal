# Firebase Setup Guide

This document provides instructions for setting up Firebase for the AS Roma Korea Community website.

## Prerequisites

1. Node.js (v18 or higher)
2. npm or yarn package manager
3. A Google account for Firebase Console access

## Firebase Project Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `laromacorea-renewal`
4. Enable Google Analytics (optional)
5. Choose or create a Google Analytics account
6. Click "Create project"

### 2. Enable Authentication

1. In the Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider
5. Save the changes

### 3. Create Firestore Database

1. In the Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll configure security rules later)
4. Select a location (choose closest to your users)
5. Click "Done"

### 4. Enable Storage

1. In the Firebase Console, go to "Storage"
2. Click "Get started"
3. Review security rules (we'll configure these later)
4. Choose a location (same as Firestore)
5. Click "Done"

### 5. Get Firebase Configuration

1. In the Firebase Console, go to "Project settings" (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and choose "Web" (</> icon)
4. Enter app nickname: `laromacorea-web`
5. Check "Also set up Firebase Hosting" (optional)
6. Click "Register app"
7. Copy the configuration object

### 6. Configure Environment Variables

1. Copy `.env.example` to `.env`
2. Replace the placeholder values with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_actual_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
VITE_FIREBASE_APP_ID=your_actual_app_id
```

## Authentication System Implementation

The authentication system has been implemented with the following features:

### Core Features

- ✅ Email/password authentication (sign up, sign in, sign out)
- ✅ Password reset functionality
- ✅ User profile management with Firestore integration
- ✅ Real-time authentication state management
- ✅ Korean error messages for better UX
- ✅ Email verification support
- ✅ User points system (100 initial points for new users)
- ✅ Admin role support
- ✅ Route protection middleware

### Files Created/Updated

- `src/services/firebase.js` - Enhanced Firebase configuration with validation
- `src/services/auth.js` - Comprehensive authentication service
- `src/stores/user.js` - Enhanced Pinia store for user state management
- `src/composables/useAuth.js` - Reusable authentication composable
- `src/middleware/auth.js` - Route protection middleware
- `src/__tests__/auth.spec.js` - Comprehensive test suite
- `.env` - Environment configuration file
- `src/main.js` - Updated to initialize authentication

## Security Rules

### Firestore Security Rules

Replace the default rules in Firestore with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null; // Allow reading other users for display purposes
    }

    // Posts are readable by all authenticated users
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.authorId;
      allow update, delete: if request.auth != null &&
        (request.auth.uid == resource.data.authorId ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

    // Comments follow similar rules to posts
    match /comments/{commentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.authorId;
      allow update, delete: if request.auth != null &&
        (request.auth.uid == resource.data.authorId ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

    // Icons are readable by all, writable by admins only
    match /icons/{iconId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Points history is readable by owner and admins
    match /points_history/{historyId} {
      allow read: if request.auth != null &&
        (request.auth.uid == resource.data.userId ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null;
    }
  }
}
```

### Storage Security Rules

Replace the default Storage rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Images and videos for posts
    match /posts/{postId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        request.resource.size < 10 * 1024 * 1024 && // 10MB limit
        request.resource.contentType.matches('image/.*|video/.*');
    }

    // User profile images
    match /users/{userId}/profile/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId &&
        request.resource.size < 5 * 1024 * 1024 && // 5MB limit
        request.resource.contentType.matches('image/.*');
    }

    // Icon images (admin only)
    match /icons/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Database Structure

The application uses the following Firestore collections:

### users

```javascript
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string | null,
  selectedIcon: string | null,
  points: number,
  role: 'user' | 'admin',
  createdAt: timestamp,
  lastLoginAt: timestamp,
  isActive: boolean,
  emailVerified: boolean
}
```

### posts

```javascript
{
  id: string,
  boardType: 'notice' | 'squad' | 'match' | 'calcio' | 'free' | 'special' | 'media',
  title: string,
  content: string,
  authorId: string,
  authorName: string,
  authorIcon: string | null,
  createdAt: timestamp,
  updatedAt: timestamp,
  viewCount: number,
  likeCount: number,
  commentCount: number,
  isPinned: boolean,
  tags: string[],
  mediaUrls: string[]
}
```

### comments

```javascript
{
  id: string,
  postId: string,
  parentId: string | null, // for replies
  authorId: string,
  authorName: string,
  authorIcon: string | null,
  content: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  likeCount: number,
  isDeleted: boolean
}
```

### icons

```javascript
{
  id: string,
  name: string,
  imageUrl: string,
  price: number,
  category: string,
  isActive: boolean,
  createdAt: timestamp
}
```

### points_history

```javascript
{
  id: string,
  userId: string,
  action: 'post_create' | 'comment_create' | 'icon_purchase' | 'admin_adjustment',
  points: number, // positive for earning, negative for spending
  description: string,
  createdAt: timestamp,
  relatedId: string | null // postId, commentId, iconId, etc.
}
```

## Usage Examples

### Using the Authentication Composable

```vue
<script setup>
import { useAuth } from '@/composables/useAuth'

const { user, isAuthenticated, loading, signIn, signUp, signOut } = useAuth()

const handleSignIn = async () => {
  const result = await signIn('user@example.com', 'password')
  if (result.success) {
    console.log('Signed in successfully')
  } else {
    console.error('Sign in failed:', result.error)
  }
}
</script>
```

### Using Route Protection

```javascript
import { requireAuth, requireAdmin } from '@/middleware/auth'

const routes = [
  {
    path: '/profile',
    component: ProfileView,
    beforeEnter: requireAuth,
  },
  {
    path: '/admin',
    component: AdminView,
    beforeEnter: requireAdmin,
  },
]
```

## Testing the Setup

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Run the authentication tests:

   ```bash
   npm run test:unit -- --run src/__tests__/auth.spec.js
   ```

3. Check the browser console for any Firebase connection errors

## Troubleshooting

### Common Issues

1. **"Firebase configuration incomplete" warning**
   - Make sure all environment variables in `.env` are set with actual values
   - Restart the development server after updating `.env`

2. **Authentication not working**
   - Verify that Email/Password authentication is enabled in Firebase Console
   - Check that the API key and auth domain are correct

3. **Firestore permission denied**
   - Make sure security rules are properly configured
   - Verify that the user is authenticated before making database calls

4. **Storage upload fails**
   - Check Storage security rules
   - Verify file size and type restrictions

### Development Tips

1. Use Firebase Emulator Suite for local development:

   ```bash
   npm install -g firebase-tools
   firebase init emulators
   firebase emulators:start
   ```

2. Set `VITE_USE_FIREBASE_EMULATOR=true` in `.env` to connect to local emulators

3. Monitor Firebase usage in the Console to avoid exceeding free tier limits

## Next Steps

After completing the Firebase setup:

1. ✅ Test user registration and login functionality
2. Create the first admin user manually in Firebase Console
3. Set up the basic layout components (Task 3)
4. Implement the board system (Tasks 4-6)
5. Add the icon shop functionality (Task 5.2)

For production deployment, remember to:

1. Update security rules for production use
2. Set up proper error monitoring
3. Configure Firebase Hosting
4. Set up backup strategies for Firestore data
