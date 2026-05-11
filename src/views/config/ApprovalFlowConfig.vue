<template>
  <div class="approval-flow-page">
    <van-nav-bar title="审批流配置" left-arrow @click-left="$router.back()">
      <template #right>
        <van-icon name="plus" size="18" @click="showAddDialog = true" />
      </template>
    </van-nav-bar>

    <div class="section-card">
      <div class="section-title">📋 审批流程列表</div>
      <div class="flow-card" v-for="flow in flows" :key="flow.id">
        <div class="flow-header">
          <span class="flow-name">{{ flow.name }}</span>
          <van-switch v-model="flow.enabled" size="20" />
        </div>
        <div class="flow-nodes">
          <div class="node" v-for="(node, idx) in flow.nodes" :key="idx">
            <div class="node-connector" v-if="idx > 0">
              <van-icon name="down" size="12" color="#c8c9cc" />
            </div>
            <div class="node-body">
              <van-tag :type="node.type === '审批' ? 'primary' : 'warning'" round>{{ node.type }}</van-tag>
              <span class="node-name">{{ node.name }}</span>
              <span class="node-mode" v-if="node.mode">（{{ node.mode }}）</span>
            </div>
          </div>
        </div>
        <div class="flow-actions">
          <van-button size="mini" plain type="primary" @click="editFlow(flow)">编辑</van-button>
          <van-button size="mini" plain type="danger" @click="deleteFlow(flow.id)">删除</van-button>
        </div>
      </div>
    </div>

    <van-dialog v-model:show="showAddDialog" title="新增审批流" show-cancel-button @confirm="addFlow" confirm-button-text="保存">
      <van-form @submit="addFlow" style="padding: 16px">
        <van-field v-model="formData.name" label="流程名称" placeholder="如 领用审批" :rules="[{ required: true }]" />
        <van-field v-model="formData.category" label="适用分类" placeholder="如 B-通用设备" />
      </van-form>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { showSuccessToast, showConfirmDialog } from 'vant'

const showAddDialog = ref(false)
const formData = ref({ name: '', category: '' })

const flows = ref([
  {
    id: 1, name: '领用审批流程', enabled: true, category: '全部',
    nodes: [
      { type: '审批', name: '部门主管', mode: '会签' },
      { type: '审批', name: '资产管理员', mode: '会签' },
      { type: '抄送', name: '财务部' }
    ]
  },
  {
    id: 2, name: '报修审批流程', enabled: true, category: 'C-专用设备',
    nodes: [
      { type: '审批', name: '检测车间主任', mode: '会签' },
      { type: '审批', name: '资产管理员', mode: '会签' }
    ]
  },
  {
    id: 3, name: '报废审批流程', enabled: false, category: '全部',
    nodes: [
      { type: '审批', name: '部门主管', mode: '会签' },
      { type: '审批', name: '资产管理员', mode: '会签' },
      { type: '审批', name: '总经理', mode: '会签' },
      { type: '抄送', name: '财务部' }
    ]
  }
])

function addFlow() {
  flows.value.unshift({
    id: Date.now(),
    name: formData.value.name,
    enabled: true,
    category: formData.value.category || '全部',
    nodes: [{ type: '审批', name: '部门主管', mode: '会签' }]
  })
  formData.value = { name: '', category: '' }
  showAddDialog.value = false
  showSuccessToast('审批流已创建')
}

function editFlow(flow) {
  showSuccessToast('编辑功能开发中')
}

function deleteFlow(id) {
  showConfirmDialog({ title: '确认删除', message: '确定要删除该审批流吗？' }).then(() => {
    flows.value = flows.value.filter(f => f.id !== id)
    showSuccessToast('已删除')
  })
}
</script>

<style scoped>
.section-card { background: #fff; margin: 12px; border-radius: 12px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.section-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
.flow-card { border: 1px solid #ebedf0; border-radius: 10px; padding: 14px; margin-bottom: 12px; }
.flow-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.flow-name { font-size: 14px; font-weight: 500; }
.flow-nodes { padding: 8px 0; }
.node { display: flex; flex-direction: column; align-items: flex-start; }
.node-connector { padding: 2px 0 2px 20px; }
.node-body { display: flex; align-items: center; gap: 6px; padding: 4px 0; font-size: 13px; }
.node-mode { color: #969799; font-size: 12px; }
.flow-actions { display: flex; gap: 8px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #f5f5f5; }
</style>