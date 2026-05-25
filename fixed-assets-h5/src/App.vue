<template>
  <GlobalLoading />
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import GlobalLoading from '@/components/common/GlobalLoading.vue'

const authStore = useAuthStore()
onMounted(() => { authStore.refreshFromStorage() })
</script>