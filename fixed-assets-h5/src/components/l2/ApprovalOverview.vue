<template>
  <div class="approval-overview">
    <div class="summary">
      <div class="num">{{ pendingList.length }}</div>
      <div class="label">待审批</div>
    </div>

    <van-cell-group title="待办审批">
      <van-cell v-for="item in pendingList" :key="item.id" :title="item.assetName" :label="(item.applicantName || '-') + ' · ' + (item.createdAt || '')" is-link @click="openApproval(item)" />
      <van-empty v-if="!pendingList.length" description="暂无待审批项" />
    </van-cell-group>

    <van-cell-group title="已处理">
      <van-cell v-for="item in processedList" :key="item.id" :title="item.assetName" :label="(item.status === 'APPROVED' ? '已通过' : '已拒绝') + ' · ' + (item.handledAt || '')">
        <template #right-icon><StatusBadge :value="item.status" type="approval" /></template>
      </van-cell>
    </van-cell-group>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast, showConfirmDialog, showDialog } from 'vant'
import { getPendingList, approveApplication, rejectApplication } from '@/api/approvals'
import StatusBadge from '@/components/common/StatusBadge.vue'

const pendingList = ref([])
const processedList = ref([])

onMounted(refreshList)
async function refreshList() {
  try {
    const res = await getPendingList()
    pendingList.value = res.data?.pending || []
    processedList.value = res.data?.processed || []
  } catch (e) { console.error(e) }
}

async function openApproval(item) {
  try {
    await showConfirmDialog({
      title: item.assetName,
      message: '申请人：' + (item.applicantName || '-') + '\n类型：' + (item.typeLabel || item.type || '-') + '\n数量：' + (item.quantity || 1),
      confirmButtonText: '通过', confirmButtonColor: '#52c41a',
      cancelButtonText: '拒绝'
    })
    await approveApplication(item.id, { approverId: 'u005' })
    showToast('已通过')
    await refreshList()
  } catch {
    try {
      await showDialog({ title: '确认拒绝？', message: '确定拒绝吗？', showCancelButton: true, confirmButtonText: '确定拒绝' })
      await rejectApplication(item.id)
      showToast('已拒绝')
      await refreshList()
    } catch {}
  }
}
</script>

<style scoped>
.approval-overview { min-height: 100vh; background: #f7f8fa; padding: 16px; }
.summary { text-align: center; padding: 24px; background: #fff; border-radius: 12px; margin-bottom: 16px; }
.summary .num { font-size: 48px; font-weight: 700; color: #fa8c16; }
.summary .label { font-size: 14px; color: #999; }
</style>