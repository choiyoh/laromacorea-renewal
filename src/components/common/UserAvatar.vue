<template>
  <v-avatar :size="size" :class="avatarClass">
    <v-img
      v-if="currentIcon?.url || photoURL"
      :src="currentIcon?.url || photoURL"
      :alt="displayName || '익명'"
    />
    <v-icon v-else :icon="defaultIcon" :size="iconSize" />
  </v-avatar>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
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
    default: 16,
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

async function loadUserIcon() {
  if (!props.userId) return;

  try {
    const iconData = await getUserCurrentIcon(props.userId);
    currentIcon.value = iconData;
  } catch (error) {
    console.error('Error loading user icon:', error);
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
