<template>
  <div class="icon-shop">
    <!-- 헤더 섹션 -->
    <v-card class="mb-6">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="8">
            <h1 class="text-h4 mb-2">
              <v-icon class="me-2">mdi-store</v-icon>
              아이콘 상점
            </h1>
            <p class="text-body-1 text-medium-emphasis">
              포인트를 사용하여 다양한 아이콘을 구매하고 개성을 표현해보세요!
            </p>
          </v-col>
          <v-col cols="12" md="4" class="text-center">
            <div class="d-flex align-center justify-center">
              <v-icon size="32" color="amber" class="me-2">mdi-star</v-icon>
              <div>
                <div class="text-h5 font-weight-bold text-amber">
                  {{ userPoints.toLocaleString() }}
                </div>
                <div class="text-body-2 text-medium-emphasis">보유 포인트</div>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 필터 및 검색 -->
    <v-card class="mb-6">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="searchQuery"
              label="아이콘 검색"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="selectedCategory"
              :items="categoryOptions"
              label="카테고리"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="sortBy"
              :items="sortOptions"
              label="정렬"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 구매한 아이콘 섹션 -->
    <v-card v-if="purchasedIcons.length > 0" class="mb-6">
      <v-card-title>
        <v-icon class="me-2">mdi-check-circle</v-icon>
        구매한 아이콘
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col
            v-for="icon in purchasedIcons"
            :key="icon.id"
            cols="6"
            sm="4"
            md="3"
            lg="2"
          >
            <v-card
              :class="[
                'icon-card purchased-icon',
                { 'selected-icon': user?.selectedIcon === icon.id },
              ]"
              @click="selectIcon(icon)"
            >
              <v-card-text class="text-center pa-3">
                <v-avatar size="48" class="mb-2">
                  <v-img :src="icon.url" :alt="icon.name" />
                </v-avatar>
                <div class="text-body-2 font-weight-medium">
                  {{ icon.name }}
                </div>
                <v-chip
                  v-if="user?.selectedIcon === icon.id"
                  color="success"
                  size="x-small"
                  class="mt-1"
                >
                  사용 중
                </v-chip>
                <v-btn
                  v-else
                  color="primary"
                  size="x-small"
                  variant="outlined"
                  class="mt-1"
                  @click.stop="selectIcon(icon)"
                  :loading="loading"
                >
                  선택
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 아이콘 목록 -->
    <v-card>
      <v-card-title>
        <v-icon class="me-2">mdi-shopping</v-icon>
        구매 가능한 아이콘
      </v-card-title>
      <v-card-text>
        <div v-if="loading && icons.length === 0" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" />
          <div class="mt-2">아이콘을 불러오는 중...</div>
        </div>

        <div v-else-if="filteredIcons.length === 0" class="text-center py-8">
          <v-icon size="64" class="mb-4 text-medium-emphasis"
            >mdi-package-variant</v-icon
          >
          <h3 class="text-h6 mb-2">아이콘이 없습니다</h3>
          <p class="text-body-2 text-medium-emphasis">
            {{
              searchQuery || selectedCategory !== 'all'
                ? '검색 조건에 맞는 아이콘이 없습니다.'
                : '현재 구매 가능한 아이콘이 없습니다.'
            }}
          </p>
        </div>

        <v-row v-else>
          <v-col
            v-for="icon in filteredIcons"
            :key="icon.id"
            cols="6"
            sm="4"
            md="3"
            lg="2"
          >
            <v-card
              :class="[
                'icon-card',
                { 'insufficient-points': userPoints < icon.price },
              ]"
              @click="showPurchaseDialog(icon)"
            >
              <v-card-text class="text-center pa-3">
                <v-avatar size="48" class="mb-2">
                  <v-img :src="icon.url" :alt="icon.name" />
                </v-avatar>
                <div class="text-body-2 font-weight-medium mb-1">
                  {{ icon.name }}
                </div>
                <v-chip
                  :color="userPoints >= icon.price ? 'success' : 'error'"
                  size="small"
                  variant="flat"
                >
                  <v-icon start size="16">mdi-star</v-icon>
                  {{ icon.price.toLocaleString() }}
                </v-chip>
                <div
                  v-if="icon.description"
                  class="text-caption text-medium-emphasis mt-1"
                >
                  {{ icon.description }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 구매 확인 다이얼로그 -->
    <v-dialog v-model="purchaseDialog.show" max-width="400">
      <v-card v-if="purchaseDialog.icon">
        <v-card-title class="text-h6">아이콘 구매</v-card-title>
        <v-card-text>
          <div class="text-center mb-4">
            <v-avatar size="80" class="mb-2">
              <v-img
                :src="purchaseDialog.icon.url"
                :alt="purchaseDialog.icon.name"
              />
            </v-avatar>
            <h3 class="text-h6">{{ purchaseDialog.icon.name }}</h3>
            <p
              v-if="purchaseDialog.icon.description"
              class="text-body-2 text-medium-emphasis"
            >
              {{ purchaseDialog.icon.description }}
            </p>
          </div>

          <v-divider class="my-4" />

          <div class="d-flex justify-space-between align-center mb-2">
            <span>구매 가격:</span>
            <v-chip color="warning" variant="flat">
              <v-icon start size="16">mdi-star</v-icon>
              {{ purchaseDialog.icon.price.toLocaleString() }}
            </v-chip>
          </div>

          <div class="d-flex justify-space-between align-center mb-2">
            <span>보유 포인트:</span>
            <v-chip color="success" variant="flat">
              <v-icon start size="16">mdi-star</v-icon>
              {{ userPoints.toLocaleString() }}
            </v-chip>
          </div>

          <div class="d-flex justify-space-between align-center">
            <span>구매 후 포인트:</span>
            <v-chip
              :color="
                userPoints - purchaseDialog.icon.price >= 0 ? 'info' : 'error'
              "
              variant="flat"
            >
              <v-icon start size="16">mdi-star</v-icon>
              {{ (userPoints - purchaseDialog.icon.price).toLocaleString() }}
            </v-chip>
          </div>

          <v-alert
            v-if="userPoints < purchaseDialog.icon.price"
            type="error"
            variant="tonal"
            class="mt-4"
          >
            포인트가 부족합니다.
            {{ (purchaseDialog.icon.price - userPoints).toLocaleString() }}
            포인트가 더 필요합니다.
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="purchaseDialog.show = false">취소</v-btn>
          <v-btn
            color="primary"
            :disabled="userPoints < purchaseDialog.icon.price"
            :loading="loading"
            @click="purchaseIcon"
          >
            구매하기
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 성공/에러 스낵바 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false"> 닫기 </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { iconService, userService } from '@/services/database';
import { useUserIcon } from '@/composables/useUserIcon';

// Composables
const { user, updateProfile } = useAuth();
const { invalidateUserIconCache } = useUserIcon();

// Reactive data
const loading = ref(false);
const icons = ref([]);
const purchasedIconIds = ref([]);
const searchQuery = ref('');
const selectedCategory = ref('all');
const sortBy = ref('price-asc');

const purchaseDialog = ref({
  show: false,
  icon: null,
});

const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
});

