<template>
  <v-btn
    v-bind="$attrs"
    :loading="isLoading"
    :disabled="disabled || isLoading"
    @click="handleClick"
  >
    <slot />
  </v-btn>
</template>

<script setup>
import { computed } from 'vue'
import { useLoading } from '@/composables/useLoading'

const props = defineProps({
  loadingKey: {
    type: String,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  asyncAction: {
    type: Function,
    default: null,
  },
})

const emit = defineEmits(['click'])

const { loading, withLoading } = useLoading(props.loadingKey)

const isLoading = computed(() => loading.value)

const handleClick = async (event) => {
  if (props.asyncAction) {
    await withLoading(() => props.asyncAction(event))
  } else {
    emit('click', event)
  }
}
</script>
