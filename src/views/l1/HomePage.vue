<template>
  <AppShell title="我的资产" :show-back="false">
    <div class="l1-home">
      <div class="user-card">
        <div class="user-info">
          <div class="user-avatar">{{ userInfo?.name?.[0] }}</div>
          <div class="user-meta">
            <h3>{{ userInfo?.name }}</h3>
            <p>{{ userInfo?.dept }}</p>
          </div>
        </div>
        <div class="quick-actions">
          <div class="action-item" @click="goApply('receive')">
            <van-icon name="cart-o" size="24" />
            <span>领用申请</span>
          </div>
          <div class="action-item" @click="goApply('return')">
            <van-icon name="arrow-left" size="24" />
            <span>归还申请</span>
          </div>
          <div class="action-item" @click="goApply('repair')">
            <van-icon name="setting-o" size="24" />
            <span>报修申请</span>
          </div>
          <div class="action-item" @click="$router.push('/l1/my-applications')">
            <van-icon name="orders-o" size="24" />
            <span>我的申请</span>
          </div>
          <div class="action-item" @click="$router.push('/l1/debts')" v-if="hasDebtAccess">
            <van-icon name="balance-list-o" size="24" />
            <span>欠款管理</span>
          </div>
        </div>
      </div>

      <div class="section">
        <van-collapse v-model="activeNames">
          <van-collapse-item title="我名下的资产" name="assets">
            <van-empty description="暂无资产" v-if="!myAssets.length" />
            <div class="asset-list" v-else>
              <div
                v-for="a in myAssets"
                :key="a.id"
                class="asset-card"
                @click="$router.push(`/l1/assets/${a.id}`)"
              >
                <div class="asset-main">
                  <div class="asset-icon" :class="a.categoryName?.includes('易耗') ? 'consumable' : 'asset'">
                    <van-icon :name="a.categoryName?.includes('易耗') ? 'label-o' : 'desktop-o'" />
                  </div>
                  <div class="asset-info">
                    <h4>{{ a.name }}</h4>
                    <p class="code">{{ a.code }}</p>
                    <p class="loc"><van-icon name="location-o" size="12" /> {{ a.locationName }} · 领用{{ a.myQty || 1 }}{{ a.unit || '件' }}</p>
                  </div>
                </div>
                <StatusBadge :status="a.status" />
              </div>
            </div>
          </van-collapse-item>

          <van-collapse-item title="我的申请记录" name="applications">
            <van-empty description="暂无申请记录" v-if="!recentApps.length" />
            <div class="app-list" v-else>
              <div
                v-for="app in recentApps"
                :key="app.id"
                class="app-item"
              >
                <div class="app-main">
                  <span class="app-type">{{ typeLabel(app.type) }}</span>
                  <span class="app-asset">{{ app.assetName }}</span>
                </div>
                <div class="app-meta">
                  <span class="app-time">{{ app.createdAt?.slice(5, 16) }}</span>
                  <StatusBadge :status="app.status" />
                </div>
              </div>
            </div>
          </van-collapse-item>
        </van-collapse>
      </div>
    </div>
  </AppShell>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useAuthStore } from '@/stores/auth'
import { getAssets } from '@/api/assets'
import { getMyApplications } from '@/api/approvals'
import { checkDebtAccess } from '@/api/debts'
import AppShell from '@/components/global/AppShell.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const router = useRouter()
const authStore = useAuthStore()
const userInfo = computed(() => authStore.userInfo)
const myAssets = ref([])
const recentApps = ref([])
const hasDebtAccess = ref(false)
const activeNames = ref([])

const typeLabelMap = { receive: '领用', return: '归还', repair: '报修', scrap: '报废', loss: '报损' }
function typeLabel(t) { return typeLabelMap[t] || t }

function goApply(type) { router.push(`/l1/apply/${type}`) }

async function loadData() {
  const userId = userInfo.value?.id
  try {
    const [res1, res2] = await Promise.all([
      getAssets({ custodian: userId }),
      getMyApplications({ page: 1, pageSize: 100, userId })
    ])
    // 从已通过申请中统计每个资产的用户个人领用数
    const myQtyMap = {}
    const apps = res2.data?.list || []
    apps.filter(a => a.status === 'APPROVED' && a.type === 'receive').forEach(a => {
      myQtyMap[a.assetId] = (myQtyMap[a.assetId] || 0) + (a.quantity || 0)
    })
    apps.filter(a => a.status === 'APPROVED' && (a.type === 'return')).forEach(a => {
      myQtyMap[a.assetId] = (myQtyMap[a.assetId] || 0) - (a.quantity || 0)
    })
    const rawList = (res1.data?.list || []).filter(a => a.custodian === userId)
    myAssets.value = rawList.map(a => ({
      ...a,
      myQty: myQtyMap[a.id] || a.inUseCount || 1
    })).slice(0, 5)
    recentApps.value = apps.slice(0, 5)
  } catch {
    showToast('加载失败')
  }
}

async function checkAccess() {
  try {
    const res = await checkDebtAccess(userInfo.value?.id)
    hasDebtAccess.value = res.data?.hasAccess || false
  } catch { hasDebtAccess.value = false }
}

onMounted(function() { loadData(); checkAccess() })
</script>

<style scoped>
.l1-home { padding: 12px; }
.user-card {
  background: linear-gradient(135deg, #1989fa, #1a75d2);
  border-radius: 12px; padding: 16px; color: #fff; margin-bottom: 16px;
}
.user-info { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.user-avatar {
  width: 50px; height: 50px; border-radius: 50%;
  background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 600; flex-shrink: 0;
}
.user-meta h3 { font-size: 17px; font-weight: 600; margin-bottom: 2px; }
.user-meta p { font-size: 13px; opacity: 0.8; }
.quick-actions {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
  background: rgba(255,255,255,0.1); border-radius: 10px; padding: 12px;
}
.action-item {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  color: #fff; font-size: 12px; cursor: pointer; padding: 8px 0;
}
.section { margin-bottom: 16px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.section-header h4 { font-size: 15px; font-weight: 600; }
.section-header .more { font-size: 13px; color: #1989fa; cursor: pointer; }
.asset-card {
  background: #fff; border-radius: 10px; padding: 12px; margin-bottom: 8px;
  display: flex; align-items: center; gap: 12px; cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.asset-main { flex: 1; display: flex; gap: 10px; }
.asset-icon {
  width: 44px; height: 44px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
}
.asset-icon.asset { background: #e6f7ff; color: #1989fa; }
.asset-icon.consumable { background: #fff7e6; color: #fa8c16; }
.asset-info h4 { font-size: 14px; font-weight: 600; margin-bottom: 3px; }
.asset-info p { font-size: 12px; color: #999; }
.asset-info .code { margin-bottom: 2px; }
.asset-info .loc { display: flex; align-items: center; gap: 2px; }
.app-item {
  background: #fff; border-radius: 10px; padding: 12px; margin-bottom: 8px;
  display: flex; justify-content: space-between; align-items: center;
}
.app-main { display: flex; flex-direction: column; gap: 4px; }
.app-type { font-size: 12px; color: #1989fa; font-weight: 600; }
.app-asset { font-size: 14px; }
.app-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.app-time { font-size: 11px; color: #999; }
</style>