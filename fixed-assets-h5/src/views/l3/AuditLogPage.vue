<template>
  <AppShell title="审计日志">
    <div class="audit-log-page">
      <div class="search-bar">
        <van-search v-model="keyword" placeholder="搜索操作内容" @search="onSearch" />
      </div>

      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list v-model="loading" :finished="finished" finished-text="没有更多了" @load="onLoad">
          <van-empty description="暂无日志记录" v-if="!list.length && !loading" />
          <div class="log-list" v-else>
            <div
              v-for="log in list"
              :key="log.id"
              class="log-item"
              @click="showDetail(log)"
            >
              <div class="log-icon" :class="logIconClass(log.action)">
                <van-icon :name="logIcon(log.action)" size="16" />
              </div>
              <div class="log-info">
                <div class="log-header">
                  <span class="log-action">{{ formatAction(log.action) }}</span>
                  <span class="log-time">{{ log.createdAt }}</span>
                </div>
                <p class="log-target">对象: {{ formatTarget(log) }}</p>
                <p class="log-detail" v-if="extractQty(log.detail)">{{ extractQty(log.detail) }}</p>
                <p class="log-operator">操作人: {{ formatOperator(log.operator) }}</p>
              </div>
              <van-icon name="arrow" size="14" style="color:#ccc;align-self:center;flex-shrink:0" />
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 日志详情弹窗 -->
    <van-popup v-model:show="showLogDetail" position="bottom" round style="height:70%">
      <div class="detail-popup" v-if="curLog">
        <div class="detail-title">{{ formatAction(curLog.action) }}</div>
        <van-cell-group inset>
          <van-cell title="操作时间" :value="curLog.createdAt" />
          <van-cell title="操作人" :value="formatOperator(curLog.operator)" />
          <van-cell title="对象">{{ formatTarget(curLog) }}</van-cell>
        </van-cell-group>
        <div class="detail-section">
          <div class="detail-section-title">详细内容</div>
          <div class="detail-content">{{ curLog.detail }}</div>
        </div>
      </div>
    </van-popup>
  </AppShell>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppShell from '@/components/global/AppShell.vue'
import { getAuditLogs } from '@/api/config'

const keyword = ref('')
const list = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)
const pageSize = 20
const showLogDetail = ref(false)
const curLog = ref(null)

function logIcon(action) {
  const map = {
    'CREATE': 'plus', '新增资产': 'plus',
    'APPROVE': 'success', '审批通过': 'success',
    'REJECT': 'cross', '审批拒绝': 'cross',
    'INVENTORY': 'scan', '盘点': 'scan',
    'DELETE': 'trash', '删除': 'trash',
    'APPLY': 'edit', 'INSPECTION': 'clock-o',
    'CONFIG': 'setting-o', 'SURPLUS': 'plus'
  }
  return map[action] || 'records'
}
function logIconClass(action) {
  const map = {
    'CREATE': 'create', '新增资产': 'create',
    'APPROVE': 'success', '审批通过': 'success',
    'REJECT': 'reject', '审批拒绝': 'reject',
    'INVENTORY': 'scan', '盘点': 'scan',
    'DELETE': 'delete', '删除': 'delete',
    'APPLY': 'apply', 'INSPECTION': 'inspection',
    'CONFIG': 'config', 'SURPLUS': 'surplus'
  }
  return map[action] || 'default'
}

