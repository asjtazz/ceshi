<template>
  <div class="my-requests-page">
    <van-nav-bar title="我的申请记录" left-arrow @click-left="$router.back()" />

    <van-tabs v-model:active="activeTab" sticky>
      <van-tab title="待审批">
        <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了">
          <div v-for="item in pendingList" :key="item.id" class="request-card">
            <van-card
              :title="item.assetName"
              :desc="`申请类型：${item.type}`"
              :num="item.quantity"
              :price="item.date"
              :thumb="item.thumb || 'https://fastly.jsdelivr.net/npm/@vant/assets/logo.png'"
            >
              <template #tags>
                <van-tag type="warning">待审批</van-tag>
              </template>
              <template #footer>
                <van-button size="mini" round plain type="danger" @click="cancelRequest(item.id)">撤回</van-button>
              </template>
            </van-card>
          </div>
        </van-list>
      </van-tab>
      <van-tab title="已通过">
        <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了">
          <div v-for="item in approvedList" :key="item.id" class="request-card">
            <van-card
              :title="item.assetName"
              :desc="`申请类型：${item.type}`"
              :num="item.quantity"
              :price="item.date"
            >
              <template #tags>
                <van-tag type="success">已通过</van-tag>
              </template>
            </van-card>
          </div>
        </van-list>
      </van-tab>
      <van-tab title="已拒绝">
        <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了">
          <div v-for="item in rejectedList" :key="item.id" class="request-card">
            <van-card
              :title="item.assetName"
              :desc="`申请类型：${item.type}`"
              :num="item.quantity"
              :price="item.date"
            >
              <template #tags>
                <van-tag type="danger">已拒绝</van-tag>
              </template>
              <template #footer>
                <van-button size="mini" round plain type="primary" @click="reapply(item)">重新申请</van-button>
              </template>
            </van-card>
          </div>
        </van-list>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { showToast } from 'vant'

const activeTab = ref(0)
const loading = ref(false)
const finished = ref(false)

const pendingList = ref([
  { id: 1, assetName: '联想ThinkPad X1 Carbon', type: '领用', quantity: 1, date: '2026-05-10', thumb: '' },
  { id: 2, assetName: '惠普 LaserJet Pro 打印机', type: '报修', quantity: 1, date: '2026-05-09', thumb: '' }
])

const approvedList = ref([
  { id: 3, assetName: '办公椅-人体工学款', type: '领用', quantity: 2, date: '2026-05-08' },
  { id: 4, assetName: 'A4 打印纸 500张/包', type: '领用', quantity: 5, date: '2026-05-06' }
])

const rejectedList = ref([
  { id: 5, assetName: 'iPhone 15 Pro', type: '领用', quantity: 1, date: '2026-05-05' }
])

function cancelRequest(id) {
  showToast('已撤回申请')
}

function reapply(item) {
  showToast('已重新提交申请')
}
</script>

<style scoped>
.request-card { margin: 8px 12px; }
</style>