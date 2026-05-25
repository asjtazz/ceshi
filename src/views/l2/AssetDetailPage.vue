<template>
  <AppShell title="资产详情">
    <div class="detail-page" v-if="asset">
      <div class="detail-header">
        <div class="asset-icon" :class="asset.categoryName?.includes('易耗') ? 'consumable' : 'asset'">
          <van-icon :name="asset.categoryName?.includes('易耗') ? 'label-o' : 'desktop-o'" size="28" />
        </div>
        <h2>{{ asset.name }}</h2>
        <p class="code">{{ asset.code }}</p>
        <StatusBadge :status="asset.status" />
        <div class="warning-tags" v-if="showInspectionWarning">
          <van-tag v-if="isInspectionExpired" type="danger">检定已过期</van-tag>
          <van-tag v-else-if="isInspectionNearby" type="warning">检定即将到期</van-tag>
        </div>
      </div>

      <div class="detail-section">
        <h4 class="section-title">基本信息</h4>
        <van-cell-group inset>
          <van-cell title="资产分类" :value="asset.categoryPath || asset.categoryName" />
          <van-cell title="规格型号" :value="asset.model || '-'" />
          <van-cell title="存放地点" :value="asset.locationPath || asset.locationName" />
          <van-cell title="责任人" :value="asset.custodianName || '-'" />
          <van-cell title="购置日期" :value="asset.purchaseDate || '-'" />
          <van-cell title="单价" :value="asset.price ? '¥' + asset.price : '-'" />
        </van-cell-group>
      </div>

      <div class="detail-section" v-if="asset.images && asset.images.length > 0">
        <h4 class="section-title">资产图片</h4>
        <div class="image-list">
          <div
            v-for="(img, index) in asset.images"
            :key="index"
            class="image-item"
            @click="openPreview(asset.images, index)"
          >
            <img :src="img" alt="资产图片" class="thumb" width="80" height="80" loading="lazy" />
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4 class="section-title">库存信息</h4>
        <van-cell-group inset>
          <van-cell title="总数量" :value="asset.quantity" />
          <van-cell title="已领用" :value="asset.inUseCount" />
          <van-cell title="待锁定" :value="asset.pendingQuantity || 0" />
          <van-cell title="可用库存" :value="asset.quantity - asset.inUseCount - (asset.pendingQuantity || 0)" />
          <van-cell title="单位" :value="asset.unit" />
        </van-cell-group>
      </div>

      <div class="detail-section" v-if="asset.inspectionCycle > 0">
        <h4 class="section-title">检定信息</h4>
        <van-cell-group inset>
          <van-cell title="检定周期" :value="asset.inspectionCycle + '天'" />
          <van-cell title="上次检定" :value="asset.lastInspectionDate || '-'" />
          <van-cell title="下次检定" :value="asset.nextInspectionDate || '-'">
            <template #right-icon>
              <van-tag v-if="isInspectionExpired" type="danger" size="small">已过期</van-tag>
              <van-tag v-else-if="isInspectionNearby" type="warning" size="small">即将到期</van-tag>
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <div class="detail-actions">
        <van-button type="primary" size="small" round @click="openEdit">编辑资产</van-button>
        <van-button size="small" round @click="showMoreActions = true">更多操作</van-button>
        <van-button size="small" round plain type="primary" @click="loadTrace">流向追踪</van-button>
      </div>
    </div>
    <van-empty description="加载中" v-else />

    <van-action-sheet v-model:show="showMoreActions" :actions="moreActions" @select="onActionSelect" cancel-text="取消" />

    <van-popup v-model:show="showEdit" position="right" style="width:100%;height:100%">
      <van-nav-bar title="编辑资产" left-text="取消" right-text="保存" @click-left="showEdit = false" @click-right="onEditSubmit" />
      <div style="padding: 12px; overflow-y: auto; height: calc(100vh - 46px)">
        <van-cell-group inset style="margin-bottom: 12px">
          <van-field v-model="editForm.name" label="资产名称" placeholder="请输入资产名称" />
          <van-field v-model="editForm.code" label="资产编码" placeholder="资产编码" />
          <van-field label="资产状态" label-align="top" style="padding-top:12px">
            <template #input>
              <van-radio-group v-model="editForm.status" direction="horizontal" style="flex-wrap:wrap">
                <van-radio name="IDLE">空闲</van-radio>
                <van-radio name="IN_USE">在用</van-radio>
                <van-radio name="MAINTENANCE">维修中</van-radio>
                <van-radio name="INSPECTION">检测中</van-radio>
                <van-radio name="SCRAPPED">已报废</van-radio>
              </van-radio-group>
            </template>
          </van-field>
        </van-cell-group>
        <van-cell-group inset title="资产图片" style="margin-bottom: 12px">
          <div class="upload-title">上传图片（选填，最多3张）</div>
          <van-uploader v-model="editImages" multiple :max-count="3" />
        </van-cell-group>
        <van-cell-group inset title="库存信息" style="margin-bottom: 12px">
          <van-field v-model="editForm.quantity" label="总数量" type="digit" />
          <van-field v-model="editForm.unit" label="单位" placeholder="请选择单位" readonly is-link @click="showUnitPicker = true" />
          <van-field v-model="editForm.price" label="单价（元）" type="number" />
        </van-cell-group>
        <van-cell-group inset title="规格位置" style="margin-bottom: 12px">
          <van-field v-model="editForm.model" label="规格型号" placeholder="请输入型号" />
          <van-field v-model="editForm.custodianName" label="责任人" placeholder="请输入责任人" />
          <TreeSelector v-model="editForm.locationId" :nodes="locationNodes" label="存放地点" />
          <TreeSelector v-model="editForm.categoryId" :nodes="categoryNodes" label="资产分类" />
        </van-cell-group>
        <van-cell-group inset title="检定信息" style="margin-bottom: 12px">
          <van-cell title="是否需要检定" center>
            <template #right-icon>
              <van-switch v-model="editForm.inspectionEnabled" size="20px" />
            </template>
          </van-cell>
          <template v-if="editForm.inspectionEnabled">
            <van-field v-model="editForm.lastInspectionDate" label="上次检定日期" is-link readonly @click="showLastInspDate = true" />
            <van-field v-model="inspectionCycleLabel" label="检定周期" is-link readonly placeholder="请选择检定周期" @click="showCyclePicker = true" />
            <van-field v-model="editForm.nextInspectionDate" label="下次检定日期" is-link readonly @click="showEditInspDate = true" />
          </template>
        </van-cell-group>
        <div style="height: 30px"></div>
      </div>
    </van-popup>

    <van-popup v-model:show="showEditInspDate" position="bottom" round>
      <van-date-picker title="下次检定日期" @confirm="onEditInspDateConfirm" @cancel="showEditInspDate = false" />
    </van-popup>
    <van-popup v-model:show="showLastInspDate" position="bottom" round>
      <van-date-picker title="上次检定日期" :max-date="maxDate" @confirm="onLastInspDateConfirm" @cancel="showLastInspDate = false" />
    </van-popup>
    <van-popup v-model:show="showUnitPicker" position="bottom" round>
      <van-picker title="选择单位" :columns="unitColumns" @confirm="onUnitConfirm" @cancel="showUnitPicker = false" />
    </van-popup>
    <van-popup v-model:show="showCyclePicker" position="bottom" round>
      <van-picker title="检定周期" :columns="cycleColumns" @confirm="onCycleConfirm" @cancel="showCyclePicker = false" />
    </van-popup>

    <van-popup v-model:show="showTrace" position="right" style="width:100%;height:100%;overflow-y:auto">
      <van-nav-bar title="流向追踪" left-text="返回" @click-left="showTrace = false" />
      <van-loading v-if="traceLoading" style="text-align:center;padding:40px" />
      <div v-else-if="traceData" class="trace-content">
        <div class="trace-asset-info">
          <h3>{{ traceData.asset?.name }}</h3>
          <p>{{ traceData.asset?.code }}</p>
        </div>
        <van-cell-group inset title="操作记录">
          <van-cell v-for="(log, i) in traceData.logs" :key="i" :label="log.createdAt">
            <template #title>
              <span class="trace-action">{{ formatTraceAction(log.action) }}</span>
            </template>
            <template #value>{{ log.operator }}</template>
            <template #default>{{ log.detail }}</template>
          </van-cell>
          <van-empty description="暂无操作记录" v-if="!traceData.logs?.length" />
        </van-cell-group>
        <van-cell-group inset title="关联申请">
          <van-cell v-for="(app, i) in traceData.applications" :key="i" :label="app.createdAt">
            <template #title>
              <van-tag :type="app.status === 'APPROVED' ? 'success' : app.status === 'REJECTED' ? 'danger' : 'primary'" size="small">
                {{ app.status === 'APPROVED' ? '通过' : app.status === 'REJECTED' ? '拒绝' : '待审' }}
              </van-tag>
              <span style="margin-left:8px">{{ formatTraceAppType(app.type) }}</span>
            </template>
            <template #value>{{ app.quantity }}件</template>
            <template #default>{{ app.applicantName }} · {{ app.remark || '-' }}</template>
          </van-cell>
          <van-empty description="暂无关联申请" v-if="!traceData.applications?.length" />
        </van-cell-group>
      </div>
    </van-popup>

    <!-- 自定义图片预览弹窗 -->
    <div v-if="previewVisible" class="image-preview-overlay" @click.self="closePreview">
      <div class="image-preview-container">
        <div class="preview-header">
          <span class="preview-count">{{ currentPreviewIndex + 1 }} / {{ previewImages.length }}</span>
          <div class="close-btn" @click="closePreview">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff4d4f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
        </div>
        <div class="preview-content">
          <div v-if="previewImages.length > 1" class="nav-btn nav-prev" @click.stop="prevImage">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </div>
          <img :src="previewImages[currentPreviewIndex]" class="preview-image" />
          <div v-if="previewImages.length > 1" class="nav-btn nav-next" @click.stop="nextImage">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch, onUnmounted } from "vue"
