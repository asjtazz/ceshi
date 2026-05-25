<template>
  <AppShell :title="debt ? debt.debtorName : '欠款详情'" @back="router.back()">
    <div class="detail-page" v-if="debt">
      <div class="card">
        <div class="balance-section">
          <div class="label">剩余欠款</div>
          <div class="amount" :class="{ overdue: debt.status === 'OVERDUE' }">¥{{ Number(debt.balance || debt.amount - debt.paidAmount).toFixed(2) }}</div>
          <van-tag :type="statusType[debt.status] || 'default'" size="large">{{ statusLabel[debt.status] || debt.status }}</van-tag>
        </div>
      </div>

      <van-cell-group inset title="基本信息" style="margin-top:16px">
        <van-cell title="欠款单位" :value="debt.debtorName" />
        <van-cell title="联系人" :value="debt.contactPerson || '-'" v-if="debt.contactPerson" />
        <van-cell title="联系电话" :value="debt.contactPhone || '-'" v-if="debt.contactPhone" />
        <van-cell title="欠款总额" :value="'¥' + Number(debt.amount).toFixed(2)" />
        <van-cell title="已还金额" :value="'¥' + Number(debt.paidAmount).toFixed(2)" />
        <van-cell title="责任人" :value="debt.responsiblePerson || '-'" />
        <van-cell title="到期日" :value="debt.dueDate || '-'" />
        <van-cell title="备注" :value="debt.remark || '-'" />
        <van-cell title="登记人" :value="debt.operator || '-'" />
        <van-cell title="登记时间" :value="debt.createdAt || '-'" />
      </van-cell-group>

      <div class="repay-history" v-if="debt.repayments && debt.repayments.length">
        <van-cell-group inset title="还款记录" style="margin-top:16px">
          <van-cell v-for="(r, i) in debt.repayments" :key="i">
            <template #title>
              <span class="repay-amount">¥{{ Number(r.amount).toFixed(2) }}</span>
              <van-tag plain size="small" style="margin-left:8px">{{ r.method || '-' }}</van-tag>
            </template>
            <template #label>
              <div class="repay-meta">
                <span>还款时间: {{ r.repayDate || r.createdAt || '-' }}</span>
                <span>确认人: {{ r.confirmPerson || r.operator || '-' }}</span>
              </div>
            </template>
            <template #default v-if="r.remark">
              <span class="repay-remark">备注: {{ r.remark }}</span>
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <div class="repay-history" v-else style="margin-top:16px">
        <van-empty description="暂无还款记录" />
      </div>

      <div class="actions">
        <van-button v-if="debt.status !== 'SETTLED'" type="primary" block round @click="showRepay = true">还款</van-button>
        <van-button v-else disabled block round>已结清</van-button>
      </div>

      <van-popup v-model:show="showRepay" position="bottom" round :style="{ height: '70%' }">
        <div class="repay-form">
          <div class="repay-header">
            <van-nav-bar title="还款" left-text="取消" @click-left="showRepay = false" />
          </div>
          <div class="repay-content">
            <van-field v-model="repayAmount" type="number" label="还款金额" placeholder="请输入还款金额" :rules="[{ required: true, message: '请输入还款金额' }]" />
            <van-field v-model="repayMethod" is-link readonly label="还款方式" placeholder="请选择还款方式" @click="showMethodPicker = true" :rules="[{ required: true, message: '请选择还款方式' }]" />
            <van-field v-model="repayDate" is-link readonly label="还款日期" placeholder="请选择还款日期" @click="showRepayDatePicker = true" :rules="[{ required: true, message: '请选择还款日期' }]" />
            <van-field v-model="confirmPerson" is-link readonly label="确认人" placeholder="请选择确认人" @click="showUserPicker = true" :rules="[{ required: true, message: '请选择确认人' }]" />
            <van-field v-model="repayRemark" label="备注" type="textarea" placeholder="备注说明" rows="3" />
            <div class="repay-buttons">
              <van-button round size="large" block @click="showRepay = false">取消</van-button>
              <van-button type="primary" round size="large" block @click="onRepaySubmit">确认还款</van-button>
            </div>
          </div>
        </div>
      </van-popup>

      <van-popup v-model:show="showMethodPicker" position="bottom" round>
        <van-picker :columns="paymentMethods" @confirm="onMethodConfirm" @cancel="showMethodPicker = false" />
      </van-popup>

      <van-popup v-model:show="showRepayDatePicker" position="bottom" round>
        <van-date-picker title="选择还款日期" :max-date="today" @confirm="onRepayDateConfirm" @cancel="showRepayDatePicker = false" />
      </van-popup>

      <van-popup v-model:show="showUserPicker" position="bottom" round>
        <van-picker :columns="userColumns" @confirm="onUserConfirm" @cancel="showUserPicker = false" />
      </van-popup>
    </div>
    <van-empty description="加载中..." v-else />
  </AppShell>
