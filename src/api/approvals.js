import request from './request'

// 我的申请列表
export const getMyApplications = (params) => request.get('/applications/mine', { params })

// 申请详情（含审批记录）
export const getApplicationDetail = (id) => request.get(`/applications/${id}/detail`)

// 创建申请
export const createApplication = (data) => request.post('/applications', data)

// 审批通过
export const approveApplication = (id, data) => request.put(`/applications/${id}/approve`, data)

// 审批拒绝
export const rejectApplication = (id, data) => request.put(`/applications/${id}/reject`, data)

// 待审批数量
export const getPendingCount = () => request.get('/approvals/pending-count')

// 待审批列表（含已处理）
export const getPendingList = () => request.get('/approvals/pending-list')

// 我提交的申请待审批数量
export const getMyPendingCount = () => request.get('/applications/pending-count')
