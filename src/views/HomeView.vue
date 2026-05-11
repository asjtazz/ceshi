<template>
  <div class="home-page">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="welcome-text">
        <h3>👋 你好，{{ userStore.userName }}</h3>
        <p>{{ userStore.deptName }}</p>
      </div>
    </div>

    <!-- L1 员工首页：业务入口卡片 -->
    <div class="quick-actions" v-if="userStore.isL1">
      <div class="action-grid">
        <div class="action-card" @click="goRoute('/apply')">
          <div class="action-icon" style="background:#e8f4fd"><span style="font-size:28px">📋</span></div>
          <span>资产领用</span>
        </div>
        <div class="action-card" @click="goRoute('/apply?type=return')">
          <div class="action-icon" style="background:#fef3e2"><span style="font-size:28px">🔄</span></div>
          <span>资产归还</span>
        </div>
        <div class="action-card" @click="goRoute('/apply?type=repair')">
          <div class="action-icon" style="background:#fde8e8"><span style="font-size:28px">🔧</span></div>
          <span>报修申请</span>
        </div>
        <div class="action-card" @click="goRoute('/apply?type=scrap')">
          <div class="action-icon" style="background:#f0e6ff"><span style="font-size:28px">🗑️</span></div>
          <span>报废申请</span>
        </div>
      </div>

      <!-- 我的申请记录 -->
      <div class="section-card" @click="goRoute('/my-requests')">
        <div class="section-header">
          <span>📄 我的申请记录</span>
          <van-icon name="arrow" />
        </div>
        <div class="request-summary">
          <div class="summary-item">
            <span class="num">3</span>
            <span class="label">待审批</span>
          </div>
          <div class="summary-item">
            <span class="num">5</span>
            <span class="label">已通过</span>
          </div>
          <div class="summary-item">
            <span class="num">1</span>
            <span class="label">已拒绝</span>
          </div>
        </div>
      </div>
    </div>

    <!-- L2/L3 管理员首页：看板 -->
    <div class="admin-dashboard" v-if="userStore.isAdmin">
      <div class="kpi-row">
        <div class="kpi-card">
          <span class="kpi-value">156</span>
          <span class="kpi-label">资产总数</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-value">128</span>
          <span class="kpi-label">在用资产</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-value">12</span>
          <span class="kpi-label">待审批</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-value">6</span>
          <span class="kpi-label">低库存</span>
        </div>
      </div>

      <!-- 快捷入口 -->
      <div class="quick-links">
        <van-grid :column-num="4" :border="false">
          <van-grid-item icon="records-o" text="资产台账" @click="goRoute('/admin/assets')" />
          <van-grid-item icon="balance-list-o" text="审批管理" @click="goRoute('/admin/approvals')" />
          <van-grid-item icon="orders-o" text="盘点管理" @click="goRoute('/admin/inventory')" />
          <van-grid-item icon="setting-o" text="系统配置" @click="goRoute('/config')" v-if="userStore.isL3" />
        </van-grid>
      </div>
    </div>

    <div class="footer-version">榕江恒鑫 · 固定资产管理系统 v8.0</div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

function goRoute(path) {
  router.push(path)
}
</script>

<style scoped>
.home-page { padding-bottom: 20px; }
.welcome-banner { background: linear-gradient(135deg, #1989fa, #07c160); padding: 20px 16px; color: #fff; }
.welcome-text h3 { font-size: 18px; margin-bottom: 4px; }
.welcome-text p { font-size: 12px; opacity: 0.8; }
.action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 16px; }
.action-card { background: #fff; border-radius: 12px; padding: 20px 12px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.06); cursor: pointer; }
.action-card .action-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; }
.action-card span { font-size: 14px; color: #323233; font-weight: 500; }
.section-card { background: #fff; margin: 0 16px 12px; border-radius: 12px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); cursor: pointer; }
.section-header { display: flex; justify-content: space-between; align-items: center; font-size: 15px; font-weight: 500; margin-bottom: 12px; }
.request-summary { display: flex; justify-content: space-around; }
.summary-item { text-align: center; }
.summary-item .num { display: block; font-size: 24px; font-weight: 600; color: #1989fa; }
.summary-item .label { font-size: 12px; color: #969799; }
.kpi-row { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; padding: 16px; }
.kpi-card { background: #fff; border-radius: 10px; padding: 14px 8px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.kpi-value { display: block; font-size: 22px; font-weight: 700; color: #323233; }
.kpi-label { font-size: 11px; color: #969799; margin-top: 4px; }
.quick-links { margin: 0 16px; background: #fff; border-radius: 12px; padding: 8px 0; }
.footer-version { text-align: center; padding: 20px; font-size: 11px; color: #c8c9cc; }
</style>