<template>
  <AppShell :title="'盘点详情 - ' + (task?.locationName || '')" @back="router.back()">
    <div class="detail-page" v-if="task">
      <!-- 任务概览 -->
      <div class="summary-card">
        <div class="summary-row">
          <span>盘点地点：<strong>{{ task.locationName }}</strong></span>
          <van-tag :type="task.status === '进行中' ? 'primary' : task.status === '已完成' ? 'success' : 'default'">
            {{ task.status }}
          </van-tag>
        </div>
        <div class="summary-row">
          <span>创建时间：{{ task.createdAt }}</span>
        </div>
        <div class="summary-row" v-if="task.completedAt">
          <span>完成时间：{{ task.completedAt }}</span>
        </div>
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-value">{{ task.total }}</span>
            <span class="stat-label">总数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ task.scanned }}</span>
            <span class="stat-label">已盘</span>
          </div>
          <div class="stat-item">
            <span class="stat-value text-green">{{ surplusCount }}</span>
            <span class="stat-label">盘盈</span>
          </div>
          <div class="stat-item">
            <span class="stat-value text-red">{{ deficitCount }}</span>
            <span class="stat-label">盘亏</span>
          </div>
        </div>
      </div>

      <!-- 盘点资产列表 -->
      <van-cell-group inset title="盘点资产" style="margin-top: 12px">
        <div v-for="(item, idx) in task.assetList" :key="item.assetId" class="inv-item">
          <div class="inv-main">
            <div class="inv-left">
              <div class="asset-images" v-if="item.images && item.images.length > 0">
                <img 
                  v-for="(img, imgIdx) in item.images.slice(0, 3)" 
                  :key="imgIdx" 
                  :src="img" 
                  :alt="item.name"
                  class="asset-image"
                  :class="{ 'asset-image-multiple': item.images.length > 3 }"
                  @click="previewImage(item.images, imgIdx)"
                  loading="lazy"
                />
                <div v-if="item.images.length > 3" class="asset-more-images" @click="previewImage(item.images, 0)">
                  +{{ item.images.length - 3 }}
                </div>
              </div>
              <div class="inv-info">
                <h4>{{ item.name }}</h4>
                <p>{{ item.code }}</p>
                <p class="asset-location">{{ item.locationName }}</p>
              </div>
            </div>
            <div class="inv-qty">
              <div class="qty-row">
                <span class="qty-label">应盘</span>
                <span class="qty-value">{{ item.expectedQty }}</span>
              </div>
              <div class="qty-row">
                <span class="qty-label">实盘</span>
                <span class="qty-value qty-value-editable" :class="{ editable: task.status === '进行中' }" @click="task.status === '进行中' && editQty(item, idx)">
                  <template v-if="item.actualQty !== null && item.actualQty !== undefined">{{ item.actualQty }}</template>
                  <template v-else class="qty-placeholder">请录入</template>
                  <van-icon v-if="task.status === '进行中'" name="edit" size="18" />
                </span>
              </div>
              <div class="qty-row">
                <span class="qty-label">差异</span>
                <span class="qty-value" v-if="item.difference !== null && item.difference !== undefined" :class="item.difference > 0 ? 'text-green' : item.difference < 0 ? 'text-red' : ''">
                  {{ item.difference > 0 ? '+' : '' }}{{ item.difference }}
                </span>
                <span class="qty-value qty-placeholder" v-else>-</span>
              </div>
            </div>
          </div>
          <div class="inv-actions" v-if="task.status === '进行中'">
            <van-button size="small" type="primary" plain icon="scan" @click="doScan(item, idx)">
              扫码
            </van-button>
          </div>
          <div class="inv-actions" v-if="task.status === '已完成'">
            <van-tag v-if="item.scanned" type="success" size="medium">已盘</van-tag>
            <van-tag v-else type="default" size="medium">未盘</van-tag>
            <van-button
              v-if="item.difference > 0 && !item.surplusHandled"
              size="mini"
              type="success"
              plain
              @click="doSurplus(item)"
            >盘盈入库</van-button>
            <van-tag v-if="item.difference > 0 && item.surplusHandled" type="success" plain>已入库</van-tag>
            <van-tag v-if="item.difference < 0 && item.lossHandled" type="danger" plain>已报损</van-tag>
          </div>
        </div>
      </van-cell-group>

      <!-- 操作按钮 -->
      <div class="action-bar" v-if="task.status === '进行中'">
        <van-button type="danger" plain block @click="doCancel">取消盘点</van-button>
        <van-button type="primary" block @click="doComplete" :disabled="task.scanned < task.total">
          完成盘点 ({{ task.scanned }}/{{ task.total }})
        </van-button>
      </div>
      <div class="action-bar" v-if="task.status === '已完成' && (surplusItems.length > 0 || deficitItems.length > 0)">
        <van-button v-if="surplusItems.length > 0" type="success" block :loading="submitting" :disabled="submitting" @click="doSurplusAll">
          一键盘盈入库 ({{ surplusItems.length }})项）
        </van-button>
        <van-button v-if="deficitItems.length > 0" type="danger" block :loading="submitting" :disabled="submitting" @click="doDeficitToLoss">
          一键盘亏报损 ({{ deficitItems.length }})项）
        </van-button>
      </div>
    </div>

    <!-- 输入实盘数量弹窗 -->
    <van-dialog
      v-model:show="showQtyDialog"
      title="输入实盘数量"
      show-cancel-button
      :before-close="onQtyConfirm"
    >
      <div style="padding: 16px;">
        <van-field v-model="editQtyValue" type="digit" label="实盘数量" :placeholder="'应盘: ' + editingItem?.expectedQty" />
      </div>
    </van-dialog>

    <!-- 自定义图片预览弹窗 -->
    <div v-if="previewVisible" class="image-preview-overlay" @click.self="closePreview">
      <div class="image-preview-container">
        <div class="preview-header">
          <span class="preview-count">{{ currentPreviewIndex + 1 }} / {{ previewImages.length }}</span>
          <div class="close-btn" @click="closePreview">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff4d4f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          </div>
        </div>
        <div class="preview-content">
          <div v-if="previewImages.length > 1" class="nav-btn nav-prev" @click.stop="prevImage">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          </div>
          <img :src="previewImages[currentPreviewIndex]" class="preview-image" />
          <div v-if="previewImages.length > 1" class="nav-btn nav-next" @click.stop="nextImage">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { getTask, updateAssetQty, scanAsset, completeTask, cancelTask, deficitToLoss, surplusToAsset } from '@/api/inventory'
