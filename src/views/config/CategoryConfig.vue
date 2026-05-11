<template>
  <div class="category-config-page">
    <van-nav-bar title="资产分类管理" left-arrow @click-left="$router.back()">
      <template #right>
        <van-icon name="plus" size="18" @click="showAddDialog = true" />
      </template>
    </van-nav-bar>

    <div class="tree-list">
      <div class="tree-item" v-for="cat in categories" :key="cat.code">
        <div class="tree-level-0">
          <van-icon :name="cat.expanded ? 'folder-open' : 'folder'" color="#1989fa" />
          <span class="cat-code">{{ cat.code }}</span>
          <span class="cat-name">{{ cat.name }}</span>
          <van-tag plain size="small" style="margin-left:auto" @click="editCategory(cat)">编辑</van-tag>
        </div>
        <div class="children" v-if="cat.expanded">
          <div class="tree-item child" v-for="child in cat.children" :key="child.code">
            <span class="cat-code">{{ child.code }}</span>
            <span class="cat-name">{{ child.name }}</span>
            <van-tag plain size="small" style="margin-left:auto" @click="editCategory(child)">编辑</van-tag>
          </div>
        </div>
      </div>
    </div>

    <van-dialog v-model:show="showAddDialog" title="新增分类" show-cancel-button @confirm="addCategory" confirm-button-text="保存">
      <van-form @submit="addCategory" style="padding: 16px">
        <van-field v-model="formData.code" label="分类编码" placeholder="如 E01" />
        <van-field v-model="formData.name" label="分类名称" placeholder="如 其他设备" />
        <van-field v-model="formData.parent" label="上级分类" placeholder="留空为一级分类" />
      </van-form>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { showSuccessToast } from 'vant'

const showAddDialog = ref(false)
const formData = ref({ code: '', name: '', parent: '' })

const categories = ref([
  { code: 'A', name: '土地房屋', expanded: true, children: [
    { code: 'A01', name: '房屋' }, { code: 'A02', name: '土地' }, { code: 'A03', name: '构筑物' }
  ]},
  { code: 'B', name: '通用设备', expanded: true, children: [
    { code: 'B01', name: '计算机' }, { code: 'B02', name: '打印机' }, { code: 'B03', name: '扫描仪' },
    { code: 'B04', name: '办公家具' }, { code: 'B05', name: '空调' }
  ]},
  { code: 'C', name: '专用设备', expanded: true, children: [
    { code: 'C01', name: '检测设备' }, { code: 'C02', name: '维修工具' }, { code: 'C03', name: '安全设备' }
  ]},
  { code: 'D', name: '家具装具', expanded: true, children: [
    { code: 'D01', name: '办公桌椅' }, { code: 'D02', name: '文件柜' }, { code: 'D03', name: '其他家具' }
  ]}
])

function addCategory() {
  showSuccessToast('分类已添加')
  showAddDialog.value = false
}

function editCategory(item) {
  showSuccessToast('编辑功能开发中')
}
</script>

<style scoped>
.tree-list { padding: 12px; }
.tree-item { background: #fff; border-radius: 8px; margin-bottom: 8px; padding: 10px 14px; }
.tree-level-0 { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.cat-code { color: #1989fa; font-family: monospace; font-weight: 600; font-size: 12px; }
.cat-name { color: #323233; }
.children { margin-top: 8px; padding-left: 24px; }
.child { background: #f7f8fa; margin-bottom: 4px; }
</style>