<template>
  <AppShell title="资产分类">
    <div class="categories-page">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <div class="tree-area">
          <div class="tree-list">
            <div v-for="node in treeData" :key="node.id" class="tree-level-0">
              <div class="tree-row" @click="toggle(node)" :class="{ selected: selectedId === node.id }">
                <van-icon :name="node.expanded ? 'fold-down' : 'arrow'" size="14" color="#999" />
                <span>{{ node.name }}</span>
                <van-tag v-if="node.code" plain size="small">{{ node.code }}</van-tag>
                <div class="add-btn" @click.stop="showAddChild(node)">
                  <van-icon name="plus" size="14" />
                </div>
              </div>
              <div v-if="node.expanded && node.children" class="tree-children">
                <div v-for="child in node.children" :key="child.id" class="tree-level-1">
                  <div class="tree-row" @click="toggle(child)" :class="{ selected: selectedId === child.id }">
                    <van-icon :name="child.expanded ? 'fold-down' : 'arrow'" size="14" color="#999" />
                    <span>{{ child.name }}</span>
                    <van-tag v-if="child.code" plain size="small">{{ child.code }}</van-tag>
                    <div class="add-btn" @click.stop="showAddChild(child)">
                      <van-icon name="plus" size="14" />
                    </div>
                  </div>
                  <div v-if="child.expanded && child.children" class="tree-children">
                    <div v-for="gc in child.children" :key="gc.id" class="tree-level-2">
                      <div class="tree-row" @click="selectNode(gc)" :class="{ selected: selectedId === gc.id }">
                        <span>{{ gc.name }}</span>
                        <van-tag v-if="gc.code" plain size="small">{{ gc.code }}</van-tag>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </van-pull-refresh>
      <div class="fab" @click="showAddRoot()">
        <van-icon name="plus" size="24" color="#fff" />
      </div>
    </div>
    <van-popup v-model:show="showAdd" position="bottom" round>
      <div class="popup-form">
        <div class="popup-title">{{ addForm.parentId ? '新增子分类' : '新增分类' }}</div>
        <van-field v-model="addForm.name" label="分类名称" placeholder="请输入" />
        <van-field v-model="addForm.code" label="分类编码" :placeholder="autoCodeHint" />
        <van-field 
          v-if="addForm.parentId" 
          v-model="parentName" 
          label="上级分类" 
          readonly 
          disabled 
        />
        <div class="popup-actions">
          <van-button @click="showAdd = false">取消</van-button>
          <van-button type="primary" @click="onAddConfirm">确认</van-button>
        </div>
      </div>
    </van-popup>
    <van-popup v-model:show="showEdit" position="bottom" round>
      <div class="popup-form">
        <div class="popup-title">编辑分类</div>
        <van-field v-model="editForm.name" label="分类名称" />
        <van-field v-model="editForm.code" label="分类编码" />
        <div class="popup-actions">
          <van-button @click="showEdit = false">取消</van-button>
          <van-button type="primary" @click="onEditConfirm">确认</van-button>
          <van-button type="danger" plain @click="onDelete">删除</van-button>
        </div>
      </div>
    </van-popup>
  </AppShell>
</template>
<script setup>
import { ref, computed, onMounted } from "vue"
import { showToast } from "vant"
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/api/config"
import AppShell from "@/components/global/AppShell.vue"
import { useLoadingStore } from "@/stores/loading"

const list = ref([])
const selectedId = ref("")
const selectedNode = ref(null)
const showAdd = ref(false)
const showEdit = ref(false)
const refreshing = ref(false)
const parentName = ref("")
const loadingStore = useLoadingStore()

const addForm = ref({ name: "", code: "", parentId: "" })
const editForm = ref({ name: "", code: "" })

const autoCodeHint = computed(() => {
  if (!addForm.value.parentId) return "自动生成或手动输入"
  const parent = list.value.find(n => n.id === addForm.value.parentId)
  if (parent) {
    const siblings = list.value.filter(n => n.parentId === addForm.value.parentId)
    return `建议: ${parent.code || parent.id}${siblings.length + 1}`
  }
  return "自动生成或手动输入"
})

