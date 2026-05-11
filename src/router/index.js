import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  // L1 员工路由
  {
    path: '/',
    name: 'Home',
    meta: { roles: ['L1', 'L2', 'L3'] },
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/apply',
    name: 'Apply',
    meta: { roles: ['L1'], title: '资产申请' },
    component: () => import('@/views/ApplyView.vue')
  },
  {
    path: '/my-requests',
    name: 'MyRequests',
    meta: { roles: ['L1'], title: '我的申请' },
    component: () => import('@/views/MyRequestsView.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    meta: { roles: ['L1', 'L2', 'L3'], title: '个人中心' },
    component: () => import('@/views/ProfileView.vue')
  },

  // L2 管理员路由
  {
    path: '/admin',
    name: 'AdminDashboard',
    meta: { roles: ['L2', 'L3'], title: '管理看板' },
    component: () => import('@/views/admin/DashboardView.vue')
  },
  {
    path: '/admin/assets',
    name: 'AssetList',
    meta: { roles: ['L2', 'L3'], title: '资产台账' },
    component: () => import('@/views/admin/AssetListView.vue')
  },
  {
    path: '/admin/approvals',
    name: 'ApprovalList',
    meta: { roles: ['L2', 'L3'], title: '审批管理' },
    component: () => import('@/views/admin/ApprovalListView.vue')
  },
  {
    path: '/admin/inventory',
    name: 'Inventory',
    meta: { roles: ['L2', 'L3'], title: '盘点管理' },
    component: () => import('@/views/admin/InventoryView.vue')
  },

  // L3 超管路由
  {
    path: '/config',
    name: 'SystemConfig',
    meta: { roles: ['L3'], title: '系统配置' },
    component: () => import('@/views/config/ConfigView.vue')
  },
  {
    path: '/config/categories',
    name: 'CategoryConfig',
    meta: { roles: ['L3'], title: '分类管理' },
    component: () => import('@/views/config/CategoryConfig.vue')
  },
  {
    path: '/config/locations',
    name: 'LocationConfig',
    meta: { roles: ['L3'], title: '地点管理' },
    component: () => import('@/views/config/LocationConfig.vue')
  },
  {
    path: '/config/approval-flow',
    name: 'ApprovalFlowConfig',
    meta: { roles: ['L3'], title: '审批流配置' },
    component: () => import('@/views/config/ApprovalFlowConfig.vue')
  },
  {
    path: '/config/admins',
    name: 'AdminConfig',
    meta: { roles: ['L3'], title: '管理员设置' },
    component: () => import('@/views/config/AdminConfig.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const { roles } = to.meta
  if (roles && !roles.includes(userStore.role)) {
    next('/')
  } else {
    next()
  }
})

export default router