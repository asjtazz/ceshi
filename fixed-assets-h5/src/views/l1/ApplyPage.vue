<template>
  <AppShell title="发起申请">
    <div class="apply-page">
      <van-form @submit="onSubmit" ref="formRef">
        <van-cell-group inset class="form-group">
          <van-field label="申请类型" :model-value="typeLabel" readonly />
          <van-field
            v-model="form.assetName"
            name="assetId"
            label="选择资产"
            placeholder="请选择资产"
            readonly
            is-link
            @click="showAssetPicker = true"
            :rules="[{ required: true, message: '请选择资产' }]"
          />
          <van-field
            v-model="form.quantity"
            name="quantity"
            label="申请数量"
            type="digit"
            :placeholder="type === 'receive' ? '请输入数量（不超过可用数量）…' : '请输入数量（不超过名下数量）…'"
            :rules="[{ required: true, message: '请输入数量' }]"
          />
          <TreeSelector
            v-model="form.reason"
            :nodes="reasonOptions"
            label="申请原因"
            placeholder="请选择申请原因"
          />
          <van-field
            v-model="form.remark"
            rows="2"
            autosize
            label="备注说明"
            type="textarea" maxlength="200" show-word-limit placeholder="请输入备注（选填）"
          />
          <!-- 归还：联动开关 -->
          <template v-if="type === 'return'">
            <div class="switch-title" style="padding: 12px 16px 0; font-size: 14px; color: #646566;">归还后处理建议</div>
            <van-cell title="建议报修" center>
              <template #right-icon>
                <van-switch v-model="form.suggestRepair" />
              </template>
            </van-cell>
            <van-cell title="建议报废" center>
              <template #right-icon>
                <van-switch v-model="form.suggestScrap" />
              </template>
            </van-cell>
            <van-field
              v-if="form.suggestRepair || form.suggestScrap"
              v-model="form.problemDescription"
              rows="2"
              autosize
              label="问题描述"
              type="textarea"
              maxlength="200"
              show-word-limit
              placeholder="请描述问题"
            />
          </template>
          <!-- 调拨：目标保管人 -->
          <van-field
            v-if="type === 'transfer'"
            v-model="form.targetUserName"
            name="targetUserId"
            label="目标保管人"
            placeholder="请选择目标保管人"
            readonly is-link
            @click="showUserPicker = true"
            :rules="[{ required: true, message: '请选择目标保管人' }]"
          />
          <!-- 调拨：目标地点 -->
          <TreeSelector
            v-if="type === 'transfer'"
            v-model="form.returnLocationId"
            :nodes="locationNodes"
            label="目标地点"
            placeholder="请选择目标地点"
          />
        </van-cell-group>

        <van-cell-group inset class="form-group">
          <div class="upload-title">附件图片（选填）</div>
          <van-uploader v-model="images" multiple :max-count="3" />
        </van-cell-group>

        <div class="form-actions">
          <van-button type="primary" block round native-type="submit" :loading="submitting">提交申请</van-button>
        </div>
      </van-form>
    </div>

    <van-popup v-model:show="showAssetPicker" position="bottom" round style="height: 70%">
      <div class="picker-toolbar"><span @click="showAssetPicker = false">取消</span><strong>选择资产</strong><span @click="showAssetPicker = false">确定</span></div>
      <van-search v-model="searchKey" placeholder="搜索资产名称" />
      <div class="asset-picker-list">
        <van-empty description="暂无数据" v-if="!filteredAssets.length" />
        <div
          v-for="a in filteredAssets"
          :key="a.id"
          class="picker-item"
          :class="{ selected: form.assetId === a.id }"
          @click="selectAsset(a)"
        >
          <div class="picker-main">
            <h4>{{ a.name }}</h4>
            <p>{{ a.code }} · {{ a.locationName }}</p>
            <p class="available">
              <template v-if="type === 'receive'">
                可用数量：{{ a.quantity - a.inUseCount }}{{ a.unit || '件' }}
              </template>
              <template v-else>
                名下数量：{{ a.inUseCount }}{{ a.unit || '件' }}
              </template>
            </p>
          </div>
          <van-icon name="success" v-if="form.assetId === a.id" color="#1989fa" />
        </div>
      </div>
    </van-popup>
  </AppShell>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { useAuthStore } from '@/stores/auth'
import { useLoadingStore } from '@/stores/loading'
import { getAssets } from '@/api/assets'
import { createApplication } from '@/api/approvals'
import { RECEIVE_REASONS, SCRAP_REASONS } from '@/utils/constants'
import { getUsers } from '@/api/auth'
import { getLocations } from '@/api/config'
import AppShell from '@/components/global/AppShell.vue'
import TreeSelector from '@/components/common/TreeSelector.vue'


const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const loadingStore = useLoadingStore()
const type = route.params.type
const assetId = route.query.assetId
const formRef = ref(null)
const submitting = ref(false)
const showAssetPicker = ref(false)
const searchKey = ref('')
const users = ref([])
const locations = ref([])
const showUserPicker = ref(false)
const assets = ref([])
const images = ref([])
const selectedAsset = ref(null)
const typeLabelMap = { receive: '领用申请', return: '归还申请', repair: '报修申请', scrap: '报废申请', transfer: '调拨申请' }
const typeLabel = typeLabelMap[type] || '申请'


const form = ref({
  assetId: '',
  assetName: '',
  quantity: 1,
  reason: '',
  remark: '',
  targetUserId: '',
  targetUserName: '',
  returnLocationId: '',
  targetLocationName: '',
  suggestRepair: false,
  suggestScrap: false,
  problemDescription: ''
})
const userOptions = computed(() => users.value.map(u => ({ text: u.name + ' (' + u.dept + ')', value: u.id })))

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

