import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLoadingStore = defineStore('loading', () => {
  const loading = ref(false)
  const loadingText = ref('加载中…')

  function startLoading(text = '加载中…') {
    loading.value = true
    loadingText.value = text
  }

  function stopLoading() {
    loading.value = false
  }

  return { loading, loadingText, startLoading, stopLoading }
})
