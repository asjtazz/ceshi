<template>
  <AppShell :title="pageTitle">
    <div class="alerts-page">
      <van-tabs v-model:active="activeTab" sticky @change="onTabChange">
        <van-tab title="低库存">
          <div class="alert-list">
            <van-empty description="暂无低库存资产" v-if="!alertAssets.length" />
            <div v-for="a in alertAssets" :key="a.id" class="alert-card" @click="goDetail(a)">
              <div class="alert-main">
                <div class="alert-icon lowstock">
                  <van-icon name="warning-o" />
                </div>
                <div class="alert-info">
                  <h4>{{ a.name }}</h4>
                  <p class="code">{{ a.code }}</p>
                  <p class="meta">
                    <span>库存: {{ a.quantity - a.inUseCount }}</span>
                    <span>·</span>
                    <span>最低预警: {{ a.alertMin }}</span>
                  </p>
                </div>
              </div>
              <van-tag type="danger" size="small">低库存</van-tag>
            </div>
          </div>
        </van-tab>
        <van-tab title="维修中">
          <div class="alert-list">
            <van-empty description="暂无维修中资产" v-if="!maintenanceAssets.length" />
            <div v-for="a in maintenanceAssets" :key="a.id" class="alert-card" @click="goDetail(a)">
              <div class="alert-main">
                <div class="alert-icon maintenance">
                  <van-icon name="wrench-o" />
                </div>
                <div class="alert-info">
                  <h4>{{ a.name }}</h4>
                  <p class="code">{{ a.code }}</p>
                  <p class="meta">
                    <span>存放: {{ a.locationName }}</span>
                    <span>·</span>
                    <span>负责人: {{ a.custodianName }}</span>
                  </p>
                </div>
              </div>
              <van-tag type="warning" size="small">维修中</van-tag>
            </div>
          </div>
        </van-tab>
        <van-tab title="检定预警">
          <div class="alert-list">
            <van-empty description="暂无检定预警资产" v-if="!inspectionWarningAssets.length" />
            <div v-for="a in inspectionWarningAssets" :key="a.id" class="alert-card" @click="goDetail(a)">
              <div class="alert-main">
                <div class="alert-icon warning">
                  <van-icon name="clock-o" />
                </div>
                <div class="alert-info">
                  <h4>{{ a.name }}</h4>
                  <p class="code">{{ a.code }}</p>
                  <p class="meta">
                    <span>检定周期: {{ a.inspectionCycle }}天</span>
                    <span>·</span>
                    <span>下次检定: {{ a.nextInspectionDate }}</span>
                  </p>
                </div>
              </div>
              <van-tag color="#fa8c16" size="small">即将过期</van-tag>
            </div>
          </div>
        </van-tab>
        <van-tab title="检定过期">
          <div class="alert-list">
            <van-empty description="暂无检定过期资产" v-if="!expiredAssets.length" />
            <div v-for="a in expiredAssets" :key="a.id" class="alert-card" @click="goDetail(a)">
              <div class="alert-main">
                <div class="alert-icon expired">
                  <van-icon name="clock-o" />
                </div>
                <div class="alert-info">
                  <h4>{{ a.name }}</h4>
                  <p class="code">{{ a.code }}</p>
                  <p class="meta">
                    <span>检定周期: {{ a.inspectionCycle }}天</span>
                    <span>·</span>
                    <span>下次检定: {{ a.nextInspectionDate }}</span>
                  </p>
                </div>
              </div>
              <van-tag type="danger" size="small">已过期</van-tag>
            </div>
          </div>
        </van-tab>
      </van-tabs>
    </div>
  </AppShell>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getDashboard } from '@/api/dashboard'
import AppShell from '@/components/global/AppShell.vue'
import { useLoadingStore } from '@/stores/loading'
import { useAuthStore } from '@/stores/auth'
import { showToast } from 'vant'

const route = useRoute()
const router = useRouter()
const loadingStore = useLoadingStore()
const activeTab = ref(0)
const alertAssets = ref([])
const maintenanceAssets = ref([])
const inspectionWarningAssets = ref([])
const expiredAssets = ref([])

const type = computed(() => route.query.type || 'all')

const pageTitle = computed(() => {
  const titles = { alert: '低库存告警', maintenance: '维修告警', inspection: '检定预警', expired: '检定过期' }
  return titles[type.value] || '告警中心'
})

const tabIndexMap = { alert: 0, maintenance: 1, inspection: 2, expired: 3 }

const authStore = useAuthStore()

function goDetail(a) {
  router.push(authStore.role === 'L2' ? `/l2/assets/${a.id}` : `/l3/asset-detail/${a.id}`)
}

function onTabChange(index) {
  const types = ['alert', 'maintenance', 'inspection', 'expired']
  router.replace({ query: { type: types[index] } })
}

async function loadData() {
  loadingStore.startLoading()
  try {
    const res = await getDashboard()
    const d = res.data
    alertAssets.value = d.alertAssets || []
    maintenanceAssets.value = d.maintenanceAssets || []
    inspectionWarningAssets.value = d.inspectionWarningAssets || []
    expiredAssets.value = d.expiredAssets || []
  } catch {
    showToast('加载失败')
  } finally {
    loadingStore.stopLoading()
  }
}

onMounted(() => {
  activeTab.value = tabIndexMap[type.value] || 0
  loadData()
})
</script>

<style scoped>
.alerts-page { min-height: 100vh; }
.alert-list { padding: 8px 12px; }
.alert-card {
  background: #fff; border-radius: 10px; padding: 12px; margin-bottom: 10px;
  display: flex; align-items: center; gap: 12px; cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.alert-card:active { opacity: 0.8; }
.alert-main { flex: 1; display: flex; gap: 10px; }
.alert-icon {
  width: 44px; height: 44px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
}
.alert-icon.lowstock { background: #fff1f0; color: #ff4d4f; }
.alert-icon.maintenance { background: #fff7e6; color: #fa8c16; }
.alert-icon.warning { background: #fff7e6; color: #fa8c16; }
.alert-icon.expired { background: #fff1f0; color: #ff4d4f; }
.alert-info h4 { font-size: 14px; font-weight: 600; margin-bottom: 3px; }
.alert-info p { font-size: 12px; color: #999; }
.alert-info .meta { display: flex; gap: 4px; }
</style>