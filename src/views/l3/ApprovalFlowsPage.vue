<template>
  <AppShell title="审批流程">
    <div class="approval-flows-page">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <div class="flow-list">
          <van-empty description="暂无审批流程" v-if="!flows.length && !loading" />
          <div
            v-for="f in flows"
            :key="f.type"
            class="flow-card"
            @click="goEdit(f)"
          >
            <div class="flow-icon">
              <van-icon name="exchange" size="22" color="#52c41a" />
            </div>
            <div class="flow-info">
              <h4>{{ f.label }}</h4>
              <p>{{ f.steps }} 级审批</p>
            </div>
            <van-icon name="arrow" size="16" color="#ccc" />
          </div>
        </div>
      </van-pull-refresh>

      <div class="fab" @click="goEdit(null)">
        <van-icon name="plus" size="24" color="#fff" />
      </div>
    </div>

    <van-popup v-model:show="showEdit" position="bottom" round style="height: 80%">
      <div class="edit-flow">
        <van-nav-bar :title="editingFlow ? '编辑流程' : '新建流程'" left-text="取消" right-text="保存" @click-left="showEdit = false" @click-right="onSave" />
        <div style="padding: 16px;">
          <van-field v-model="form.label" label="流程名称" placeholder="如：领用审批" />
          <div class="steps-section">
            <div class="step-header">审批步骤</div>
            <div v-for="(step, i) in form.steps" :key="i" class="step-item">
              <span class="step-num">{{ i + 1 }}</span>
              <van-field v-model="step.approverId" label="审批人" placeholder="审批人ID（选填）" />
              <van-icon name="close" size="16" color="#ff4d4f" style="cursor:pointer;margin-left:8px;" @click="form.steps.splice(i, 1)" />
            </div>
            <van-button size="small" plain icon="plus" @click="addStep">添加步骤</van-button>
          </div>
        </div>
      </div>
    </van-popup>
  </AppShell>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { showToast } from 'vant'
import { getApprovalMapping, saveApprovalMapping } from '@/api/config'
import AppShell from '@/components/global/AppShell.vue'

const flows = ref([])
const showEdit = ref(false)
const editingFlow = ref(null)
const loading = ref(false)
const refreshing = ref(false)
const form = ref({ label: '', steps: [{ approverId: '' }] })
let flowIdCounter = Date.now()

const defaultFlows = [
  { type: 'receive', label: '领用审批', steps: [{ approverId: 'u004' }] },
  { type: 'return', label: '归还审批', steps: [{ approverId: 'u004' }] },
  { type: 'repair', label: '报修审批', steps: [{ approverId: 'u004' }] },
  { type: 'scrap', label: '报废审批', steps: [{ approverId: 'u005' }] },
  { type: 'loss', label: '报损审批', steps: [{ approverId: 'u005' }] }
]

function goEdit(f) {
  editingFlow.value = f
  form.value = f ? { ...f, steps: [...(f.steps || [])] } : { label: '', steps: [{ approverId: '' }] }
  showEdit.value = true
}

async function onSave() {
  if (!form.value.label) return showToast('请输入流程名称')
  const idx = flows.value.findIndex(f => f.type === editingFlow.value?.type || f.id === editingFlow.value?.id)
  const newFlows = [...flows.value]
  if (idx >= 0) {
    newFlows[idx] = { ...newFlows[idx], ...form.value }
  } else {
    newFlows.push({ ...form.value, type: form.value.type || 'custom' + Date.now(), id: 'f' + (++flowIdCounter) })
  }
  await saveApprovalMapping({ list: newFlows })
  showToast('保存成功'); showEdit.value = false; loadData()
}

const users = ref([])

function getApproverName(id) {
  if (!id) return ''
  const u = users.value.find(function(u) { return u.id === id })
  return u ? u.name : id
}

async function loadUsers() {
  try {
    const { getUsers } = await import('@/api/auth')
    const res = await getUsers()
    users.value = res.data?.list || []
  } catch { }
}

function addStep() {
  if (!form.value.steps) form.value.steps = []
  form.value.steps.push({ approverId: '' })
}

async function loadData() {
  loading.value = true
  const res = await getApprovalMapping()
  flows.value = (res.data?.list || []).map(f => ({ ...f, steps: f.steps || [] }))
  if (!flows.value.length) flows.value = defaultFlows
  loading.value = false
}
function onRefresh() { loadData().finally(() => refreshing.value = false) }
const showApproverPicker = ref(false)
const editingApproverStep = ref(null)

const approverColumns = computed(function() {
  return users.value.map(function(u) { return { text: u.name + ' (' + u.dept + ')', value: u.id } })
})

function selectApprover(step) {
  editingApproverStep.value = step
  showApproverPicker.value = true
}

function onApproverConfirm(opt) {
  if (editingApproverStep.value) {
    editingApproverStep.value.approverId = opt.selectedOptions[0]?.value || ''
  }
  showApproverPicker.value = false
}

onMounted(function() { loadData(); loadUsers() })
</script>

<style scoped>
.approval-flows-page { min-height: 100vh; padding-bottom: 80px; }
.flow-list { padding: 12px; }
.flow-card {
  background: #fff; border-radius: 10px; padding: 14px; margin-bottom: 10px;
  display: flex; align-items: center; gap: 12px; cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.flow-icon { width: 44px; height: 44px; border-radius: 10px; background: #f6ffed; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.flow-info { flex: 1; }
.flow-info h4 { font-size: 15px; font-weight: 600; margin-bottom: 3px; }
.flow-info p { font-size: 12px; color: #999; }
.fab {
  position: fixed; bottom: 70px; right: 20px; z-index: 100;
  width: 50px; height: 50px; border-radius: 50%;
  background: #52c41a; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(82,196,26,0.4); cursor: pointer;
}
.steps-section { margin-top: 16px; }
.step-header { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
.step-item { display: flex; align-items: center; margin-bottom: 8px; }
.step-num { width: 20px; height: 20px; border-radius: 50%; background: #1989fa; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; margin-right: 8px; }
</style>