import { getAsset, updateAsset, completeInspection } from "@/api/assets"
import { getCategories, getLocations } from "@/api/config"
import request from "@/api/request"
import { useAuthStore } from "@/stores/auth"
import { useLoadingStore } from "@/stores/loading"
import { useRoute, useRouter } from "vue-router"
import { showToast, showConfirmDialog } from "vant"
import AppShell from "@/components/global/AppShell.vue"
import StatusBadge from "@/components/common/StatusBadge.vue"
import TreeSelector from "@/components/common/TreeSelector.vue"

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const loadingStore = useLoadingStore()

const asset = ref(null)
const showMoreActions = ref(false)
const showEdit = ref(false)
const showEditInspDate = ref(false)
const showLastInspDate = ref(false)
const showUnitPicker = ref(false)
const showCyclePicker = ref(false)
const showTrace = ref(false)
const traceData = ref(null)
const traceLoading = ref(false)
const categories = ref([])
const locations = ref([])
const editImages = ref([])

// 图片预览相关状态
const previewVisible = ref(false)
const previewImages = ref([])
const currentPreviewIndex = ref(0)

const maxDate = new Date()
const unitColumns = ["台", "件", "套", "个", "箱", "包", "瓶", "副", "支", "把"].map(u => ({ text: u, value: u }))
const cycleOptions = [{ label: "每季", days: 90 }, { label: "每半年", days: 180 }, { label: "每年", days: 365 }, { label: "每两年", days: 730 }]
const cycleColumns = cycleOptions.map(o => ({ text: o.label, value: String(o.days) }))
const inspectionCycleLabel = ref("")

