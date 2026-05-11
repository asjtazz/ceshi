<template>
  <div class="dashboard-page">
    <van-nav-bar title="管理看板" left-arrow @click-left="$router.back()" />

    <!-- KPI 卡片 -->
    <div class="kpi-grid">
      <div class="kpi-card blue">
        <span class="kpi-num">156</span>
        <span class="kpi-label">资产总数</span>
      </div>
      <div class="kpi-card green">
        <span class="kpi-num">128</span>
        <span class="kpi-label">在用资产</span>
      </div>
      <div class="kpi-card orange">
        <span class="kpi-num">12</span>
        <span class="kpi-label">待审批</span>
      </div>
      <div class="kpi-card red">
        <span class="kpi-num">6</span>
        <span class="kpi-label">低库存</span>
      </div>
    </div>

    <!-- 库存预警 -->
    <div class="section-card">
      <div class="section-title">⚠️ 库存预警</div>
      <div class="warning-list">
        <div class="warning-item" v-for="item in lowStockItems" :key="item.name">
          <span class="warn-name">{{ item.name }}</span>
          <span class="warn-count" :class="{ danger: item.count <= 2 }">剩余 {{ item.count }}</span>
        </div>
      </div>
    </div>

    <!-- 到期提醒 -->
    <div class="section-card">
      <div class="section-title">📅 检测设备到期提醒</div>
      <div class="expiry-list">
        <div class="expiry-item" v-for="item in expiryItems" :key="item.name">
          <span class="expiry-name">{{ item.name }}</span>
          <span class="expiry-date" :class="{ urgent: item.days <= 7 }">{{ item.date }}（{{ item.days }}天后）</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const lowStockItems = ref([
  { name: 'A4 打印纸', count: 2 },
  { name: 'HP 硒鼓', count: 1 },
  { name: '鼠标垫', count: 3 }
])

const expiryItems = ref([
  { name: '制动检测台', date: '2026-06-15', days: 35 },
  { name: '尾气分析仪', date: '2026-05-20', days: 9 },
  { name: '灯光检测仪', date: '2026-05-25', days: 14 }
])
</script>

<style scoped>
.dashboard-page { padding-bottom: 20px; }
.kpi-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; padding: 12px; }
.kpi-card { border-radius: 12px; padding: 16px 8px; text-align: center; color: #fff; }
.kpi-card.blue { background: linear-gradient(135deg, #1989fa, #3d9bf5); }
.kpi-card.green { background: linear-gradient(135deg, #07c160, #34d37a); }
.kpi-card.orange { background: linear-gradient(135deg, #ff976a, #ffb38a); }
.kpi-card.red { background: linear-gradient(135deg, #ee0a24, #f53d52); }
.kpi-num { display: block; font-size: 24px; font-weight: 700; }
.kpi-label { font-size: 11px; opacity: 0.9; margin-top: 4px; }
.section-card { background: #fff; margin: 0 12px 12px; border-radius: 12px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.section-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
.warning-item, .expiry-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f5f5f5; font-size: 14px; }
.warning-item:last-child, .expiry-item:last-child { border-bottom: none; }
.warn-count { color: #ff976a; font-weight: 500; }
.warn-count.danger { color: #ee0a24; font-weight: 700; }
.expiry-date { color: #1989fa; }
.expiry-date.urgent { color: #ee0a24; font-weight: 700; }
</style>