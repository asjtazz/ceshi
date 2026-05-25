<template>
  <AppShell title="资产管理系统" :show-back="false" :tabs="l2Tabs">
    <div class="l2-home">
      <div class="user-card">
        <div class="user-info">
          <div class="user-avatar l2">{{ userInfo?.name?.[0] }}</div>
          <div class="user-meta">
            <h3>{{ userInfo?.name }}</h3>
            <p>{{ userInfo?.dept }} · 资产管理员</p>
          </div>
          <van-button size="small" plain type="primary" @click="onLogout">退出</van-button>
        </div>
      </div>

      <div class="stats-grid" v-if="stats">
        <div class="stat-card" @click="$router.push('/l2/assets')">
          <div class="stat-num" style="color:#1989fa">{{ stats.totalAssets }}</div>
          <div class="stat-label">资产总数</div>
        </div>
        <div class="stat-card" @click="$router.push('/l2/assets?status=IN_USE')">
          <div class="stat-num" style="color:#52c41a">{{ stats.inUseCount }}</div>
          <div class="stat-label">在用资产</div>
        </div>
        <div class="stat-card" @click="$router.push('/l2/assets?status=IDLE')">
          <div class="stat-num" style="color:#fa8c16">{{ stats.idleCount }}</div>
          <div class="stat-label">闲置资产</div>
        </div>
        <div class="stat-card" @click="$router.push('/l2/assets?status=SCRAPPED')">
          <div class="stat-num" style="color:#8c8c8c">{{ stats.scrappedCount }}</div>
          <div class="stat-label">已报废</div>
        </div>
        <div class="stat-card" @click="$router.push('/l2/approvals')">
          <div class="stat-num" style="color:#722ed1">{{ stats.pendingCount }}</div>
          <div class="stat-label">待审批</div>
        </div>
        <div class="stat-card" @click="$router.push('/l2/inventory')">
          <div class="stat-num" style="color:#faad14">{{ stats.totalSurplus }}</div>
          <div class="stat-label">盘盈</div>
        </div>
        <div class="stat-card" @click="$router.push('/l2/inventory')">
          <div class="stat-num" style="color:#eb2f96">{{ stats.totalDeficit }}</div>
          <div class="stat-label">盘亏</div>
        </div>
      </div>

      <div class="section">
        <h4 class="section-title">告警统计</h4>
        <div class="stats-grid">
          <div class="stat-sub-card" @click="$router.push('/l2/alerts?type=alert')">
            <van-icon name="warning-o" size="22" color="#ff4d4f" />
            <div>
              <div class="stat-sub-num">{{ stats?.lowStockCount || 0 }}</div>
              <div class="stat-sub-label">低库存</div>
            </div>
          </div>
          <div class="stat-sub-card" @click="$router.push('/l2/alerts?type=maintenance')">
            <van-icon name="setting-o" size="22" color="#fa8c16" />
            <div>
              <div class="stat-sub-num">{{ stats?.maintenanceCount || 0 }}</div>
              <div class="stat-sub-label">维修</div>
            </div>
          </div>
          <div class="stat-sub-card" @click="$router.push('/l2/alerts?type=inspection')">
            <van-icon name="clock-o" size="22" color="#1890ff" />
            <div>
              <div class="stat-sub-num">{{ stats?.inspectionCount || 0 }}</div>
              <div class="stat-sub-label">检定预警</div>
            </div>
          </div>
          <div class="stat-sub-card" @click="$router.push('/l2/alerts?type=expired')">
            <van-icon name="clock-o" size="22" color="#fa8c16" />
            <div>
              <div class="stat-sub-num">{{ stats?.expiredCount || 0 }}</div>
              <div class="stat-sub-label">检定过期</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h4>快捷操作</h4>
        </div>
        <div class="quick-grid">
          <div class="quick-item" @click="$router.push('/l2/assets/register')">
            <van-icon name="plus" size="24" color="#1989fa" />
            <span>新增资产</span>
          </div>
          <div class="quick-item" @click="$router.push('/l2/inventory')">
            <van-icon name="scan" size="24" color="#fa8c16" />
            <span>盘点任务</span>
          </div>
          <div class="quick-item" @click="$router.push('/l2/approvals')">
            <van-icon name="todo-list-o" size="24" color="#52c41a" />
            <span>审批列表</span>
          </div>
          <div class="quick-item" @click="$router.push('/l2/debts')">
            <van-icon name="balance-list-o" size="24" color="#eb2f96" />
            <span>欠款管理</span>
          </div>
          <div class="quick-item" @click="$router.push('/l2/assets')">
            <van-icon name="search" size="24" color="#722ed1" />
            <span>资产查询</span>
          </div>
        </div>
      </div>

      <div class="section" v-if="pendingList.length">
        <div class="section-header">
          <h4>待审批 ({{ pendingList.length }})</h4>
          <span class="more" @click="$router.push('/l2/approvals')">查看全部</span>
        </div>
        <div class="pending-list">
          <div
            v-for="app in pendingList"
            :key="app.id"
            class="pending-item"
            @click="$router.push('/l2/approvals')"
          >
            <div class="pending-icon">
              <van-icon name="warning-o" size="20" color="#fa8c16" />
            </div>
            <div class="pending-info">
              <h5>{{ app.applicantName }} - {{ typeLabel(app.type) }}</h5>
              <p>{{ app.assetName }} × {{ app.quantity }}</p>
            </div>
            <van-icon name="arrow" size="16" color="#ccc" />
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useAuthStore } from '@/stores/auth'
import { useLoadingStore } from '@/stores/loading'
import { getDashboard } from '@/api/dashboard'
import { getPendingList } from '@/api/approvals'
import AppShell from '@/components/global/AppShell.vue'