const editForm = reactive({ 
  name: "", code: "", status: "", quantity: "", custodianName: "", locationId: "", unit: "", model: "", price: "", nextInspectionDate: "", categoryId: "", inspectionEnabled: false, lastInspectionDate: "", inspectionCycle: ""
})
const assetId = route.params.id

watch([() => editForm.inspectionEnabled, () => editForm.lastInspectionDate, () => editForm.inspectionCycle], ([enabled, lastDate, cycle]) => {
  if (enabled && lastDate && cycle) {
    const d = new Date(lastDate)
    d.setDate(d.getDate() + Number(cycle))
    editForm.nextInspectionDate = d.toISOString().slice(0, 10)
  }
})

const isInspectionExpired = computed(() => {
  if (!asset.value?.nextInspectionDate) return false
  const today = new Date().toISOString().slice(0, 10)
  return asset.value.nextInspectionDate < today
})

const isInspectionNearby = computed(() => {
  if (!asset.value?.nextInspectionDate) return false
  const today = new Date()
  const nextDate = new Date(asset.value.nextInspectionDate)
  const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24))
  return diffDays > 0 && diffDays <= 30
})

const showInspectionWarning = computed(() => {
  return isInspectionExpired.value || isInspectionNearby.value
})

const categoryNodes = computed(() => toNodes(categories.value))
const locationNodes = computed(() => toNodes(locations.value))

