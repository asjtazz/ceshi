<template>
  <AppShell title="工作台">
    <div class="workbench">
      <div class="section">
        <h4 class="section-title">快捷操作</h4>
        <div class="op-grid">
          <div class="op-item" @click="$router.push('/l2/assets/register')">
            <div class="op-icon" style="background:#e6f7ff;color:#1989fa"><van-icon name="plus" size="24" /></div>
            <span>新增资产</span>
          </div>
          <div class="op-item" @click="$router.push('/l2/inventory')">
            <div class="op-icon" style="background:#fff7e6;color:#fa8c16"><van-icon name="scan" size="24" /></div>
            <span>盘点</span>
          </div>
          <div class="op-item" @click="$router.push('/l2/approvals')">
            <div class="op-icon" style="background:#f6ffed;color:#52c41a"><van-icon name="todo-list-o" size="24" /></div>
            <span>待审批</span>
          </div>
          <div class="op-item" @click="$router.push('/l2/assets')">
            <div class="op-icon" style="background:#f9f0ff;color:#722ed1"><van-icon name="search" size="24" /></div>
            <span>资产查询</span>
          </div>
          <div class="op-item" @click="$router.push('/l2/debts')">
            <div class="op-icon" style="background:#fff0f6;color:#eb2f96"><van-icon name="balance-list-o" size="24" /></div>
            <span>欠款管理</span>
          </div>
        </div>
      </div>

      <!-- 数据统计面板 -->
      <div class="section" v-if="dashboard">
        <h4 class="section-title">数据总览</h4>
        <div class="dash-grid">
          <div class="dash-item" @click="$router.push('/l2/assets')">
            <div class="dash-num">{{ dashboard.totalAssets || 0 }}</div>
            <div class="dash-label">总资产</div>
          </div>
          <div class="dash-item" @click="$router.push('/l2/assets')">
            <div class="dash-num" style="color:#52c41a">{{ dashboard.inUseCount || 0 }}</div>
            <div class="dash-label">在用</div>
          </div>
          <div class="dash-item" @click="$router.push('/l2/assets')">
            <div class="dash-num" style="color:#fa8c16">{{ dashboard.idleCount || 0 }}</div>
            <div class="dash-label">闲置</div>
          </div>
          <div class="dash-item" @click="$router.push('/l2/approvals')">
            <div class="dash-num" style="color:#ff4d4f">{{ pendingList.length }}</div>
            <div class="dash-label">待审批</div>
          </div>
        </div>
      </div>

      <!-- 告警统计 -->
      <div class="section" v-if="dashboard">
        <h4 class="section-title">告警统计</h4>
        <div class="stats-grid">
          <div class="stat-sub-card" @click="$router.push('/l2/alerts?type=alert')">
            <van-icon name="warning-o" size="22" color="#ff4d4f" />
            <div>
              <div class="stat-sub-num">{{ dashboard.lowStockCount || 0 }}</div>
              <div class="stat-sub-label">低库存</div>
            </div>
          </div>
          <div class="stat-sub-card" @click="$router.push('/l2/alerts?type=maintenance')">
            <van-icon name="setting-o" size="22" color="#fa8c16" />
            <div>
              <div class="stat-sub-num">{{ dashboard.maintenanceCount || 0 }}</div>
              <div class="stat-sub-label">维修</div>
            </div>
          </div>
          <div class="stat-sub-card" @click="$router.push('/l2/alerts?type=inspection')">
            <van-icon name="clock-o" size="22" color="#1890ff" />
            <div>
              <div class="stat-sub-num">{{ dashboard.inspectionCount || 0 }}</div>
              <div class="stat-sub-label">检定预警</div>
            </div>
          </div>
          <div class="stat-sub-card" @click="$router.push('/l2/alerts?type=expired')">
            <van-icon name="clock-o" size="22" color="#fa8c16" />
            <div>
              <div class="stat-sub-num">{{ dashboard.expiredCount || 0 }}</div>
              <div class="stat-sub-label">检定过期</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 告警面板 -->
      <div class="section" v-if="dashboard && (alertList.length || expiredList.length)">
        <h4 class="section-title" style="cursor:pointer" @click="$router.push('/l2/alerts')">告警提醒 <van-icon name="arrow" size="14" /></h4>
        <div class="alert-list">
          <div class="alert-card" v-for="a in alertList.slice(0,3)" :key="a.id" @click="$router.push('/l2/alerts?type=alert')">
            <van-icon name="warning-o" size="18" color="#ff4d4f" />
            <div class="alert-info">
              <span class="alert-name">{{ a.name }}</span>
              <span class="alert-reason">低库存（剩余{{ a.quantity - a.inUseCount }}）</span>
            </div>
          </div>
          <div class="alert-card" v-for="a in expiredList.slice(0,3)" :key="'e'+a.id" @click="$router.push('/l2/alerts?type=expired')">
            <van-icon name="clock-o" size="18" color="#fa8c16" />
            <div class="alert-info">
              <span class="alert-name">{{ a.name }}</span>
              <span class="alert-reason">检定过期（{{ a.nextInspectionDate }}）</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 待审批列表 -->
      <div class="section" v-if="pendingList.length">
        <h4 class="section-title">待审批</h4>
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
import { ref, onMounted } from 'vue'
import { getPendingList } from '@/api/approvals'
import { getDashboard } from '@/api/dashboard'
import AppShell from '@/components/global/AppShell.vue'
import { useLoadingStore } from '@/stores/loading'

