<template>
  <div class="lazy-image-container" :class="containerClass">
    <img
      ref="imageRef"
      :class="imageClass"
      :alt="alt"
      :data-src="src"
      :src="currentSrc"
      @load="onLoad"
      @error="onError"
    />

    <!-- Loading placeholder -->
    <div v-if="showLoading" class="lazy-image-loading">
      <v-progress-circular v-if="!customLoading" indeterminate size="24" color="primary" />
      <slot v-else name="loading" />
    </div>

    <!-- Error placeholder -->
    <div v-if="isError && showError" class="lazy-image-error">
      <v-icon v-if="!customError" icon="mdi-image-broken" size="24" />
      <slot v-else name="error" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useLazyImage } from '@/composables/useLazyImage'

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '/placeholder.jpg',
  },
  errorImage: {
    type: String,
    default: '/error.jpg',
  },
  aspectRatio: {
    type: [String, Number],
    default: null,
  },
  objectFit: {
    type: String,
    default: 'cover',
    validator: (value) => ['cover', 'contain', 'fill', 'none', 'scale-down'].includes(value),
  },
  lazy: {
    type: Boolean,
    default: true,
  },
  showLoading: {
    type: Boolean,
    default: true,
  },
  showError: {
    type: Boolean,
    default: true,
  },
  customLoading: {
    type: Boolean,
    default: false,
  },
  customError: {
    type: Boolean,
    default: false,
  },
  rootMargin: {
    type: String,
    default: '50px',
  },
  threshold: {
    type: Number,
    default: 0.1,
  },
})

const emit = defineEmits(['load', 'error', 'intersect'])

const currentSrc = ref(props.placeholder)

const { imageRef, isLoaded, isError, isIntersecting } = useLazyImage({
  rootMargin: props.rootMargin,
  threshold: props.threshold,
  placeholder: props.placeholder,
  errorImage: props.errorImage,
})

const containerClass = computed(() => ({
  'lazy-image-container--loading': !isLoaded.value && !isError.value,
  'lazy-image-container--loaded': isLoaded.value,
  'lazy-image-container--error': isError.value,
  'lazy-image-container--aspect-ratio': props.aspectRatio,
}))

const imageClass = computed(() => ({
  'lazy-image': true,
  'lazy-image--loaded': isLoaded.value,
  'lazy-image--error': isError.value,
  [`lazy-image--${props.objectFit}`]: true,
}))

const onLoad = () => {
  emit('load')
}

const onError = () => {
  currentSrc.value = props.errorImage
  emit('error')
}

// Watch for intersection changes
watch(isIntersecting, (value) => {
  if (value) {
    emit('intersect')
  }
})

// Handle non-lazy loading
if (!props.lazy) {
  currentSrc.value = props.src
}
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  display: inline-block;
  overflow: hidden;
}

.lazy-image-container--aspect-ratio {
  width: 100%;
  height: 0;
  padding-bottom: v-bind('aspectRatio ? `${(1 / aspectRatio) * 100}%` : "56.25%"');
}

.lazy-image-container--aspect-ratio .lazy-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.lazy-image {
  display: block;
  width: 100%;
  height: auto;
  transition:
    opacity 0.3s ease,
    filter 0.3s ease;
}

.lazy-image--cover {
  object-fit: cover;
}

.lazy-image--contain {
  object-fit: contain;
}

.lazy-image--fill {
  object-fit: fill;
}

.lazy-image--none {
  object-fit: none;
}

.lazy-image--scale-down {
  object-fit: scale-down;
}

.lazy-image-container--loading .lazy-image {
  opacity: 0;
  filter: blur(5px);
}

.lazy-image-container--loaded .lazy-image {
  opacity: 1;
  filter: none;
}

.lazy-image-container--error .lazy-image {
  opacity: 0.5;
  filter: grayscale(100%);
}

.lazy-image-loading,
.lazy-image-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.6);
}

.lazy-image-loading {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  padding: 8px;
}

.lazy-image-error {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  padding: 8px;
}

/* Responsive images */
@media (max-width: 768px) {
  .lazy-image-container {
    width: 100%;
  }
}
</style>
