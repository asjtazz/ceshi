import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const isDingtalkEnv = () => {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('dingtalk')
}

const routes = [
  { 
    path: '/', 
    name: 'entry', 
    component: () => import(isDingtalkEnv() ? '@/views/DingtalkEntryPage.vue' : '@/views/EntryPage.vue') 
  },
  { 
    path: '/dingtalk', 
    name: 'dingtalk-entry', 
    component: () => import('@/views/DingtalkEntryPage.vue') 
  },

  // L1 员工端
  { path: '/l1/home', name: 'l1-home', component: () => import('@/views/l1/HomePage.vue'), meta: { role: 'L1' } },
  { path: '/l1/assets', name: 'l1-assets', component: () => import('@/views/l1/AssetsPage.vue'), meta: { role: 'L1' } },
  { path: '/l1/assets/:id', name: 'l1-asset-detail', component: () => import('@/views/l1/AssetDetailPage.vue'), meta: { role: 'L1' } },
  { path: '/l1/apply/:type', name: 'l1-apply', component: () => import('@/views/l1/ApplyPage.vue'), meta: { role: 'L1' } },
  { path: '/l1/my-applications', name: 'l1-my-apps', component: () => import('@/views/l1/MyApplicationsPage.vue'), meta: { role: 'L1' } },
  { path: '/l1/debts', name: 'l1-debts', component: () => import('@/views/debts/DebtListPage.vue'), meta: { role: 'L1' } },
  { path: '/l1/debts/:id', name: 'l1-debt-detail', component: () => import('@/views/debts/DebtDetailPage.vue'), meta: { role: 'L1' } },

  // L2 资产管理员端
  { path: '/l2/home', name: 'l2-home', component: () => import('@/views/l2/HomePage.vue'), meta: { role: 'L2' } },
  { path: '/l2/assets', name: 'l2-assets', component: () => import('@/views/l2/AssetsPage.vue'), meta: { role: 'L2' } },
  { path: '/l2/assets/register', name: 'l2-register', component: () => import('@/views/l2/AssetRegisterPage.vue'), meta: { role: 'L2' } },
  { path: '/l2/assets/:id', name: 'l2-asset-detail', component: () => import('@/views/l2/AssetDetailPage.vue'), meta: { role: 'L2' } },
  { path: '/l2/inventory', name: 'l2-inventory', component: () => import('@/views/l2/InventoryPage.vue'), meta: { role: 'L2' } },
  { path: '/l2/inventory/:id', name: 'l2-inventory-detail', component: () => import('@/views/l2/InventoryDetailPage.vue'), meta: { role: 'L2' } },
  { path: '/l2/approvals', name: 'l2-approvals', component: () => import('@/views/l2/ApprovalsPage.vue'), meta: { role: 'L2' } },
  { path: '/l2/alerts', name: 'l2-alerts', component: () => import('@/views/l3/AlertsPage.vue'), meta: { role: 'L2' } },
  { path: '/l2/workbench', name: 'l2-workbench', component: () => import('@/views/l2/WorkbenchPage.vue'), meta: { role: 'L2' } },
  { path: '/l2/profile', name: 'l2-profile', component: () => import('@/views/l3/ProfilePage.vue'), meta: { role: 'L2' } },

  // L2 欠款管理
  { path: '/l2/debts', name: 'l2-debts', component: () => import('@/views/debts/DebtListPage.vue'), meta: { role: 'L2' } },
  { path: '/l2/debts/:id', name: 'l2-debt-detail', component: () => import('@/views/debts/DebtDetailPage.vue'), meta: { role: 'L2' } },

  // L3 欠款管理
  { path: '/l3/debts', name: 'l3-debts', component: () => import('@/views/debts/DebtListPage.vue'), meta: { role: 'L3' } },
  { path: '/l3/debts/:id', name: 'l3-debt-detail', component: () => import('@/views/debts/DebtDetailPage.vue'), meta: { role: 'L3' } },

  // L3 超管端
  { path: '/l3/home', name: 'l3-home', component: () => import('@/views/l3/HomePage.vue'), meta: { role: 'L3' } },
  { path: '/l3/settings/categories', name: 'l3-categories', component: () => import('@/views/l3/CategoriesPage.vue'), meta: { role: 'L3' } },
  { path: '/l3/settings/locations', name: 'l3-locations', component: () => import('@/views/l3/LocationsPage.vue'), meta: { role: 'L3' } },
  { path: '/l3/settings/approval-flows', name: 'l3-approval-flows', component: () => import('@/views/l3/ApprovalFlowsPage.vue'), meta: { role: 'L3' } },
  { path: '/l3/settings/code-rules', name: 'l3-code-rules', component: () => import('@/views/l3/CodeRulesPage.vue'), meta: { role: 'L3' } },
  { path: '/l3/settings/import-assets', name: 'l3-import-assets', component: () => import('@/views/l3/ImportAssetsPage.vue'), meta: { role: 'L3' } },
  { path: '/l3/audit-log', name: 'l3-audit-log', component: () => import('@/views/l3/AuditLogPage.vue'), meta: { role: 'L3' } },
  { path: '/l3/approvals', name: 'l3-approvals', component: () => import('@/views/l2/ApprovalsPage.vue'), meta: { role: 'L3' } },
  { path: '/l3/alerts', name: 'l3-alerts', component: () => import('@/views/l3/AlertsPage.vue'), meta: { role: 'L3' } },
  { path: '/l3/profile', name: 'l3-profile', component: () => import('@/views/l3/ProfilePage.vue'), meta: { role: 'L3' } },
  { path: '/l3/assets', name: 'l3-assets', component: () => import('@/views/l2/AssetsPage.vue'), meta: { role: 'L3' } },
    { path: '/l3/asset-detail/:id', name: 'l3-asset-detail', component: () => import('@/views/l2/AssetDetailPage.vue'), meta: { role: 'L3' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：已登录跳转对应首页，未登录跳登录页
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (!to.meta.role) { next(); return }
  if (!authStore.isLoggedIn) { next('/'); return }
  const role = authStore.role
  // L3 超管可以访问 L2 的资产详情和列表页面
  if (role === 'L3' && (to.path.includes('/l2/assets') || to.path.includes('/l2/approvals'))) {
    next()
    return
  }
  if (role !== to.meta.role) { next(`/${role.toLowerCase()}/home`); return }
  next()
})

export default router
