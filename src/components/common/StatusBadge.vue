<template>
  <span class="status-badge" :class="`status-${color}`">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue'
import { ASSET_STATUS, APPLICATION_STATUS } from '@/utils/constants'

const props = defineProps({
  status: { type: String, default: '' },
  type: { type: String, default: '' }
})

const allStatus = { ...ASSET_STATUS, ...APPLICATION_STATUS }
const info = computed(() => {
  const s = props.status || props.type || ''
  return allStatus[s] || { label: s, color: 'default' }
})
const label = computed(() => info.value.label)
const color = computed(() => info.value.color)
</script>

<style scoped>
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}
.status-success { background: #e6f7ff; color: #1890ff; }
.status-default { background: #f5f5f5; color: #999; }
.status-warning { background: #fff7e6; color: #fa8c16; }
.status-danger  { background: #fff1f0; color: #ff4d4f; }
</style>