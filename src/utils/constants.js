// 资产状态
export const ASSET_STATUS = {
  IN_USE: { label: '在用', color: 'success' },
  IDLE: { label: '闲置', color: 'default' },
  MAINTENANCE: { label: '维修中', color: 'warning' },
  INSPECTION: { label: '检测中', color: 'warning' },
  SCRAPPED: { label: '已报废', color: 'danger' },
}

// 申请类型
export const APPLICATION_TYPES = [
  { label: '领用', value: 'receive' },
  { label: '归还', value: 'return' },
  { label: '报修', value: 'repair' },
  { label: '报废', value: 'scrap' },
  { label: '调拨', value: 'transfer' },
  { label: '报损', value: 'loss' },
]

// 申请状态
export const APPLICATION_STATUS = {
  PENDING: { label: '待审批', color: 'warning' },
  APPROVED: { label: '已通过', color: 'success' },
  REJECTED: { label: '已拒绝', color: 'danger' },
}

// 申请理由
export const RECEIVE_REASONS = [
  { label: '业务需求', value: '业务需求' },
  { label: '设备损坏', value: '设备损坏' },
  { label: '新增需求', value: '新增需求' },
  { label: '设备更换', value: '设备更换' },
  { label: '其他', value: '其他' },
]

export const SCRAP_REASONS = [
  { label: '毁坏无法修复', value: '毁坏无法修复' },
  { label: '年限已到', value: '年限已到' },
  { label: '技术淘汰', value: '技术淘汰' },
  { label: '其他', value: '其他' },
]

// 检测周期
export const INSPECTION_CYCLES = [
  { label: '每30天', value: 30 },
  { label: '每90天', value: 90 },
  { label: '每180天', value: 180 },
  { label: '每365天', value: 365 },
  { label: '不需检定', value: 0 },
]

// 单位
export const ASSET_UNITS = ['件', '台', '套', '个', '箱', '瓶', '包', '把', '米', '张', '卷']

// 库存预警阈值
export const STOCK_ALERT_THRESHOLD = 5