import AppShell from '@/components/global/AppShell.vue'
import { useLoadingStore } from '@/stores/loading'
import { scan as ddScan } from '@/utils/dd'

const route = useRoute()
const router = useRouter()
const taskId = route.params.id
const task = ref(null)
const loadingStore = useLoadingStore()

const showQtyDialog = ref(false)
const editQtyValue = ref('')
const editingItem = ref(null)
const editingIdx = ref(-1)
const submitting = ref(false)

// 自定义图片预览
const previewVisible = ref(false)
const previewImages = ref([])
const currentPreviewIndex = ref(0)

function previewImage(images, index) {
  previewImages.value = images
  currentPreviewIndex.value = index
  previewVisible.value = true
  document.body.style.overflow = 'hidden'
}

function closePreview() {
  previewVisible.value = false
  previewImages.value = []
  currentPreviewIndex.value = 0
  document.body.style.overflow = ''
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

function handleKeydown(e) {
  if (!previewVisible.value) return
  if (e.key === 'Escape') {
    closePreview()
  } else if (e.key === 'ArrowLeft') {
    prevImage()
  } else if (e.key === 'ArrowRight') {
    nextImage()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  closePreview()
})

const surplusCount = computed(() => {
  if (!task.value?.assetList) return 0
  return task.value.assetList.reduce((sum, a) => sum + (a.difference > 0 ? a.difference : 0), 0)
})

const deficitCount = computed(() => {
  if (!task.value?.assetList) return 0
  return task.value.assetList.reduce((sum, a) => sum + (a.difference < 0 ? -a.difference : 0), 0)
})

const surplusItems = computed(() => {
  if (!task.value?.assetList) return []
  return task.value.assetList.filter(a => a.difference > 0 && !a.surplusHandled)
})

const deficitItems = computed(() => {
  if (!task.value?.assetList) return []
  return task.value.assetList.filter(a => a.difference < 0 && !a.lossHandled)
})

async function loadData() {
  loadingStore.startLoading()
  try {
    const res = await getTask(taskId)
    task.value = res.data || res
  } catch (e) {
    console.error(e)
    showToast('加载失败')
  } finally {
    loadingStore.stopLoading()
  }
}

function editQty(item, idx) {
  editingItem.value = item
  editingIdx.value = idx
  editQtyValue.value = String(item.actualQty || 0)
  showQtyDialog.value = true
}

async function onQtyConfirm(action) {
  if (action === 'cancel') return true
  const qty = parseInt(editQtyValue.value)
  if (isNaN(qty) || qty < 0) {
    showToast('请输入有效数量')
    return false
  }
  loadingStore.startLoading('更新中...')
  try {
    const item = editingItem.value
    await updateAssetQty(taskId, { assetId: item.assetId, actualQty: qty })
    item.actualQty = qty
    item.difference = qty - item.expectedQty
    item.scanned = true
    task.value.scanned = task.value.assetList.filter(a => a.scanned).length
    showToast('已更新')
  } catch (e) {
    showToast('更新失败')
  } finally {
    loadingStore.stopLoading()
  }
  return true
}

async function doScan(item, idx) {
  loadingStore.startLoading('扫码中...')
  try {
    const result = await ddScan()
    // 扫码成功后，直接将实盘数量设为应盘数量
    const qty = item.expectedQty
    await scanAsset(taskId, { assetId: item.assetId, actualQty: qty })
    item.actualQty = qty
    item.difference = 0
    item.scanned = true
    task.value.scanned = task.value.assetList.filter(a => a.scanned).length
    showToast('扫码成功')
  } catch (e) {
    console.error(e)
    showToast('扫码失败，请手动输入')
  } finally {
    loadingStore.stopLoading()
  }
}

async function doComplete() {
  try {
    await showConfirmDialog({ title: '完成盘点', message: '确认完成该盘点任务？完成后可进行盘盈入库和盘亏报损操作。' })
    loadingStore.startLoading('完成中...')
    await completeTask(taskId)
    showToast('盘点完成')
    await loadData()
  } catch {
  } finally {
    loadingStore.stopLoading()
  }
}

async function doCancel() {
  try {
    await showConfirmDialog({ title: '取消盘点', message: '确认取消该盘点任务？' })
    loadingStore.startLoading()
    await cancelTask(taskId)
    showToast('已取消')
    router.back()
  } catch {
  } finally {
    loadingStore.stopLoading()
  }
}

async function doSurplus(item) {
  if (submitting.value) return
  submitting.value = true
  loadingStore.startLoading('处理中...')
  try {
    await showConfirmDialog({ title: '盘盈入库', message: `确认将「${item.name}」盘盈 ${item.difference} 件入库？` })
    await surplusToAsset({ taskId, assetId: item.assetId })
    showToast('盘盈入库成功')
    item.surplusHandled = true
    await loadData()
  } catch (e) {
    showToast(e?.message || '操作失败')
  } finally {
    submitting.value = false
    loadingStore.stopLoading()
  }
}

async function doSurplusAll() {
  if (submitting.value) return
  submitting.value = true
  loadingStore.startLoading('处理中...')
  try {
    const items = surplusItems.value
    await showConfirmDialog({
      title: '一键盘盈入库',
      message: `将对 ${items.length} 项盘盈资产提交入库申请，确认？`
    })
    for (const item of items) {
      await surplusToAsset({ taskId, assetId: item.assetId })
      item.surplusHandled = true
    }
    showToast('盘盈入库已全部提交')
    await loadData()
  } catch (e) {
    showToast(e?.message || '操作失败')
  } finally {
    submitting.value = false
    loadingStore.stopLoading()
  }
}

async function doDeficitToLoss() {
  if (submitting.value) return
  submitting.value = true
  loadingStore.startLoading('处理中...')
  try {
    const items = deficitItems.value.map(i => ({
      assetId: i.assetId,
      assetName: i.name,
      assetCode: i.code,
      deficit: Math.abs(i.difference)
    }))
    await showConfirmDialog({
      title: '一键盘亏报损',
      message: `将对 ${items.length} 项盘亏资产提交报损申请，确认？`
    })
    await deficitToLoss({ taskId, items })
    deficitItems.value.forEach(item => item.lossHandled = true)
    showToast('报损申请已提交')
    await loadData()
  } catch (e) {
    showToast(e?.message || '操作失败')
  } finally {
    submitting.value = false
    loadingStore.stopLoading()
  }
}

onMounted(loadData)
</script>

<style scoped>
.detail-page { padding: 12px; padding-bottom: 100px; }
.summary-card {
  background: #fff; border-radius: 10px; padding: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.summary-row {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 13px; color: #666; margin-bottom: 6px;
}
.summary-stats {
  display: flex; justify-content: space-around; margin-top: 12px;
  padding-top: 12px; border-top: 1px solid #f0f0f0;
}
.stat-item { display: flex; flex-direction: column; align-items: center; }
.stat-value { font-size: 22px; font-weight: 700; color: #333; }
.stat-label { font-size: 12px; color: #999; margin-top: 2px; }
.text-green { color: #52c41a !important; }
.text-red { color: #ff4d4f !important; }
.inv-item {
  padding: 12px 16px; border-bottom: 1px solid #f5f5f5;
}
.inv-main { display: flex; justify-content: space-between; align-items: flex-start; }
.inv-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
.asset-images {
  display: flex; gap: 6px; flex-shrink: 0; flex-wrap: wrap; max-width: 140px;
  position: relative;
}
.asset-image {
  width: 40px; height: 40px; border-radius: 6px; object-fit: cover;
  cursor: pointer; border: 1px solid #e8e8e8;
}
.asset-more-images {
  width: 40px; height: 40px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.6); color: white; font-size: 14px; font-weight: 600;
  cursor: pointer;
}
.inv-info { flex: 1; min-width: 0; }
.inv-info h4 { font-size: 14px; font-weight: 600; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.inv-info p { font-size: 12px; color: #999; margin: 0; line-height: 1.6; }
.inv-info p.asset-location { color: #666; font-size: 11px; }
.inv-qty { display: flex; gap: 16px; }
.qty-row { display: flex; flex-direction: column; align-items: center; }
.qty-label { font-size: 11px; color: #999; }
.qty-value { font-size: 18px; font-weight: 600; }
.qty-value-editable { 
  color: #1989fa; 
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(25, 137, 250, 0.05);
  min-width: 70px; justify-content: center;
}
.qty-placeholder { color: #bfbfbf; font-style: italic; }
.inv-actions {
  display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px;
}
.action-bar {
  position: fixed; bottom: 0; left: 0; right: 0; padding: 12px 16px;
  background: #fff; box-shadow: 0 -2px 8px rgba(0,0,0,0.06);
  display: flex; gap: 12px; z-index: 100;
}

/* 图片预览样式 */
.image-preview-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.9); z-index: 2000;
  display: flex; align-items: center; justify-content: center;
}
.image-preview-container {
  position: relative; width: 100%; height: 100%;
  display: flex; flex-direction: column;
}
.preview-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; color: white; font-size: 14px;
}
.close-btn {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.preview-content {
  flex: 1; display: flex; align-items: center; justify-content: center;
  position: relative;
}
.preview-image {
  max-width: 90%; max-height: 85%; object-fit: contain; border-radius: 8px;
}
.nav-btn {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 56px; height: 56px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; background: rgba(255,255,255,0.1);
}
.nav-prev { left: 20px; }
.nav-next { right: 20px; }
.nav-btn:hover { background: rgba(255,255,255,0.2); }
</style>
