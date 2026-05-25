<template>
  <div class="dashboard">
    <div class="section">
      <div class="title">盘点统计</div>
      <van-row gutter="12">
        <van-col span="6"><div class="stat-card"><div class="num">{{ data.monthCount || 0 }}</div><div class="label">本月</div></div></van-col>
        <van-col span="6"><div class="stat-card"><div class="num">{{ data.quarterCount || 0 }}</div><div class="label">本季</div></div></van-col>
        <van-col span="6"><div class="stat-card"><div class="num" style="color:#ee0a24">{{ data.totalDeficit || 0 }}</div><div class="label">盘亏</div></div></van-col>
        <van-col span="6"><div class="stat-card"><div class="num" style="color:#07c160">{{ data.totalSurplus || 0 }}</div><div class="label">盘盈</div></div></van-col>
      </van-row>
    </div>

    <div class="section">
      <div class="title">待审批</div>
      <van-cell-group inset>
        <van-cell v-for="(count, key) in data.pendingCounts" :key="key" :title="key" :value="count" />
        <van-empty v-if="!Object.keys(data.pendingCounts || {}).length" description="暂无待审批" />
      </van-cell-group>
    </div>

    <div class="section">
      <div class="title">检测到期提醒</div>
      <van-cell-group inset>
        <van-cell v-for="item in (data.expiredAssets || [])" :key="item.id" :title="item.name" :label="'到期: ' + (item.nextInspectionDate || '')" is-link @click="goDetail(item)" />
        <van-empty v-if="!(data.expiredAssets || []).length" description="无到期资产" />
      </van-cell-group>
    </div>

    <div class="section">
      <div class="title">预警资产</div>
      <van-cell-group inset>
        <van-cell v-for="item in (data.alertAssets || [])" :key="item.id" :title="item.name" :label="'库存: ' + (item.quantity || 0) + ' / 预警: ' + (item.alertMin || 0)" is-link @click="goDetail(item)" />
        <van-empty v-if="!(data.alertAssets || []).length" description="无预警资产" />
      </van-cell-group>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getOverview } from '@/api/dashboard'

const router = useRouter()
const data = ref({})

function goDetail(item) { router.push(`/l2/assets/${item.id}`) }

onMounted(async () => {
  try {
    const res = await getOverview()
    data.value = res.data || {}
  } catch (e) { console.error('Dashboard load error:', e) }
})
</script>

<style scoped>
.dashboard { padding: 16px; }
.section { margin-bottom: 20px; }
.title { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
.stat-card { background: #fff; border-radius: 8px; padding: 12px; text-align: center; }
.stat-card .num { font-size: 24px; font-weight: 700; color: #1989fa; }
.stat-card .label { font-size: 12px; color: #999; margin-top: 4px; }
</style>