var userNameMap = { u001:"张三", u002:"李四", u003:"王五", u004:"赵六", u005:"管理员", u006:"系统管理员" }
function formatOperator(op) { return userNameMap[op] || op }
function formatTarget(log) {
  // 把 target 里的 ID 替换为人类可读格式
  // 例如: "任务:TASK001" → "盘点任务：办公室"
  const detail = log.detail || ''
  if (detail.startsWith('创建盘点任务：')) return '盘点任务：' + detail.replace('创建盘点任务：', '')
  if (detail.startsWith('完成盘点任务：')) return '盘点任务：' + detail.replace('完成盘点任务：', '').split('，')[0]
  if (detail.startsWith('取消盘点任务：')) return '盘点任务：' + detail.replace('取消盘点任务：', '')
  if (detail.startsWith('盘盈入库：')) return '盘盈入库：' + detail.replace('盘盈入库：', '')
  if (detail.startsWith('新增资产：')) return '新增资产：' + detail.replace('新增资产：', '').split('，')[0]
  if (detail.startsWith('检测完成：')) return '检测完成：' + detail.replace('检测完成：', '')
  if (detail.startsWith('提交')) return detail.split('：')[0] + '：' + detail.split('：')[1]?.split(' × ')[0] || detail
  if (detail.startsWith('审批通过：') || detail.startsWith('审批拒绝：')) {
    return (detail.startsWith('审批通过') ? '审批通过：' : '审批拒绝：') + detail.split('：')[1]
  }
  return log.target
}

function formatAction(action) {
  const map = {
    'CREATE': '新增资产', 'DELETE': '删除资产',
    'APPROVE': '审批通过', 'REJECT': '审批拒绝',
    'INVENTORY': '盘点', 'APPLY': '提交申请',
    'INSPECTION': '检测完成', 'CONFIG': '配置变更', 'SURPLUS': '盘盈入库'
  }
  return map[action] || action
}

function showDetail(log) {
  curLog.value = log
  showLogDetail.value = true
}

function extractQty(detail) {
  // 提取 detail 中的数量，如 "500张/箱" 或 "× 2"
  const match = detail.match(/(\d+)\s*(张|台|件|个|箱|瓶|套|把|米|批)/)
  return match ? match[0] : null
}

async function loadData(refresh = false) {
  if (refresh) page.value = 1
  const params = { page: page.value, pageSize, keyword: keyword.value }
  const res = await getAuditLogs(params)
  if (refresh) list.value = res.data?.list || []
  else list.value.push(...(res.data?.list || []))
  finished.value = (res.data?.list?.length || 0) < pageSize
  page.value++
}

function onSearch() { loadData(true) }
function onLoad() { loadData() }
function onRefresh() { refreshing.value = true; loadData(true).finally(() => refreshing.value = false) }
onMounted(() => loadData())
</script>

<style scoped>
.audit-log-page { min-height: 100vh; }
.search-bar { padding: 8px 12px; background: #fff; }
.log-list { padding: 8px 12px; }
.log-item { background: #fff; border-radius: 10px; padding: 12px; margin-bottom: 8px; display: flex; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); cursor: pointer; }
.log-item:active { background: #f5f5f5; }
.log-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.log-icon.create { background: #e6f7ff; color: #1989fa; }
.log-icon.success { background: #f6ffed; color: #52c41a; }
.log-icon.reject { background: #fff1f0; color: #ff4d4f; }
.log-icon.scan { background: #fff7e6; color: #fa8c16; }
.log-icon.delete { background: #fff1f0; color: #ff4d4f; }
.log-icon.apply { background: #f0f5ff; color: #2f54eb; }
.log-icon.inspection { background: #fff0f6; color: #eb2f96; }
.log-icon.config { background: #f9f0ff; color: #722ed1; }
.log-icon.surplus { background: #f6ffed; color: #52c41a; }
.log-icon.default { background: #f5f5f5; color: #999; }
.log-info { flex: 1; }
.log-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
.log-action { font-size: 14px; font-weight: 600; }
.log-time { font-size: 11px; color: #999; }
.log-target, .log-detail, .log-operator { font-size: 12px; color: #999; margin-top: 2px; }
.detail-popup { padding: 16px; }
.detail-title { text-align: center; font-size: 16px; font-weight: 600; margin-bottom: 16px; }
.detail-section { margin-top: 16px; background: #f7f8fa; border-radius: 8px; padding: 12px; }
.detail-section-title { font-size: 13px; font-weight: 500; color: #333; margin-bottom: 8px; }
.detail-content { font-size: 13px; color: #666; line-height: 1.6; white-space: pre-wrap; word-break: break-all; }
</style>