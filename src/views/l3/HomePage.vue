<template>
  <AppShell title="系统管理" :show-back="false" :tabs="l3Tabs">
    <div class="l3-home">
      <div class="user-card">
        <div class="user-info">
          <div class="user-avatar l3">{{ userInfo?.name?.[0] }}</div>
          <div class="user-meta">
            <h3>{{ userInfo?.name }}</h3>
            <p>{{ userInfo?.dept }} · 超级管理员</p>
          </div>
          <van-button size="small" plain type="danger" @click="onLogout">退出</van-button>
        </div>
      </div>
      <div class="stats-row" v-if="stats">
        <div class="stat-item" v-for="(s,idx) in statItems" :key="idx" @click="onStatClick(s)">
          <div class="stat-num" :style="{ color: s.color }">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
      <div class="section">
        <h4 class="section-title">告警统计</h4>
          <div class="stats-grid">
          <div class="stat-sub-card" @click="$router.push('/l3/alerts?type=alert')">
            <van-icon name="warning-o" size="22" color="#ff4d4f" />
            <div>
              <div class="stat-sub-num">{{ stats?.lowStockCount || 0 }}</div>
              <div class="stat-sub-label">低库存</div>
            </div>
          </div>
          <div class="stat-sub-card" @click="$router.push('/l3/alerts?type=maintenance')">
            <van-icon name="setting-o" size="22" color="#fa8c16" />
            <div>
              <div class="stat-sub-num">{{ stats?.maintenanceCount || 0 }}</div>
              <div class="stat-sub-label">维修</div>
            </div>
          </div>
                    <div class="stat-sub-card" @click="$router.push('/l3/alerts?type=inspection')">
            <van-icon name="clock-o" size="22" color="#1890ff" />
            <div>
              <div class="stat-sub-num">{{ stats?.inspectionCount || 0 }}</div>
              <div class="stat-sub-label">检定预警</div>
            </div>
          </div>
          <div class="stat-sub-card" @click="$router.push('/l3/alerts?type=expired')">
            <van-icon name="clock-o" size="22" color="#fa8c16" />
            <div>
              <div class="stat-sub-num">{{ stats?.expiredCount || 0 }}</div>
              <div class="stat-sub-label">检定过期</div>
            </div>
          </div>
        </div>
      </div>
      <div class="section">
        <h4 class="section-title">系统配置</h4>
        <div class="menu-grid">
          <div class="menu-item" @click="$router.push('/l3/settings/categories')">
            <div class="menu-icon" style="background:#e6f7ff;color:#1989fa">
              <van-icon name="cluster-o" size="22" />
            </div>
            <span>资产分类</span>
          </div>
          <div class="menu-item" @click="$router.push('/l3/settings/locations')">
            <div class="menu-icon" style="background:#fff7e6;color:#fa8c16">
              <van-icon name="location-o" size="22" />
            </div>
            <span>存放地点</span>
          </div>
          <div class="menu-item" @click="$router.push('/l3/settings/approval-flows')">
            <div class="menu-icon" style="background:#f6ffed;color:#52c41a">
              <van-icon name="exchange" size="22" />
            </div>
            <span>审批流程</span>
          </div>
          <div class="menu-item" @click="$router.push('/l3/settings/code-rules')">
            <div class="menu-icon" style="background:#fff1f0;color:#ff4d4f">
              <van-icon name="bar-chart-o" size="22" />
            </div>
            <span>编码规则</span>
          </div>
          <div class="menu-item" @click="$router.push('/l3/alerts')">
            <div class="menu-icon" style="background:#fff0f6;color:#eb2f96">
              <van-icon name="warning-o" size="22" />
            </div>
            <span>预警设置</span>
          </div>
          <div class="menu-item" @click="$router.push('/l3/audit-log')">
            <div class="menu-icon" style="background:#f9f0ff;color:#722ed1">
              <van-icon name="records" size="22" />
            </div>
            <span>审计日志</span>
          </div>
                      <div class="menu-item" @click="$router.push('/l3/debts')">
            <div class="menu-icon" style="background:#e6f7ff;color:#13c2c2">
              <van-icon name="balance-list-o" size="22" />
            </div>
            <span>欠款管理</span>
          </div>
          <div class="menu-item" @click="onExport">
            <div class="menu-icon" style="background:#e6f7ff;color:#13c2c2">
              <van-icon name="down" size="22" />
            </div>
            <span>数据导出</span>
          </div>
          <div class="menu-item" @click="$router.push('/l3/settings/import-assets')">
            <div class="menu-icon" style="background:#f6ffed;color:#52c41a">
              <van-icon name="add-o" size="22" />
            </div>
            <span>批量导入</span>
          </div>
          <div class="menu-item" @click="$router.push('/l3/profile')">
            <div class="menu-icon" style="background:#f0f5ff;color:#2f54eb">
              <van-icon name="manager-o" size="22" />
            </div>
            <span>用户管理</span>
          </div>
        </div>
      </div>
      <div class="section">
      </div>
            <!-- 告警面板 -->
      <div class="section" v-if="stats?.alertAssets?.length || stats?.expiredAssets?.length">
        <h4 class="section-title">告警提醒</h4>
        <div class="alert-list">
          <div class="alert-card" v-for="a in (stats?.alertAssets || []).slice(0,3)" :key="a.id" @click="$router.push('/l3/asset-detail/' + a.id)">
            <van-icon name="warning-o" size="18" color="#ff4d4f" />
            <div class="alert-info">
              <span class="alert-name">{{ a.name }}</span>
              <span class="alert-reason">低库存（剩余{{ a.quantity - a.inUseCount }} / 预警{{ a.alertMin }}&#xff09;</span>
            </div>
          </div>
          <div class="alert-card" v-for="a in (stats?.expiredAssets || []).slice(0,3)" :key="'e'+a.id" @click="$router.push('/l3/asset-detail/' + a.id)">
            <van-icon name="clock-o" size="18" color="#fa8c16" />
            <div class="alert-info">
              <span class="alert-name">{{ a.name }}</span>
              <span class="alert-reason">检定过期（{{ a.nextInspectionDate }}&#xff09;</span>
            </div>
          </div>
        </div>
      </div>