</template>

<script setup>
import { ref, onMounted, reactive } from "vue"
import { useRoute, useRouter } from "vue-router"
import { showToast } from "vant"
import { getDebtDetail, repayDebt } from "@/api/debts"
import { getUsers } from "@/api/auth"
import AppShell from "@/components/global/AppShell.vue"
import { useLoadingStore } from "@/stores/loading"

const route = useRoute()
const router = useRouter()
const loadingStore = useLoadingStore()
const debt = ref(null)
const showRepay = ref(false)
const repayAmount = ref("")

const maxRepay = ref(0)
const showMethodPicker = ref(false)
const showRepayDatePicker = ref(false)
const showUserPicker = ref(false)
const repayMethod = ref("")
const repayDate = ref("")
const confirmPerson = ref("")
const confirmPersonId = ref("")
const repayRemark = ref("")
const users = ref([])

const today = new Date()
function formatDate(d) {
  return d.toISOString().slice(0, 10)
}

const paymentMethods = [
  { text: "银行转账", value: "银行转账" },
  { text: "POS收入", value: "POS收入" },
  { text: "现金", value: "现金" },
  { text: "支付宝", value: "支付宝" },
  { text: "微信", value: "微信" }
]

const userColumns = ref([])

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

async function loadData() {
  loadingStore.startLoading()
  try {
    const res = await getDebtDetail(route.params.id)
    debt.value = res.data
    maxRepay.value = Number(res.data.balance || res.data.amount - res.data.paidAmount)
  } catch {
    showToast("加载失败")
  } finally {
    loadingStore.stopLoading()
  }
}

async function loadUsers() {
  try {
    const res = await getUsers()
    users.value = res.data?.list || res.data || []
    userColumns.value = users.value.map(u => ({ text: u.name, value: u.id }))
  } catch {
  }
}

function onMethodConfirm({ selectedOptions }) {
  repayMethod.value = selectedOptions[0]?.value || selectedOptions[0]
  showMethodPicker.value = false
}

function onRepayDateConfirm({ selectedValues }) {
  repayDate.value = selectedValues.join("-")
  showRepayDatePicker.value = false
}

function onUserConfirm({ selectedOptions }) {
  confirmPerson.value = selectedOptions[0]?.text
  confirmPersonId.value = selectedOptions[0]?.value
  showUserPicker.value = false
}

async function onRepaySubmit() {
  const amount = parseFloat(repayAmount.value)
  if (!amount || amount <= 0) {
    showToast("请输入有效金额")
    return
  }
  if (amount > maxRepay.value) {
    showToast("还款金额不能超过剩余欠款")
    return
  }
  if (!repayMethod.value) {
    showToast("请选择还款方式")
    return
  }
  if (!repayDate.value) {
    showToast("请选择还款日期")
    return
  }
  if (!confirmPerson.value) {
    showToast("请选择确认人")
    return
  }
  loadingStore.startLoading("处理中...")
  try {
    await repayDebt(route.params.id, {
      amount,
      method: repayMethod.value,
      operator: confirmPerson.value,
      operatorId: confirmPersonId.value,
      repayDate: repayDate.value,
      confirmPerson: confirmPerson.value,
      remark: repayRemark.value
    })
    showToast("还款成功")
    showRepay.value = false
    repayAmount.value = ""
    repayMethod.value = ""
    repayDate.value = ""
    confirmPerson.value = ""
    confirmPersonId.value = ""
    repayRemark.value = ""
    await loadData()
  } catch {
    showToast("还款失败")
  } finally {
    loadingStore.stopLoading()
  }
}

onMounted(() => {
  loadData()
  loadUsers()
  repayDate.value = formatDate(today)
})
</script>

<style scoped>
.detail-page {
  padding: 12px;
  padding-bottom: 100px;
}
.card {
  background: #fff;
  border-radius: 12px;
  padding: 24px 16px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.label {
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
}
.amount {
  font-size: 36px;
  font-weight: 700;
  color: #333;
  margin-bottom: 12px;
}
.amount.overdue {
  color: #ff4d4f;
}
.actions {
  padding: 20px 16px;
}
.repay-form {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.repay-header {
  flex-shrink: 0;
  border-bottom: 1px solid #f5f5f5;
}
.repay-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}
.repay-buttons {
  display: flex;
  gap: 12px;
  padding-top: 16px;
}
.repay-history .repay-amount {
  font-size: 16px;
  font-weight: 600;
  color: #52c41a;
}
.repay-history .repay-meta {
  font-size: 12px;
  color: #999;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}
.repay-history .repay-remark {
  font-size: 12px;
  color: #666;
}
</style>
