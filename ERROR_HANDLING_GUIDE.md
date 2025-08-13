# Error Handling & Loading State System

This document describes the comprehensive error handling and loading state management system implemented for the AS Roma Korea Community website.

## Overview

The error handling system provides:

- Global error management with user-friendly notifications
- Network status monitoring and offline handling
- Loading state management with skeleton UI
- Automatic error recovery and retry mechanisms
- Type-safe error handling for different error categories

## Architecture

### Core Components

1. **Error Store** (`src/stores/error.js`) - Centralized error state management
2. **Error Handler Composable** (`src/composables/useErrorHandler.js`) - Error handling utilities
3. **Loading Composable** (`src/composables/useLoading.js`) - Loading state management
4. **Network Status Composable** (`src/composables/useNetworkStatus.js`) - Network monitoring
5. **UI Components** - Error notifications and loading indicators

### Error Types

```javascript
const ERROR_TYPES = {
  NETWORK: 'network', // Network connectivity issues
  AUTH: 'auth', // Authentication errors
  VALIDATION: 'validation', // Form validation errors
  PERMISSION: 'permission', // Authorization errors
  SERVER: 'server', // Server-side errors
  UNKNOWN: 'unknown', // Unclassified errors
}
```

## Usage Guide

### Basic Error Handling

```javascript
import { useErrorHandler } from '@/composables/useErrorHandler'

const { handleError, handleAuthError, handleValidationError } = useErrorHandler()

// Handle different error types
try {
  await someOperation()
} catch (error) {
  handleError(error, 'Operation Context')
}

// Handle specific error types
handleAuthError(authError, 'Login')
handleValidationError('Invalid email format', 'Form Validation')
```

### Loading States

```javascript
import { useLoading, useGlobalLoading } from '@/composables/useLoading'

// Local loading state
const { loading, setLoading, withLoading } = useLoading()

// With automatic loading management
const result = await withLoading(async () => {
  return await apiCall()
})

// Global loading state
const { setGlobalLoading, withGlobalLoading } = useGlobalLoading()

await withGlobalLoading(async () => {
  await heavyOperation()
}, 'Processing data...')
```

### Network Status Monitoring

```javascript
import { useNetworkStatus } from '@/composables/useNetworkStatus'

const { isOnline, connectionType, effectiveType, isSlowConnection, getConnectionQuality } =
  useNetworkStatus()

// Automatically monitors network status and updates error store
```

### Error Recovery

```javascript
import { useErrorStore } from '@/stores/error'

const errorStore = useErrorStore()

// Retry failed operations
const result = await errorStore.retryNetworkOperation(
  () => apiCall(),
  3, // max retries
)
```

## UI Components

### Error Notification Component

Displays global error notifications with different styles based on error type:

```vue
<template>
  <ErrorNotification />
</template>
```

Features:

- Network error banners
- Offline status indicators
- Dismissible error snackbars
- Auto-dismiss for non-critical errors
- Contextual error information

### Loading Overlay Component

Global loading overlay for heavy operations:

```vue
<template>
  <LoadingOverlay />
</template>
```

Features:

- Backdrop blur effect
- Customizable loading messages
- Responsive design
- Dark theme support

### Skeleton Loader Component

Provides skeleton loading states for different content types:

```vue
<template>
  <SkeletonLoader type="post-list" :count="3" />
</template>
```

Available types:

- `post-list` - Blog post list skeleton
- `post-detail` - Single post detail skeleton
- `comment-list` - Comment list skeleton
- `icon-grid` - Icon grid skeleton
- `card-list` - Card grid skeleton
- Generic line skeletons (`full`, `medium`, `short`, etc.)

### Loading Button Component

Button with integrated loading state:

```vue
<template>
  <LoadingButton :async-action="handleSubmit" color="primary"> Submit </LoadingButton>
</template>
```

## Integration with Stores

### User Store Integration

```javascript
// In user store actions
async function signIn(email, password) {
  errorStore.setLoading('auth-signin', true)

  try {
    const result = await AuthService.signIn(email, password)
    return result
  } catch (error) {
    errorStore.handleFirebaseError(error, 'User Sign In')
    throw error
  } finally {
    errorStore.setLoading('auth-signin', false)
  }
}
```

### Boards Store Integration

```javascript
// In boards store actions
async function fetchPosts(boardType) {
  const loadingKey = `fetch-posts-${boardType}`
  errorStore.setLoading(loadingKey, true)

  try {
    const posts = await ApiService.getDocuments('posts', constraints)
    return posts
  } catch (error) {
    errorStore.handleFirebaseError(error, `Fetch Posts - ${boardType}`)
    throw error
  } finally {
    errorStore.setLoading(loadingKey, false)
  }
}
```

## Global Error Handling

### Vue Error Handler

Automatically catches and handles Vue component errors:

```javascript
// In main.js
app.config.errorHandler = (error, instance, info) => {
  const errorStore = useErrorStore()
  errorStore.addError(error, errorStore.ERROR_TYPES.UNKNOWN, `Vue Error: ${info}`)
}
```