const treeData = computed(() => {
  const roots = list.value.filter(n => !n.parentId)
  function buildChildren(parentId) {
    return list.value.filter(c => c.parentId === parentId).map(c => ({
      ...c, expanded: false,
      children: buildChildren(c.id)
    }))
  }
  return roots.map(r => ({ ...r, expanded: true, children: buildChildren(r.id) }))
})

function toggle(node) { node.expanded = !node.expanded }
function selectNode(node) { 
  selectedId.value = node.id; 
  selectedNode.value = node; 
  editForm.value = { name: node.name, code: node.code }
  showEdit.value = true
}

function showAddRoot() {
  addForm.value = { name: "", code: "", parentId: "" }
  parentName.value = ""
  showAdd.value = true
}

function showAddChild(parentNode) {
  addForm.value = { name: "", code: "", parentId: parentNode.id }
  parentName.value = parentNode.name
  // 自动生成编码
  const siblings = list.value.filter(n => n.parentId === parentNode.id)
  const baseCode = parentNode.code || parentNode.id
  addForm.value.code = `${baseCode}${siblings.length + 1}`
  showAdd.value = true
}

async function onAddConfirm() {
  if (!addForm.value.name) return showToast("请输入分类名称")
  loadingStore.startLoading("创建中...")
  try {
    await createCategory(addForm.value)
    showToast("创建成功")
    showAdd.value = false
    loadData()
  } catch {
    showToast("创建失败")
  } finally {
    loadingStore.stopLoading()
  }
}
async function onEditConfirm() {
  if (!selectedNode.value) return
  loadingStore.startLoading("更新中...")
  try {
    await updateCategory(selectedNode.value.id, editForm.value)
    showToast("更新成功")
    showEdit.value = false
    loadData()
  } catch {
    showToast("更新失败")
  } finally {
    loadingStore.stopLoading()
  }
}
async function onDelete() {
  if (!selectedNode.value) return
  loadingStore.startLoading("删除中...")
  try {
    await deleteCategory(selectedNode.value.id)
    showToast("删除成功")
    selectedNode.value = null
    showEdit.value = false
    loadData()
  } catch {
    showToast("删除失败")
  } finally {
    loadingStore.stopLoading()
  }
}

async function loadData() {
  loadingStore.startLoading()
  try {
    const res = await getCategories()
    list.value = res.data?.list || []
  } catch {
    showToast("加载失败")
  } finally {
    loadingStore.stopLoading()
  }
}
function onRefresh() { loadData().finally(() => refreshing.value = false) }
onMounted(loadData)
</script>

<style scoped>
.categories-page { min-height: 100vh; padding-bottom: 80px; }
.tree-area { padding: 12px; }
.tree-list { background: #fff; border-radius: 10px; overflow: hidden; }
.tree-row { 
  display: flex; align-items: center; gap: 6px; 
  padding: 12px 14px; cursor: pointer; 
  border-bottom: 1px solid #f5f5f5; font-size: 14px; 
  position: relative;
}
.tree-row:hover { background: #fafafa; }
.tree-row.selected { background: #e6f7ff; color: #1989fa; font-weight: 600; }
.tree-level-0 .tree-row { padding-left: 14px; }
.tree-level-1 .tree-row { padding-left: 36px; font-size: 13px; }
.tree-level-2 .tree-row { padding-left: 58px; font-size: 13px; color: #666; }
.tree-children { border-top: none; }
.add-btn {
  margin-left: auto;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #e6f7ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1989fa;
  transition: all 0.2s;
}
.add-btn:hover { background: #1989fa; color: #fff; }
.fab {
  position: fixed; bottom: 70px; right: 20px; z-index: 100;
  width: 50px; height: 50px; border-radius: 50%;
  background: #ff4d4f; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(255,77,79,0.4); cursor: pointer;
}
.popup-form { padding: 16px; }
.popup-title { font-size: 16px; font-weight: 600; text-align: center; padding: 16px 0; }
.popup-actions { display: flex; gap: 12px; justify-content: center; padding: 16px 0; }
</style>
