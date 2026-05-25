import request from './request'

// 驾驶舱统一接口（L2/L3 共用）
export const getDashboard = () => request.get('/l3/dashboard')

// L2 驾驶舱概览
export const getOverview = () => request.get('/l3/dashboard')
