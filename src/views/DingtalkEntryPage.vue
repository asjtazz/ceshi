<template>
  <div class="dingtalk-entry">
    <div class="entry-header">
      <div class="logo-area">
        <div class="logo-icon" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none"><rect x="8" y="12" width="32" height="28" rx="3" fill="#1989fa" opacity="0.15"/><rect x="12" y="16" width="24" height="20" rx="2" stroke="#1989fa" stroke-width="2"/><path d="M12 24h24M12 32h16" stroke="#1989fa" stroke-width="2" stroke-linecap="round"/></svg>
        </div>
        <h1>固定资产管理</h1>
        <p>钉钉企业内部应用</p>
      </div>
    </div>

    <div class="entry-content">
      <div v-if="isLoading" class="loading-area">
        <van-loading type="spinner" size="24" color="#1989fa" />
        <p>正在登录...</p>
      </div>

      <div v-else-if="isDingtalkEnv" class="login-area">
        <van-button type="primary" size="large" round block @click="handleDingtalkLogin">
          <span class="btn-content">
            <svg class="dd-icon" viewBox="0 0 24 24" fill="none">
              <path d="M20 8.5c0 4.5-3.6 8.2-8.1 8.2-1.3 0-2.5-.3-3.6-.8l-3 1.7.8-2.8c-1.6-1-2.6-2.7-2.6-4.7C3.5 5.4 7.1 2 11.6 2 16.1 2 20 5.4 20 8.5z" fill="#1890ff"/>
            </svg>
            钉钉登录
          </span>
        </van-button>
        <p class="desc">使用钉钉账号安全登录</p>
      </div>

      <div v-else class="dev-area">
        <div class="dev-header">
          <h3>开发环境模拟</h3>
          <p>选择一个身份测试</p>
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
              <h4>{{ role.label }}</h4>
              <p>{{ role.desc }}</p>
            </div>
            <div class="role-check">
              <van-icon name="success" />
            </div>
          </div>
        </div>

        <div class="users-section" v-if="selected && users.length">
          <h5>选择账号</h5>
          <div class="users-list">
            <div
              v-for="u in currentUsers"
              :key="u.id"
              class="user-item"
              @click="handleMockLogin(u)"
            >
              <div class="user-avatar">{{ u.name[0] }}</div>
              <div class="user-info">
                <span class="user-name">{{ u.name }}</span>
                <span class="user-dept">{{ u.dept }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="entry-footer">
      <p>固定资产管理系统 · {{ new Date().getFullYear() }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLoadingStore } from '@/stores/loading'
import { showToast } from 'vant'
import { dingtalkLogin } from '@/utils/dingtalk'

const router = useRouter()
const authStore = useAuthStore()
const loadingStore = useLoadingStore()

const isLoading = ref(false)
const selected = ref('')

const isDingtalkEnv = computed(() => {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('dingtalk')
})

const roleList = [
  {
    value: 'L1',
    label: '员工',
    desc: '查看资产、提交申请',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="8" r="3.5" stroke="#1989fa" stroke-width="2" fill="none"/><path d="M5.5 19.5c0-3 2.5-5.5 6.5-5.5s6.5 2.5 6.5 5.5" stroke="#1989fa" stroke-width="2" stroke-linecap="round" fill="none"/></svg>'
  },
  {
    value: 'L2',
    label: '资产管理员',
    desc: '管理资产、审批申请、盘点',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24"><rect x="3.5" y="3.5" width="17" height="17" rx="2" stroke="#fa8c16" stroke-width="2" fill="none"/><path d="M9 12l1.8 1.8L15.6 9" stroke="#fa8c16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>'
  },
  {
    value: 'L3',
    label: '超级管理员',
    desc: '系统配置、审计日志',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 2.5L14.8 8L21 8.8L16.5 13L17.6 19.5L12 16.5L6.4 19.5L7.5 13L3 8.8L9.2 8L12 2.5Z" stroke="#ff4d4f" stroke-width="2" stroke-linejoin="round" fill="none"/></svg>'
  }
]

const users = [
  { id: 'u001', name: '张三', role: 'L1', dept: '办公室', phone: '13800000001' },
  { id: 'u002', name: '李四', role: 'L1', dept: '外检', phone: '13800000002' },
  { id: 'u003', name: '王五', role: 'L1', dept: '环保车间', phone: '13800000003' },
  { id: 'u004', name: '赵六', role: 'L2', dept: '管理部', phone: 'admin' },
  { id: 'u005', name: '系统管理员', role: 'L3', dept: '系统管理', phone: 'manager' }
]

const currentUsers = computed(() => {
  if (!selected.value) return []
  return users.filter(u => u.role === selected.value)
})

async function handleDingtalkLogin() {
  isLoading.value = true
  try {
    await dingtalkLogin()
  } catch (e) {
    console.error(e)
    showToast('登录失败，请重试')
  } finally {
    isLoading.value = false
  }
}

function handleMockLogin(user) {
  loadingStore.startLoading('登录中…')
  setTimeout(() => {
    authStore.setUser({
      ...user,
      userid: user.phone === 'manager' ? 'mock_manager' : user.phone === 'admin' ? 'mock_admin' : `mock_${user.id}`
    })
    loadingStore.stopLoading()
    showToast(`欢迎，${user.name}`)
    router.push(`/${user.role.toLowerCase()}/home`)
  }, 400)
}

onMounted(() => {
  if (isDingtalkEnv.value) {
    handleDingtalkLogin()
  }
})
</script>

<style scoped>
.dingtalk-entry {
  min-height: 100vh;
  background: linear-gradient(180deg, #f7f8fa 0%, #f0f2f5 100%);
  display: flex;
  flex-direction: column;
}

.entry-header {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  padding: 56px 24px 48px;
  color: #fff;
  text-align: center;
}

.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-icon {
  width: 72px;
  height: 72px;
  margin-bottom: 16px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.entry-header h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px;
}

.entry-header p {
  font-size: 14px;
  opacity: 0.85;
  margin: 0;
}

.entry-content {
  flex: 1;
  padding: 24px 16px;
}

.loading-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 16px;
  gap: 16px;
}

.loading-area p {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.login-area {
  padding: 16px 0;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.dd-icon {
  width: 20px;
  height: 20px;
}

.desc {
  text-align: center;
  color: #999;
  font-size: 13px;
  margin-top: 16px;
}

.dev-area {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.dev-header {
  text-align: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
}

.dev-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 6px;
  color: #333;
}

.dev-header p {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.role-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.role-card {
  background: #fafafa;
  border-radius: 12px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.role-card.active {
  background: #e6f7ff;
  border-color: #1890ff;
}

.role-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-l1 { background: #e6f7ff; }
.icon-l2 { background: #fff7e6; }
.icon-l3 { background: #fff1f0; }

.role-info { flex: 1; }

.role-info h4 {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 4px;
  color: #333;
}

.role-info p {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.role-check {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  transition: all 0.2s;
}

.role-card.active .role-check {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

.users-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed #f0f0f0;
}

.users-section h5 {
  font-size: 13px;
  color: #666;
  margin: 0 0 12px;
  font-weight: 500;
}

.users-list {
  display: grid;
  gap: 8px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
}

.user-item:active {
  background: #e8e8e8;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.user-dept {
  font-size: 12px;
  color: #999;
}

.entry-footer {
  text-align: center;
  padding: 24px;
  color: #bbb;
  font-size: 12px;
}
</style>
