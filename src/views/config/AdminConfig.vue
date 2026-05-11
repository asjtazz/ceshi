<template>
  <div class="admin-config-page">
    <van-nav-bar title="管理员设置" left-arrow @click-left="$router.back()">
      <template #right>
        <van-icon name="plus" size="18" @click="showAddDialog = true" />
      </template>
    </van-nav-bar>

    <div class="section-card">
      <div class="section-title">👥 管理员列表</div>
      <div class="admin-card" v-for="admin in admins" :key="admin.id">
        <div class="admin-info">
          <div class="admin-avatar">
            <van-icon name="contact" size="24" color="#1989fa" />
          </div>
          <div class="admin-detail">
            <span class="admin-name">{{ admin.name }}</span>
            <span class="admin-role">{{ admin.role }}</span>
          </div>
        </div>
        <van-icon name="delete" size="16" color="#ee0a24" @click="removeAdmin(admin.id)" />
      </div>
    </div>

    <div class="section-card">
      <div class="section-title">📋 按部门分组</div>
      <div class="dept-group" v-for="dept in departments" :key="dept.name">
        <div class="dept-header" @click="dept.expanded = !dept.expanded">
          <van-icon :name="dept.expanded ? 'arrow-down' : 'arrow'" />
          <span class="dept-name">{{ dept.name }}</span>
          <span class="dept-count">{{ dept.members.length }}人</span>
        </div>
        <div class="dept-members" v-if="dept.expanded">
          <div class="member-item" v-for="member in dept.members" :key="member">
            <span>{{ member }}</span>
            <van-button size="mini" round plain type="primary" @click="addAsAdmin(member)">设为管理员</van-button>
          </div>
        </div>
      </div>
    </div>

    <van-dialog v-model:show="showAddDialog" title="新增管理员" show-cancel-button @confirm="addAdmin" confirm-button-text="保存">
      <van-form @submit="addAdmin" style="padding: 16px">
        <van-field v-model="formData.name" label="姓名" placeholder="请输入姓名" :rules="[{ required: true }]" />
        <van-field v-model="formData.role" is-link readonly label="角色" placeholder="选择角色" @click="showRolePicker = true" />
      </van-form>
    </van-dialog>

    <van-popup v-model:show="showRolePicker" position="bottom" round>
      <van-picker :columns="['L2 管理员', 'L3 超级管理员']" @confirm="onRoleConfirm" @cancel="showRolePicker = false" title="选择角色" />
    </van-popup>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { showSuccessToast, showConfirmDialog } from 'vant'

const showAddDialog = ref(false)
const showRolePicker = ref(false)
const formData = ref({ name: '', role: '' })

const admins = ref([
  { id: 1, name: '艾培刚', role: 'L3 超级管理员' },
  { id: 2, name: '程晨', role: 'L2 管理员' },
  { id: 3, name: '张峻山', role: 'L2 管理员' }
])

const departments = ref([
  { name: '管理层', expanded: true, members: ['艾培刚', '张峻山'] },
  { name: '检测车间', expanded: false, members: ['程晨', '李工', '王师傅'] },
  { name: '业务大厅', expanded: false, members: ['小刘', '小陈', '小杨'] },
  { name: '办公区', expanded: false, members: ['赵会计', '周人事'] },
  { name: '维修车间', expanded: false, members: ['孙师傅', '吴师傅'] }
])

function onRoleConfirm({ selectedOptions }) {
  formData.value.role = selectedOptions[0]?.text || selectedOptions[0]
  showRolePicker.value = false
}

function addAdmin() {
  admins.value.push({
    id: Date.now(),
    name: formData.value.name,
    role: formData.value.role || 'L2 管理员'
  })
  formData.value = { name: '', role: '' }
  showAddDialog.value = false
  showSuccessToast('管理员已添加')
}

function removeAdmin(id) {
  showConfirmDialog({ title: '确认移除', message: '确定要移除该管理员吗？' }).then(() => {
    admins.value = admins.value.filter(a => a.id !== id)
    showSuccessToast('已移除')
  })
}

function addAsAdmin(name) {
  if (!admins.value.find(a => a.name === name)) {
    admins.value.push({ id: Date.now(), name, role: 'L2 管理员' })
    showSuccessToast(`${name} 已设为管理员`)
  } else {
    showSuccessToast('已是管理员')
  }
}
</script>

<style scoped>
.section-card { background: #fff; margin: 12px; border-radius: 12px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.section-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
.admin-card { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
.admin-card:last-child { border-bottom: none; }
.admin-info { display: flex; align-items: center; gap: 10px; }
.admin-avatar { width: 36px; height: 36px; border-radius: 18px; background: #e8f4fd; display: flex; align-items: center; justify-content: center; }
.admin-detail { display: flex; flex-direction: column; }
.admin-name { font-size: 14px; font-weight: 500; }
.admin-role { font-size: 11px; color: #969799; }
.dept-group { margin-bottom: 8px; }
.dept-header { display: flex; align-items: center; gap: 6px; padding: 8px 0; cursor: pointer; }
.dept-name { font-size: 14px; font-weight: 500; flex: 1; }
.dept-count { font-size: 12px; color: #969799; }
.dept-members { padding-left: 20px; }
.member-item { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #f5f5f5; }
.member-item:last-child { border-bottom: none; }
</style>