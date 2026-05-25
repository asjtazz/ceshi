<template>
  <AppShell title="盘点任务">
    <div class="inventory-page">
      <van-tabs v-model:active="tab" sticky>
        <van-tab title="进行中" name="ACTIVE" />
        <van-tab title="已完成" name="COMPLETED" />
        <van-tab title="已取消" name="CANCELLED" />
        <van-tab title="盘盈" name="SURPLUS" />
        <van-tab title="盘亏" name="DEFICIT" />
      </van-tabs>

      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <div class="task-list">
          <van-empty description="暂无盘点任务" v-if="!tasks.length && !surplusAssets.length && !deficitAssets.length && !loading" />

          <!-- 盘盈资产列表 -->
          <div v-if="tab === 'SURPLUS'" class="diff-list">
            <div v-for="item in surplusAssets" :key="item.assetId" class="diff-card surplus">
              <div class="diff-info">
                <h4>{{ item.name }}</h4>
                <p>{{ item.code }} · {{ item.taskName }}</p>
              </div>
              <div class="diff-qty">
                <van-tag type="success" size="medium">+{{ item.difference }}</van-tag>
              </div>
            </div>
          </div>

          <!-- 盘亏资产列表 -->
          <div v-if="tab === 'DEFICIT'" class="diff-list">
            <div v-for="item in deficitAssets" :key="item.assetId" class="diff-card deficit">
              <div class="diff-info">
                <h4>{{ item.name }}</h4>
                <p>{{ item.code }} · {{ item.taskName }}</p>
              </div>
              <div class="diff-qty">
                <van-tag type="danger" size="medium">{{ item.difference }}</van-tag>
              </div>
            </div>
          </div>

          <!-- 进行中/已完成/已取消任务列表 -->
          <div v-for="task in tasks"
            :key="task.id"
            class="task-card"
            @click="goTask(task)"
          >
            <div class="task-header">
              <span class="task-name">{{ task.locationName }}</span>
              <van-tag :type="task.status === '进行中' ? 'primary' : task.status === '已完成' ? 'success' : 'default'">
                {{ task.status }}
              </van-tag>
            </div>
            <div class="task-meta">
              <span><van-icon name="clock-o" size="12" /> {{ task.createdAt?.slice(0, 10) }}</span>
              <span>盘点资产: {{ task.total || 0 }}项</span>
            </div>
            <div class="task-stats" v-if="task.assetList">
              <span class="surplus">盘盈: {{ getSurplusCount(task) }}</span>
              <span class="deficit">盘亏: {{ getDeficitCount(task) }}</span>
            </div>
          </div>
        </div>
      </van-pull-refresh>

      <div class="fab" @click="openCreate">
        <van-icon name="plus" size="24" color="#fff" />
      </div>
    </div>

    <van-popup v-model:show="showCreate" position="bottom" round style="height: 70%">
      <van-nav-bar title="新建盘点任务" left-text="取消" right-text="创建" @click-left="showCreate = false" @click-right="doCreateTask" />
      <div style="padding: 16px;">
        <van-field v-model="newTask.name" label="任务名称" placeholder="请输入任务名称" />
        <TreeSelector v-model="newTask.locationId" :nodes="locationNodes" label="盘点地点" />
        <van-cell-group inset>
          <van-cell title="盘点易耗品">
            <template #right-icon>
              <van-switch v-model="newTask.includeConsumables" size="20" />
            </template>
          </van-cell>
        </van-cell-group>
        <van-field v-model="newTask.remark" label="备注" placeholder="备注说明（选填）" />
      </div>
    </van-popup>
  </AppShell>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useLoadingStore } from '@/stores/loading'
import { getActiveTasks, createTask } from '@/api/inventory'
import { getLocations } from '@/api/config'
import AppShell from '@/components/global/AppShell.vue'
import TreeSelector from '@/components/common/TreeSelector.vue'

const router = useRouter()
const loadingStore = useLoadingStore()
const tab = ref('ACTIVE')
const tasks = ref([])
const surplusAssets = ref([])
const deficitAssets = ref([])
const loading = ref(false)
const refreshing = ref(false)
const showCreate = ref(false)
const newTask = ref({ name: '', locationId: '', remark: '', includeConsumables: false })
const locations = ref([])

