<template>
  <div class="inventory-page">
    <van-nav-bar title="盘点管理" left-arrow @click-left="$router.back()" />

    <div class="section-card">
      <div class="section-title">📋 盘点任务</div>
      <div class="inventory-task" v-for="task in tasks" :key="task.id">
        <div class="task-header">
          <span class="task-name">{{ task.name }}</span>
          <van-tag :type="task.status === '进行中' ? 'warning' : 'success'">{{ task.status }}</van-tag>
        </div>
        <div class="task-info">
          <p>范围：{{ task.range }}</p>
          <p>开始：{{ task.startDate }}</p>
          <p>进度：{{ task.progress }}%（{{ task.done }}/{{ task.total }}）</p>
        </div>
        <van-progress :percentage="task.progress" color="#1989fa" :show-pivot="false" style="margin: 8px 0" />
        <div class="task-actions" v-if="task.status === '进行中'">
          <van-button size="small" round type="primary" @click="startScan(task.id)">扫码盘点</van-button>
        </div>
      </div>
    </div>

    <div class="section-card">
      <div class="section-title">➕ 新建盘点</div>
      <van-form @submit="createTask" style="padding: 8px 0">
        <van-field v-model="newTask.name" label="任务名称" placeholder="请输入盘点任务名称" :rules="[{ required: true }]" />
        <van-field v-model="newTask.range" is-link readonly label="盘点范围" placeholder="选择盘点范围" @click="showRangePicker = true" />
        <van-field v-model="newTask.endDate" is-link readonly label="截止日期" placeholder="选择截止日期" @click="showDatePicker = true" />
        <van-button round block type="primary" native-type="submit" size="small" style="margin-top: 12px">创建盘点任务</van-button>
      </van-form>
    </div>

    <van-popup v-model:show="showRangePicker" position="bottom" round>
      <van-picker :columns="rangeOptions" @confirm="onRangeConfirm" @cancel="showRangePicker = false" title="选择盘点范围" />
    </van-popup>

    <van-popup v-model:show="showDatePicker" position="bottom" round>
      <van-date-picker v-model="selectedDate" title="选择日期" @confirm="onDateConfirm" @cancel="showDatePicker = false" />
    </van-popup>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { showSuccessToast } from 'vant'

const showRangePicker = ref(false)
const showDatePicker = ref(false)
const selectedDate = ref([])

const tasks = ref([
  { id: 1, name: '2026年5月全库盘点', range: '全库', status: '进行中', startDate: '2026-05-01', done: 98, total: 156, progress: 63 },
  { id: 2, name: '检测车间专项盘点', range: '主站-检测车间', status: '已完成', startDate: '2026-04-15', done: 45, total: 45, progress: 100 }
])

const newTask = ref({ name: '', range: '', endDate: '' })
const rangeOptions = ['全库盘点', '按地点：主站', '按地点：分站', '按分类：专用设备', '按分类：通用设备']

function onRangeConfirm({ selectedOptions }) {
  newTask.value.range = selectedOptions[0]?.text || selectedOptions[0]
  showRangePicker.value = false
}

function onDateConfirm({ selectedValues }) {
  newTask.value.endDate = selectedValues.join('-')
  showDatePicker.value = false
}

function createTask() {
  tasks.value.unshift({
    id: Date.now(),
    name: newTask.value.name,
    range: newTask.value.range,
    status: '进行中',
    startDate: new Date().toISOString().slice(0, 10),
    done: 0,
    total: 0,
    progress: 0
  })
  newTask.value = { name: '', range: '', endDate: '' }
  showSuccessToast('盘点任务已创建')
}

function startScan(id) {
  showSuccessToast('请使用扫码枪扫描资产二维码')
}
</script>

<style scoped>
.section-card { background: #fff; margin: 12px; border-radius: 12px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.section-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
.inventory-task { padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
.inventory-task:last-child { border-bottom: none; }
.task-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.task-name { font-size: 14px; font-weight: 500; }
.task-info p { font-size: 12px; color: #969799; padding: 2px 0; }
.task-actions { margin-top: 8px; }
</style>