<template>
  <van-form class="apply-form">
    <van-cell-group title="资产信息">
      <van-cell title="选择资产" :value="form.assetName || '请搜索选择'" is-link @click="openAssetPicker" />
    </van-cell-group>

    <van-cell-group title="数量信息">
      <van-cell title="申请数量">
        <template #default>
          <van-stepper v-model="form.quantity" min="1" :max="999" integer />
        </template>
      </van-cell>
    </van-cell-group>

    <van-cell-group v-if="type === 'receive'" title="申请信息">
      <van-cell title="申请理由" :value="form.reason || '请选择'" is-link @click="showReasonPicker = true" />
      <van-field v-model="form.remark" label="备注" type="textarea" rows="2" placeholder="补充说明（选填）" />
    </van-cell-group>

    <van-cell-group v-if="type === 'repair'" title="报修信息">
      <van-field v-model="form.problem" label="故障描述" type="textarea" rows="2" placeholder="请描述故障现象" />
      <van-cell title="申请理由" :value="form.reason || '请选择'" is-link @click="showReasonPicker = true" />
    </van-cell-group>

    <van-cell-group v-if="type === 'scrap'" title="报废信息">
      <van-cell title="报废原因" :value="form.scrappedReason || '请选择'" is-link @click="showScrapPicker = true" />
    </van-cell-group>

    <van-cell-group v-if="type === 'return'" title="归还信息">
      <van-cell title="申请理由" value="归还资产" />
      <van-cell title="归还地点" :value="form.returnLocationName || '请选择归还地点'" is-link @click="showLocationPicker = true" />
      <van-cell title="建议报废" value="">
        <template #right-icon><van-switch v-model="form.suggestScrap" /></template>
      </van-cell>
    </van-cell-group>

    <van-cell-group v-if="type === 'transfer'" title="调拨信息">
      <van-cell title="目标保管人" :value="form.targetUserName || '请选择'" is-link @click="showUserPicker = true" />
      <van-field v-model="form.reason" label="调拨原因" type="textarea" rows="2" placeholder="请输入调拨原因" />
    </van-cell-group>

    <van-cell-group v-if="type !== 'receive'" title="图片凭证">
      <div style="padding:12px"><van-uploader v-model="form.images" :max-count="4" /></div>
    </van-cell-group>

    <div class="submit-area">
      <van-button type="primary" block :loading="submitting" @click="onSubmit">提交申请</van-button>
    </div>

    <!-- 资产搜索弹窗 -->
    <van-popup v-model:show="showAssetPicker" position="bottom" round :style="{ height: '70vh' }">
      <div class="picker-container">
        <van-search v-model="keyword" placeholder="输入名称搜索" @search="doSearch" />
        <div class="picker-body">
          <div v-for="item in searchResults" :key="item.id" class="picker-item" :class="{ disabled: !canSelect(item) }" @click="canSelect(item) && onSelectAsset(item)">
            <div>
              <div class="item-name">{{ item.name }}</div>
              <div class="item-code">{{ item.code }} · 已领用:{{ item.inUseCount || 0 }}{{ item.unit || '件' }} · 库存:{{ item.quantity || 0 }}{{ item.unit || '件' }}</div>
            </div>
            <van-tag v-if="item.alertEnabled && item.quantity <= item.alertMin" type="danger" size="small">库存紧张</van-tag>
          </div>
          <van-empty v-if="!searchResults.length && !loading" description="未找到资产" />
        </div>
      </div>
    </van-popup>

    <!-- 归还地点选择 -->
    <van-popup v-model:show="showLocationPicker" position="bottom" round style="max-height:60vh">
      <van-cascader v-model="locationValue" title="选择归还地点" :options="locationOptions" @finish="onLocationFinish" />
    </van-popup>

    <!-- 目标人选择 -->
    <van-popup v-model:show="showUserPicker" position="bottom" round>
      <van-picker :columns="userOptions" @confirm="onUserConfirm" @cancel="showUserPicker = false" />
    </van-popup>

    <!-- 理由选择 -->
    <van-popup v-model:show="showReasonPicker" position="bottom" round>
      <van-picker :columns="reasonOptions" @confirm="onReasonConfirm" @cancel="showReasonPicker = false" />
    </van-popup>

    <!-- 报废原因选择 -->
    <van-popup v-model:show="showScrapPicker" position="bottom" round>
      <van-picker :columns="scrapOptions" @confirm="onScrapConfirm" @cancel="showScrapPicker = false" />
    </van-popup>
  </van-form>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getAssets } from '@/api/assets'
import { getLocations } from '@/api/config'
import { createApplication } from '@/api/approvals'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const props = defineProps({ type: { type: String, default: 'receive' } })

const form = reactive({
  assetId: '', assetName: '', assetCode: '', quantity: 1,
  returnLocationId: '', returnLocationName: '',
  targetUserId: '', targetUserName: '',
  reason: '', remark: '', problem: '', scrappedReason: '',
  suggestScrap: false, images: []
})

const submitting = ref(false)
const keyword = ref('')
const searchResults = ref([])
const loading = ref(false)

