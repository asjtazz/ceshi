<template>
  <div class="config-page">
    <van-nav-bar title="系统配置" left-arrow @click-left="$router.back()" />

    <van-cell-group inset style="margin: 16px">
      <van-cell title="🏷️ 资产分类管理" is-link to="/config/categories" />
      <van-cell title="📍 存放地点管理" is-link to="/config/locations" />
      <van-cell title="📋 审批流配置" is-link to="/config/approval-flow" />
      <van-cell title="👥 管理员设置" is-link to="/config/admins" />
    </van-cell-group>

    <div class="section-card">
      <div class="section-title">⚙️ 系统参数</div>
      <van-form @submit="saveSettings">
        <van-cell-group inset>
          <van-field v-model="settings.companyName" label="单位名称" placeholder="榕江恒鑫机动车检测站" />
          <van-field v-model="settings.codePrefix" label="资产编码前缀" placeholder="HX02" />
          <van-field v-model="settings.lowStockWarn" label="低库存预警线" type="digit" placeholder="5" />
        </van-cell-group>
        <div style="margin: 16px">
          <van-button round block type="primary" native-type="submit" size="small">保存设置</van-button>
        </div>
      </van-form>
    </div>

    <div class="section-card">
      <div class="section-title">📊 审计日志</div>
      <div class="log-item" v-for="log in logs" :key="log.id">
        <span class="log-time">{{ log.time }}</span>
        <span class="log-action">{{ log.action }}</span>
        <span class="log-user">{{ log.user }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { showSuccessToast } from 'vant'

const settings = ref({
  companyName: '榕江恒鑫机动车检测站',
  codePrefix: 'HX02',
  lowStockWarn: '5'
})

const logs = ref([
  { id: 1, time: '2026-05-11 10:23', action: '修改了资产分类', user: '艾培刚' },
  { id: 2, time: '2026-05-10 15:12', action: '新增管理员', user: '艾培刚' },
  { id: 3, time: '2026-05-09 09:45', action: '配置审批流', user: '艾培刚' }
])

function saveSettings() {
  showSuccessToast('系统设置已保存')
}
</script>

<style scoped>
.section-card { background: #fff; margin: 12px; border-radius: 12px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.section-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
.log-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f5f5f5; font-size: 12px; }
.log-item:last-child { border-bottom: none; }
.log-time { color: #969799; }
.log-action { color: #323233; flex: 1; margin: 0 8px; }
.log-user { color: #1989fa; }
</style>