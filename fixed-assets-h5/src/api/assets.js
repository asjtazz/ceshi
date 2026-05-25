import request from './request'

// 获取资产列表（分页、搜索、筛选）
export const getAssets = (params) => request.get('/assets', { params })

// 获取单个资产详情
export const getAsset = (id) => request.get(`/assets/${id}`)

// 获取资产操作历史
export const getAssetHistory = (id) => request.get(`/assets/${id}/history`)

// 新增资产（入库）
export const createAsset = (data) => request.post('/assets', data)

// 更新资产信息
export const updateAsset = (id, data) => request.put(`/assets/${id}`, data)

// 删除资产
export const deleteAsset = (id) => request.delete(`/assets/${id}`)

// 检测完成
export const completeInspection = (id, data) => request.put(`/assets/${id}/inspection-complete`, data)

// 锁定盘点
export const lockAsset = (id) => request.post(`/assets/${id}/lock`)

// 解锁盘点
export const unlockAsset = (id) => request.delete(`/assets/${id}/unlock`)

// 获取资产名称联想
export const getAssetSuggestions = (params) => request.get('/assets', { params: { ...params, pageSize: 10 } })