const showAssetPicker = ref(false)
async function openAssetPicker() {
  showAssetPicker.value = true
  await doSearch()
}
async function doSearch() {
  loading.value = true
  try {
    const params = { page: 1, pageSize: 200 }
    if (keyword.value.trim()) params.keyword = keyword.value.trim()
    const res = await getAssets(params)
    let list = res.data?.list || []
    if (props.type !== 'receive') {
      const myId = authStore.userInfo?.id
      list = list.filter(item =>
        (item.inUseCount || 0) > 0 &&
        item.custodian === myId &&
        !item.categoryId?.startsWith('A')
      )
    }
    searchResults.value = list
  } catch { searchResults.value = [] }
  finally { loading.value = false }
}
function canSelect(item) {
  if (props.type === 'receive') return item.quantity > 0
  return item.inUseCount > 0 && item.custodian === authStore.userInfo?.id && !item.categoryId?.startsWith('A')
}
function onSelectAsset(item) {
  form.assetId = item.id
  form.assetName = item.name
  form.assetCode = item.code
  showAssetPicker.value = false
}

const showLocationPicker = ref(false)
const locationValue = ref('')
const locationOptions = ref([])
onMounted(async () => {
  try {
    const res = await getLocations()
    if (res.code === 0 && res.data) {
      const top = res.data.filter(l => !l.parentId)
      locationOptions.value = top.map(s => ({
        text: s.name, value: s.id,
        children: res.data.filter(l => l.parentId === s.id).map(r => ({
          text: r.name, value: r.id,
          children: res.data.filter(l => l.parentId === r.id).map(w => ({ text: w.name, value: w.id }))
        }))
      }))
    }
  } catch (e) { console.error(e) }
})
function onLocationFinish({ selectedOptions }) {
  const last = selectedOptions[selectedOptions.length - 1]
  form.returnLocationId = last.value
  form.returnLocationName = selectedOptions.map(o => o.text).join(' / ')
  showLocationPicker.value = false
}

const showUserPicker = ref(false)
const userOptions = [
  { text: '张三', value: 'u001' }, { text: '李四', value: 'u002' },
  { text: '王五', value: 'u003' }, { text: '赵六', value: 'u004' },
  { text: '管理员', value: 'u005' }
]
function onUserConfirm({ selectedOptions }) {
  form.targetUserId = selectedOptions[0].value
  form.targetUserName = selectedOptions[0].text
  showUserPicker.value = false
}

const showReasonPicker = ref(false)
const reasonOptions = [
  { text: '业务需求', value: '业务需求' }, { text: '设备损坏', value: '设备损坏' },
  { text: '新增需求', value: '新增需求' }, { text: '设备更换', value: '设备更换' }, { text: '其他', value: '其他' }
]
function onReasonConfirm({ selectedOptions }) {
  form.reason = selectedOptions[0]?.value || ''
  showReasonPicker.value = false
}

const showScrapPicker = ref(false)
const scrapOptions = [
  { text: '损坏无法修复', value: '损坏无法修复' }, { text: '年限已到', value: '年限已到' },
  { text: '技术淘汰', value: '技术淘汰' }, { text: '其他', value: '其他' }
]
function onScrapConfirm({ selectedOptions }) {
  form.scrappedReason = selectedOptions[0]?.value || ''
  showScrapPicker.value = false
}

async function onSubmit() {
  if (!form.assetName) { showToast('请选择资产'); return }
  if (!form.quantity || form.quantity < 1) { showToast('请输入有效数量'); return }
  if (props.type === 'return' && !form.returnLocationId) { showToast('请选择归还地点'); return }
  if (props.type === 'transfer' && !form.targetUserId) { showToast('请选择目标保管人'); return }
  if (props.type === 'scrap' && !form.scrappedReason) { showToast('请选择报废原因'); return }
  if (props.type === 'repair' && !form.problem && !form.reason) { showToast('请描述故障或选择理由'); return }

  submitting.value = true
  try {
    await createApplication({
      assetId: form.assetId, assetName: form.assetName, assetCode: form.assetCode,
      quantity: form.quantity, type: props.type,
      returnLocationId: form.returnLocationId, returnLocationName: form.returnLocationName,
      targetUserId: form.targetUserId, targetUserName: form.targetUserName,
      reason: form.reason || form.scrappedReason || '归还资产',
      problem: form.problem, remark: form.remark, suggestScrap: form.suggestScrap,
      applicantId: authStore.userInfo?.id, applicantName: authStore.userInfo?.name
    })
    showToast('提交成功')
    router.push('/l1/my-applications')
  } catch { showToast('提交失败') }
  finally { submitting.value = false }
}
</script>

<style scoped>
.apply-form { padding-bottom: 80px; }
.submit-area { padding: 16px; position: fixed; bottom: 0; left: 0; right: 0; background: #fff; }
.picker-container { display: flex; flex-direction: column; height: 100%; }
.picker-body { flex: 1; overflow-y: auto; }
.picker-item { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid #f5f5f5; }
.picker-item.disabled { opacity: 0.4; pointer-events: none; }
.item-name { font-size: 14px; color: #323233; }
.item-code { font-size: 12px; color: #999; margin-top: 2px; }
</style>