function toNodes(list) {
  if (!Array.isArray(list)) return []
  const roots = list.filter(n => !n.parentId).map(n => ({ id: n.id, name: n.name, children: [] }))
  function attach(nodes) {
    nodes.forEach(node => {
      node.children = list.filter(n => n.parentId === node.id).map(n => ({ id: n.id, name: n.name, children: [] }))
      attach(node.children)
    })
  }
  attach(roots)
  return roots
}

const moreActions = computed(() => {
  const a = asset.value
  if (!a) return []
  const actions = []
  if (a.status === "MAINTENANCE") {
    actions.push({ name: "维修完成", action: "maintenanceComplete" })
    return actions
  }
  if (a.inspectionCycle > 0) actions.push({ name: "完成检定", action: "inspection" })
  actions.push({ name: "调拨", action: "transfer" })
  actions.push({ name: "报损", action: "loss" })
  actions.push({ name: "报废", action: "scrap" })
  actions.push({ name: "删除资产", action: "delete", color: "#ff4d4f" })
  return actions
})

function onActionSelect(action) {
  showMoreActions.value = false
  if (action.action === "inspection") handleInspection()
  if (action.action === "delete") handleDelete()
  if (action.action === "maintenanceComplete") handleMaintenanceComplete()
  if (action.action === "transfer") handleTransfer()
  if (action.action === "loss") handleLoss()
  if (action.action === "scrap") handleScrap()
}

// 图片预览相关函数
function handleKeydown(e) {
  if (!previewVisible.value) return
  if (e.key === "Escape") {
    closePreview()
  } else if (e.key === "ArrowLeft") {
    prevImage()
  } else if (e.key === "ArrowRight") {
    nextImage()
  }
}

function openPreview(images, index) {
  previewImages.value = images
  currentPreviewIndex.value = index
  previewVisible.value = true
  document.body.style.overflow = "hidden"
  document.addEventListener("keydown", handleKeydown)
}

function closePreview() {
  previewVisible.value = false
  document.body.style.overflow = ""
  document.removeEventListener("keydown", handleKeydown)
}

function prevImage() {
  if (currentPreviewIndex.value > 0) {
    currentPreviewIndex.value--
  } else {
    currentPreviewIndex.value = previewImages.value.length - 1
  }
}

function nextImage() {
  if (currentPreviewIndex.value < previewImages.value.length - 1) {
    currentPreviewIndex.value++
  } else {
    currentPreviewIndex.value = 0
  }
}

// 组件卸载时清理
onUnmounted(() => {
  document.body.style.overflow = ""
  document.removeEventListener("keydown", handleKeydown)
})

async function handleInspection() {
  loadingStore.startLoading('处理中...')
  try {
    await completeInspection(assetId, { nextInspectionDate: new Date().toISOString().slice(0, 10) })
    showToast("检定完成")
    loadData()
  } catch { showToast("操作失败") }
  finally { loadingStore.stopLoading() }
}

async function handleDelete() {
  try {
    await showConfirmDialog({ title: "删除资产", message: "确认删除该资产？此操作不可撤销。" })
    loadingStore.startLoading('删除中...')
    await request.delete("/assets/" + assetId)
    showToast("已删除")
    router.push("/l2/assets")
  } catch { }
  finally { loadingStore.stopLoading() }
}

