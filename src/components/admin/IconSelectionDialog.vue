<template>
  <v-dialog :model-value="show" @update:model-value="$emit('close')" max-width="800px">
    <v-card>
      <v-card-title>
        <span class="text-h5">아이콘 변경: {{ user?.displayName }}</span>
      </v-card-title>
      <v-card-text>
        <div v-if="loading" class="text-center">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
        <v-row v-else>
          <v-col v-for="icon in icons" :key="icon.id" cols="6" sm="4" md="3">
            <v-card
              :class="{'selected-icon': selectedIcon === icon.id}"
              @click="selectedIcon = icon.id"
              class="icon-card"
            >
              <v-avatar size="48" class="mb-2">
                <v-img :src="icon.url" :alt="icon.name"></v-img>
              </v-avatar>
              <div class="text-body-2 font-weight-medium">{{ icon.name }}</div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue-darken-1" variant="text" @click="$emit('close')">
          취소
        </v-btn>
        <v-btn color="blue-darken-1" variant="text" @click="saveIcon" :disabled="!selectedIcon">
          저장
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { iconService } from '@/services/database';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  user: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['close', 'save']);

const loading = ref(false);
const icons = ref([]);
const selectedIcon = ref(null);

async function fetchIcons() {
  loading.value = true;
  try {
    icons.value = await iconService.getActiveIcons();
  } catch (error) {
    console.error('Error fetching icons:', error);
  } finally {
    loading.value = false;
  }
}

function saveIcon() {
  if (selectedIcon.value) {
    const iconObject = icons.value.find(icon => icon.id === selectedIcon.value);
    emit('save', iconObject);
  }
}

onMounted(() => {
  fetchIcons();
});

watch(() => props.user, (newUser) => {
  if (newUser) {
    selectedIcon.value = newUser.selectedIcon;
  }
});
</script>

<style scoped>
.icon-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  text-align: center;
  padding: 16px;
}

.icon-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.selected-icon {
  border-color: #2196f3;
  background-color: rgba(33, 150, 243, 0.1);
}
</style>
