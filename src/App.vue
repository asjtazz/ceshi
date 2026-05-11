<template>
  <div class="app-wrapper">
    <!-- 角色切换工具栏 -->
    <div class="role-switcher" v-if="showRoleSwitcher">
      <van-dropdown-menu>
        <van-dropdown-item v-model="currentRole" :options="roleOptions" @change="switchRole" />
      </van-dropdown-menu>
      <span class="version-badge">v8.0</span>
    </div>

    <!-- 主视图 -->
    <router-view />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const showRoleSwitcher = ref(true)

const roleOptions = [
  { text: '👤 L1 员工', value: 'L1' },
  { text: '🛠️ L2 管理员', value: 'L2' },
  { text: '🔧 L3 超管', value: 'L3' }
]

const currentRole = computed({
  get: () => userStore.role,
  set: (val) => {}
})

function switchRole(role) {
  userStore.setRole(role)
  router.push('/')
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f7f8fa; color: #323233; }
.app-wrapper { min-height: 100vh; padding-top: 46px; }
.role-switcher { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; display: flex; align-items: center; background: #fff; border-bottom: 1px solid #ebedf0; }
.role-switcher .van-dropdown-menu { flex: 1; }
.version-badge { padding: 0 12px; font-size: 11px; color: #999; white-space: nowrap; }
</style>