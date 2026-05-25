<template>
  <AppShell title="资产详情" @back="router.back()">
    <div class="page" v-if="asset">
      <van-cell-group inset title="基本信息" style="margin-top:16px">
        <van-cell title="资产名称" :value="asset.name" />
        <van-cell title="资产编码" :value="asset.code" />
        <van-cell title="型号" :value="asset.model || '-'"/>
        <van-cell title="分类" :value="asset.categoryName || '-'"/>
        <van-cell title="存放地点" :value="asset.locationName || '-'"/>
        <van-cell title="状态" :value="statusLabel[asset.status] || asset.status" />
        <van-cell title="保管人" :value="asset.custodianName || '-'"/>
        <van-cell title="总数量" :value="asset.quantity" />
        <van-cell title="在用数量" :value="asset.inUseCount" />
        <van-cell title="单位" :value="asset.unit || '-'"/>
        <van-cell title="单价">
          <template #value><span>¥{{ Number(asset.price).toFixed(2) }}</span></template>
        </van-cell>
        <van-cell title="购置日期" :value="asset.purchaseDate || '-'"/>
      </van-cell-group>

      <van-cell-group inset title="检定信息" style="margin-top:16px">
        <van-cell title="检定周期" :value="asset.inspectionCycle ? asset.inspectionCycle + '天' : '未设置'"/>
        <van-cell title="上次检定" :value="asset.lastInspectionDate || '-'"/>
        <van-cell title="下次检定" :value="asset.nextInspectionDate || '-'"/>
      </van-cell-group>
    </div>
  </AppShell>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getAssets } from '@/api/assets'
import AppShell from '@/components/global/AppShell.vue'
import { useLoadingStore } from '@/stores/loading'

const route = useRoute()
const router = useRouter()
const asset = ref(null)
const loadingStore = useLoadingStore()

const statusLabel = { IDLE: '空闲', IN_USE: '在用', MAINTENANCE: '维修中', INSPECTION: '检测中', SCRAPPED: '已报废' }

onMounted(loadData)
async function loadData() {
  loadingStore.startLoading()
  try {
    const res = await getAssets({ pageSize: 200 })
    asset.value = (res.data?.list || []).find(a => a.id === route.params.id)
  } catch (e) {
    console.error(e)
    showToast('加载失败')
  } finally {
    loadingStore.stopLoading()
  }
}
</script>

<style scoped>
.page { padding: 16px; }
</style>