async function handleMaintenanceComplete() {
  try {
    await showConfirmDialog({
      title: "维修完成", message: "该资产维修是否完成？修好将恢复为在用状态。"
    })
    loadingStore.startLoading('处理中...')
    await request.put("/assets/" + assetId + "/repair-complete", { result: "repaired" })
    showToast("维修完成，资产已恢复在用")
    loadData()
  } catch { }
  finally { loadingStore.stopLoading() }
}

async function handleTransfer() {
  try {
    await showConfirmDialog({ title: "调拨", message: "确认调拨该资产？调拨后将发起调拨审批流程。" })
    loadingStore.startLoading('提交中...')
    await request.post("/applications", {
      type: "transfer", assetId, assetName: asset.value.name, quantity: 1
    })
    showToast("调拨申请已提交")
  } catch { }
  finally { loadingStore.stopLoading() }
}

async function handleLoss() {
  try {
    await showConfirmDialog({ title: "报损", message: "确认报损该资产？报损将发起报损审批流程。" })
    loadingStore.startLoading('提交中...')
    await request.post("/applications", {
      type: "loss", assetId, assetName: asset.value.name, quantity: asset.value.inUseCount || 1
    })
    showToast("报损申请已提交")
  } catch { }
  finally { loadingStore.stopLoading() }
}

async function handleScrap() {
  try {
    await showConfirmDialog({ title: "报废", message: "确认报废该资产？报废将发起报废审批流程。" })
    loadingStore.startLoading('提交中...')
    await request.post("/applications", {
      type: "scrap", assetId, assetName: asset.value.name, quantity: asset.value.quantity || 1
    })
    showToast("报废申请已提交")
  } catch { }
  finally { loadingStore.stopLoading() }
}

function openEdit() {
  if (!asset.value) return
  Object.assign(editForm, {
    name: asset.value.name,
    code: asset.value.code || "",
    status: asset.value.status,
    quantity: String(asset.value.quantity),
    custodianName: asset.value.custodianName || "",
    locationId: asset.value.locationId || "",
    unit: asset.value.unit || "",
    model: asset.value.model || "",
    price: asset.value.price ? String(asset.value.price) : "",
    nextInspectionDate: asset.value.nextInspectionDate || "",
    categoryId: asset.value.categoryId || "",
    inspectionEnabled: asset.value.inspectionCycle > 0,
    lastInspectionDate: asset.value.lastInspectionDate || "",
    inspectionCycle: asset.value.inspectionCycle > 0 ? String(asset.value.inspectionCycle) : ""
  })
  if (asset.value.inspectionCycle > 0) {
    const opt = cycleOptions.find(o => o.days === asset.value.inspectionCycle)
    inspectionCycleLabel.value = opt?.label || ""
  }
  // 加载现有图片到 editImages
  editImages.value = (asset.value.images || []).map(url => ({ url }))
  showEdit.value = true
}

function onEditInspDateConfirm({ selectedValues }) {
  editForm.nextInspectionDate = selectedValues.join("-")
  showEditInspDate.value = false
}

function onLastInspDateConfirm({ selectedValues }) {
  editForm.lastInspectionDate = selectedValues.join("-")
  showLastInspDate.value = false
}

function onUnitConfirm({ selectedOptions }) { 
  editForm.unit = selectedOptions[0]?.value || selectedOptions[0]
  showUnitPicker.value = false
}

function onCycleConfirm({ selectedOptions }) {
  editForm.inspectionCycle = selectedOptions[0]?.value || ""
  inspectionCycleLabel.value = selectedOptions[0]?.text || ""
  showCyclePicker.value = false
  if (editForm.inspectionEnabled && editForm.lastInspectionDate && editForm.inspectionCycle) {
    const d = new Date(editForm.lastInspectionDate)
    d.setDate(d.getDate() + Number(editForm.inspectionCycle))
    editForm.nextInspectionDate = d.toISOString().slice(0, 10)
  }
}

