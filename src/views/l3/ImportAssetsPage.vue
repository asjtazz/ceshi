<template>
  <AppShell title="批量导入资产">
    <div class="import-page">
      <div class="info-card">
        <div class="info-title">
          <van-icon name="info-o" size="18" color="#1989fa" />
          <span>导入说明</span>
        </div>
        <ul class="info-list">
          <li>请先下载导入模板，按照模板格式填写资产信息</li>
          <li>必填项：资产名称、资产分类、存放地点、数量、单位</li>
          <li>资产分类和存放地点请填写名称，系统会自动匹配</li>
          <li>支持 .xlsx 格式的 Excel 文件</li>
        </ul>
      </div>

      <div class="action-area">
        <van-button type="primary" block round @click="downloadTemplate">
          <van-icon name="down" style="margin-right: 6px" />
          下载导入模板
        </van-button>
        <div class="upload-wrapper">
          <van-uploader
            v-model="fileList"
            :max-count="1"
            accept=".xlsx,.xls"
            :after-read="afterRead"
            @delete="onDelete"
          >
            <div class="upload-btn">
              <van-icon name="plus" size="24" color="#999" />
              <div>点击上传Excel文件</div>
            </div>
          </van-uploader>
        </div>
      </div>

      <div v-if="previewData.length > 0" class="preview-section">
        <h4 class="section-title">预览数据（共 {{ previewData.length }} 条）</h4>
        <div class="table-wrapper">
          <table class="preview-table">
            <thead>
              <tr>
                <th>序号</th>
                <th>资产名称</th>
                <th>资产分类</th>
                <th>存放地点</th>
                <th>数量</th>
                <th>单位</th>
                <th>单价</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in previewData" :key="index">
                <td>{{ index + 1 }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.categoryName }}</td>
                <td>{{ item.locationName }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ item.unit }}</td>
                <td>{{ item.price || '-' }}</td>
                <td>
                  <van-tag :type="item.valid ? 'success' : 'danger'" size="small">
                    {{ item.valid ? '有效' : '无效' }}
                  </van-tag>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="error-list" v-if="invalidCount > 0">
          <h5>无效数据（{{ invalidCount }} 条）</h5>
          <div v-for="(err, index) in errors" :key="index" class="error-item">
            第 {{ err.row }} 行：{{ err.message }}
          </div>
        </div>
        <div class="submit-actions">
          <van-button type="primary" round :loading="importing" @click="submitImport" :disabled="validCount === 0">
            确认导入（{{ validCount }} 条）
          </van-button>
          <van-button round @click="reset">清空数据</van-button>
        </div>
      </div>

      <div v-if="importResult" class="result-section">
        <van-result
          :icon="importResult.success ? 'success' : 'fail'"
          :title="importResult.success ? '导入成功' : '导入失败'"
          :description="importResult.message"
        />
        <div class="result-detail" v-if="importResult.success">
          <van-cell-group inset>
            <van-cell title="成功导入" :value="importResult.successCount + ' 条'" />
            <van-cell title="失败" :value="importResult.failCount + ' 条'" v-if="importResult.failCount > 0" />
          </van-cell-group>
        </div>
        <van-button type="primary" round block style="margin-top: 16px" @click="goBack">
          返回
        </van-button>
      </div>
    </div>
  </AppShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useLoadingStore } from '@/stores/loading'
import AppShell from '@/components/global/AppShell.vue'

const router = useRouter()
const loadingStore = useLoadingStore()
const fileList = ref([])
const previewData = ref([])
const importing = ref(false)
const importResult = ref(null)

const validCount = computed(() => previewData.value.filter(item => item.valid).length)
const invalidCount = computed(() => previewData.value.filter(item => !item.valid).length)
const errors = computed(() => previewData.value.filter(item => !item.valid).map(item => ({ row: item.row, message: item.error })))

function downloadTemplate() {
  const link = document.createElement('a')
  link.href = 'http://localhost:3002/api/assets/import/template'
  link.download = '资产导入模板.xlsx'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

async function afterRead(file) {
  loadingStore.startLoading('解析中...')
  try {
    const formData = new FormData()
    formData.append('file', file.file)
    
    const res = await fetch('http://localhost:3002/api/assets/import/preview', {
      method: 'POST',
      body: formData
    })
    
    const data = await res.json()
    if (data.code !== 0) {
      showToast(data.message || '解析失败')
      return
    }
    
    previewData.value = data.data || []
    importResult.value = null
    showToast('解析成功')
  } catch (e) {
    showToast('解析失败：' + e.message)
  } finally {
    loadingStore.stopLoading()
  }
}

function onDelete() {
  previewData.value = []
  importResult.value = null
}

function reset() {
  previewData.value = []
  fileList.value = []
  importResult.value = null
}

async function submitImport() {
  if (validCount.value === 0) {
    showToast('没有可导入的数据')
    return
  }
  
  importing.value = true
  loadingStore.startLoading('导入中...')
  
  try {
    const formData = new FormData()
    formData.append('file', fileList.value[0].file)
    
    const res = await fetch('http://localhost:3002/api/assets/import', {
      method: 'POST',
      body: formData
    })
    
    const data = await res.json()
    if (data.code !== 0) {
      showToast(data.message || '导入失败')
      return
    }
    
    importResult.value = {
      success: true,
      message: '导入完成',
      successCount: data.data.successCount || 0,
      failCount: data.data.failCount || 0
    }
  } catch (e) {
    importResult.value = {
      success: false,
      message: '导入失败：' + e.message
    }
  } finally {
    importing.value = false
    loadingStore.stopLoading()
  }
}

function goBack() {
  router.back()
}
</script>

<style scoped>
.import-page {
  padding: 12px;
}

.info-card {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 16px;
}

.info-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #1989fa;
  margin-bottom: 8px;
}

.info-list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  color: #666;
  line-height: 1.8;
}

.action-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.upload-wrapper {
  width: 100%;
}

.upload-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 120px;
  background: #f7f8fa;
  border: 2px dashed #dcdee2;
  border-radius: 10px;
  color: #999;
  font-size: 13px;
}

.preview-section {
  background: #fff;
  border-radius: 10px;
  padding: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 12px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.preview-table th,
.preview-table td {
  padding: 8px;
  border-bottom: 1px solid #eee;
  text-align: left;
}

.preview-table th {
  background: #f7f8fa;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.preview-table td {
  color: #666;
}

.preview-table tbody tr:last-child td {
  border-bottom: none;
}

.error-list {
  background: #fff1f0;
  border: 1px solid #ffa39e;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.error-list h5 {
  font-size: 13px;
  color: #ff4d4f;
  margin: 0 0 8px 0;
}

.error-item {
  font-size: 12px;
  color: #ff4d4f;
  padding: 4px 0;
}

.submit-actions {
  display: flex;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.submit-actions .van-button {
  flex: 1;
}

.result-section {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
}

.result-detail {
  margin-top: 16px;
}
</style>
