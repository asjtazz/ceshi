<template>
  <div class="apply-page">
    <van-nav-bar title="资产申请" left-arrow @click-left="$router.back()" />

    <div class="apply-form">
      <van-form @submit="onSubmit">
        <van-cell-group inset>
          <van-field
            v-model="formData.assetName"
            name="assetName"
            label="资产名称"
            placeholder="请选择或输入资产名称"
            :rules="[{ required: true, message: '请填写资产名称' }]"
          />
          <van-field
            v-model="formData.category"
            is-link
            readonly
            label="资产分类"
            placeholder="请选择资产分类"
            @click="showCategoryPicker = true"
            :rules="[{ required: true, message: '请选择资产分类' }]"
          />
          <van-field
            v-model="formData.location"
            is-link
            readonly
            label="存放地点"
            placeholder="请选择存放地点"
            @click="showLocationPicker = true"
            :rules="[{ required: true, message: '请选择存放地点' }]"
          />
          <van-field
            v-model="formData.applyType"
            is-link
            readonly
            label="申请类型"
            placeholder="请选择申请类型"
            @click="showTypePicker = true"
            :rules="[{ required: true, message: '请选择申请类型' }]"
          />
          <van-field
            v-if="formData.applyType === '领用'"
            v-model="formData.quantity"
            label="数量"
            placeholder="请输入数量"
            type="digit"
            :rules="[{ required: true, message: '请填写数量' }]"
          />
          <van-field
            v-model="formData.remark"
            label="申请说明"
            type="textarea"
            placeholder="请输入申请原因或备注"
            rows="3"
            autosize
          />
        </van-cell-group>

        <div style="margin: 16px">
          <van-button round block type="primary" native-type="submit" :loading="submitting">
            提交申请
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- 分类选择器 -->
    <van-popup v-model:show="showCategoryPicker" position="bottom" round>
      <van-picker
        :columns="categoryColumns"
        @confirm="onCategoryConfirm"
        @cancel="showCategoryPicker = false"
        title="选择资产分类"
      />
    </van-popup>

    <!-- 地点选择器 -->
    <van-popup v-model:show="showLocationPicker" position="bottom" round>
      <van-picker
        :columns="locationColumns"
        @confirm="onLocationConfirm"
        @cancel="showLocationPicker = false"
        title="选择存放地点"
      />
    </van-popup>

    <!-- 类型选择器 -->
    <van-popup v-model:show="showTypePicker" position="bottom" round>
      <van-picker
        :columns="typeColumns"
        @confirm="onTypeConfirm"
        @cancel="showTypePicker = false"
        title="选择申请类型"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { showToast, showSuccessToast } from 'vant'

const router = useRouter()

const submitting = ref(false)
const showCategoryPicker = ref(false)
const showLocationPicker = ref(false)
const showTypePicker = ref(false)

const formData = reactive({
  assetName: '',
  category: '',
  location: '',
  applyType: '',
  quantity: 1,
  remark: ''
})

const categoryColumns = [
  { text: 'A-土地房屋', children: [{ text: 'A01-房屋' }, { text: 'A02-土地' }, { text: 'A03-构筑物' }] },
  { text: 'B-通用设备', children: [{ text: 'B01-计算机' }, { text: 'B02-打印机' }, { text: 'B03-扫描仪' }, { text: 'B04-办公家具' }, { text: 'B05-空调' }] },
  { text: 'C-专用设备', children: [{ text: 'C01-检测设备' }, { text: 'C02-维修工具' }, { text: 'C03-安全设备' }] },
  { text: 'D-家具装具', children: [{ text: 'D01-办公桌椅' }, { text: 'D02-文件柜' }, { text: 'D03-其他家具' }] }
]

const locationColumns = [
  { text: '主站', children: [{ text: '主站-大厅' }, { text: '主站-检测车间' }, { text: '主站-办公室' }, { text: '主站-仓库' }] },
  { text: '分站', children: [{ text: '分站-大厅' }, { text: '分站-检测车间' }, { text: '分站-办公室' }, { text: '分站-仓库' }] }
]

const typeColumns = ['领用', '归还', '报修', '报废']

function onCategoryConfirm({ selectedOptions }) {
  formData.category = selectedOptions.map(opt => opt.text).join(' / ')
  showCategoryPicker.value = false
}

function onLocationConfirm({ selectedOptions }) {
  formData.location = selectedOptions.map(opt => opt.text).join(' - ')
  showLocationPicker.value = false
}

function onTypeConfirm({ selectedOptions }) {
  formData.applyType = selectedOptions[0]?.text || selectedOptions[0]
  showTypePicker.value = false
}

function onSubmit() {
  submitting.value = true
  setTimeout(() => {
    submitting.value = false
    showSuccessToast('申请已提交，等待审批')
    setTimeout(() => router.push('/my-requests'), 1500)
  }, 1000)
}

import { useRouter } from 'vue-router'
</script>

<style scoped>
.apply-form { padding: 12px 0; }
</style>