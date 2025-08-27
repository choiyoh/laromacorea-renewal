<template>
  <v-avatar :size="size" :class="avatarClass">
    <v-img
      v-if="currentIcon?.url || photoURL"
      :src="currentIcon?.url || photoURL"
      :alt="displayName || '익명'"
    />
    <v-icon v-else :icon="defaultIcon" :size="computedIconSize" />
  </v-avatar>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useUserIcon } from '@/composables/useUserIcon';

const props = defineProps({
  userId: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    default: '익명',
  },
  photoURL: {
    type: String,
    default: null,
  },
  size: {
    type: [String, Number],
    default: 24,
  },
  defaultIcon: {
    type: String,
    default: 'mdi-account',
  },
  iconSize: {
    type: [String, Number],
    default: null, // null이면 자동 계산
  },
  avatarClass: {
    type: String,
    default: '',
  },
  // 정적 아이콘 URL (fallback용)
  staticIconUrl: {
    type: String,
    default: null,
  },
});

const { getUserCurrentIcon } = useUserIcon();
const currentIcon = ref(null);

// 아바타 크기에 비례한 아이콘 크기 계산 (기본 아이콘에만 적용)
const computedIconSize = computed(() => {
  if (props.iconSize !== null) {
    return props.iconSize;
  }

  // 사용자 아이콘이 있는 경우는 원래 크기 유지
  if (currentIcon.value?.url || props.photoURL || props.staticIconUrl) {
    const avatarSize =
      typeof props.size === 'string' ? parseInt(props.size) : props.size;
    return Math.max(12, Math.round(avatarSize * 0.65));
  }

  // 기본 아이콘(mdi-account 등)은 고정 크기 24px
  return 24;
});

async function loadUserIcon() {
  if (!props.userId) return;

  try {
    const iconData = await getUserCurrentIcon(props.userId);
    currentIcon.value = iconData;
  } catch (error) {
    // fallback으로 정적 아이콘 사용
    if (props.staticIconUrl) {
      currentIcon.value = { url: props.staticIconUrl };
    }
  }
}

// 컴포넌트 마운트 시 아이콘 로드
onMounted(() => {
  loadUserIcon();
});

// userId가 변경되면 아이콘 다시 로드
watch(
  () => props.userId,
  () => {
    loadUserIcon();
  },
);
</script>