// Computed
const userPoints = computed(() => user.value?.points || 0);

const categoryOptions = computed(() => [
  { title: '전체', value: 'all' },
  { title: '선수', value: 'player' },
  { title: '로고', value: 'logo' },
  { title: '특별', value: 'special' },
  { title: '시즌', value: 'seasonal' },
]);

const sortOptions = [
  { title: '가격 낮은순', value: 'price-asc' },
  { title: '가격 높은순', value: 'price-desc' },
  { title: '이름순', value: 'name-asc' },
  { title: '인기순', value: 'popularity-desc' },
];

const purchasedIcons = computed(() => {
  return icons.value.filter((icon) => purchasedIconIds.value.includes(icon.id));
});

const availableIcons = computed(() => {
  return icons.value.filter(
    (icon) => !purchasedIconIds.value.includes(icon.id),
  );
});

const filteredIcons = computed(() => {
  let filtered = [...availableIcons.value];

  // 검색 필터
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (icon) =>
        icon.name.toLowerCase().includes(query) ||
        (icon.description && icon.description.toLowerCase().includes(query)),
    );
  }

  // 카테고리 필터
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(
      (icon) => icon.category === selectedCategory.value,
    );
  }

  // 정렬
  switch (sortBy.value) {
    case 'price-asc':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filtered.sort((a, b) => b.price - a.price);
      break;
    case 'name-asc':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'popularity-desc':
      filtered.sort((a, b) => (b.purchaseCount || 0) - (a.purchaseCount || 0));
      break;
  }

  return filtered;
});

