import request from './request'

// 资产分类
export const getCategories = () => request.get('/config/categories')
export const createCategory = (data) => request.post('/config/categories', data)
export const updateCategory = (id, data) => request.put('/config/categories/' + id, data)
export const deleteCategory = (id) => request.delete('/config/categories/' + id)

// 存放地点
export const getLocations = () => request.get('/config/locations')
export const createLocation = (data) => request.post('/config/locations', data)
export const updateLocation = (id, data) => request.put('/config/locations/' + id, data)
export const deleteLocation = (id) => request.delete('/config/locations/' + id)

// 编码规则
export const getCodeRules = () => request.get('/config/code-rules')
export const saveCodeRules = (data) => request.post('/config/code-rules', data)

// 审批模板映射
export const getApprovalMapping = () => request.get('/config/approval-mapping')
export const saveApprovalMapping = (data) => request.post('/config/approval-mapping', data)

// 审计日志
export const getAuditLogs = (params) => request.get('/config/audit-logs', { params })

// 预警设置
export const getAlertSettings = () => request.get('/config/alert-settings')
export const saveAlertSettings = (data) => request.post('/config/alert-settings', data)

// 欠款权限
export const getDebtPermissions = () => request.get('/config/debt-permissions')
export const updateDebtPermissions = (userIds) => request.post('/config/debt-permissions', { userIds })

// 导出
const BASE_URL = import.meta.env.VITE_APP_BASE_API
const SERVER_BASE = BASE_URL.replace(/\/api\/?$/, '') // e.g., http://localhost:3002/api -> http://localhost:3002
export const exportAssets = () => window.open(SERVER_BASE + '/api/export/assets', '_blank')
export const exportAuditLogs = () => window.open(SERVER_BASE + '/api/export/audit-logs', '_blank')