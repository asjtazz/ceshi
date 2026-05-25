<template>
  <div class="entry-page">
    <div class="entry-header">
      <div class="logo-area">
        <div class="logo-icon" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none"><rect x="8" y="12" width="32" height="28" rx="3" fill="#1989fa" opacity="0.15"/><rect x="12" y="16" width="24" height="20" rx="2" stroke="#1989fa" stroke-width="2"/><path d="M12 24h24M12 32h16" stroke="#1989fa" stroke-width="2" stroke-linecap="round"/></svg>
        </div>
        <h1>固定资产管理系统</h1>
        <p>请选择您的身份登录</p>
      </div>
    </div>

    <div class="role-cards">
      <div
        v-for="role in roleList"
        :key="role.value"
        class="role-card"
        :class="{ active: selected === role.value }"
        @click="selected = role.value"
      >
        <div class="role-icon" :class="`icon-${role.value.toLowerCase()}`">
          <span v-html="role.icon" />
        </div>
        <div class="role-info">
          <h3>{{ role.label }}</h3>
          <p>{{ role.desc }}</p>
        </div>
        <div class="role-check">
          <van-icon name="success" />
        </div>
      </div>
    </div>

    <div class="users-section" v-if="selected && allUsers.length">
      <h4 class="section-title">选择账号</h4>
      <div class="users-list">
        <div
          v-for="u in currentUsers"
          :key="u.id"
          class="user-item"
          @click="login(u)"
        >
          <div class="user-avatar">{{ u.name[0] }}</div>
          <div class="user-info">
            <span class="user-name">{{ u.name }}</span>
            <span class="user-dept">{{ u.dept }}</span>
          </div>
          <van-icon name="arrow" class="user-arrow" size="16" color="#ccc" />
        </div>
      </div>
    </div>

    <div class="entry-footer">
      <p>模拟数据演示环境 · 2025</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { showToast } from 'vant'
import { useLoadingStore } from '@/stores/loading'
import { getUsers } from '@/api/auth'

const router = useRouter()
const authStore = useAuthStore()
const loadingStore = useLoadingStore()
const selected = ref('')
const allUsers = ref([])

const roleList = [
  {
    value: 'L1',
    label: '员工',
    desc: '查看资产、提交申请、查看我的申请',
    icon: '<svg viewBox="0 0 24 24" width="28" height="28"><circle cx="12" cy="8" r="4" stroke="#1989fa" stroke-width="2" fill="none"/><path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#1989fa" stroke-width="2" stroke-linecap="round" fill="none"/></svg>'
  },
  {
    value: 'L2',
    label: '资产管理员',
    desc: '管理资产、审批申请、盘点任务',
    icon: '<svg viewBox="0 0 24 24" width="28" height="28"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#fa8c16" stroke-width="2" fill="none"/><path d="M9 12l2 2 4-4" stroke="#fa8c16" stroke-width="2" stroke-linecap="round" fill="none"/></svg>'
  },
  {
    value: 'L3',
    label: '超级管理员',
    desc: '系统配置、审计日志、数据管理',
    icon: '<svg viewBox="0 0 24 24" width="28" height="28"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#ff4d4f" stroke-width="2" stroke-linejoin="round" fill="none"/></svg>'
  }
]

const currentUsers = computed(() => {
  if (!selected.value) return []
  return allUsers.value.filter(u => u.role === selected.value)
})

function login(user) {
  loadingStore.startLoading('登录中…')
  setTimeout(() => {
    authStore.setUser(user)
    loadingStore.stopLoading()
    showToast(`欢迎，${user.name}`)
    router.push(`/${user.role.toLowerCase()}/home`)
  }, 300)
}

async function loadUsers() {
  loadingStore.startLoading()
  try {
    const res = await getUsers()
    allUsers.value = res.data?.list || []
  } catch (e) {
    console.error(e)
    showToast('加载用户失败')
    allUsers.value = [
      { id: 'u001', name: '张三', role: 'L1', dept: '办公室' },
      { id: 'u002', name: '李四', role: 'L1', dept: '外检' },
      { id: 'u003', name: '王五', role: 'L1', dept: '环保车间' },
      { id: 'u004', name: '赵六', role: 'L1', dept: '安检车间' },
      { id: 'u005', name: '管理员', role: 'L2', dept: '管理部' },
      { id: 'u006', name: '系统管理员', role: 'L3', dept: '系统管理' }
    ]
  } finally {
    loadingStore.stopLoading()
  }
}

onMounted(loadUsers)
</script>

<style scoped>
.entry-page { min-height: 100vh; background: #f7f8fa; display: flex; flex-direction: column; }
.entry-header { background: linear-gradient(135deg, #1989fa, #1a75d2); padding: 40px 24px 32px; color: #fff; text-align: center; }
.logo-icon { width: 60px; height: 60px; margin: 0 auto 12px; }
.entry-header h1 { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
.entry-header p { font-size: 14px; opacity: 0.8; }
.role-cards { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.role-card {
  background: #fff; border-radius: 12px; padding: 16px;
  display: flex; align-items: center; gap: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06); cursor: pointer;
  border: 2px solid transparent; transition: border-color 0.2s, box-shadow 0.2s;
}
.role-card:focus-visible {
  outline: 2px solid #1989fa;
  outline-offset: 2px;
}
.role-card.active {
  border-color: #1989fa;
  box-shadow: 0 2px 8px rgba(25,137,250,0.2);
}
.role-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.icon-l1 { background: #e6f7ff; }
.icon-l2 { background: #fff7e6; }
.icon-l3 { background: #fff1f0; }
.role-info { flex: 1; min-width: 0; }
.role-info h3 { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.role-info p { font-size: 12px; color: #999; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.role-check { width: 22px; height: 22px; border-radius: 50%; border: 2px solid #e5e5e5; display: flex; align-items: center; justify-content: center; color: transparent; font-size: 12px; transition: all 0.2s; flex-shrink: 0; }
.role-card.active .role-check { background: #1989fa; border-color: #1989fa; color: #fff; }
.users-section { padding: 0 16px 16px; }
.section-title { font-size: 13px; color: #999; margin-bottom: 10px; font-weight: 500; }
.users-list { display: flex; flex-direction: column; gap: 8px; }
.user-item {
  background: #fff; border-radius: 10px; padding: 12px 14px;
  display: flex; align-items: center; gap: 12px; cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.user-item:active { background: #f5f5f5; }
.user-avatar { width: 40px; height: 40px; border-radius: 50%; background: #1989fa; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 600; flex-shrink: 0; }
.user-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.user-name { font-size: 15px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-dept { font-size: 12px; color: #999; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.entry-footer { text-align: center; padding: 20px; color: #bbb; font-size: 12px; }
</style>