### Unhandled Promise Rejections

Catches unhandled promise rejections:

```javascript
// In main.js
window.addEventListener('unhandledrejection', (event) => {
  const errorStore = useErrorStore()
  errorStore.addError(event.reason, errorStore.ERROR_TYPES.UNKNOWN, 'Unhandled Promise')
  event.preventDefault()
})
```

## Firebase Error Handling

### Authentication Errors

```javascript
const authErrorMessages = {
  'auth/user-not-found': '등록되지 않은 이메일입니다.',
  'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
  'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
  'auth/weak-password': '비밀번호는 최소 6자 이상이어야 합니다.',
  'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
  'auth/too-many-requests': '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.',
}
```

### Firestore Errors

```javascript
const firestoreErrorMessages = {
  'permission-denied': '권한이 없습니다.',
  unavailable: '서비스를 일시적으로 사용할 수 없습니다.',
  'deadline-exceeded': '요청 시간이 초과되었습니다.',
  'invalid-argument': '잘못된 요청입니다.',
}
```

## Testing

The error handling system includes comprehensive tests:

```bash
npm run test:unit -- --run src/__tests__/error-handling.spec.js
```

Test coverage includes:

- Error store functionality
- Error handler composable
- Loading state management
- Network error handling
- Error recovery mechanisms

## Best Practices

### 1. Use Specific Error Types

```javascript
// Good
handleValidationError('Email format is invalid', 'User Registration')

// Avoid
handleError('Error occurred')
```

### 2. Provide Context

```javascript
// Good
errorStore.handleFirebaseError(error, 'User Profile Update')

// Avoid
errorStore.handleFirebaseError(error)
```

### 3. Use Loading Keys for Specific Operations

```javascript
// Good
errorStore.setLoading('fetch-user-posts', true)

// Avoid
errorStore.setGlobalLoading(true) // for specific operations
```

### 4. Handle Errors at the Right Level

```javascript
// Handle at component level for UI feedback
try {
  await userAction()
} catch (error) {
  // Show user-friendly message
  showSnackbar('Action failed. Please try again.')
}

// Handle at store level for global state
// Store automatically handles errors and updates global state
```

### 5. Use Skeleton Loading for Better UX

```vue
<template>
  <div>
    <SkeletonLoader v-if="loading" type="post-list" :count="5" />
    <PostList v-else :posts="posts" />
  </div>
</template>
```

## Performance Considerations

### 1. Debounced Loading States

For rapid state changes, use debounced loading:

```javascript
import { useDebouncedLoading } from '@/composables/useLoading'

const { loading, setLoading } = useDebouncedLoading(300)
```

### 2. Error Cleanup

Errors are automatically cleaned up:

- Auto-dismiss after 10 seconds for non-critical errors
- Manual dismissal available
- Batch clearing for multiple errors

### 3. Network Monitoring

Network status is monitored efficiently:

- Uses native browser APIs
- Periodic connectivity checks (30-second intervals)
- Minimal performance impact

## Accessibility

The error handling system follows accessibility best practices:

### 1. Screen Reader Support

- Error messages are announced to screen readers
- Loading states provide appropriate ARIA labels
- Focus management during error states

### 2. Keyboard Navigation

- Error dismissal buttons are keyboard accessible
- Loading overlays don't trap focus inappropriately
- Proper tab order maintained

### 3. Color and Contrast

- Error colors meet WCAG contrast requirements
- Icons supplement color coding
- High contrast mode support

## Troubleshooting

### Common Issues

1. **Errors not displaying**
   - Check if ErrorNotification component is included in App.vue
   - Verify error store is properly initialized

2. **Loading states not working**
   - Ensure loading keys are unique
   - Check if LoadingOverlay component is included

3. **Network status not updating**
   - Verify useNetworkStatus is called in App.vue
   - Check browser support for Network Information API

### Debug Mode

Enable debug logging in development:

```javascript
// In main.js (development only)
if (import.meta.env.DEV) {
  window.errorStore = useErrorStore()
  console.log('Error store available as window.errorStore')
}
```

## Migration Guide

### From Legacy Error Handling

1. Replace manual error state management:

```javascript
// Before
const error = ref(null)
const loading = ref(false)

try {
  loading.value = true
  await operation()
} catch (err) {
  error.value = err.message
} finally {
  loading.value = false
}

// After
const { withLoading } = useLoading()
const { handleError } = useErrorHandler()

try {
  await withLoading(() => operation())
} catch (error) {
  handleError(error, 'Operation Context')
}
```

2. Update error display components:

```vue
<!-- Before -->
<v-alert v-if="error" type="error">{{ error }}</v-alert>

<!-- After -->
<ErrorNotification />
```

3. Replace loading indicators:

```vue
<!-- Before -->
<v-progress-circular v-if="loading" />

<!-- After -->
<SkeletonLoader v-if="loading" type="post-list" />
```

This comprehensive error handling system provides a robust foundation for managing errors and loading states throughout the application, ensuring a smooth user experience even when things go wrong.