<div class="section" v-if="stats?.categoryDistribution?.length">
        <h4 class="section-title">分类分布</h4>
        <div class="chart-placeholder">
          <div v-for="cat in stats.categoryDistribution" :key="cat.name" class="bar-item">
            <span class="bar-label">{{ cat.name }}</span>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: cat.percent + '%', background: cat.color }"></div>
            </div>
            <span class="bar-num">{{ cat.count }}</span>
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getDashboard } from '@/api/dashboard'
import { exportAssets } from '@/api/config'
import AppShell from '@/components/global/AppShell.vue'
import { useLoadingStore } from '@/stores/loading'
const chartColors = ["#1989fa","#52c41a","#fa8c16","#ff4d4f","#722ed1","#eb2f96","#13c2c2","#faad14","#2f54eb","#a0d911"]
const router = useRouter()
const authStore = useAuthStore()
const loadingStore = useLoadingStore()
const userInfo = computed(() => authStore.userInfo)
const stats = ref(null)
const l3Tabs = [
  { label: '首页', name: 'home', icon: 'home-o', path: '/l3/home' },
  { label: '配置', name: 'settings', icon: 'setting-o', path: '/l3/home' },
  { label: '日志', name: 'log', icon: 'records', path: '/l3/audit-log' },
  { label: '我的', name: 'me', icon: 'user-o', path: '/l3/profile' }
]
const statItems = computed(() => {
  const s = stats.value
  if (!s) return []
  return [
    { label: '资产总数', value: s.totalAssets, color: '#1989fa' },
    { label: '在用', value: s.inUseCount, color: '#52c41a' },
    { label: '闲置', value: s.idleCount, color: '#fa8c16' },
    { label: '已报废', value: s.scrappedCount, color: '#8c8c8c' },
    { label: '待审批', value: s.pendingCount, color: '#722ed1' }
  ]
})
const computedCategories = computed(() => {
  const cats = stats.value?.categoryDistribution || []
  const maxCount = Math.max(...cats.map(c => c.count), 1)
  return cats.map((c, i) => ({
    ...c,
    percent: Math.round(c.count / maxCount * 100),
    color: chartColors[i % chartColors.length]
  }))
})
function onLogout() { authStore.logout(); router.replace('/') }
function onExport() { exportAssets() }
function onStatClick(s) {
  const map = {
    "资产总数": "/l3/assets",
    "在用": "/l3/assets?status=IN_USE",
    "闲置": "/l3/assets?status=IDLE",
    "已报废": "/l3/assets?status=SCRAPPED",
    "待审批": "/l3/approvals"
  }
  const path = map[s.label]
  if (path) router.push(path)
}
async function loadData() {
  loadingStore.startLoading()
  try { var res = await getDashboard(); stats.value = res.data }
  catch(e) { console.error(e) }
  finally { loadingStore.stopLoading() }
}
onMounted(loadData)
</script>
<style scoped>
.l3-home { padding: 12px; }
.user-card {
  background: linear-gradient(135deg, #ff4d4f, #cf1322);
  border-radius: 12px; padding: 16px; color: #fff; margin-bottom: 12px;
}
.user-info { display: flex; align-items: center; gap: 12px; }
.user-avatar {
  width: 46px; height: 46px; border-radius: 50%;
  background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 600; flex-shrink: 0; color: #fff;
}
.user-meta { flex: 1; min-width: 0; }
.user-meta h3 { font-size: 17px; font-weight: 600; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-meta p { font-size: 13px; opacity: 0.8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.stats-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 16px; }
.stat-item { background: #fff; border-radius: 10px; padding: 12px 6px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.04); cursor: pointer; }
.stat-item:focus-visible {
  outline: 2px solid #1989fa;
  outline-offset: 2px;
}
.stat-num { font-size: 22px; font-weight: 700; }
.stat-label { font-size: 11px; color: #999; margin-top: 3px; }
.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 16px; }
.stat-sub-card { background: #fff; border-radius: 10px; padding: 12px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); cursor: pointer; }
.stat-sub-card:active { opacity: 0.8; }
.stat-sub-num { font-size: 18px; font-weight: 700; color: #333; }
.stat-sub-label { font-size: 12px; color: #999; }
.section { margin-bottom: 16px; }
.section-title { font-size: 14px; font-weight: 600; margin-bottom: 10px; }
.menu-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.menu-item {
  background: #fff; border-radius: 10px; padding: 12px 6px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  font-size: 12px; color: #666; cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.menu-item:focus-visible {
  outline: 2px solid #1989fa;
  outline-offset: 2px;
}
.menu-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.chart-placeholder { background: #fff; border-radius: 10px; padding: 12px; }
.bar-item { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.bar-label { font-size: 12px; width: 80px; color: #666; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bar-track { flex: 1; height: 8px; background: #f5f5f5; border-radius: 4px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
.bar-num { font-size: 12px; color: #999; width: 28px; text-align: right; flex-shrink: 0; }
.overview-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.overview-item { background: #fff; border-radius: 10px; padding: 14px 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.ov-num { font-size: 22px; font-weight: 700; color: #1989fa; }
.ov-label { font-size: 11px; color: #999; margin-top: 4px; }
.alert-list { display: flex; flex-direction: column; gap: 6px; }
.alert-card { background: #fff; border-radius: 10px; padding: 12px; display: flex; align-items: center; gap: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); cursor: pointer; }
.alert-card:active { background: #f5f5f5; }
.alert-info { flex: 1; display: flex; flex-direction: column; }
.alert-name { font-size: 14px; font-weight: 500; }
.alert-reason { font-size: 12px; color: #999; margin-top: 2px; }
.alert-empty { text-align: center; padding: 16px; color: #999; font-size: 13px; }
</style>