const router = useRouter()
const authStore = useAuthStore()
const loadingStore = useLoadingStore()
const userInfo = computed(() => authStore.userInfo)
const stats = ref(null)
const pendingList = ref([])
const dashboard = ref(null)
const loading = ref(false)

const l2Tabs = [
  { label: '首页', name: 'home', icon: 'home-o', path: '/l2/home' },
  { label: '资产', name: 'assets', icon: 'records', path: '/l2/assets' },
  { label: '审批', name: 'approvals', icon: 'todo-list-o', path: '/l2/approvals' },
  { label: '工作台', name: 'workbench', icon: 'apps-o', path: '/l2/workbench' },
  { label: '我的', name: 'profile', icon: 'user-o', path: '/l2/profile' }
]

const typeLabelMap = { receive: '领用', return: '归还', repair: '报修', scrap: '报废' }
function typeLabel(t) { return typeLabelMap[t] || t }

function onLogout() {
  authStore.logout()
  router.replace('/')
}

async function loadData() {
  loading.value = true
  try {
    const [dashRes, listRes] = await Promise.all([
      getDashboard(),
      getPendingList()
    ])
    const d = dashRes.data
    stats.value = d
    dashboard.value = d
    const rawList = listRes.data?.pending || listRes.data?.list || []
    pendingList.value = (Array.isArray(rawList) ? rawList : []).filter(a => a.status === 'PENDING').slice(0, 5)
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.l2-home { padding: 12px; }
.user-card {
  background: linear-gradient(135deg, #fa8c16, #d46b08);
  border-radius: 12px; padding: 16px; color: #fff; margin-bottom: 12px;
}
.user-info { display: flex; align-items: center; gap: 12px; }
.user-avatar {
  width: 46px; height: 46px; border-radius: 50%;
  background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 600; flex-shrink: 0; color: #fff;
}
.user-meta { flex: 1; }
.user-meta h3 { font-size: 17px; font-weight: 600; margin-bottom: 2px; }
.user-meta p { font-size: 13px; opacity: 0.8; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 8px; }
.stat-card {
  background: #fff; border-radius: 10px; padding: 12px 6px;
  text-align: center; cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.stat-card:focus-visible {
  outline: 2px solid #1989fa;
  outline-offset: 2px;
}
.stat-num { font-size: 22px; font-weight: 700; }
.stat-label { font-size: 11px; color: #999; margin-top: 3px; }
.section { margin-top: 16px; }
.section-title { font-size: 14px; font-weight: 600; margin-bottom: 10px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.section-header h4 { font-size: 15px; font-weight: 600; }
.section-header .more { font-size: 13px; color: #1989fa; cursor: pointer; }
.quick-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.stat-sub-card {
  background: #fff; border-radius: 10px; padding: 12px;
  display: flex; align-items: center; gap: 12px; cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.stat-sub-card:active { opacity: 0.8; }
.stat-sub-num { font-size: 18px; font-weight: 700; color: #333; }
.stat-sub-label { font-size: 12px; color: #999; }
.quick-item {
  background: #fff; border-radius: 10px; padding: 14px 6px;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  font-size: 12px; color: #666; cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.pending-list { display: flex; flex-direction: column; gap: 6px; }
.pending-item {
  background: #fff; border-radius: 10px; padding: 12px;
  display: flex; align-items: center; gap: 10px; cursor: pointer;
}
.pending-icon {
  width: 36px; height: 36px; border-radius: 8px;
  background: #fff7e6; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.pending-info { flex: 1; min-width: 0; }
.pending-info h5 { font-size: 14px; font-weight: 600; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pending-info p { font-size: 12px; color: #999; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
