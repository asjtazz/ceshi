<template>
  <AppShell title="新增资产">
    <div class="register-page">
      <van-form @submit="onSubmit" ref="formRef">
        <van-cell-group inset title="基本信息">
          <van-field
            v-model="form.code"
            label="资产编码"
            placeholder="系统自动生成"
            readonly
            right-icon="info-o"
            @click-right-icon="showCodeTip = true"
          />
          <TreeSelector v-model="form.categoryId" :nodes="categoryNodes" label="资产分类" />
          <van-field
            v-model="form.name"
            label="资产名称"
            placeholder="请输入资产名称"
            :rules="[{ required: true, message: '请输入资产名称' }]"
            @input="onNameInput"
          />
          <van-popup v-model:show="showNameSuggestions" position="bottom" round :style="{ maxHeight: '50%' }" @click-overlay="showNameSuggestions = false">
            <div class="suggestions-header">
              <span>选择资产名称</span>
              <span class="close-btn" @click="showNameSuggestions = false">关闭</span>
            </div>
            <div class="suggestions-list">
              <div
                v-for="(item, index) in filteredNames"
                :key="index"
                class="suggestion-item"
                @click="selectName(item)"
              >
                <span class="suggestion-name">{{ item.name }}</span>
                <span class="suggestion-meta" v-if="item.category">分类：{{ item.category }}</span>
              </div>
              <van-empty v-if="filteredNames.length === 0" description="没有匹配的名称" />
            </div>
          </van-popup>
          <van-field v-model="form.model" label="规格型号" placeholder="请输入规格型号（选填）" />
        </van-cell-group>

        <van-cell-group inset title="资产图片">
          <div class="upload-title">上传图片（选填，最多3张）</div>
          <van-uploader v-model="images" multiple :max-count="3" />
        </van-cell-group>

        <van-cell-group inset title="存放信息">
          <TreeSelector v-model="form.locationId" :nodes="locationNodes" label="存放地点" />
          <van-field v-model="form.custodianName" label="责任人" placeholder="请输入责任人（选填）" />
        </van-cell-group>

        <van-cell-group inset title="数量与价值">
          <van-field v-model="form.quantity" label="数量" type="digit" placeholder="默认1" />
          <van-field
            v-model="form.unit"
            label="单位"
            placeholder="请选择单位"
            readonly
            is-link
            @click="showUnitPicker = true"
          />
          <van-field v-model="form.price" label="单价(元)" type="number" placeholder="请输入单价（选填）" />
          <van-field v-model="form.purchaseDate" label="购置日期" placeholder="YYYY-MM-DD" is-link readonly @click="showDate = true" />
        </van-cell-group>

        <van-cell-group inset title="检定信息">
          <van-cell title="是否需要检定" center>
            <template #right-icon>
              <van-switch v-model="form.inspectionEnabled" size="20px" />
            </template>
          </van-cell>
          <template v-if="form.inspectionEnabled">
            <van-field v-model="form.lastInspectionDate" label="上次检定日期" is-link readonly @click="openLastInspDatePicker" />
            <van-field v-model="inspectionCycleLabel" label="检定周期" is-link readonly placeholder="请选择检定周期" @click="showCyclePicker = true" />
            <van-field v-model="form.nextInspectionDate" label="下次检定日期" is-link readonly @click="showInspDate = true" />
          </template>
        </van-cell-group>

        <van-cell-group inset title="盘点设置">
          <van-cell title="加入盘点" center>
            <template #right-icon>
              <van-switch v-model="form.inventoryEnabled" size="20px" />
            </template>
          </van-cell>
        </van-cell-group>

        <van-cell-group inset title="库存预警">
          <van-cell title="低库存告警" center>
            <template #right-icon>
              <van-switch v-model="form.alertEnabled" size="20px" />
            </template>
          </van-cell>
          <template v-if="form.alertEnabled">
            <van-field v-model="form.alertMin" label="最低库存数" type="digit" placeholder="库存低于此数将告警" />
          </template>
        </van-cell-group>

        <div class="form-actions">
          <van-button type="primary" block round native-type="submit" :loading="submitting">确认入库</van-button>
        </div>
      </van-form>
    </div>

    <van-popup v-model:show="showDate" position="bottom" round>
      <van-date-picker
        title="购置日期"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onDateConfirm"
        @cancel="showDate = false"
      />
    </van-popup>
    <van-popup v-model:show="showInspDate" position="bottom" round>
      <van-date-picker title="下次检定" :min-date="minDate" @confirm="onInspDateConfirm" @cancel="showInspDate = false" />
    </van-popup>
    <van-popup v-model:show="showLastInspDate" position="bottom" round>
      <van-date-picker
        v-model="lastInspDateValue"
        title="上次检定"
        :max-date="maxDate"
        :min-date="minDate"
        @confirm="onLastInspDateConfirm"
        @cancel="showLastInspDate = false"
      />
    </van-popup>
    <van-popup v-model:show="showUnitPicker" position="bottom" round>
      <van-picker title="选择单位" :columns="unitColumns" @confirm="onUnitConfirm" @cancel="showUnitPicker = false" />
    </van-popup>
    <van-popup v-model:show="showCyclePicker" position="bottom" round>
      <van-picker title="检定周期" :columns="cycleColumns" @confirm="onCycleConfirm" @cancel="showCyclePicker = false" />
    </van-popup>
  </AppShell>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useLoadingStore } from '@/stores/loading'
