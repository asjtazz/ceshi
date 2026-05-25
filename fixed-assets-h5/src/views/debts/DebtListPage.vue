<template>
  <AppShell title="欠款管理">
    <div class="debt-page">
      <div class="toolbar">
        <van-search v-model="keyword" placeholder="搜索欠款单位" @search="onSearch" />
      </div>
      <div class="filter-bar">
        <div class="filter-item" @click="showFilter = true">
          <span>{{ filterLabel }}</span>
          <van-icon name="arrow-down" size="12" />
        </div>
        <div class="filter-item" @click="onExport"><van-icon name="down" size="14" /><span>导出</span></div>
        <div class="filter-item" @click="showCreate = true">
          <van-icon name="plus" size="14" />
          <span>新增</span>
        </div>
      </div>
      <div class="stats-bar" v-if="stats">
        <div class="stat-item"><span class="stat-num" style="color:#1989fa">{{ stats.totalDebts }}</span><span class="stat-label">欠款记录</span></div>
        <div class="stat-item"><span class="stat-num" style="color:#ff4d4f">{{ stats.totalAmount }}</span><span class="stat-label">待还总额</span></div>
        <div class="stat-item"><span class="stat-num" style="color:#52c41a">{{ stats.totalPaid }}</span><span class="stat-label">已还总额</span></div>
        <div class="stat-item"><span class="stat-num" style="color:#fa8c16">{{ stats.totalBalance }}</span><span class="stat-label">剩余欠款</span></div>
      </div>
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="onLoad">
          <van-empty description="暂无欠款记录" v-if="!list.length && !loading" />
          <div class="debt-list" v-else>
            <div v-for="d in list" :key="d.id" class="debt-card" @click="$router.push(route.path + '/' + d.id)">
              <div class="debt-header">
                <span class="debtor">{{ d.debtorName }}</span>
                <van-tag :type="statusType[d.status] || 'default'">{{ statusLabel[d.status] || d.status }}</van-tag>
              </div>
              <div class="debt-body">
                <div class="amount-row">
                  <span>欠款总额: <strong>¥{{ Number(d.amount).toFixed(2) }}</strong></span>
                  <span>已还: ¥{{ Number(d.paidAmount).toFixed(2) }}</span>
                </div>
                <div class="balance-row">
                  <span>剩余欠款:</span>
                  <span class="balance" :class="{ overdue: d.status === 'OVERDUE' }">¥{{ Number(d.balance || d.amount - d.paidAmount).toFixed(2) }}</span>
                </div>
                <div class="meta-row">
                  <span>责任人: {{ d.responsiblePerson || '-' }}</span>
                  <span>到期日: {{ d.dueDate || '-' }}</span>
                </div>
              </div>
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>

    <van-popup v-model:show="showFilter" position="bottom" round>
      <van-picker title="筛选状态" :columns="filterOptions" @confirm="onFilterConfirm" @cancel="showFilter = false" />
    </van-popup>

    <van-dialog v-model:show="showCreate" title="新增欠款" show-cancel-button @confirm="beforeCreateClose" :before-close="beforeCreateClose">
      <div style="padding:16px">
        <van-field v-model="createForm.debtorName" label="欠款单位" placeholder="请输入欠款单位" :rules="[{ required: true, message: '请输入欠款单位' }]" />
        <van-field v-model="createForm.contactPerson" label="联系人" placeholder="请输入联系人" />
        <van-field v-model="createForm.contactPhone" label="联系电话" placeholder="请输入联系电话" />
        <van-field v-model="createForm.amount" label="欠款总额" type="number" placeholder="请输入欠款总额" />
        <van-field v-model="createForm.responsiblePerson" label="责任人" placeholder="请输入责任人" />
        <van-field v-model="createForm.dueDate" label="到期日" is-link readonly placeholder="选择到期日" @click="showDueDate = true" />
        <van-field v-model="createForm.remark" label="备注" placeholder="备注说明" />
      </div>
    </van-dialog>

    <van-popup v-model:show="showDueDate" position="bottom" round>
      <van-date-picker title="选择到期日" :min-date="minDate" @confirm="onDueDateConfirm" @cancel="showDueDate = false" />
    </van-popup>
  </AppShell>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue"
import { useRoute } from "vue-router"
import { showToast } from "vant"
import { getDebts, createDebt } from "@/api/debts"
import AppShell from "@/components/global/AppShell.vue"
import { useLoadingStore } from "@/stores/loading"

const route = useRoute()
const loadingStore = useLoadingStore()
const stats = ref(null)
const keyword = ref("")
const status = ref("")
const showFilter = ref(false)
const showCreate = ref(false)
const list = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const showDueDate = ref(false)
const page = ref(1)
const pageSize = 20

const today = new Date()
const minDate = new Date(today)
minDate.setDate(today.getDate() + 1)
const defaultDueDate = new Date(today)
defaultDueDate.setMonth(today.getMonth() + 1)
function formatDate(d) {
  return d.toISOString().slice(0, 10)
}