const pendingList = ref([])
const dashboard = ref(null)
const alertList = ref([])
const expiredList = ref([])
const loadingStore = useLoadingStore()

const typeLabelMap = { receive: '领用', return: '归还', repair: '报修', scrap: '报废', loss: '报损' }
function typeLabel(t) { return typeLabelMap[t] || t }

async function loadData() {
  loadingStore.startLoading()
  try {
    const [pendingRes, dashRes] = await Promise.all([
      getPendingList(),
      getDashboard()
    ])
    const all = pendingRes.data?.pending || pendingRes.data?.list || []
    pendingList.value = (Array.isArray(all) ? all : []).filter(a => a.status === 'PENDING').slice(0, 5)
    const d = dashRes.data
    dashboard.value = d
    alertList.value = d?.alertAssets || []
    expiredList.value = d?.expiredAssets || []
  } finally {
    loadingStore.stopLoading()
  }
}

onMounted(() => loadData())
</script>

<style scoped>
.workbench { padding: 12px; }
.section { margin-bottom: 20px; }
.section-title { font-size: 14px; font-weight: 600; margin-bottom: 10px; }
.op-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.op-item {
  background: #fff; border-radius: 10px; padding: 14px 6px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  font-size: 12px; color: #666; cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.op-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.dash-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.dash-item { background: #fff; border-radius: 10px; padding: 14px 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.04); cursor: pointer; }
.dash-num { font-size: 22px; font-weight: 700; color: #1989fa; }
.dash-label { font-size: 11px; color: #999; margin-top: 4px; }
.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 8px; }
.stat-sub-card { background: #fff; border-radius: 10px; padding: 14px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); cursor: pointer; }
.stat-sub-num { font-size: 20px; font-weight: 700; color: #333; }
.stat-sub-label { font-size: 12px; color: #999; }
.alert-list { display: flex; flex-direction: column; gap: 6px; }
.alert-card { background: #fff; border-radius: 10px; padding: 12px; display: flex; align-items: center; gap: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); cursor: pointer; }
.alert-card:active { background: #f5f5f5; }
.alert-info { flex: 1; display: flex; flex-direction: column; }
.alert-name { font-size: 14px; font-weight: 500; }
.alert-reason { font-size: 12px; color: #999; margin-top: 2px; }
.pending-list { display: flex; flex-direction: column; gap: 6px; }
.pending-item {
  background: #fff; border-radius: 10px; padding: 12px;
  display: flex; align-items: center; gap: 10px; cursor: pointer;
}
.pending-icon { width: 36px; height: 36px; border-radius: 8px; background: #fff7e6; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.pending-info { flex: 1; }
.pending-info h5 { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
.pending-info p { font-size: 12px; color: #999; }
</style>