import { createAsset, getAssets } from '@/api/assets'
import { getCategories } from '@/api/config'
import { getLocations } from '@/api/config'
import AppShell from '@/components/global/AppShell.vue'
import TreeSelector from '@/components/common/TreeSelector.vue'

const router = useRouter()
const loadingStore = useLoadingStore()
const formRef = ref(null)
const submitting = ref(false)
const showDate = ref(false)
const showInspDate = ref(false)
const showLastInspDate = ref(false)
const showUnitPicker = ref(false)
const showCyclePicker = ref(false)
const showCodeTip = ref(false)
const categories = ref([])
const locations = ref([])
const assets = ref([])
const showNameSuggestions = ref(false)
const images = ref([])
const lastInspDateValue = ref([new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()])

const maxDate = new Date()
const minDate = new Date(2000, 0, 1)

const unitColumns = ['台', '件', '套', '个', '箱', '包', '瓶', '副', '支', '把'].map(u => ({ text: u, value: u }))

const cycleOptions = [
  { label: '每季', days: 90 },
  { label: '每半年', days: 180 },
  { label: '每年', days: 365 },
  { label: '每两年', days: 730 }
]
const cycleColumns = cycleOptions.map(o => ({ text: o.label, value: String(o.days) }))
const inspectionCycleLabel = ref('')

const form = ref({
  name: '',
  model: '',
  categoryId: '',
  locationId: '',
  custodianName: '',
  quantity: '1',
  unit: '',
  price: '',
  purchaseDate: '',
  inspectionEnabled: false,
  lastInspectionDate: '',
  inspectionCycle: '',
  nextInspectionDate: '',
  inventoryEnabled: false,
  alertEnabled: false,
  alertMin: ''
})

// 自动生成下次检定日期
watch([() => form.value.inspectionEnabled, () => form.value.lastInspectionDate, () => form.value.inspectionCycle], ([enabled, lastDate, cycle]) => {
  if (enabled && lastDate && cycle) {
    const d = new Date(lastDate)
    d.setDate(d.getDate() + Number(cycle))
    form.value.nextInspectionDate = d.toISOString().slice(0, 10)
  }
})

const categoryNodes = computed(() => toNodes(categories.value))
const locationNodes = computed(() => toNodes(locations.value))

// 资产名称联想过滤 - 只在有输入时显示
const filteredNames = computed(() => {
  if (!form.value.name || form.value.name.length < 1) {
    return []
  }
  const searchText = form.value.name.toLowerCase()
  const namesMap = {}
  const names = []
  assets.value.forEach(asset => {
    if (asset.name.toLowerCase().includes(searchText) && !namesMap[asset.name]) {
      namesMap[asset.name] = true
      names.push({
        name: asset.name,
        category: asset.categoryName || ''
      })
    }
  })
  return names
})

