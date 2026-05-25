<template>
  <van-button size="small" plain type="primary" @click="doExport">{{ text || '导出' }}</van-button>
</template>

<script setup>
import { showToast } from 'vant'
const props = defineProps({ url: String, text: { type: String, default: '导出' } })

function doExport() {
  if (!props.url) return showToast('导出地址未配置')
  window.open(props.url, '_blank')
  showToast('已开始导出')
}
</script>