const reasonOptions = computed(() => {
  const map = {
    receive: RECEIVE_REASONS.map(r => ({ id: r.value, name: r.label })),
    return: RECEIVE_REASONS.map(r => ({ id: r.value, name: r.label })),
    repair: [
      { id: "设备故障", name: "设备故障" },
      { id: "软件问题", name: "软件问题" },
      { id: "配件损坏", name: "配件损坏" },
      { id: "其他", name: "其他" }
    ],
    scrap: SCRAP_REASONS.map(r => ({ id: r.value, name: r.label })),
    transfer: [
      { id: "岗位调整", name: "岗位调整" },
      { id: "地点变更", name: "地点变更" },
      { id: "其他", name: "其他" }
    ]
  }
  return map[type] || RECEIVE_REASONS.map(r => ({ id: r.value, name: r.label }))
})

const filteredAssets = computed(() => {
  if (!searchKey.value) return assets.value
  return assets.value.filter(a => a.name.includes(searchKey.value) || a.code.includes(searchKey.value))
})

function onUserConfirm({ selectedOptions }) {
  const opt = selectedOptions[0]
  if (opt) {
    form.value.targetUserId = opt.value
    form.value.targetUserName = opt.text
  }
  showUserPicker.value = false
}

function selectAsset(a) {
  form.value.assetId = a.id
  form.value.assetName = a.name
  selectedAsset.value = a
  showAssetPicker.value = false
}

// 监听locationId变化时，自动更新targetLocationName
watch(() => form.value.returnLocationId, (locId) => {
  if (locId) {
    const loc = locations.value.find(l => l.id === locId)
    if (loc) {
      form.value.targetLocationName = loc.name
    }
  }
})

async function onSubmit() {
  // 数量校验
  const qty = Number(form.value.quantity)
  if (qty <= 0) return showToast('数量必须大于0')
  if (type === 'receive') {
    const maxQty = selectedAsset.value ? (selectedAsset.value.quantity - selectedAsset.value.inUseCount) : 0
    if (qty > maxQty) return showToast(`库存不足，最多可申请${maxQty}`)
  } else if (type === 'return' || type === 'repair' || type === 'scrap') {
    const myQty = selectedAsset.value ? selectedAsset.value.inUseCount : 0
    if (qty > myQty) return showToast(`超出您名下领用数量${myQty}`)
  }
  submitting.value = true
  loadingStore.startLoading('提交中...')
  try {
    await createApplication({
      type,
      assetId: form.value.assetId,
      quantity: Number(form.value.quantity),
      reason: form.value.reason,
      remark: form.value.remark,
      applicantId: authStore.userInfo?.id,
      applicantName: authStore.userInfo?.name,
      targetUserId: form.value.targetUserId || undefined,
      returnLocationId: form.value.returnLocationId || undefined,
      targetUserName: form.value.targetUserName || undefined,
      targetLocationName: form.value.targetLocationName || undefined,
      assetName: form.value.assetName,
      images: images.value.map(f => f.url || f.content),
      suggestRepair: form.value.suggestRepair,
      suggestScrap: form.value.suggestScrap,
      problem: form.value.problemDescription
    })
    showToast('申请提交成功')
    router.replace('/l1/my-applications')
  } catch (e) {
    showToast(e?.message || '提交失败')
  } finally {
    submitting.value = false
    loadingStore.stopLoading()
  }
}

async function loadAssets() {
  const res = await getAssets({ page: 1, pageSize: 100 })
  let list = res.data?.list || []
  const userId = authStore.userInfo?.id
  if (type === 'receive') {
    // 领用：只显示状态为闲置且有库存的资产
    list = list.filter(a => a.status === 'IDLE' && (a.quantity - a.inUseCount) > 0)
  } else if (type === 'return') {
    // 归还：只显示当前用户名下的在用资产
    list = list.filter(a => a.custodian === userId && a.inUseCount > 0)
  } else if (type === 'repair') {
    // 报修：只显示当前用户名下的非低值易耗品
    list = list.filter(a => a.custodian === userId && a.inUseCount > 0 && !a.categoryName?.includes('易耗'))
  } else if (type === 'scrap') {
    // 报废：只显示当前用户名下的在用资产
    list = list.filter(a => a.custodian === userId && a.inUseCount > 0)
  } else if (type === 'transfer') {
    // 调拨：显示当前用户名下的资产
    list = list.filter(a => a.custodian === userId && a.inUseCount > 0)
  }
  assets.value = list
  // 预填
  if (assetId) {
    const a = list.find(x => x.id === assetId)
    if (a) selectAsset(a)
  }
}

async function loadTransferData() {
  if (type === 'transfer') {
    try {
      const [uRes, lRes] = await Promise.all([
        getUsers(),
        getLocations()
      ])
      users.value = uRes.data?.list || [];
      locations.value = lRes.data?.list || [];
    } catch (e) { console.error(e) }
  }
}
loadTransferData()
onMounted(loadAssets)
</script>

<style scoped>
.apply-page { padding: 12px 0; }
.form-group { margin-bottom: 12px; }
.upload-title { padding: 12px 16px 8px; font-size: 14px; color: #333; }
.form-actions { padding: 16px; }
.picker-toolbar{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #e5e5e5}.picker-toolbar strong{font-size:15px}.picker-toolbar span{font-size:14px;color:#1989fa;cursor:pointer}.asset-picker-list { height: calc(70vh - 100px); overflow-y: auto; padding: 8px 0; }
.picker-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid #f5f5f5; cursor: pointer;
}
.picker-item.selected { background: #e6f7ff; }
.picker-main h4 { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.picker-main p { font-size: 12px; color: #999; }
.picker-main .available { color: #1989fa; font-weight: 500; }
</style>