async function onEditSubmit() {
  loadingStore.startLoading('保存中...')
  try {
    const payload = { 
      ...editForm, 
      quantity: Number(editForm.quantity) || 0, 
      price: Number(editForm.price) || 0, 
      inspectionCycle: editForm.inspectionEnabled ? (Number(editForm.inspectionCycle) || 0) : 0,
      images: editImages.value.map(f => f.url || f.content)
    }
    if (!editForm.inspectionEnabled) {
      payload.lastInspectionDate = ""
      payload.nextInspectionDate = ""
    }
    if (payload.categoryId) {
      const cat = categories.value.find(c => c.id === payload.categoryId)
      if (cat) payload.categoryName = cat.name
    }
    if (payload.locationId) {
      const loc = locations.value.find(l => l.id === payload.locationId)
      if (loc) payload.locationName = loc.name
    }
    await updateAsset(assetId, payload)
    showToast("更新成功")
    showEdit.value = false
    loadData()
  } catch { showToast("更新失败") }
  finally { loadingStore.stopLoading() }
}

async function loadTrace() {
  showTrace.value = true
  traceLoading.value = true
  traceData.value = null
  try {
    const res = await request.get("/assets/" + assetId + "/trace")
    traceData.value = res.data
  } catch { showToast("加载失败") }
  traceLoading.value = false
}

function formatTraceAction(action) {
  return { CREATE: "新增", APPROVE: "审批通过", REJECT: "审批拒绝", APPLY: "提交申请", DELETE: "删除", INVENTORY: "盘点", INSPECTION: "检定", CONFIG: "配置", SURPLUS: "盘盈", LOSS: "报损", TRANSFER: "调拨" }[action] || action
}

function formatTraceAppType(type) {
  return { receive: "领用", return: "归还", repair: "报修", scrap: "报废", loss: "报损", transfer: "调拨" }[type] || type
}

async function loadData() {
  const res = await getAsset(assetId)
  asset.value = res.data
}

async function loadConfig() {
  const [catRes, locRes] = await Promise.all([getCategories(), getLocations()])
  categories.value = Array.isArray(catRes.data?.list) ? catRes.data.list : (catRes.data || [])
  locations.value = Array.isArray(locRes.data?.list) ? locRes.data.list : (locRes.data || [])
}

onMounted(() => { loadData(); loadConfig() })
</script>

<style scoped>
.detail-page { padding-bottom: 20px; }
.detail-header {
  background: linear-gradient(135deg, #fa8c16, #d46b08); padding: 24px 16px; text-align: center; color: #fff;
}
.asset-icon {
  width: 60px; height: 60px; border-radius: 50%; background: rgba(255,255,255,0.2); margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;
}
.detail-header h2 { font-size: 18px; font-weight: 600; margin-bottom: 6px; }
.code { font-size: 13px; opacity: 0.8; margin-bottom: 12px; }
.warning-tags { margin-top: 12px; display: flex; gap: 8px; justify-content: center; }
.detail-section { padding: 12px; }
.section-title { font-size: 14px; font-weight: 600; margin-bottom: 10px; color: #333; }
.detail-actions { display: flex; gap: 12px; justify-content: center; padding: 16px; }
.trace-content { padding: 12px; }
.trace-asset-info { text-align: center; padding: 20px 16px; background: linear-gradient(135deg, #fa8c16, #d46b08); color: #fff; margin-bottom: 12px; border-radius: 8px; }
.trace-asset-info h3 { font-size: 16px; font-weight: 600; margin-bottom: 6px; }
.trace-asset-info p { font-size: 13px; opacity: 0.8; }
.trace-action { font-weight: 600; }
.upload-title { padding: 12px 16px 8px; font-size: 14px; color: #333; }
.image-list { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 12px; }
.image-item { cursor: pointer; }
.image-item .thumb { border-radius: 4px; object-fit: cover; }

/* 图片预览弹窗样式 */
.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.9);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  color: #fff;
}

.preview-count {
  font-size: 16px;
  font-weight: 500;
}

.close-btn {
  cursor: pointer;
  padding: 4px;
}

.preview-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.preview-image {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  padding: 12px;
  cursor: pointer;
  color: #fff;
  background: rgba(255,255,255,0.1);
  border-radius: 50%;
  transition: background 0.2s;
}

.nav-btn:hover {
  background: rgba(255,255,255,0.2);
}

.nav-prev {
  left: 20px;
}

.nav-next {
  right: 20px;
}
</style>
