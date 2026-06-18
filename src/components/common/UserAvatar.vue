<template>
  <div
    class="avatar-container"
    :style="{ width: `${size}px`, height: `${size}px` }"
    :class="avatarClass"
  >
    <v-img
      v-if="currentIcon?.url || photoURL"
      :src="toCdnUrl(currentIcon?.url || photoURL)"
      :alt="displayName || '익명'"
      height="100%"
      width="100%"
      style="object-fit: cover"
    />
    <v-icon v-else :icon="defaultIcon" :size="computedIconSize" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useUserIcon } from '@/composables/useUserIcon';
import { toCdnUrl } from '@/utils/image';

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
  // 1. staticIconUrl이 있으면 DB 조회 없이 바로 사용 (N+1 방지 핵심)
  if (props.staticIconUrl) {
    currentIcon.value = { url: props.staticIconUrl };
    return;
  }

  // 2. photoURL이 있으면(구글 로그인 등) 굳이 아이콘 조회 안 해도 됨 (선택사항, 기획에 따라 다름)
  // 현재 로직상 photoURL이 있어도 아이콘을 우선 보여주는지 확인 필요.
  // 템플릿: v-if="currentIcon?.url || photoURL" -> 아이콘이 있으면 아이콘이 우선됨.
  // 따라서 photoURL이 있어도 아이콘 확인을 위해 조회를 하긴 해야 함.
  // 하지만 "비용 절감"이 최우선이라면, photoURL이 있을 때 조회를 안 하는 옵션도 고려 가능.
  // 일단 안전하게 staticIconUrl(게시글에 박제된 아이콘)이 있을 때만 조회 건너뛰기.

  if (!props.userId) return;

  try {
    const iconData = await getUserCurrentIcon(props.userId);
    currentIcon.value = iconData;
  } catch {
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

// userId나 staticIconUrl이 변경되면 아이콘 다시 로드
watch([() => props.userId, () => props.staticIconUrl], () => {
  loadUserIcon();
});
</script>

<style scoped>
.avatar-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  background-color: #f0f0f0;
  flex-shrink: 0; /* 컨테이너 크기 고정 */
  aspect-ratio: 1; /* 정사각형 비율 강제 */
}
</style>