const createForm = reactive({
  debtorName: "",
  contactPerson: "",
  contactPhone: "",
  amount: "",
  responsiblePerson: "",
  dueDate: formatDate(defaultDueDate),
  remark: ""
})

const statusLabel = {
  PENDING: "待还",
  OVERDUE: "逾期",
  SETTLED: "已核销"
}
const statusType = {
  PENDING: "warning",
  OVERDUE: "danger",
  SETTLED: "success"
}
const filterOptions = [
  { text: "全部状态", value: "" },
  { text: "待还", value: "PENDING" },
  { text: "逾期", value: "OVERDUE" },
  { text: "已核销", value: "SETTLED" }
]
const filterLabel = ref("全部状态")

async function loadStats() {
  try {
    const res = await getDebts({ page: 1, pageSize: 1000 })
    const items = res.data?.list || []
    const totalAmount = items.reduce(function(s, d) {
      return s + Number(d.amount || 0)
    }, 0)
    const totalPaid = items.reduce(function(s, d) {
      return s + Number(d.paidAmount || 0)
    }, 0)
    stats.value = {
      totalDebts: items.length,
      totalAmount: totalAmount.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      totalBalance: (totalAmount - totalPaid).toFixed(2)
    }
  } catch { }
}

async function loadData(refresh = false) {
  if (refresh) {
    page.value = 1
    list.value = []
  }
  const params = { page: page.value, pageSize, keyword: keyword.value }
  if (status.value) params.status = status.value
  try {
    const res = await getDebts(params)
    const items = res.data?.list || []
    if (refresh) {
      list.value = items
    } else {
      list.value.push(...items)
    }
    finished.value = items.length < pageSize
    page.value++
  } catch { }
}

function onSearch() {
  loadData(true)
}

function onLoad() {
  loadData()
}

function onRefresh() {
  refreshing.value = true
  loadData(true).finally(() => {
    refreshing.value = false
  })
}

async function onExport() {
  try {
    const token = localStorage.getItem("assets_token") || ""
    const url = import.meta.env.VITE_APP_BASE_API + "/export/debts"
    const res = await fetch(url, { headers: { Authorization: "Bearer " + token } })
    const blob = await res.blob()
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "欠款导出_" + new Date().toISOString().slice(0,10) + ".csv"
    a.click()
    showToast("导出成功")
  } catch {
    showToast("导出失败")
  }
}

function onFilterConfirm({ selectedOptions }) {
  status.value = selectedOptions[0]?.value || ""
  filterLabel.value = selectedOptions[0]?.text || "全部状态"
  showFilter.value = false
  loadData(true)
}

function onDueDateConfirm({ selectedValues }) {
  createForm.dueDate = selectedValues.join("-")
  showDueDate.value = false
}

async function beforeCreateClose(action) {
  if (action === "confirm") {
    if (!createForm.debtorName) {
      showToast("请输入欠款单位")
      return false
    }
    loadingStore.startLoading("创建中...")
    try {
      await createDebt({
        debtorName: createForm.debtorName,
        contactPerson: createForm.contactPerson,
        contactPhone: createForm.contactPhone,
        amount: parseFloat(createForm.amount) || 0,
        responsiblePerson: createForm.responsiblePerson,
        dueDate: createForm.dueDate,
        remark: createForm.remark
      })
      showToast("创建成功")
      showCreate.value = false
      createForm.debtorName = ""
      createForm.contactPerson = ""
      createForm.contactPhone = ""
      createForm.amount = ""
      createForm.responsiblePerson = ""
      createForm.dueDate = formatDate(defaultDueDate)
      createForm.remark = ""
      loadData(true)
      loadStats()
    } catch {
      showToast("创建失败")
      return false
    } finally {
      loadingStore.stopLoading()
    }
  }
  return true
}

onMounted(() => {
  loadData()
  loadStats()
})
</script>

<style scoped>
.stats-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
}
.stats-bar .stat-item {
  text-align: center;
}
.stats-bar .stat-num {
  display: block;
  font-size: 18px;
  font-weight: 700;
}
.stats-bar .stat-label {
  font-size: 11px;
  color: #999;
}
.debt-page {
  min-height: 100vh;
}
.toolbar {
  padding: 8px 12px;
  background: #fff;
}
.filter-bar {
  display: flex;
  gap: 12px;
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #f5f5f5;
}
.filter-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  padding: 4px 8px;
  background: #f5f5f5;
  border-radius: 6px;
}
.debt-list {
  padding: 8px 12px;
}
.debt-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  cursor: pointer;
}
.debt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.debtor {
  font-size: 15px;
  font-weight: 600;
}
.debt-body {
  font-size: 13px;
  color: #666;
}
.amount-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}
.balance-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}
.balance {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}
.balance.overdue {
  color: #ff4d4f;
}
.meta-row {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
}
</style>
