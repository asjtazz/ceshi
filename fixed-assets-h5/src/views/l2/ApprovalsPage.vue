<template>
  <AppShell title="审批列表">
    <div class="approvals-page">
      <van-tabs v-model:active="tab" sticky>
        <van-tab title="待审批" name="PENDING" />
        <van-tab title="已处理" name="HANDLED" />
      </van-tabs>

      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <div class="app-list">
          <van-empty description="暂无数据" v-if="!list.length && !pageLoading" />
          <div
            v-for="app in list"
            :key="app.id"
            class="app-card"
          >
            <div class="app-header">
              <span class="app-type">{{ typeLabel(app.type) }}</span>
              <StatusBadge :status="app.status" />
            </div>
            <div class="app-body">
              <h4>{{ app.assetName }}</h4>
              <p class="code">{{ app.assetCode }}</p>
              <p class="meta">
                <span>申请人: {{ app.applicantName }}</span>
                <span>数量: {{ app.quantity }}</span>
                <span>{{ app.createdAt?.slice(0, 16) }}</span>
              </p>
              <p class="reason" v-if="app.reason">原因: {{ app.reason }}</p>
              <!-- 归还申请联动信息 -->
              <div v-if="app.type === 'return'" class="suggestions">
                <van-tag v-if="app.suggestRepair" type="warning">建议报修</van-tag>
                <van-tag v-if="app.suggestScrap" type="danger">建议报废</van-tag>
              </div>
              <p v-if="app.problem" class="problem">问题: {{ app.problem }}</p>
              <!-- 图片显示 -->
              <div v-if="app.images && app.images.length > 0" class="image-list">
                <div
                  v-for="(img, index) in app.images"
                  :key="index"
                  class="image-item"
                  @click="openPreview(app.images, index)"
                >
                  <img :src="img" alt="审批附件" class="thumb" width="80" height="80" loading="lazy" />
                </div>
              </div>
            </div>
            <div class="app-actions" v-if="tab === 'PENDING'">
              <van-button size="small" type="primary" round @click.stop="approve(app)">通过</van-button>
              <van-button size="small" plain round @click.stop="showReject(app)">拒绝</van-button>
            </div>
          </div>
        </div>
      </van-pull-refresh>
    </div>

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

    <van-dialog v-model:show="rejectDialog" title="拒绝原因" show-cancel-button @confirm="onRejectConfirm">
      <div style="padding: 16px;">
        <van-field v-model="rejectReason" rows="2" type="textarea" placeholder="请输入拒绝原因" />
      </div>
    </van-dialog>
  </AppShell>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { showToast } from 'vant'
import { getPendingList, approveApplication, rejectApplication } from '@/api/approvals'
import { useLoadingStore } from '@/stores/loading'
import AppShell from '@/components/global/AppShell.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const tab = ref('PENDING')
const list = ref([])
const pageLoading = ref(false)
const refreshing = ref(false)
const rejectDialog = ref(false)
const rejectReason = ref('')
const currentApp = ref(null)

const loadingStore = useLoadingStore()

// 图片预览相关状态
const previewVisible = ref(false)
const previewImages = ref([])
const currentPreviewIndex = ref(0)

const typeLabelMap = { receive: '领用', return: '归还', repair: '报修', scrap: '报废', loss: '报损' }
function typeLabel(t) { return typeLabelMap[t] || t }

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

function openPreview(images, index) {
  previewImages.value = images
  currentPreviewIndex.value = index
  previewVisible.value = true
  // 禁止背景滚动
  document.body.style.overflow = 'hidden'
  // 添加键盘监听
  document.addEventListener('keydown', handleKeydown)
}

function closePreview() {
  previewVisible.value = false
  // 恢复背景滚动
  document.body.style.overflow = ''
  // 移除键盘监听
  document.removeEventListener('keydown', handleKeydown)
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
  document.body.style.overflow = ''
  document.removeEventListener('keydown', handleKeydown)
})

async function loadData() {
  pageLoading.value = true
  try {
    const res = await getPendingList()
    const data = res.data || {}
    const pending = Array.isArray(data.pending) ? data.pending : []
    const processed = Array.isArray(data.processed) ? data.processed : []
    if (tab.value === 'PENDING') {
      list.value = pending.filter(a => a.status === 'PENDING')
    } else {
      list.value = processed
    }
  } catch {
    showToast('加载失败')
  } finally {
    pageLoading.value = false
  }
}

function onRefresh() { loadData().finally(() => refreshing.value = false) }
watch(tab, () => loadData())

async function approve(app) {
  loadingStore.startLoading('审批中...')
  try {
    await approveApplication(app.id, { quantity: app.quantity })
    showToast('审批通过')
    await loadData()
  } catch { 
    showToast('操作失败') 
  } finally {
    loadingStore.stopLoading()
  }
}

function showReject(app) {
  currentApp.value = app
  rejectReason.value = ''
  rejectDialog.value = true
}

async function onRejectConfirm() {
  loadingStore.startLoading('操作中...')
  try {
    await rejectApplication(currentApp.value.id, { reason: rejectReason.value })
    showToast('已拒绝')
    await loadData()
  } catch { 
    showToast('操作失败') 
  } finally {
    loadingStore.stopLoading()
  }
}

onMounted(loadData)
</script>

<style scoped>
.approvals-page { min-height: 100vh; }
.app-list { padding: 8px 12px; }
.app-card {
  background: #fff; border-radius: 10px; padding: 12px; margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.app-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.app-type { font-size: 13px; color: #1989fa; font-weight: 600; }
.app-body h4 { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
.app-body .code { font-size: 12px; color: #999; margin-bottom: 8px; }
.app-body .meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: #666; margin-bottom: 4px; }
.app-body .reason { font-size: 12px; color: #666; }
.app-body .suggestions { margin-top: 8px; display: flex; gap: 8px; }
.app-body .problem { font-size: 12px; color: #ff6034; margin-top: 4px; }

/* 图片列表样式 - 响应式缩略图 */
.image-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-top: 10px;
}
@media (min-width: 600px) {
  .image-list {
    grid-template-columns: repeat(5, 1fr);
  }
}
.image-item {
  aspect-ratio: 1;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  background: #f7f8fa;
}
.image-item .thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 自定义图片预览样式 */
.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  overscroll-behavior: contain;
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
  padding: 16px;
  color: #fff;
  font-size: 16px;
}
.preview-count {
  color: #fff;
}
.close-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}
.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}
.preview-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 20px;
}
.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transition: background 0.2s;
}
.nav-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}
.nav-prev {
  left: 20px;
}
.nav-next {
  right: 20px;
}

.app-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; padding-top: 10px; border-top: 1px solid #f5f5f5; }
</style>
