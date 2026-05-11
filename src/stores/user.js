import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const role = ref('L1')
  const userName = ref('艾培刚')
  const deptName = ref('榕江恒鑫机动车检测站')

  function setRole(newRole) {
    role.value = newRole
    localStorage.setItem('fixed_assets_role', newRole)
  }

  function initRole() {
    const saved = localStorage.getItem('fixed_assets_role')
    if (saved && ['L1', 'L2', 'L3'].includes(saved)) {
      role.value = saved
    }
  }

  const isL1 = computed(() => role.value === 'L1')
  const isL2 = computed(() => role.value === 'L2')
  const isL3 = computed(() => role.value === 'L3')
  const isAdmin = computed(() => role.value === 'L2' || role.value === 'L3')

  return {
    role, userName, deptName,
    setRole, initRole,
    isL1, isL2, isL3, isAdmin
  }
})