// Methods
const showSnackbar = (message, color = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color,
  };
};

const loadIcons = async () => {
  try {
    loading.value = true;
    icons.value = await iconService.getActiveIcons();
  } catch (error) {
    showSnackbar('아이콘 목록을 불러오는데 실패했습니다', 'error');
  } finally {
    loading.value = false;
  }
};

const loadPurchasedIcons = async () => {
  if (!user.value?.uid) return;

  try {
    const purchased = await iconService.getUserPurchasedIcons(user.value.uid);
    purchasedIconIds.value = purchased.map((item) => item.iconId);
  } catch (error) {
    // Error loading purchased icons
  }
};

const showPurchaseDialog = (icon) => {
  purchaseDialog.value = {
    show: true,
    icon,
  };
};

const purchaseIcon = async () => {
  const icon = purchaseDialog.value.icon;
  if (!icon || !user.value?.uid) return;

  try {
    loading.value = true;

    // 포인트 부족 체크
    if (userPoints.value < icon.price) {
      showSnackbar('포인트가 부족합니다', 'error');
      return;
    }

    // 아이콘 구매
    await iconService.purchaseIcon(user.value.uid, icon.id, icon.price);

    // 구매한 아이콘 목록에 추가
    purchasedIconIds.value.push(icon.id);

    // 사용자 데이터 새로고침
    await refreshUserData();

    purchaseDialog.value.show = false;
    showSnackbar(`${icon.name} 아이콘을 구매했습니다!`);
  } catch (error) {
    showSnackbar('아이콘 구매에 실패했습니다', 'error');
  } finally {
    loading.value = false;
  }
};

const selectIcon = async (icon) => {
  if (!user.value?.uid) return;

  try {
    loading.value = true;

    await updateProfile({
      selectedIcon: icon.id,
      selectedIconData: {
        id: icon.id,
        name: icon.name,
        url: icon.url,
      },
    });

    // 사용자 아이콘 캐시 무효화
    invalidateUserIconCache(user.value.uid);

    showSnackbar(`${icon.name} 아이콘을 선택했습니다`);
  } catch (error) {
    showSnackbar('아이콘 선택에 실패했습니다', 'error');
  } finally {
    loading.value = false;
  }
};

const refreshUserData = async () => {
  if (!user.value?.uid) return;

  try {
    const userData = await userService.getUser(user.value.uid);
    if (userData) {
      // 사용자 스토어 업데이트 (포인트 등)
      Object.assign(user.value, userData);
    }
  } catch (error) {
    // Error refreshing user data
  }
};

// Lifecycle
onMounted(async () => {
  await loadIcons();
  if (user.value?.uid) {
    await loadPurchasedIcons();
  }
});
</script>

<style scoped>
.icon-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.icon-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.icon-card.insufficient-points {
  opacity: 0.6;
}

.icon-card.insufficient-points:hover {
  transform: none;
}

.purchased-icon {
  border-color: #4caf50;
  background-color: rgba(76, 175, 80, 0.05);
}

.selected-icon {
  border-color: #2196f3;
  background-color: rgba(33, 150, 243, 0.1);
}

.purchased-icon:hover,
.selected-icon:hover {
  border-color: #4caf50;
  background-color: rgba(76, 175, 80, 0.1);
}
</style>