function toNodes(list) {
  if (!Array.isArray(list)) return []
  const map = {}
  list.forEach(n => map[n.id] = n)
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

// 监听资产名称输入，自动显示联想弹窗
watch(() => form.value.name, (newName) => {
  if (newName && newName.length >= 1) {
    showNameSuggestions.value = true
  } else {
    showNameSuggestions.value = false
  }
})

function onNameInput() {
  if (form.value.name && form.value.name.length >= 1) {
    showNameSuggestions.value = true
  } else {
    showNameSuggestions.value = false
  }
}

function openLastInspDatePicker() {
  // 每次打开都重置为今天
  const today = new Date()
  lastInspDateValue.value = [today.getFullYear(), today.getMonth() + 1, today.getDate()]
  showLastInspDate.value = true
}

function selectName(item) {
  form.value.name = item.name
  showNameSuggestions.value = false
  // 自动填充同名称的其他信息，比如分类、型号等
  const similarAsset = assets.value.find(a => a.name === item.name)
  if (similarAsset) {
    if (!form.value.categoryId && similarAsset.categoryId) {
      form.value.categoryId = similarAsset.categoryId
    }
    if (!form.value.model && similarAsset.model) {
      form.value.model = similarAsset.model
    }
    if (!form.value.unit && similarAsset.unit) {
      form.value.unit = similarAsset.unit
    }
  }
}

function onDateConfirm({ selectedValues }) { form.value.purchaseDate = selectedValues.join('-'); showDate.value = false }
function onInspDateConfirm({ selectedValues }) { form.value.nextInspectionDate = selectedValues.join('-'); showInspDate.value = false }
function onLastInspDateConfirm({ selectedValues }) { form.value.lastInspectionDate = selectedValues.join('-'); showLastInspDate.value = false }
function onUnitConfirm({ selectedOptions }) { form.value.unit = selectedOptions[0]?.text || ''; showUnitPicker.value = false }
function onCycleConfirm({ selectedOptions }) {
  form.value.inspectionCycle = selectedOptions[0]?.value || ''
  inspectionCycleLabel.value = selectedOptions[0]?.text || ''
  showCyclePicker.value = false
  // 选完周期后自动计算下次检定日期
  if (form.value.inspectionEnabled && form.value.lastInspectionDate && form.value.inspectionCycle) {
    const d = new Date(form.value.lastInspectionDate)
    d.setDate(d.getDate() + Number(form.value.inspectionCycle))
    form.value.nextInspectionDate = d.toISOString().slice(0, 10)
  }
}

async function onSubmit() {
  submitting.value = true
  loadingStore.startLoading('保存中...')
  try {
    const payload = {
      ...form.value,
      quantity: Number(form.value.quantity) || 1,
      price: Number(form.value.price) || 0,
      inspectionCycle: form.value.inspectionEnabled ? (Number(form.value.inspectionCycle) || 0) : 0,
      status: 'IDLE',
      images: images.value.map(f => f.url || f.content)
    }
    if (!form.value.inspectionEnabled) {
      payload.lastInspectionDate = ''
      payload.nextInspectionDate = ''
    }
    await createAsset(payload)
    showToast('资产入库成功')
    router.replace('/l2/assets')
  } catch (e) {
    showToast(e?.message || '保存失败')
  } finally {
    submitting.value = false
    loadingStore.stopLoading()
  }
}

async function loadConfig() {
  try {
    const [catRes, locRes, assetsRes] = await Promise.all([getCategories(), getLocations(), getAssets({ page: 1, pageSize: 500 })])
    categories.value = Array.isArray(catRes.data?.list) ? catRes.data.list : (catRes.data || [])
    locations.value = Array.isArray(locRes.data?.list) ? locRes.data.list : (locRes.data || [])
    assets.value = Array.isArray(assetsRes.data?.list) ? assetsRes.data.list : (assetsRes.data || [])
    // 预填购置日期为今天
    if (!form.value.purchaseDate) {
      form.value.purchaseDate = new Date().toISOString().slice(0, 10)
    }
  } catch {
    showToast('加载配置失败')
  }
}

onMounted(loadConfig)
</script>

<style scoped>
.register-page { padding-bottom: 20px; }
.form-actions { padding: 16px; }
.upload-title { padding: 12px 16px 8px; font-size: 14px; color: #333; }

.suggestions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  font-weight: 600;
  border-bottom: 1px solid #f5f5f5;
}

.close-btn {
  color: #1989fa;
  font-size: 14px;
  cursor: pointer;
}

.suggestions-list {
  max-height: 400px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background-color: #f5f5f5;
}

.suggestion-item:active {
  background-color: #e5e5e5;
}

.suggestion-name {
  display: block;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.suggestion-meta {
  font-size: 12px;
  color: #999;
}
</style>