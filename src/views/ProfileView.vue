<template>
  <div class="profile-page">
    <van-nav-bar title="个人中心" left-arrow @click-left="$router.back()" />

    <div class="user-card">
      <div class="avatar">
        <van-icon name="contact" size="48" color="#1989fa" />
      </div>
      <div class="user-info">
        <h3>{{ userStore.userName }}</h3>
        <p>{{ userStore.deptName }}</p>
      </div>
    </div>

    <van-cell-group inset style="margin: 16px">
      <van-cell title="当前角色" :value="roleLabel" />
      <van-cell title="版本号" value="v8.0" />
      <van-cell title="数据存储" value="本地缓存" />
    </van-cell-group>

    <div style="margin: 16px; padding: 20px; text-align: center">
      <p style="color: #969799; font-size: 12px;">榕江恒鑫机动车检测站</p>
      <p style="color: #c8c9cc; font-size: 11px; margin-top: 4px;">固定资产管理系统 v8.0</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const roleLabel = computed(() => {
  const map = { L1: '👤 员工', L2: '🛠️ 管理员', L3: '🔧 超级管理员' }
  return map[userStore.role] || '未知'
})
</script>

<style scoped>
.user-card { display: flex; align-items: center; padding: 24px 16px; background: #fff; margin: 0 0 12px; }
.avatar { width: 60px; height: 60px; border-radius: 30px; background: #e8f4fd; display: flex; align-items: center; justify-content: center; margin-right: 16px; }
.user-info h3 { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
.user-info p { font-size: 13px; color: #969799; }
</style>