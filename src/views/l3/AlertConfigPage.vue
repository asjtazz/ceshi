<template>
  <AppShell title="预警设置">
    <div class="page">
      <van-cell-group inset title="全局设置">
        <van-field label="预警开关">
          <template #input>
            <van-switch v-model="form.alertEnabled" />
          </template>
        </van-field>
        <van-field 
          v-model="form.alertMin" 
          label="库存预警阈值" 
          type="digit" 
          placeholder="请输入数量"
        />
        <van-field 
          v-model="form.inspectionWarningDays" 
          label="检定预警天数" 
          type="digit" 
          placeholder="请输入天数"
        />
      </van-cell-group>
      <div style="padding: 16px">
        <van-button type="primary" block round @click="onSave" :loading="saving">保存设置</van-button>
      </div>
      <van-cell-group inset title="当前预警资产" style="margin-top: 12px">
        <van-cell 
          v-for="item in alertAssets" 
          :key="item.id" 
          :title="item.name" 
          :label="'库存: ' + (item.quantity || 0) + ' / 预警线: ' + (item.alertMin || 0)"
        >
          <template #right-icon>
            <van-tag type="danger" size="small">低库存</van-tag>
          </template>
        </van-cell>
        <van-empty v-if="!alertAssets.length" description="暂无预警资产" />
      </van-cell-group>
    </div>
  </AppShell>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getAssets } from '@/api/assets'
import { getAlertSettings, saveAlertSettings } from '@/api/config'
import AppShell from '@/components/global/AppShell.vue'

const router = useRouter()
const alertAssets = ref([])
const saving = ref(false)

const form = ref({
  alertEnabled: true,
  alertMin: 5,
  inspectionWarningDays: 30
})

async function onSave() {
  try {
    saving.value = true
    await saveAlertSettings(form.value)
    showToast('保存成功')
    // 刷新预警资产列表
    await loadAlertAssets()
  } catch { 
    showToast('保存失败') 
  } finally {
    saving.value = false
  }
}

async function loadAlertAssets() {
  const assetsRes = await getAssets({ pageSize: 200 })
  alertAssets.value = (assetsRes.data?.list || []).filter(function(a) { 
    return a.alertEnabled && (a.quantity - a.inUseCount) <= a.alertMin 
  })
}

onMounted(async () => {
  const [assetsRes, settingsRes] = await Promise.all([
    getAssets({ pageSize: 200 }),
    getAlertSettings().catch(function() { return { data: null } })
  ])
  alertAssets.value = (assetsRes.data?.list || []).filter(function(a) { 
    return a.alertEnabled && (a.quantity - a.inUseCount) <= a.alertMin 
  })
  if (settingsRes.data) {
    form.value.alertEnabled = settingsRes.data.alertEnabled !== false
    form.value.alertMin = settingsRes.data.alertMin || 5
    form.value.inspectionWarningDays = settingsRes.data.inspectionWarningDays || 30
  }
})
</script>
<style scoped>
.page { padding: 16px; }
</style>
