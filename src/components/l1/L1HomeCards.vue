<template>
  <div class="home-cards">
    <div class="user-header">
      <div class="avatar">{{ (authStore.userInfo?.name || '?').charAt(0) }}</div>
      <div class="info">
        <div class="name">{{ authStore.userInfo?.name || '未知用户' }}</div>
        <div class="dept">{{ authStore.userInfo?.dept || '' }}</div>
      </div>
    </div>

    <div class="stat-cards">
      <div class="stat-card" @click="router.push('/l1/my-applications')">
        <div class="num">{{ pendingCount }}</div>
        <div class="label">待审批</div>
      </div>
      <div class="stat-card" @click="router.push('/l1/assets')">
        <div class="num">{{ inUseCount }}</div>
        <div class="label">使用中</div>
      </div>
      <div class="stat-card">
        <div class="num">{{ maintCount }}</div>
        <div class="label" @click="router.push('/l1/assets?status=MAINTENANCE')">维修中</div>
      </div>
    </div>

    <div class="section-title">快捷操作</div>
    <div class="quick-actions">
      <van-grid :column-num="4" :border="false">
        <van-grid-item icon="records" text="领用" @click="goApply('receive')" />
        <van-grid-item icon="redo" text="归还" @click="goApply('return')" />
        <van-grid-item icon="warning-o" text="报修" @click="goApply('repair')" />
        <van-grid-item icon="clear" text="报废" @click="goApply('scrap')" />
        <van-grid-item icon="exchange" text="调拨" @click="goApply('transfer')" />
        <van-grid-item icon="search" text="资产列表" @click="router.push('/l1/assets')" />
        <van-grid-item icon="records" text="我的申请" @click="router.push('/l1/my-applications')" />
      </van-grid>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getAssets } from '@/api/assets'
import { getMyApplications } from '@/api/approvals'

const router = useRouter()
const authStore = useAuthStore()
const pendingCount = ref(0)
const inUseCount = ref(0)
const maintCount = ref(0)

onMounted(async () => {
  try {
    const [pendingRes, assetRes] = await Promise.all([
      getMyApplications({ applicantId: authStore.userInfo?.id, status: 'PENDING' }),
      getAssets({ custodian: authStore.userInfo?.id, pageSize: 200 })
    ])
    pendingCount.value = pendingRes.data?.list?.length || 0
    const assets = assetRes.data?.list || []
    inUseCount.value = assets.filter(a => a.status === 'IN_USE').reduce((s, a) => s + (parseInt(a.inUseCount) || 0), 0)
    maintCount.value = assets.filter(a => a.status === 'MAINTENANCE').length
  } catch (e) { console.error(e) }
})

function goApply(type) { router.push('/l1/apply/' + type) }
</script>

<style scoped>
.home-cards { padding: 16px; }
.user-header { display: flex; align-items: center; padding: 20px; background: #fff; border-radius: 12px; margin-bottom: 16px; }
.avatar { width: 48px; height: 48px; border-radius: 50%; background: #1989fa; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-right: 12px; }
.info .name { font-size: 18px; font-weight: 600; }
.info .dept { font-size: 13px; color: #999; margin-top: 4px; }
.stat-cards { display: flex; gap: 12px; margin-bottom: 16px; }
.stat-card { flex: 1; background: #fff; border-radius: 12px; padding: 16px; text-align: center; }
.stat-card .num { font-size: 28px; font-weight: 700; color: #1989fa; }
.stat-card .label { font-size: 12px; color: #999; margin-top: 4px; }
.section-title { font-size: 16px; font-weight: 600; margin: 16px 0 12px; }
</style>