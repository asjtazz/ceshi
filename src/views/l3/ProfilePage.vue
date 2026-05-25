<template>
  <AppShell title="个人中心">
    <div class="profile-page">
      <div class="profile-card">
        <div class="avatar">{{ userInfo?.name?.[0] }}</div>
        <div class="meta">
          <h3>{{ userInfo?.name }}</h3>
          <p>{{ userInfo?.dept }}</p>
        </div>
      </div>

      <van-cell-group inset>
        <van-cell title="角色" :value="roleLabel" />
        <van-cell title="部门" :value="userInfo?.dept || '-'" />
        <van-cell title="用户ID" :value="userInfo?.id || '-'" />
      </van-cell-group>

      <van-cell-group inset style="margin-top: 12px">
        <van-cell title="关于系统" value="v1.0.0" />
      </van-cell-group>

      <van-cell-group inset title="人员管理" style="margin-top: 12px" v-if="isL3">
        <van-cell v-for="u in userList" :key="u.id" :title="getUserTitle(u)" :label="getUserLabel(u)">
          <template #right-icon>
            <div style="display:flex;gap:16px;align-items:center;">
              <div v-if="u.role === 'L1'" style="font-size:12px;color:#999;">
                欠款权限:
                <van-switch :model-value="debtPermittedUsers.includes(u.id)" size="20" @change="toggleDebtPermission(u)" style="margin-left:8px;" />
              </div>
              <div style="font-size:12px;color:#999;">
                <span v-if="u.role !== 'L3'">管理员:</span>
                <van-switch :model-value="u.role === 'L2'" size="20" @change="toggleRole(u)" v-if="u.role !== 'L3'" />
              </div>
            </div>
          </template>
        </van-cell>
        <van-empty v-if="!userList.length" description="暂无数据" />
      </van-cell-group>

      <div class="logout-btn">
        <van-button type="danger" block round @click="onLogout">退出登录</van-button>
      </div>
    </div>
  </AppShell>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { showConfirmDialog, showToast } from 'vant'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { getUsers, updateUser } from '@/api/auth'
import { getDebtPermissions, updateDebtPermissions } from '@/api/config'
import AppShell from '@/components/global/AppShell.vue'
import { useLoadingStore } from '@/stores/loading'

const authStore = useAuthStore()
const router = useRouter()
const loadingStore = useLoadingStore()
const userInfo = computed(() => authStore.userInfo)
const roleLabel = computed(() => ({ L1: '员工', L2: '资产管理员', L3: '超级管理员' }[userInfo.value?.role] || '未知'))
const isL3 = computed(() => userInfo.value?.role === 'L3')
const userList = ref([])
const debtPermittedUsers = ref([])

function getUserTitle(u) {
  return u.name + ' (' + u.dept + ')'
}

function getUserLabel(u) {
  return 'ID: ' + u.id + ' | 角色: ' + u.role
}

async function loadUsers() {
  loadingStore.startLoading()
  try {
    const res = await getUsers()
    userList.value = (res.data?.list || []).filter(u => u.role === 'L1' || u.role === 'L2')
  } catch {
    showToast("加载用户失败")
  } finally {
    loadingStore.stopLoading()
  }
}

async function loadDebtPermissions() {
  try {
    const res = await getDebtPermissions()
    debtPermittedUsers.value = res.data?.userIds || []
  } catch { }
}

async function toggleRole(u) {
  loadingStore.startLoading("更新中...")
  try {
    const newRole = u.role === 'L2' ? 'L1' : 'L2'
    await updateUser(u.id, { role: newRole })
    u.role = newRole
    showToast("更新成功")
  } catch {
    showToast("更新失败")
  } finally {
    loadingStore.stopLoading()
  }
}

async function toggleDebtPermission(u) {
  loadingStore.startLoading("更新中...")
  try {
    let newList = []
    if (debtPermittedUsers.value.includes(u.id)) {
      newList = debtPermittedUsers.value.filter(id => id !== u.id)
    } else {
      newList = [...debtPermittedUsers.value, u.id]
    }
    await updateDebtPermissions(newList)
    debtPermittedUsers.value = newList
    showToast("更新成功")
  } catch {
    showToast("更新失败")
  } finally {
    loadingStore.stopLoading()
  }
}

async function onLogout() {
  try {
    await showConfirmDialog({ title: '退出登录', message: '确认退出当前账号？' })
    authStore.logout()
    router.replace('/')
  } catch {}
}

onMounted(() => { if (isL3.value) { loadUsers(); loadDebtPermissions(); } })
</script>

<style scoped>
.profile-page { padding: 12px; }
.profile-card {
  background: linear-gradient(135deg, #ff4d4f, #cf1322);
  border-radius: 12px; padding: 20px; color: #fff; margin-bottom: 16px;
  display: flex; align-items: center; gap: 16px;
}
.avatar {
  width: 60px; height: 60px; border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; font-weight: 600; flex-shrink: 0;
}
.meta h3 { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
.meta p { font-size: 13px; opacity: 0.8; }
.logout-btn { padding: 24px 0; }
</style>