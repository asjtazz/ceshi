<template>
  <van-overlay :show="loading" z-index="9999">
    <div class="loading-content">
      <van-loading type="spinner" size="32px" color="#1989fa" />
      <div class="loading-text">{{ loadingText }}</div>
    </div>
  </van-overlay>
</template>

<script setup>
import { useLoadingStore } from '@/stores/loading'

const { loading, loadingText } = useLoadingStore()
</script>

<style scoped>
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  padding: 20px;
}
.loading-text {
  margin-top: 12px;
  font-size: 14px;
}
</style>
