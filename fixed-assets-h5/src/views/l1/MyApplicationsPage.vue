<template>
  <AppShell title="我的申请">
    <div class="my-apps">
      <van-tabs v-model:active="activeTab" sticky>
        <van-tab title="全部" name="" />
        <van-tab title="待审批" name="PENDING" />
        <van-tab title="已通过" name="APPROVED" />
        <van-tab title="已拒绝" name="REJECTED" />
      </van-tabs>

      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list v-model="loading" :finished="finished" finished-text="没有更多了" @load="onLoad">
          <van-empty description="暂无申请记录" v-if="!list.length && !loading" />
          <div class="app-list" v-else>
            <div
              v-for="app in list"
              :key="app.id"
              class="app-card"
              @click="viewDetail(app)"
            >
              <div class="app-header">
                <span class="app-type">{{ typeLabel(app.type) }}</span>
                <StatusBadge :status="app.status" />
              </div>
              <div class="app-body">
                <h4>{{ app.assetName }}</h4>
                <p class="code">{{ app.assetCode }}</p>
                <p class="meta">
                  <span>申请数量: {{ app.quantity }}</span>
                  <span>申请时间: {{ formatTime(app.createdAt) }}</span>
                </p>
                <p class="reason" v-if="app.reason">原因: {{ app.reason }}</p>
              </div>
              <div class="app-footer" v-if="app.status === 'REJECTED' && app.approverRemark">
                <p class="remark">审批意见: {{ app.approverRemark }}</p>
              </div>
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>
  </AppShell>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useLoadingStore } from '@/stores/loading'
import { getMyApplications } from '@/api/approvals'
import AppShell from '@/components/global/AppShell.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const loadingStore = useLoadingStore()
const activeTab = ref('')
const list = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)
const pageSize = 10

const typeLabelMap = { receive: '领用', return: '归还', repair: '报修', scrap: '报废' }
function typeLabel(t) { return typeLabelMap[t] || t }
function formatTime(timeStr) {
  if (!timeStr) return ''
  // 如果最后是冒号，去掉
  const str = timeStr.trim()
  if (str.endsWith(':')) {
    return str.slice(0, -1)
  }
  return str.slice(0, 16)
}

async function loadData(refresh = false) {
  if (refresh) page.value = 1
  loading.value = true
  try {
    const params = { page: page.value, pageSize, status: activeTab.value, userId: authStore.userInfo?.id }
    const res = await getMyApplications(params)
    if (refresh) list.value = res.data?.list || []
    else list.value.push(...(res.data?.list || []))
    finished.value = (res.data?.list?.length || 0) < pageSize
    page.value++
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

function onLoad() { loadData() }
function onRefresh() { refreshing.value = true; loadData(true).finally(() => refreshing.value = false) }
function viewDetail(app) { /* router.push(`/l1/applications/${app.id}`) */ }

watch(activeTab, () => loadData(true))
onMounted(() => loadData())
</script>

<style scoped>
.my-apps { min-height: 100vh; }
.app-list { padding: 8px 12px; }
.app-card {
  background: #fff; border-radius: 10px; padding: 12px; margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.app-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.app-type { font-size: 13px; color: #1989fa; font-weight: 600; }
.app-body h4 { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
.app-body .code { font-size: 12px; color: #999; margin-bottom: 8px; }
.app-body .meta { display: flex; gap: 16px; font-size: 12px; color: #666; margin-bottom: 4px; }
.app-body .reason { font-size: 12px; color: #666; }
.app-footer { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #eee; }
.remark { font-size: 12px; color: #ff4d4f; }
</style>