const locationNodes = computed(() => {
  if (!Array.isArray(locations.value)) return []
  const roots = locations.value.filter(n => !n.parentId).map(n => ({ id: n.id, name: n.name, children: [] }))
  function attach(nodes) {
    nodes.forEach(node => {
      node.children = locations.value.filter(n => n.parentId === node.id).map(n => ({ id: n.id, name: n.name, children: [] }))
      attach(node.children)
    })
  }
  attach(roots)
  return roots
})

const statusMap = { ACTIVE: '进行中', COMPLETED: '已完成', CANCELLED: '已取消' }

async function loadData() {
  loading.value = true
  try {
    const res = await getActiveTasks()
    const raw = Array.isArray(res.data?.list) ? res.data.list : Array.isArray(res.data) ? res.data : []
    if (tab.value === 'SURPLUS' || tab.value === 'DEFICIT') {
      // 盘盈/盘亏：从所有已完成任务中找出有盘盈/盘亏的资产
      tasks.value = []
      surplusAssets.value = []
      deficitAssets.value = []
      const completedTasks = raw.filter(t => t.status === '已完成')
      const allItems = []
      completedTasks.forEach(t => {
        t.assetList?.forEach(item => {
          if (item.difference > 0) allItems.push({ ...item, taskId: t.id, taskName: t.locationName })
          if (item.difference < 0) allItems.push({ ...item, taskId: t.id, taskName: t.locationName })
        })
      })
      if (tab.value === 'SURPLUS') surplusAssets.value = allItems.filter(i => i.difference > 0)
      else deficitAssets.value = allItems.filter(i => i.difference < 0)
    } else {
      surplusAssets.value = []
      deficitAssets.value = []
      tasks.value = raw.filter(t => t.status === statusMap[tab.value])
    }
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

function onRefresh() { loadData().finally(() => refreshing.value = false) }
watch(tab, () => loadData())

async function doCreateTask() {
  if (!newTask.value.name.trim()) return showToast('请输入任务名称')
  loadingStore.startLoading('创建中...')
  try {
    await createTask(newTask.value)
    showToast('创建成功')
    showCreate.value = false
    newTask.value = { name: '', locationId: '', remark: '', includeConsumables: false }
    loadData()
  } catch {
    showToast('创建失败')
  } finally {
    loadingStore.stopLoading()
  }
}

function openCreate() {
  showCreate.value = true
}

function getSurplusCount(task) {
  if (!task.assetList) return 0
  return task.assetList.reduce((sum, item) => sum + (item.difference > 0 ? item.difference : 0), 0)
}

function getDeficitCount(task) {
  if (!task.assetList) return 0
  return task.assetList.reduce((sum, item) => sum + (item.difference < 0 ? Math.abs(item.difference) : 0), 0)
}

function goTask(task) { router.push(`/l2/inventory/${task.id}`) }

async function loadLocations() {
  const res = await getLocations()
  locations.value = res.data?.list || []
}

onMounted(() => { loadData(); loadLocations() })
</script>

<style scoped>
.inventory-page { min-height: 100vh; padding-bottom: 80px; }
.task-list { padding: 8px 12px; }
.task-card {
  background: #fff; border-radius: 10px; padding: 14px; margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04); cursor: pointer;
}
.task-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.task-name { font-size: 15px; font-weight: 600; }
.task-meta { display: flex; gap: 16px; font-size: 12px; color: #999; margin-bottom: 6px; }
.task-stats { display: flex; gap: 12px; font-size: 13px; }
.surplus { color: #52c41a; }
.deficit { color: #ff4d4f; }
.diff-list { padding: 8px 12px; }
.diff-card {
  background: #fff; border-radius: 10px; padding: 14px; margin-bottom: 10px;
  display: flex; justify-content: space-between; align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.diff-card.surplus { border-left: 4px solid #52c41a; }
.diff-card.deficit { border-left: 4px solid #ff4d4f; }
.diff-info h4 { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.diff-info p { font-size: 12px; color: #999; }
.fab {
  position: fixed; bottom: 70px; right: 20px; z-index: 100;
  width: 50px; height: 50px; border-radius: 50%;
  background: #1989fa; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(25,137,250,0.4); cursor: pointer;
}
</style>