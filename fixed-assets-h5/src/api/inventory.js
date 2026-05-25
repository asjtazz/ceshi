import request from './request'

// 获取盘点任务列表
export const getActiveTasks = () => request.get('/inventory/tasks')

// 获取盘点任务详情
export const getTask = (id) => request.get(`/inventory/tasks/${id}`)

// 创建盘点任务
export const createTask = (data) => request.post('/inventory/tasks', data)

// 扫码/标记盘点
export const scanAsset = (taskId, data) => request.post(`/inventory/tasks/${taskId}/scan`, data)

// 更新实盘数量
export const updateAssetQty = (taskId, data) => request.put(`/inventory/tasks/${taskId}/asset`, data)

// 完成盘点
export const completeTask = (id) => request.post(`/inventory/tasks/${id}/complete`)

// 取消盘点
export const cancelTask = (id) => request.post(`/inventory/tasks/${id}/cancel`)

// 盘亏转报损
export const deficitToLoss = (data) => request.post('/inventory/deficit-to-loss', data)

// 盘盈入库
export const surplusToAsset = (data) => request.post('/inventory/surplus-to-asset', data)
