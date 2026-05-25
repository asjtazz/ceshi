import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const userInfo = ref(null)

  const role = computed(() => userInfo.value?.role || '')
  const isLoggedIn = computed(() => !!userInfo.value)

  function refreshFromStorage() {
    const saved = localStorage.getItem('assets_user')
    if (saved) {
      try { userInfo.value = JSON.parse(saved) } catch {}
    }
  }

  function setUser(user, token, refreshToken) {
    userInfo.value = user
    if (token) localStorage.setItem('assets_token', token)
    if (refreshToken) localStorage.setItem('assets_refresh_token', refreshToken)
    localStorage.setItem('assets_user', JSON.stringify(user))
  }

  function logout() {
    userInfo.value = null
    localStorage.removeItem('assets_token')
    localStorage.removeItem('assets_refresh_token')
    localStorage.removeItem('assets_user')
  }

  return { userInfo, role, isLoggedIn, refreshFromStorage, setUser, logout }
})
