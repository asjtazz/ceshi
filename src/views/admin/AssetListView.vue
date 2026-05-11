<template>
  <div class="asset-list-page">
    <van-nav-bar title="资产台账" left-arrow @click-left="$router.back()">
      <template #right>
        <van-icon name="plus" size="18" @click="showAddDialog = true" />
      </template>
    </van-nav-bar>

    <!-- 搜索 -->
    <van-search v-model="keyword" shape="round" placeholder="搜索资产名称/编号" />

    <!-- 状态筛选 -->
    <van-tabs v-model:active="statusFilter" sticky>
      <van-tab title="全部" />
      <van-tab title="在用" />
      <van-tab title="闲置" />
      <van-tab title="维修" />
      <van-tab title="报废" />
    </van-tabs>

    <!-- 资产列表 -->
    <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了">
      <div class="asset-card" v-for="item in filteredList" :key="item.id">
        <div class="asset-header">
          <span class="asset-code">{{ item.code }}</span>
          <van-tag :type="statusType(item.status)">{{ item.status }}</van-tag>
        </div>
        <div class="asset-body">
          <div class="asset-row"><span class="label">名称</span><span>{{ item.name }}</span></div>
          <div class="asset-row"><span class="label">分类</span><span>{{ item.category }}</span></div>
          <div class="asset-row"><span class="label">地点</span><span>{{ item.location }}</span></div>
          <div class="asset-row"><span class="label">使用人</span><span>{{ item.user }}</span></div>
        </div>
      </div>
    </van-list>

    <!-- 新增资产弹窗 -->
    <van-dialog v-model:show="showAddDialog" title="新增资产" show-cancel-button @confirm="addAsset" confirm-button-text="保存">
      <van-form @submit="addAsset" style="padding: 16px">
        <van-field v-model="newAsset.name" label="资产名称" placeholder="请输入" :rules="[{ required: true }]" />
        <van-field v-model="newAsset.category" label="资产分类" placeholder="请输入" />
        <van-field v-model="newAsset.location" label="存放地点" placeholder="请输入" />
        <van-field v-model="newAsset.code" label="资产编号" placeholder="自动生成可修改" />
      </van-form>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { showSuccessToast } from 'vant'

const keyword = ref('')
const statusFilter = ref(0)
const loading = ref(false)
const finished = ref(false)
const showAddDialog = ref(false)

const statusMap = ['全部', '在用', '闲置', '维修', '报废']

const newAsset = ref({ name: '', category: '', location: '', code: '' })

const assetList = ref([
  { id: 1, code: 'HX02-B01-0001', name: '联想ThinkPad X1', category: 'B-通用设备/计算机', location: '主站-办公室', status: '在用', user: '张峻山' },
  { id: 2, code: 'HX02-B02-0001', name: '惠普LaserJet Pro', category: 'B-通用设备/打印机', location: '主站-大厅', status: '在用', user: '艾培刚' },
  { id: 3, code: 'HX02-C01-0001', name: '制动检测台', category: 'C-专用设备/检测设备', location: '主站-检测车间', status: '在用', user: '程晨' },
  { id: 4, code: 'HX02-C01-0002', name: '尾气分析仪', category: 'C-专用设备/检测设备', location: '主站-检测车间', status: '维修', user: '-' },
  { id: 5, code: 'HX02-D01-0001', name: '办公桌-1.6m', category: 'D-家具装具/办公桌椅', location: '主站-办公室', status: '闲置', user: '-' }
])

const filteredList = computed(() => {
  let list = assetList.value
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter(i => i.name.includes(kw) || i.code.toLowerCase().includes(kw))
  }
  if (statusFilter.value > 0) {
    list = list.filter(i => i.status === statusMap[statusFilter.value])
  }
  return list
})

function statusType(status) {
  const map = { '在用': 'success', '闲置': 'default', '维修': 'warning', '报废': 'danger' }
  return map[status] || 'default'
}

function addAsset() {
  const item = {
    id: assetList.value.length + 1,
    code: newAsset.value.code || `HX02-${String(Date.now()).slice(-6)}`,
    name: newAsset.value.name,
    category: newAsset.value.category || '未分类',
    location: newAsset.value.location || '未指定',
    status: '闲置',
    user: '-'
  }
  assetList.value.unshift(item)
  newAsset.value = { name: '', category: '', location: '', code: '' }
  showSuccessToast('资产已添加')
}
</script>

<style scoped>
.asset-card { background: #fff; margin: 8px 12px; border-radius: 12px; padding: 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.asset-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.asset-code { font-size: 12px; color: #969799; font-family: monospace; }
.asset-body { }
.asset-row { display: flex; padding: 4px 0; font-size: 13px; }
.asset-row .label { width: 60px; color: #969799; flex-shrink: 0; }
</style>