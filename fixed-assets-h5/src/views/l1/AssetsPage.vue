<template>
  <AppShell title="资产列表">
    <div class="l1-assets">
      <div class="search-bar">
        <van-search v-model="keyword" placeholder="搜索资产名称/编码" @search="onSearch" />
      </div>
      <div class="filter-bar">
        <div class="filter-item" @click="showType = true">
          <span>{{ typeLabel }}</span>
          <van-icon name="arrow-down" size="12" />
        </div>
        <div class="filter-item" @click="showStatus = true">
          <span>{{ statusLabel }}</span>
          <van-icon name="arrow-down" size="12" />
        </div>
        <div class="filter-item" @click="exportAssets">
          <van-icon name="down" size="14" />
          <span>导出</span>
        </div>
      </div>
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list v-model="loading" :finished="finished" finished-text="没有更多了" @load="onLoad">
          <van-empty description="暂无数据" v-if="!list.length && !loading" />
          <div class="asset-list" v-else>
            <div
              v-for="a in list"
              :key="a.id"
              class="asset-card"
              @click="goDetail(a)"
            >
              <div class="asset-main">
                <div class="asset-icon" :class="a.categoryName?.includes('易耗') ? 'consumable' : 'asset'">
                  <van-icon :name="a.categoryName?.includes('易耗') ? 'label-o' : 'desktop-o'" />
                </div>
                <div class="asset-info">
                  <h4>{{ a.name }}</h4>
                  <p class="code">{{ a.code }}</p>
                  <p class="meta">
                    <span>{{ a.categoryName }}</span>
                    <span>·</span>
                    <span>{{ a.locationName }}</span>
                  </p>
                </div>
              </div>
              <StatusBadge :status="a.status" />
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>

    <van-popup v-model:show="showType" position="bottom" round>
      <van-picker title="资产类型" :columns="typeColumns" @confirm="onTypeConfirm" @cancel="showType = false" />
    </van-popup>
    <van-popup v-model:show="showStatus" position="bottom" round>
      <van-picker title="状态" :columns="statusColumns" @confirm="onStatusConfirm" @cancel="showStatus = false" />
    </van-popup>
  </AppShell>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAssets } from '@/api/assets'
import AppShell from '@/components/global/AppShell.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useLoadingStore } from '@/stores/loading'

const router = useRouter()
const loadingStore = useLoadingStore()
const keyword = ref('')
const type = ref('')
const status = ref('')
const showType = ref(false)
const showStatus = ref(false)
const list = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)
const pageSize = 10

const typeColumns = [{ text: '全部', value: '' }, { text: '固定资产', value: 'asset' }, { text: '易耗品', value: 'consumable' }]
const statusColumns = [
  { text: '全部', value: '' },
  { text: '在用', value: 'IN_USE' },
  { text: '闲置', value: 'IDLE' },
  { text: '维修中', value: 'MAINTENANCE' },
  { text: '检测中', value: 'INSPECTION' },
]
const typeLabel = computed(() => typeColumns.find(c => c.value === type.value)?.text || '全部类型')
const statusLabel = computed(() => statusColumns.find(c => c.value === status.value)?.text || '全部状态')

async function loadData(refresh = false) {
  if (refresh) { page.value = 1; list.value = [] }
  const params = { page: page.value, pageSize, keyword: keyword.value, status: status.value }
  if (type.value) params.isConsumable = type.value === 'consumable'
  loadingStore.startLoading()
  try {
    const res = await getAssets(params)
    const newItems = res.data?.list || []
    const map = new Map(list.value.map(a => [a.id, a]))
    newItems.forEach(a => map.set(a.id, a))
    list.value = Array.from(map.values())
    finished.value = (res.data?.list?.length || 0) < pageSize
    page.value++
  } finally {
    loadingStore.stopLoading()
  }
}

function onSearch() { loadData(true) }
function onTypeConfirm({ selectedOptions }) { type.value = selectedOptions[0]?.value; showType.value = false; loadData(true) }
function onStatusConfirm({ selectedOptions }) { status.value = selectedOptions[0]?.value; showStatus.value = false; loadData(true) }
function onLoad() { loadData() }
function onRefresh() { refreshing.value = true; loadData(true).finally(() => refreshing.value = false) }
function goDetail(a) { router.push(`/l1/assets/${a.id}`) }

function exportAssets() {
  let url = 'http://localhost:3002/api/assets/export?';
  const params = [];
  if (keyword.value) params.push(`keyword=${encodeURIComponent(keyword.value)}`);
  if (status.value) params.push(`status=${encodeURIComponent(status.value)}`);
  if (type.value) params.push(`isConsumable=${type.value === 'consumable'}`);
  url += params.join('&');
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `资产列表_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

onMounted(() => loadData())
</script>

<style scoped>
.l1-assets { min-height: 100vh; }
.search-bar { padding: 8px 12px; background: #fff; }
.filter-bar {
  display: flex; gap: 12px; padding: 8px 16px;
  background: #fff; border-bottom: 1px solid #f5f5f5;
}
.filter-item {
  display: flex; align-items: center; gap: 4px;
  font-size: 13px; color: #666; cursor: pointer;
  padding: 4px 8px; background: #f5f5f5; border-radius: 6px;
}
.asset-list { padding: 8px 12px; }
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
.asset-info .meta { display: flex; gap: 4px; }
</style>