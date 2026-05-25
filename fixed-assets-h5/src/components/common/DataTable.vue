<template>
  <div class="data-table">
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="onLoad">
        <slot />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const props = defineProps({ loading: Boolean, finished: Boolean })
const emit = defineEmits(['load', 'refresh'])
const refreshing = ref(false)

function onLoad() { emit('load') }
async function onRefresh() {
  refreshing.value = true
  emit('refresh')
  refreshing.value = false
}
</script>