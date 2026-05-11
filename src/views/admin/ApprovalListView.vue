<template>
  <div class="approval-page">
    <van-nav-bar title="审批管理" left-arrow @click-left="$router.back()" />

    <van-tabs v-model:active="activeTab" sticky>
      <van-tab title="待审批">
        <div class="approval-card" v-for="item in pendingList" :key="item.id">
          <div class="approval-header">
            <span class="approval-user">{{ item.user }}</span>
            <van-tag plain type="warning">待审批</van-tag>
          </div>
          <div class="approval-body">
            <p><span class="label">申请类型：</span>{{ item.type }}</p>
            <p><span class="label">资产名称：</span>{{ item.assetName }}</p>
            <p><span class="label">数量：</span>{{ item.quantity }}</p>
            <p><span class="label">申请时间：</span>{{ item.date }}</p>
            <p class="remark" v-if="item.remark"><span class="label">说明：</span>{{ item.remark }}</p>
          </div>
          <div class="approval-actions">
            <van-button size="small" round plain type="danger" @click="reject(item.id)">拒绝</van-button>
            <van-button size="small" round type="primary" @click="approve(item.id)">通过</van-button>
          </div>
        </div>
      </van-tab>
      <van-tab title="已处理">
        <div class="approval-card" v-for="item in historyList" :key="item.id">
          <div class="approval-header">
            <span class="approval-user">{{ item.user }}</span>
            <van-tag :type="item.result === '通过' ? 'success' : 'danger'">{{ item.result }}</van-tag>
          </div>
          <div class="approval-body">
            <p><span class="label">申请类型：</span>{{ item.type }}</p>
            <p><span class="label">资产名称：</span>{{ item.assetName }}</p>
            <p><span class="label">处理时间：</span>{{ item.processDate }}</p>
          </div>
        </div>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { showSuccessToast, showToast } from 'vant'

const activeTab = ref(0)

const pendingList = ref([
  { id: 1, user: '张峻山', type: '领用', assetName: '联想ThinkPad X1', quantity: 1, date: '2026-05-11', remark: '旧电脑太卡需要更换' },
  { id: 2, user: '程晨', type: '报修', assetName: '尾气分析仪', quantity: 1, date: '2026-05-10', remark: '检测数据不稳定' },
  { id: 3, user: '艾培刚', type: '领用', assetName: 'A4打印纸', quantity: 5, date: '2026-05-10', remark: '' }
])

const historyList = ref([
  { id: 4, user: '张峻山', type: '领用', assetName: '办公椅', result: '通过', processDate: '2026-05-09' },
  { id: 5, user: '程晨', type: '报废', assetName: '旧空调', result: '拒绝', processDate: '2026-05-08' }
])

function approve(id) {
  const idx = pendingList.value.findIndex(i => i.id === id)
  if (idx > -1) {
    const item = pendingList.value.splice(idx, 1)[0]
    historyList.value.unshift({ ...item, result: '通过', processDate: new Date().toISOString().slice(0, 10) })
    showSuccessToast('已审批通过')
  }
}

function reject(id) {
  const idx = pendingList.value.findIndex(i => i.id === id)
  if (idx > -1) {
    const item = pendingList.value.splice(idx, 1)[0]
    historyList.value.unshift({ ...item, result: '拒绝', processDate: new Date().toISOString().slice(0, 10) })
    showToast('已拒绝')
  }
}
</script>

<style scoped>
.approval-card { background: #fff; margin: 8px 12px; border-radius: 12px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.approval-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.approval-user { font-size: 15px; font-weight: 600; }
.approval-body p { font-size: 13px; color: #323233; padding: 2px 0; }
.approval-body .label { color: #969799; }
.approval-body .remark { color: #666; font-style: italic; }
.approval-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f5f5f5; }
</style>