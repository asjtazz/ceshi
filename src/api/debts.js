import request from './request'

// 获取欠款列表
export const getDebts = (params) => request.get('/debts', { params })
export const getDebtDetail = (id) => request.get('/debts/' + id)
export const createDebt = (data) => request.post('/debts', data)
export const updateDebt = (id, data) => request.put('/debts/' + id, data)
export const repayDebt = (id, data) => request.post('/debts/' + id + '/repay', data)
export const deleteDebt = (id) => request.delete('/debts/' + id)

// 欠款管理权限
export const checkDebtAccess = (userId) => request.get('/users/check-debt-access', { params: { userId } })
export const getDebtPermissions = () => request.get('/config/debt-permissions')
export const saveDebtPermissions = (data) => request.post('/config/debt-permissions', data)
