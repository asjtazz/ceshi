<template>
  <div class="audit-log-viewer">
    <div class="toolbar">
      <van-dropdown-menu>
        <van-dropdown-item v-model="filterType" :options="filterOptions" />
      </van-dropdown-menu>
      <van-field v-model="keyword" placeholder="搜索详情" clearable @keyup.enter="onSearch" />
    </div>

    <DataTable :loading="loading" :finished="finished" @load="loadMore" @refresh="onRefresh">
      <van-cell v-for="item in list" :key="item.id" :title="actionLabel(item.action)" :label="item.detail" :value="item.createdAt" />
      <van-empty v-if="!list.length && !loading" description="暂无日志" />
    </DataTable>

    <van-popup v-model:show="detailVisible" position="bottom" round closeable style="max-height:80vh;overflow-y:auto;padding:20px">
      <div v-if="detailData">
        <h3>{{ detailData.typeLabel || detailData.type }}申请 #{{ detailData.id }}</h3>
        <van-cell-group inset>
          <van-cell title="申请类型" :value="detailData.typeLabel || detailData.type" />
          <van-cell title="申请人" :value="detailData.applicantName || '-'" />
          <van-cell title="资产名称" :value="detailData.assetName || '-'" />
          <van-cell title="资产编码" :value="detailData.assetCode || '-'" />
          <van-cell title="申请数量" :value="detailData.quantity || 1" />
          <van-cell title="申请时间" :value="detailData.createdAt || '-'" />
          <van-cell title="审批状态" :value="statusLabel(detailData.status)" />
          <van-cell v-if="detailData.approverId" title="审批人" :value="detailData.approverId" />
          <van-cell v-if="detailData.handledAt" title="审批时间" :value="detailData.handledAt" />
        </van-cell-group>

        <h4 v-if="detailData.auditLogs?.length" style="margin:16px 0 8px;font-size:15px;color:#333">审批流转记录</h4>
        <van-cell-group inset v-if="detailData.auditLogs?.length">
          <van-cell v-for="log in detailData.auditLogs" :key="log.id">
            <template #title><span>{{ actionLabel(log.action) }}</span><span style="color:#999;font-size:12px;margin-left:8px">{{ log.createdAt }}</span></template>
            <template #label>{{ log.detail }}</template>
          </van-cell>
        </van-cell-group>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { showToast } from 'vant'
import { getAuditLogs, getApplicationDetail } from '@/api/config'
import DataTable from '@/components/common/DataTable.vue'

const actionLabel = (action) => ({
  CREATE: '创建', APPLY: '提交申请', APPROVE: '审批通过', REJECT: '审批拒绝',
  INVENTORY: '盘点', CONFIG: '配置', SURPLUS: '盘盈入库', INSPECTION: '检测完成'
}[action] || action)

const statusLabel = (s) => ({ PENDING: '待审批', APPROVED: '已通过', REJECTED: '已拒绝' }[s] || s)

const list = ref([])
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const keyword = ref('')
const filterType = ref('')
const filterOptions = [
  { text: '全部类型', value: '' },
  { text: '创建', value: 'CREATE' },
  { text: '提交申请', value: 'APPLY' },
  { text: '审批通过', value: 'APPROVE' },
  { text: '审批拒绝', value: 'REJECT' },
  { text: '盘点', value: 'INVENTORY' }
]

const detailVisible = ref(false)
const detailData = ref(null)

async function loadMore() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: 20 }
    if (keyword.value.trim()) params.keyword = keyword.value.trim()
    const res = await getAuditLogs(params)
    const items = res.data?.list || []
    list.value = page.value === 1 ? items : [...list.value, ...items]
    finished.value = items.length < 20
    page.value++
  } catch { /* ignore */ }
  finally { loading.value = false }
}

async function onRefresh() { page.value = 1; list.value = []; await loadMore() }
async function onSearch() { page.value = 1; list.value = []; await loadMore() }

async function showDetail(item) {
  // 从 target 字段提取申请ID，如 "申请:APP001"
  const match = item.target?.match(/申请:(\w+)/)
  if (!match) { showToast('该日志无关联申请单'); return }
  try {
    const res = await getApplicationDetail(match[1])
    if (res.code === 0 && res.data) { detailData.value = res.data; detailVisible.value = true }
    else showToast('获取详情失败')
  } catch { showToast('获取详情失败') }
}
</script>

<style scoped>
.audit-log-viewer { background: #f7f8fa; min-height: 100vh; }
.toolbar { display: flex; gap: 8px; padding: 12px; background: #fff; align-items: center; flex-wrap: wrap; }
</style>