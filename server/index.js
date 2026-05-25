import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
app.use(cors())
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }))

// 确保上传目录存在
const uploadDir = join(__dirname, 'uploads')
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir)
}

const PORT = 3002

function delay(ms) { 
  const delayMs = ms || 80
  return new Promise(function(r) { setTimeout(r, delayMs) }) 
}

function respond(res, data, msg) { 
  res.json({ code: 0, message: msg || 'success', data: data }) 
}

function respondList(res, list, total) { 
  res.json({ code: 0, message: 'success', data: { list: list, total: total || list.length } }) 
}

function statusLabel(s) { 
  return { IDLE:'空闲', IN_USE:'在用', MAINTENANCE:'维修中', INSPECTION:'检测中', SCRAPPED:'已报废' }[s] || s 
}

function typeLabel(t) { 
  return { receive:'领用', return:'归还', repair:'报修', scrap:'报废', loss:'报损', transfer:'调拨' }[t] || t 
}

function makeAuditLog(action, target, operator, detail) { 
  return { 
    id: 'LOG' + String(Date.now()).slice(-8), 
    action: action, 
    target: target, 
    operator: operator || 'system', 
    detail: detail || '', 
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-') 
  } 
}

function enrichAsset(a, cats, locs) {
  if (!a) return a
  const asset = { ...a }
  const cat = cats.find(function(c) { return c.id === a.categoryId })
  if (cat) { asset.categoryName = cat.name }
  const loc = locs.find(function(l) { return l.id === a.locationId })
  if (loc) { asset.locationName = loc.name }
  return asset
}

// 判断是否是低值易耗品
function isLowValueConsumable(categoryId, categoryName) {
  return categoryName?.includes('易耗品') || 
         categoryId?.startsWith('ZC07') || 
         categoryId?.startsWith('A')
}

const categories = [
  { id:'ZC01', name:'房屋及建筑物', parentId:null },
  { id:'ZC02', name:'机器设备', parentId:null },
  { id:'ZC021', name:'检测设备', parentId:'ZC02' },
  { id:'ZC022', name:'专用设备', parentId:'ZC02' },
  { id:'ZC03', name:'电子设备', parentId:null },
  { id:'ZC031', name:'办公设备', parentId:'ZC03' },
  { id:'ZC032', name:'网络设备', parentId:'ZC03' },
  { id:'ZC033', name:'电器设备', parentId:'ZC03' },
  { id:'ZC034', name:'电脑设备', parentId:'ZC03' },
  { id:'ZC04', name:'运输工具', parentId:null },
  { id:'ZC05', name:'办公家具', parentId:null },
  { id:'ZC051', name:'办公家具', parentId:'ZC05' },
  { id:'ZC052', name:'厨房用品', parentId:'ZC05' },
  { id:'ZC06', name:'其他设备', parentId:null },
  { id:'ZC07', name:'低值易耗品', parentId:null },
  { id:'ZC071', name:'办公用品', parentId:'ZC07' },
  { id:'ZC072', name:'生产用品', parentId:'ZC07' },
  { id:'ZC073', name:'生活用品', parentId:'ZC07' },
  { id:'ZC074', name:'调修工具', parentId:'ZC07' },
  { id:'ZC075', name:'其他用品', parentId:'ZC07' },
  { id:'ZC076', name:'其他易耗品', parentId:'ZC07' },
  { id:'A', name:'办公用品类', parentId:null },
  { id:'ZC077', name:'打印耗材类', parentId:'ZC07' },
  { id:'ZC0771', name:'A4打印纸', parentId:'ZC077' },
  { id:'ZC0772', name:'激光打印机硒鼓', parentId:'ZC077' },
  { id:'A02', name:'日常办公用品', parentId:'A' },
  { id:'A04', name:'其他办公用品', parentId:'A' },
  { id:'ZC078', name:'清洁用品', parentId:'ZC07' },
  { id:'ZC079', name:'劳保消防', parentId:'ZC07' }
]

const locations = [
  { id:'HX01', name:'恒鑫站', parentId:null },
  { id:'HX0101', name:'办公室', parentId:'HX01' },
  { id:'HX010101', name:'总经理办公室', parentId:'HX0101' },
  { id:'HX010102', name:'财务室', parentId:'HX0101' },
  { id:'HX010103', name:'行政办公室', parentId:'HX0101' },
  { id:'HX0102', name:'库房', parentId:'HX01' },
  { id:'HX010201', name:'主库房', parentId:'HX0102' },
  { id:'HX010202', name:'备件库', parentId:'HX0102' },
  { id:'HX0103', name:'大厅', parentId:'HX01' },
  { id:'HX0104', name:'外检', parentId:'HX01' },
  { id:'HX0105', name:'环保车间', parentId:'HX01' },
  { id:'HX0106', name:'安检车间', parentId:'HX01' },
  { id:'HX0107', name:'保安室', parentId:'HX01' },
  { id:'HX0108', name:'配电室', parentId:'HX01' },
  { id:'HX0109', name:'气泵房', parentId:'HX01' },
  { id:'HX0110', name:'厨房', parentId:'HX01' },
  { id:'HX0111', name:'寝室', parentId:'HX01' },
  { id:'HX0113', name:'公共区域', parentId:'HX01' },
  { id:'TR01', name:'天锐站', parentId:null },
  { id:'TR0101', name:'办公楼一楼大厅', parentId:'TR01' },
  { id:'TR0103', name:'楼梯间', parentId:'TR01' },
  { id:'TR0104', name:'二楼库房', parentId:'TR01' },
  { id:'TR0105', name:'档案室', parentId:'TR01' },
  { id:'TR0106', name:'三楼总经理室', parentId:'TR01' },
  { id:'TR0107', name:'财务室', parentId:'TR01' },
  { id:'TR0108', name:'办公室', parentId:'TR01' },
  { id:'TR0110', name:'寝室', parentId:'TR01' },
  { id:'TR0113', name:'寝室', parentId:'TR01' },
  { id:'TR0114', name:'寝室', parentId:'TR01' },
  { id:'TR0115', name:'业务大厅', parentId:'TR01' },
  { id:'TR0116', name:'外检区', parentId:'TR01' },
  { id:'TR0119', name:'环保车间', parentId:'TR01' },
  { id:'TR0120', name:'安检车间', parentId:'TR01' },
  { id:'TR0121', name:'摩检车间', parentId:'TR01' },
  { id:'TR0122', name:'保安室', parentId:'TR01' },
  { id:'TR0125', name:'调修棚', parentId:'TR01' },
  { id:'TR0126', name:'厨房', parentId:'TR01' }
]

const users = [
  { id:'u001', name:'张三', role:'L1', dept:'办公室' },
  { id:'u002', name:'李四', role:'L1', dept:'外检' },
  { id:'u003', name:'王五', role:'L1', dept:'环保车间' },
  { id:'u004', name:'赵六', role:'L2', dept:'安检车间' },
  { id:'u005', name:'管理员', role:'L2', dept:'管理部' },
  { id:'u006', name:'系统管理员', role:'L3', dept:'系统管理' }
]

let globalSeq = 11 // 需要修改的话保持 let

const assets = [
  { id:'1', code:'HX0101-ZC031-000001', name:'戴尔显示器 27寸', model:'U2720Q', categoryId:'ZC031', categoryName:'办公设备', locationId:'HX0101', locationName:'办公室', status:'IN_USE', custodian:'u001', custodianName:'张三', quantity:2, inUseCount:1, pendingQuantity:0, unit:'台', price:3500, purchaseDate:'2024-01-15', inspectionCycle:365, nextInspectionDate:'2025-01-20', alertEnabled:false, alertMin:0, images:[], created_at:'2024-01-15', updated_at:'2024-01-20' },
  { id:'2', code:'HX0101-ZC034-000001', name:'ThinkPad T490 笔记本', model:'20N1', categoryId:'ZC034', categoryName:'电脑设备', locationId:'HX0101', locationName:'办公室', status:'IDLE', custodian:'', custodianName:'', quantity:1, inUseCount:0, pendingQuantity:0, unit:'台', price:8500, purchaseDate:'2023-11-10', inspectionCycle:0, nextInspectionDate:'', alertEnabled:false, alertMin:0, images:[], created_at:'2023-11-10', updated_at:'' },
  { id:'3', code:'TR0119-ZC021-000001', name:'汽车尾气分析仪', model:'NHA-509', categoryId:'ZC021', categoryName:'检测设备', locationId:'TR0119', locationName:'环保车间', status:'IN_USE', custodian:'u003', custodianName:'王五', quantity:1, inUseCount:1, pendingQuantity:0, unit:'台', price:28000, purchaseDate:'2022-06-01', inspectionCycle:180, nextInspectionDate:'2025-05-15', alertEnabled:false, alertMin:0, images:[], created_at:'2022-06-01', updated_at:'2025-04-20' },
  { id:'4', code:'HX0103-ZC031-000002', name:'打印机 HP LaserJet', model:'Pro MFP M429', categoryId:'ZC031', categoryName:'办公设备', locationId:'HX0103', locationName:'大厅', status:'MAINTENANCE', custodian:'u001', custodianName:'张三', quantity:1, inUseCount:1, pendingQuantity:0, unit:'台', price:4200, purchaseDate:'2023-03-20', inspectionCycle:0, nextInspectionDate:'', alertEnabled:false, alertMin:0, images:[], created_at:'2023-03-20', updated_at:'2025-05-10' },
  { id:'5', code:'HX0101-ZC031-000003', name:'罗技键鼠套装', model:'MK540', categoryId:'ZC031', categoryName:'办公设备', locationId:'HX0101', locationName:'办公室', status:'IN_USE', custodian:'u002', custodianName:'李四', quantity:3, inUseCount:1, pendingQuantity:0, unit:'套', price:280, purchaseDate:'2024-03-05', inspectionCycle:0, nextInspectionDate:'', alertEnabled:false, alertMin:0, images:[], created_at:'2024-03-05', updated_at:'2024-03-08' },
  { id:'c1', code:'HX0101-ZC0771-000001', name:'A4复印纸 500张/箱', model:'幸运鸟', categoryId:'ZC0771', categoryName:'A4打印纸', locationId:'HX0101', locationName:'办公室', status:'IN_USE', custodian:'u001', custodianName:'张三', quantity:28, inUseCount:5, pendingQuantity:0, unit:'箱', price:45, purchaseDate:'2025-01-05', inspectionCycle:0, nextInspectionDate:'', alertEnabled:true, alertMin:10, images:[], created_at:'2025-01-05', updated_at:'2025-01-05' },
  { id:'c2', code:'TR0119-ZC0772-000001', name:'HP 硒鼓 CF228A', model:'CF228A', categoryId:'ZC0772', categoryName:'激光打印机硒鼓', locationId:'TR0119', locationName:'环保车间', status:'IN_USE', custodian:'u003', custodianName:'王五', quantity:12, inUseCount:2, pendingQuantity:0, unit:'个', price:380, purchaseDate:'2025-02-10', inspectionCycle:0, nextInspectionDate:'', alertEnabled:true, alertMin:5, images:[], created_at:'2025-02-10', updated_at:'2025-02-10' },
  { id:'c3', code:'HX0103-ZC0772-000002', name:'HP 硒鼓 CE278A', model:'CE278A', categoryId:'ZC0772', categoryName:'激光打印机硒鼓', locationId:'HX0103', locationName:'大厅', status:'IN_USE', custodian:'u001', custodianName:'张三', quantity:7, inUseCount:1, pendingQuantity:0, unit:'个', price:320, purchaseDate:'2025-03-01', inspectionCycle:0, nextInspectionDate:'', alertEnabled:true, alertMin:8, images:[], created_at:'2025-03-01', updated_at:'2025-03-01' },
  { id:'c4', code:'TR0120-ZC078-000001', name:'84消毒液 500ml', model:'白猫', categoryId:'ZC078', categoryName:'清洁用品', locationId:'TR0120', locationName:'安检车间', status:'IN_USE', custodian:'u003', custodianName:'王五', quantity:42, inUseCount:3, pendingQuantity:0, unit:'瓶', price:12, purchaseDate:'2025-03-15', inspectionCycle:0, nextInspectionDate:'', alertEnabled:false, alertMin:0, images:[], created_at:'2025-03-15', updated_at:'2025-03-15' },
  { id:'c5', code:'HX0102-ZC079-000001', name:'防护手套 10只/包', model:'3M', categoryId:'ZC079', categoryName:'劳保消防', locationId:'HX0102', locationName:'库房', status:'IDLE', custodian:'u002', custodianName:'李四', quantity:15, inUseCount:5, pendingQuantity:0, unit:'包', price:25, purchaseDate:'2025-04-01', inspectionCycle:0, nextInspectionDate:'', alertEnabled:true, alertMin:20, images:[], created_at:'2025-04-01', updated_at:'2025-04-01' }
]

const applications = [
  { id:'APP001', type:'receive', assetId:'1', assetName:'戴尔显示器 27寸', assetCode:'HX0101-ZC031-000001', applicantId:'u001', applicantName:'张三', reason:'业务需求', quantity:1, status:'PENDING', approverId:'', handledAt:'', createdAt:'2025-05-10 09:30', images:[], suggestScrap:false, problem:'' },
  { id:'APP002', type:'return', assetId:'2', assetName:'ThinkPad T490 笔记本', assetCode:'HX0101-ZC034-000001', applicantId:'u002', applicantName:'李四', reason:'归还资产', quantity:1, status:'PENDING', approverId:'', handledAt:'', createdAt:'2025-05-11 14:00', images:[], suggestScrap:true, problem:'屏幕有划痕' },
  { id:'APP003', type:'scrap', assetId:'4', assetName:'打印机 HP LaserJet', assetCode:'HX0103-ZC031-000002', applicantId:'u001', applicantName:'张三', reason:'损坏无法修复', quantity:1, status:'PENDING', approverId:'', handledAt:'', createdAt:'2025-05-12 16:00', images:[], suggestScrap:false, problem:'卡纸严重' },
  { id:'APP004', type:'receive', assetId:'c1', assetName:'A4复印纸 500张/箱', assetCode:'HX0101-ZC0771-000001', applicantId:'u003', applicantName:'王五', reason:'新增需求', quantity:3, status:'APPROVED', approverId:'u004', handledAt:'2025-05-09 10:00', createdAt:'2025-05-08 09:00', images:[], suggestScrap:false, problem:'' },
  { id:'APP005', type:'repair', assetId:'3', assetName:'汽车尾气分析仪', assetCode:'TR0119-ZC021-000001', applicantId:'u003', applicantName:'王五', reason:'设备损坏', quantity:1, status:'APPROVED', approverId:'u004', handledAt:'2025-05-07 15:30', createdAt:'2025-05-06 11:00', images:[], suggestScrap:false, problem:'显示屏异常' },
  { id:'APP006', type:'receive', assetId:'5', assetName:'罗技键鼠套装', assetCode:'HX0101-ZC031-000003', applicantId:'u001', applicantName:'张三', reason:'设备更换', quantity:1, status:'REJECTED', approverId:'u004', handledAt:'2025-05-05 09:00', createdAt:'2025-05-04 14:00', images:[], suggestScrap:false, problem:'' }
]

const approvalMapping = [
  { id:'M001', type:'receive', label:'领用审批', approverId:'u004', approverName:'赵六', steps:[{ approverId:'u004' }] },
  { id:'M002', type:'return', label:'归还审批', approverId:'u004', approverName:'赵六', steps:[{ approverId:'u004' }] },
  { id:'M003', type:'repair', label:'报修审批', approverId:'u004', approverName:'赵六', steps:[{ approverId:'u004' }] },
  { id:'M004', type:'scrap', label:'报废审批', approverId:'u005', approverName:'管理员', steps:[{ approverId:'u005' }] },
  { id:'M005', type:'loss', label:'报损审批', approverId:'u005', approverName:'管理员', steps:[{ approverId:'u005' }] },
  { id:'M006', type:'transfer', label:'调拨审批', approverId:'u004', approverName:'赵六', steps:[{ approverId:'u004' }] }
]

const codeRules = [
  { id:'CR001', name:'固定资产编码规则', pattern:'{LOC}-{CAT}-{SEQ}', description:'存放地点代码-分类代码-4位流水号', enabled:true },
  { id:'CR002', name:'耗材编码规则', pattern:'{LOC}-{CAT}-{SEQ}', description:'存放地点代码-分类代码-4位流水号', enabled:true },
  { id:'CR003', name:'资产编码规则', pattern:'{CAT}-{SEQ}', description:'分类代码-6位流水号', enabled:false }
]

const auditLogs = [
  { id:'LOG00001', action:'CREATE', target:'资产:1', operator:'u004', detail:'新增资产：戴尔显示器 27寸', createdAt:'2024-01-15 10:00' },
  { id:'LOG00002', action:'CREATE', target:'资产:2', operator:'u004', detail:'新增资产：ThinkPad T490 笔记本', createdAt:'2023-11-10 09:00' },
  { id:'LOG00003', action:'APPLY', target:'申请:APP004', operator:'u003', detail:'提交领用申请：A4复印纸 3箱', createdAt:'2025-05-08 09:00' },
  { id:'LOG00004', action:'APPROVE', target:'申请:APP004', operator:'u004', detail:'审批通过：A4复印纸 x 3', createdAt:'2025-05-09 10:00' },
  { id:'LOG00005', action:'APPLY', target:'申请:APP005', operator:'u003', detail:'提交报修申请：汽车尾气分析仪', createdAt:'2025-05-06 11:00' },
  { id:'LOG00006', action:'APPROVE', target:'申请:APP005', operator:'u004', detail:'审批通过：汽车尾气分析仪', createdAt:'2025-05-07 15:30' },
  { id:'LOG00007', action:'CREATE', target:'申请:APP001', operator:'u001', detail:'提交领用申请：戴尔显示器', createdAt:'2025-05-10 09:30' },
  { id:'LOG00008', action:'CREATE', target:'申请:APP003', operator:'u001', detail:'提交报废申请：打印机 HP LaserJet', createdAt:'2025-05-12 16:00' },
  { id:'LOG00009', action:'INVENTORY', target:'任务:TASK001', operator:'u004', detail:'创建盘点任务：办公室', createdAt:'2025-05-10 08:00' },
  { id:'LOG00010', action:'INVENTORY', target:'任务:TASK002', operator:'u004', detail:'完成盘点任务：环保车间', createdAt:'2025-05-03 17:00' }
]

const inventoryTasks = [
  { 
    id: 'TASK1779386762961',
    locationId: 'HX0101',
    locationName: '办公室',
    status: '已完成',
    assetList: [
      { assetId: '1', name: '戴尔显示器 27寸', code: 'HX0101-ZC031-000001', expectedQty: 2, actualQty: 4, difference: 2, scanned: true, surplusHandled: false },
      { assetId: '2', name: 'ThinkPad T490 笔记本', code: 'HX0101-ZC034-000001', expectedQty: 1, actualQty: 0, difference: -1, scanned: true, lossHandled: false },
      { assetId: '5', name: '罗技键鼠套装', code: 'HX0101-ZC031-000003', expectedQty: 3, actualQty: 3, difference: 0, scanned: true }
    ],
    total: 3,
    scanned: 3,
    totalSurplus: 2,
    totalDeficit: 1,
    createdAt: '2026-05-15 09:00',
    completedAt: '2026-05-22 10:00'
  }
]

const alertSettings = {
  alertEnabled: true,
  alertMin: 5,
  inspectionWarningDays: 30
}

const debts = [
  { id:'debt_001', debtorName:'恒鑫机动车检测站', amount:15000.00, paidAmount:5000.00, balance:10000.00, status:'PENDING', responsiblePerson:'张三', dueDate:'2026-06-15', remark:'设备采购尾款', createdAt:'2026-05-17 10:00', updatedAt:'2026-05-17 10:00', operator:'管理员', repayments: [{amount:5000.00, method:'银行转账', repayDate:'2026-05-20', confirmPerson:'管理员', remark:'首期款', createdAt:'2026-05-20 15:30'}] },
  { id:'debt_002', debtorName:'天锐机动车检测站', amount:28000.00, paidAmount:28000.00, balance:0.00, status:'SETTLED', responsiblePerson:'李四', dueDate:'2026-04-30', remark:'维修费结清', createdAt:'2026-03-10 09:00', updatedAt:'2026-04-30 16:00', operator:'管理员', repayments: [{amount:28000.00, method:'现金', repayDate:'2026-04-28', confirmPerson:'财务', remark:'结清全款', createdAt:'2026-04-28 10:00'}] },
  { id:'debt_003', debtorName:'恒鑫机动车检测站', amount:8500.00, paidAmount:2000.00, balance:6500.00, status:'OVERDUE', responsiblePerson:'王五', dueDate:'2026-05-01', remark:'配件采购', createdAt:'2026-04-15 14:00', updatedAt:'2026-05-16 10:00', operator:'管理员', repayments: [{amount:2000.00, method:'微信', repayDate:'2026-04-25', confirmPerson:'张三', remark:'部分还款', createdAt:'2026-04-25 14:00'}] },
  { id:'debt_004', debtorName:'顺通汽修厂', amount:5000.00, paidAmount:0.00, balance:5000.00, status:'PENDING', responsiblePerson:'赵六', dueDate:'2026-07-01', remark:'检测设备定金', createdAt:'2026-05-12 11:00', updatedAt:'2026-05-12 11:00', operator:'管理员', repayments: [] },
  { id:'debt_005', debtorName:'宏达汽配', amount:3200.00, paidAmount:1000.00, balance:2200.00, status:'OVERDUE', responsiblePerson:'张三', dueDate:'2026-05-10', remark:'耗材采购', createdAt:'2026-04-20 09:30', updatedAt:'2026-05-16 10:00', operator:'管理员', repayments: [{amount:1000.00, method:'支付宝', repayDate:'2026-04-30', confirmPerson:'系统管理员', remark:'部分还款', createdAt:'2026-04-30 14:30'}] }
]

let debtPermittedUsers = ['u001', 'u002'] // 会更新，保持 let

app.post('/api/auth/login', async function(req, res, next) {
  try {
    await delay()
    const username = req.body.username
    const password = req.body.password
    const user = users.find(function(u) { return u.name === username })
    if (!user) return res.json({ code: 401, message: '用户不存在' })
    if (password && password !== '123456') return res.json({ code: 401, message: '密码错误' })
    const token = 'mock_' + user.id + '_' + Date.now()
    respond(res, { token: token, user: { id: user.id, name: user.name, role: user.role, dept: user.dept } })
  } catch (error) {
    next(error)
  }
})

app.get('/api/config/debt-permissions', async function(req, res, next) {
  try {
    await delay()
    respond(res, { userIds: debtPermittedUsers })
  } catch (error) {
    next(error)
  }
})

app.post('/api/config/debt-permissions', async function(req, res, next) {
  try {
    await delay()
    debtPermittedUsers = req.body.userIds || []
    respond(res, { ok: true, userIds: debtPermittedUsers })
  } catch (error) {
    next(error)
  }
})

app.get('/api/users/check-debt-access', async function(req, res, next) {
  try {
    await delay()
    const userId = req.query.userId
    respond(res, { hasAccess: debtPermittedUsers.indexOf(userId) >= 0 })
  } catch (error) {
    next(error)
  }
})

app.get('/api/users', async function(req, res, next) {
  try {
    await delay()
    respondList(res, users)
  } catch (error) {
    next(error)
  }
})

app.put('/api/users/:id', async function(req, res, next) {
  try {
    await delay()
    const idx = users.findIndex(function(u) { return u.id === req.params.id })
    if (idx === -1) return res.status(404).json({ code:404, message:'用户不存在' })
    Object.assign(users[idx], req.body)
    respond(res, users[idx])
  } catch (error) {
    next(error)
  }
})

app.get('/api/config/categories', async function(req, res, next) {
  try {
    await delay()
    respondList(res, categories)
  } catch (error) {
    next(error)
  }
})

app.get('/api/config/locations', async function(req, res, next) {
  try {
    await delay()
    respondList(res, locations)
  } catch (error) {
    next(error)
  }
})

app.get('/api/config/approval-mapping', async function(req, res, next) {
  try {
    await delay()
    respondList(res, approvalMapping)
  } catch (error) {
    next(error)
  }
})

app.post('/api/config/approval-mapping', async function(req, res, next) {
  try {
    await delay()
    const data = req.body
    if (data.list) {
      approvalMapping = data.list
    }
    auditLogs.push(makeAuditLog('CONFIG', '审批配置', 'u005', '更新审批配置'))
    respond(res, { ok: true })
  } catch (error) {
    next(error)
  }
})

app.get('/api/config/audit-logs', async function(req, res, next) {
  try {
    await delay()
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 50
    const kw = (req.query.keyword || '').toLowerCase()
    let logList = auditLogs.slice(0).reverse()
    if (kw) {
      logList = logList.filter(function(l) {
        return (l.detail || '').toLowerCase().includes(kw) || 
               (l.target || '').toLowerCase().includes(kw) || 
               (l.operator || '').toLowerCase().includes(kw)
      })
    }
    const total = logList.length
    respondList(res, logList.slice((page - 1) * pageSize, page * pageSize), total)
  } catch (error) {
    next(error)
  }
})

app.get('/api/config/code-rules', async function(req, res, next) {
  try {
    await delay()
    respondList(res, codeRules)
  } catch (error) {
    next(error)
  }
})

// 简单的CSV解析函数
function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim())
  const data = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    const row = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx] ? values[idx].trim() : ''
    })
    data.push(row)
  }
  
  return data
}

// 验证并处理单行数据
function validateRow(row, rowNum) {
  const result = {
    row: rowNum + 1,
    valid: true,
    error: null,
    name: '',
    model: '',
    categoryName: '',
    categoryId: '',
    locationName: '',
    locationId: '',
    custodianName: '',
    quantity: 1,
    unit: '',
    price: 0,
    purchaseDate: '',
    inspectionEnabled: false,
    lastInspectionDate: '',
    inspectionCycle: 0,
    nextInspectionDate: '',
    inventoryEnabled: false,
    alertEnabled: false,
    alertMin: 0
  }
  
  const nameKey = Object.keys(row).find(k => k.includes('资产名称'))
  const categoryKey = Object.keys(row).find(k => k.includes('资产分类'))
  const locationKey = Object.keys(row).find(k => k.includes('存放地点'))
  const quantityKey = Object.keys(row).find(k => k.includes('数量'))
  const unitKey = Object.keys(row).find(k => k.includes('单位'))
  
  if (!row[nameKey]) {
    result.valid = false
    result.error = '资产名称不能为空'
    return result
  }
  if (!row[categoryKey]) {
    result.valid = false
    result.error = '资产分类不能为空'
    return result
  }
  if (!row[locationKey]) {
    result.valid = false
    result.error = '存放地点不能为空'
    return result
  }
  if (!row[quantityKey]) {
    result.valid = false
    result.error = '数量不能为空'
    return result
  }
  if (!row[unitKey]) {
    result.valid = false
    result.error = '单位不能为空'
    return result
  }
  
  const categoryName = row[categoryKey]
  const category = categories.find(c => c.name === categoryName)
  if (!category) {
    result.valid = false
    result.error = `找不到资产分类：${categoryName}`
    return result
  }
  
  const locationName = row[locationKey]
  const location = locations.find(l => l.name === locationName)
  if (!location) {
    result.valid = false
    result.error = `找不到存放地点：${locationName}`
    return result
  }
  
  result.name = row[nameKey]
  result.categoryName = categoryName
  result.categoryId = category.id
  result.locationName = locationName
  result.locationId = location.id
  result.quantity = parseInt(row[quantityKey]) || 1
  result.unit = row[unitKey]
  
  const modelKey = Object.keys(row).find(k => k.includes('规格型号'))
  if (modelKey) result.model = row[modelKey]
  
  const custodianKey = Object.keys(row).find(k => k.includes('责任人'))
  if (custodianKey) result.custodianName = row[custodianKey]
  
  const priceKey = Object.keys(row).find(k => k.includes('单价'))
  if (priceKey) result.price = parseFloat(row[priceKey]) || 0
  
  const purchaseDateKey = Object.keys(row).find(k => k.includes('购置日期'))
  if (purchaseDateKey) result.purchaseDate = row[purchaseDateKey]
  
  const inspectionKey = Object.keys(row).find(k => k.includes('是否需要检定'))
  if (inspectionKey) result.inspectionEnabled = row[inspectionKey] === '是'
  
  const lastInspDateKey = Object.keys(row).find(k => k.includes('上次检定日期'))
  if (lastInspDateKey) result.lastInspectionDate = row[lastInspDateKey]
  
  const cycleKey = Object.keys(row).find(k => k.includes('检定周期'))
  if (cycleKey) result.inspectionCycle = parseInt(row[cycleKey]) || 0
  
  const nextInspDateKey = Object.keys(row).find(k => k.includes('下次检定日期'))
  if (nextInspDateKey) result.nextInspectionDate = row[nextInspDateKey]
  
  const inventoryKey = Object.keys(row).find(k => k.includes('是否加入盘点'))
  if (inventoryKey) result.inventoryEnabled = row[inventoryKey] === '是'
  
  const alertKey = Object.keys(row).find(k => k.includes('是否启用低库存告警'))
  if (alertKey) result.alertEnabled = row[alertKey] === '是'
  
  const alertMinKey = Object.keys(row).find(k => k.includes('最低库存数'))
  if (alertMinKey) result.alertMin = parseInt(row[alertMinKey]) || 0
  
  return result
}

// 存储预览数据的临时变量
let currentPreviewData = []

// 批量导入资产相关API - 必须放在 /api/assets/:id 前面！
app.get('/api/assets/import/template', async function(req, res, next) {
  try {
    await delay()
    // 生成CSV模板
    const headers = [
      '资产名称*',
      '规格型号',
      '资产分类*',
      '存放地点*',
      '责任人',
      '数量*',
      '单位*',
      '单价(元)',
      '购置日期(YYYY-MM-DD)',
      '是否需要检定(是/否)',
      '上次检定日期',
      '检定周期(天)',
      '下次检定日期',
      '是否加入盘点(是/否)',
      '是否启用低库存告警(是/否)',
      '最低库存数'
    ]
    
    const exampleRow = [
      '戴尔显示器',
      'U2720Q',
      '办公设备',
      '办公室',
      '张三',
      '2',
      '台',
      '3500',
      '2025-01-15',
      '否',
      '',
      '',
      '',
      '是',
      '否',
      ''
    ]
    
    const csvContent = [
      headers.join(','),
      exampleRow.join(',')
    ].join('\n')
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename=资产导入模板.csv')
    res.send('\uFEFF' + csvContent)
  } catch (error) {
    next(error)
  }
})

// 导出资产CSV - 必须放在 /api/assets/:id 前面！
app.get('/api/assets/export', async function(req, res, next) {
  try {
    await delay()
    const keyword = req.query.keyword || ''
    const status = req.query.status || ''
    const isConsumable = req.query.isConsumable === 'true' || req.query.isConsumable === '1'
    const includeConsumable = req.query.includeConsumable === undefined || req.query.includeConsumable === 'true'
    
    let filteredAssets = assets.filter(a => {
      if (keyword) {
        const kw = keyword.toLowerCase()
        if (!a.name.toLowerCase().includes(kw) && !a.code.toLowerCase().includes(kw)) {
          return false
        }
      }
      if (status) {
        if (status === 'EXPIRED') {
          if (!a.nextInspectionDate) return false
          const today = new Date().toISOString().split('T')[0]
          if (a.nextInspectionDate >= today) return false
        } else if (a.status !== status) {
          return false
        }
      }
      if (isConsumable !== undefined) {
        const category = categories.find(c => c.id === a.categoryId)
        const isLowValue = isLowValueConsumable(a.categoryId, category?.name)
        if (isConsumable && !isLowValue) return false
        if (!isConsumable && isLowValue) return false
      }
      if (!includeConsumable) {
        const category = categories.find(c => c.id === a.categoryId)
        if (isLowValueConsumable(a.categoryId, category?.name)) return false
      }
      return true
    })
    
    const headers = [
      '资产编码', '资产名称', '规格型号', '资产分类', '存放地点',
      '责任人', '数量', '单位', '单价(元)', '购置日期',
      '状态', '库存', '是否需要检定', '上次检定日期', '检定周期(天)', '下次检定日期'
    ]
    
    const statusMap = {
      'IDLE': '闲置', 'IN_USE': '在用', 'MAINTENANCE': '维修中',
      'INSPECTION': '检测中', 'SCRAPPED': '已报废'
    }
    
    const rows = filteredAssets.map(a => {
      const stock = a.quantity - a.inUseCount
      return [
        a.code, a.name, a.model || '', a.categoryName || '', a.locationName || '',
        a.custodianName || '', a.quantity, a.unit || '', a.price || 0, a.purchaseDate || '',
        statusMap[a.status] || a.status, stock,
        a.inspectionCycle > 0 ? '是' : '否', a.lastInspectionDate || '',
        a.inspectionCycle || '', a.nextInspectionDate || ''
      ]
    })
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => {
        const str = String(cell || '')
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }).join(','))
    ].join('\n')
    
    const filename = `资产列表_${new Date().toISOString().slice(0,10)}.csv`
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
    res.send('\uFEFF' + csvContent)
  } catch (error) {
    next(error)
  }
})

app.get('/api/assets', async function(req, res, next) {
  try {
    await delay()
    let list = assets.map(function(a) { return enrichAsset(a, categories, locations) })
    const keyword = req.query.keyword
    const categoryId = req.query.categoryId
    const status = req.query.status
    const custodian = req.query.custodian
    if (keyword) { 
      const kw = keyword.toLowerCase()
      list = list.filter(function(a) { 
        return (a.name || '').toLowerCase().includes(kw) || (a.code || '').includes(kw) 
      }) 
    }
    if (categoryId) list = list.filter(function(a) { return a.categoryId === categoryId })
    if (status) {
      if (status === 'EXPIRED') {
        const now = new Date().toISOString().split('T')[0]
        list = list.filter(function(a) { 
          return a.nextInspectionDate && a.nextInspectionDate < now 
        })
      } else {
        list = list.filter(function(a) { return a.status === status })
      }
    } else {
      list = list.filter(function(a) { return a.status !== 'SCRAPPED' })
    }
    if (custodian) list = list.filter(function(a) { return a.custodian === custodian })
    const total = list.length
    const page = parseInt(req.query.page) || 1
    const ps = parseInt(req.query.pageSize) || 200
    respondList(res, list.slice((page - 1) * ps, page * ps), total)
  } catch (error) {
    next(error)
  }
})

app.get('/api/assets/:id', async function(req, res, next) {
  try {
    await delay()
    const asset = assets.find(function(a) { return a.id === req.params.id })
    if (!asset) return res.status(404).json({ code: 404, message: '资产不存在' })
    respond(res, enrichAsset(asset, categories, locations))
  } catch (error) {
    next(error)
  }
})

app.get('/api/assets/:id/trace', async function(req, res, next) {
  try {
    await delay()
    const asset = assets.find(function(a) { return a.id === req.params.id })
    if (!asset) return res.status(404).json({ code: 404, message: '资产不存在' })
    const logs = auditLogs.filter(function(l) { 
      return l.target.includes(asset.id) || (l.detail || '').includes(asset.name) 
    })
    const apps = applications.filter(function(a) { return a.assetId === asset.id })
    respond(res, { asset: asset, logs: logs, applications: apps })
  } catch (error) {
    next(error)
  }
})

app.get('/api/dashboard', async function(req, res, next) {
  try {
    await delay()
    const totalAssets = assets.length
    const inUseCount = assets.filter(function(a) { return a.status === 'IN_USE' }).length
    const idleCount = assets.filter(function(a) { return a.status === 'IDLE' }).length
    const inspectionCount = assets.filter(function(a) { return a.status === 'INSPECTION' }).length
    const scrappedCount = assets.filter(function(a) { 
      const cat = categories.find(c => c.id === a.categoryId)
      return a.status === 'SCRAPPED' && !isLowValueConsumable(a.categoryId, cat?.name) 
    }).length
    const now = new Date().toISOString().split('T')[0]
    const expiredAssets = assets.filter(function(a) { return a.nextInspectionDate && a.nextInspectionDate < now })
    const expiredCount = expiredAssets.length
    const lowStockAssets = assets.filter(function(a) { 
      return a.alertEnabled && parseInt(a.quantity || 0) <= parseInt(a.alertMin || 0) 
    })
    const lowStockCount = lowStockAssets.length
    const maintenanceAssets = assets.filter(function(a) { return a.status === 'MAINTENANCE' })
    const maintenanceCount = maintenanceAssets.length
    const thirtyDaysLater = new Date()
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
    const thirtyDaysLaterStr = thirtyDaysLater.toISOString().split('T')[0]
    const inspectionWarningAssets = assets.filter(function(a) { 
      return a.nextInspectionDate && a.nextInspectionDate >= now && a.nextInspectionDate <= thirtyDaysLaterStr 
    })
    const alertCount = maintenanceCount + lowStockCount
    const pendingCount = applications.filter(function(a) { return a.status === 'PENDING' }).length
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const monthTasks = inventoryTasks.filter(function(t) { return new Date(t.createdAt) >= monthStart })
    const quarterStart = new Date()
    quarterStart.setMonth(Math.floor(quarterStart.getMonth() / 3) * 3, 1)
    quarterStart.setHours(0, 0, 0, 0)
    let totalSurplus = 0
    let totalDeficit = 0
    inventoryTasks.forEach(function(t) {
      if (t.assetList) {
        t.assetList.forEach(function(item) {
          if (item.difference > 0) totalSurplus += item.difference
          if (item.difference < 0) totalDeficit += Math.abs(item.difference)
        })
      }
    })
    respond(res, {
      totalAssets: totalAssets,
      inUseCount: inUseCount,
      idleCount: idleCount,
      maintenanceCount: maintenanceCount,
      lowStockCount: lowStockCount,
      alertCount: alertCount,
      inspectionCount: inspectionCount,
      expiredCount: expiredCount,
      pendingCount: pendingCount,
      monthCount: monthTasks.length,
      quarterCount: inventoryTasks.length,
      totalSurplus: totalSurplus,
      totalDeficit: totalDeficit,
      scrappedCount: scrappedCount,
      alertAssets: lowStockAssets,
      maintenanceAssets: maintenanceAssets,
      inspectionWarningAssets: inspectionWarningAssets,
      expiredAssets: expiredAssets
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/applications', async function(req, res, next) {
  try {
    await delay()
    let list = applications.slice(0).reverse()
    const type = req.query.type
    const status = req.query.status
    const applicantId = req.query.applicantId
    if (type) list = list.filter(function(a) { return a.type === type })
    if (status) list = list.filter(function(a) { return a.status === status })
    if (applicantId) list = list.filter(function(a) { return a.applicantId === applicantId })
    const page = parseInt(req.query.page) || 1
    const ps = parseInt(req.query.pageSize) || 200
    respondList(res, list.slice((page - 1) * ps, page * ps), list.length)
  } catch (error) {
    next(error)
  }
})

app.get('/api/applications/pending', async function(req, res, next) {
  try {
    await delay()
    const pending = applications.filter(function(a) { return a.status === 'PENDING' }).reverse()
    const processed = applications.filter(function(a) { return a.status !== 'PENDING' }).reverse()
    respond(res, { pending: pending, processed: processed })
  } catch (error) {
    next(error)
  }
})

app.post('/api/applications', async function(req, res, next) {
  try {
    await delay()
    const data = req.body
    const id = 'APP' + String(applications.length + 100).slice(-3) + String(Date.now()).slice(-2)
    
    // 检查是否可以提交
    if (data.type === 'receive') {
      const asset = assets.find(function(a) { return a.id === data.assetId })
      if (asset) {
        const available = (parseInt(asset.quantity) || 0) - (parseInt(asset.inUseCount) || 0) - (parseInt(asset.pendingQuantity) || 0)
        const qty = parseInt(data.quantity) || 1
        if (qty > available) {
          return res.json({ code: 400, message: '可用数量不足' })
        }
        // 检查是否同一用户对同一资产有重复的待审批申请
        const existingApp = applications.find(function(a) { 
          return a.assetId === data.assetId && a.applicantId === data.applicantId && a.status === 'PENDING'
        })
        if (existingApp) {
          return res.json({ code: 400, message: '您已有该资产的待审批申请' })
        }
        // 锁定数量
        asset.pendingQuantity = (parseInt(asset.pendingQuantity) || 0) + qty
      }
    }
    
    const app = {
      id: id, 
      type: data.type, 
      typeLabel: typeLabel(data.type),
      assetId: data.assetId, 
      assetName: data.assetName, 
      assetCode: data.assetCode,
      applicantId: data.applicantId, 
      applicantName: data.applicantName,
      reason: data.reason, 
      quantity: parseInt(data.quantity) || 1,
      status: 'PENDING', 
      approverId: '', 
      handledAt: '',
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      images: data.images || [], 
      suggestRepair: !!data.suggestRepair, 
      suggestScrap: !!data.suggestScrap, 
      problem: data.problem || ''
    }
    applications.push(app)
    auditLogs.push(makeAuditLog('APPLY', '申请:' + id, data.applicantId, 
      '提交' + app.typeLabel + '申请：' + data.assetName + 
      '，数量：' + (data.quantity || 1) + 
      (data.reason ? '，原因：' + data.reason : '')))
    respond(res, app)
  } catch (error) {
    next(error)
  }
})

app.put('/api/applications/:id/approve', async function(req, res, next) {
  try {
    await delay()
    const app = applications.find(function(a) { return a.id === req.params.id })
    if (!app) return res.status(404).json({ code: 404, message: '申请不存在' })
    if (app.status !== 'PENDING') return res.json({ code: 400, message: '该申请已处理' })
    app.status = 'APPROVED'
    app.approverId = req.body.approverId || 'u004'
    app.handledAt = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
    
    const asset = assets.find(function(a) { return a.id === app.assetId })
    const qty = app.quantity || 1
    
    if (asset) {
      if (app.type === 'receive') {
        const available = (parseInt(asset.quantity) || 0) - (parseInt(asset.inUseCount) || 0)
        if (qty > available) {
          app.status = 'REJECTED'
          // 释放锁定
          asset.pendingQuantity = Math.max(0, (parseInt(asset.pendingQuantity) || 0) - qty)
          auditLogs.push(makeAuditLog('REJECT', '申请:' + app.id, app.approverId, '库存不足'))
          return respond(res, app, '库存不足')
        }
        asset.custodian = app.applicantId
        asset.custodianName = app.applicantName
        asset.inUseCount = (parseInt(asset.inUseCount) || 0) + qty
        asset.pendingQuantity = Math.max(0, (parseInt(asset.pendingQuantity) || 0) - qty)
      } else if (app.type === 'return') {
        const userQty = parseInt(asset.inUseCount) || 0
        if (qty > userQty) {
          app.status = 'REJECTED'
          auditLogs.push(makeAuditLog('REJECT', '申请:' + app.id, app.approverId, '归还数量超出'))
          return respond(res, app, '归还数量超出名下已领用数')
        }
        asset.inUseCount = Math.max(0, userQty - qty)
        if (asset.inUseCount === 0) { 
          asset.custodian = ''
          asset.custodianName = '' 
        }
      } else if (app.type === 'repair') {
        asset.status = 'MAINTENANCE'
      } else if (app.type === 'scrap' || app.type === 'loss') {
        asset.quantity = Math.max(0, (parseInt(asset.quantity) || 0) - qty)
        asset.inUseCount = Math.max(0, (parseInt(asset.inUseCount) || 0) - qty)
        asset.status = 'SCRAPPED'
      } else if (app.type === 'transfer') {
        if (app.targetUserId) {
          const newUser = users.find(function(u) { return u.id === app.targetUserId })
          asset.custodian = app.targetUserId
          asset.custodianName = newUser ? newUser.name : app.targetUserName
        }
        if (app.returnLocationId) {
          const newLoc = locations.find(function(l) { return l.id === app.returnLocationId })
          if (newLoc) { asset.locationId = newLoc.id; asset.locationName = newLoc.name }
        }
      }
    }
    
    auditLogs.push(makeAuditLog('APPROVE', '申请:' + app.id, app.approverId, 
      '审批通过：' + (app.assetName || '') + 
      '，类型：' + app.typeLabel + 
      '，数量：' + (app.quantity || 1) + 
      (app.reason ? '，原因：' + app.reason : '')))
    respond(res, app)
  } catch (error) {
    next(error)
  }
})

app.put('/api/applications/:id/reject', async function(req, res, next) {
  try {
    await delay()
    const app = applications.find(function(a) { return a.id === req.params.id })
    if (!app) return res.status(404).json({ code: 404, message: '申请不存在' })
    app.status = 'REJECTED'
    app.approverId = req.body.approverId || 'u004'
    app.handledAt = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
    
    // 如果是领用申请，释放锁定数量
    if (app.type === 'receive') {
      const asset = assets.find(function(a) { return a.id === app.assetId })
      if (asset) {
        asset.pendingQuantity = Math.max(0, (parseInt(asset.pendingQuantity) || 0) - (parseInt(app.quantity) || 0))
      }
    }
    
    auditLogs.push(makeAuditLog('REJECT', '申请:' + app.id, app.approverId, 
      '审批拒绝：' + (app.assetName || '') + 
      '，类型：' + app.typeLabel + 
      '，数量：' + (app.quantity || 1)))
    respond(res, app)
  } catch (error) {
    next(error)
  }
})

app.get('/api/applications/my', async function(req, res, next) {
  try {
    await delay()
    const userId = req.query.userId
    const statusFilter = req.query.status
    const page = parseInt(req.query.page) || 1
    const ps = parseInt(req.query.pageSize) || 100
    if (!userId) return respondList(res, [])
    let list = applications.filter(function(a) { return a.applicantId === userId }).reverse()
    if (statusFilter) list = list.filter(function(a) { return a.status === statusFilter })
    respondList(res, list.slice((page - 1) * ps, page * ps), list.length)
  } catch (error) {
    next(error)
  }
})

app.get('/api/applications/mine', async function(req, res, next) {
  try {
    await delay()
    const userId = req.query.userId
    const statusFilter = req.query.status
    const page = parseInt(req.query.page) || 1
    const ps = parseInt(req.query.pageSize) || 100
    if (!userId) return respondList(res, [])
    let list = applications.filter(function(a) { return a.applicantId === userId }).reverse()
    if (statusFilter) list = list.filter(function(a) { return a.status === statusFilter })
    respondList(res, list.slice((page - 1) * ps, page * ps), list.length)
  } catch (error) {
    next(error)
  }
})

app.get('/api/debts', async function(req, res, next) {
  try {
    await delay()
    let list = debts.slice(0)
    const kw = req.query.keyword
    const status = req.query.status
    if (kw) {
      list = list.filter(function(d) { 
        return d.debtorName.includes(kw) || (d.remark || '').includes(kw) 
      })
    }
    if (status) list = list.filter(function(d) { return d.status === status })
    const page = parseInt(req.query.page) || 1
    const ps = parseInt(req.query.pageSize) || 200
    respondList(res, list.slice((page - 1) * ps, page * ps), list.length)
  } catch (error) {
    next(error)
  }
})

app.get('/api/debts/:id', async function(req, res, next) {
  try {
    await delay()
    const d = debts.find(function(i) { return i.id === req.params.id })
    if (!d) return res.status(404).json({ code: 404, message: '欠款记录不存在' })
    respond(res, d)
  } catch (error) {
    next(error)
  }
})

app.post('/api/debts', async function(req, res, next) {
  try {
    await delay()
    const data = req.body
    const id = 'debt_' + String(debts.length + 100).slice(-3)
    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
    const balance = (parseFloat(data.amount) || 0) - (parseFloat(data.paidAmount) || 0)
    const d = { 
      id: id, 
      debtorName: data.debtorName, 
      amount: parseFloat(data.amount) || 0, 
      paidAmount: parseFloat(data.paidAmount) || 0, 
      balance: Math.max(0, balance), 
      status: balance <= 0 ? 'SETTLED' : 'PENDING', 
      responsiblePerson: data.responsiblePerson || '', 
      contactPerson: data.contactPerson || '', 
      contactPhone: data.contactPhone || '', 
      dueDate: data.dueDate || '', 
      remark: data.remark || '', 
      createdAt: now, 
      updatedAt: now, 
      operator: data.operator || '管理员',
      repayments: []
    }
    debts.push(d)
    auditLogs.push(makeAuditLog('CREATE', '欠款:' + id, data.operator || '管理员', '新增欠款记录：' + d.debtorName))
    respond(res, d)
  } catch (error) {
    next(error)
  }
})

app.put('/api/debts/:id', async function(req, res, next) {
  try {
    await delay()
    const d = debts.find(function(i) { return i.id === req.params.id })
    if (!d) return res.status(404).json({ code: 404, message: '欠款记录不存在' })
    Object.assign(d, req.body)
    d.balance = Math.max(0, d.amount - d.paidAmount)
    d.payMethod = d.payMethod || []
    const payAmount = parseFloat(req.body.amount) || 0
    if (req.body.method) {
      d.payMethod.push({ 
        amount: payAmount, 
        method: req.body.method, 
        date: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-') 
      })
    }
    d.updatedAt = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
    if (d.balance <= 0) d.status = 'SETTLED'
    respond(res, d)
  } catch (error) {
    next(error)
  }
})

app.post('/api/debts/:id/repay', async function(req, res, next) {
  try {
    await delay()
    const d = debts.find(function(i) { return i.id === req.params.id })
    if (!d) return res.status(404).json({ code: 404, message: '欠款记录不存在' })
    const payAmount = parseFloat(req.body.amount) || 0
    d.paidAmount = (parseFloat(d.paidAmount) || 0) + payAmount
    d.balance = Math.max(0, d.amount - d.paidAmount)
    d.repayments = d.repayments || []
    const repayment = {
      amount: payAmount, 
      method: req.body.method || '现金', 
      repayDate: req.body.repayDate || new Date().toISOString().slice(0,10),
      confirmPerson: req.body.confirmPerson || req.body.operator || '管理员',
      operator: req.body.operator || '管理员',
      remark: req.body.remark || '',
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
    }
    d.repayments.push(repayment)
    d.updatedAt = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
    if (d.balance <= 0) d.status = 'SETTLED'
    else if (new Date(d.dueDate) < new Date()) d.status = 'OVERDUE'
    respond(res, d, '还款成功')
  } catch (error) {
    next(error)
  }
})

app.delete('/api/debts/:id', async function(req, res, next) {
  try {
    await delay()
    const idx = debts.findIndex(function(i) { return i.id === req.params.id })
    if (idx === -1) return res.status(404).json({ code: 404, message: '欠款记录不存在' })
    debts.splice(idx, 1)
    respond(res, { ok: true }, '已删除')
  } catch (error) {
    next(error)
  }
})

app.get('/api/export/assets', function(req, res, next) {
  try {
    const header = '资产编码,资产名称,型号,分类,存放地点,状态,保管人,总数量,在用数量,单位\n'
    const rows = assets.map(function(a) { 
      return a.code + ',' + a.name + ',' + (a.model || '') + ',' + (a.categoryName || '') + ',' + 
             (a.locationName || '') + ',' + statusLabel(a.status) + ',' + (a.custodianName || '') + ',' + 
             (a.quantity || 0) + ',' + (a.inUseCount || 0) + ',' + (a.unit || '') 
    }).join('\n')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename=assets.csv')
    res.send('\uFEFF' + header + rows)
  } catch (error) {
    next(error)
  }
})

app.get('/api/export/debts', function(req, res, next) {
  try {
    const statusMap = { PENDING:'待还', OVERDUE:'逾期', SETTLED:'已核销' }
    const header = '欠款单位,欠款总额,已还金额,剩余欠款,状态,责任人,到期日,备注,登记人,登记时间\n'
    const rows = debts.map(function(d) { 
      return d.debtorName + ',' + d.amount + ',' + d.paidAmount + ',' + d.balance + ',' + 
             (statusMap[d.status] || d.status) + ',' + (d.responsiblePerson || '') + ',' + 
             (d.dueDate || '') + ',' + (d.remark || '') + ',' + (d.operator || '') + ',' + (d.createdAt || '') 
    }).join('\n')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename=debts.csv')
    res.send('\uFEFF' + header + rows)
  } catch (error) {
    next(error)
  }
})

app.get('/api/export/audit-logs', function(req, res, next) {
  try {
    const header = '时间,操作,目标,操作人,详情\n'
    const rows = auditLogs.map(function(l) { 
      return l.createdAt + ',' + l.action + ',' + l.target + ',' + l.operator + ',' + l.detail 
    }).join('\n')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv')
    res.send('\uFEFF' + header + rows)
  } catch (error) {
    next(error)
  }
})

app.post('/api/assets', async function(req, res, next) {
  try {
    await delay()
    const data = req.body
    
    // 判断是否是低值易耗品
    const isLowValue = isLowValueConsumable(data.categoryId, data.categoryName)
    const qty = parseInt(data.quantity) || 1
    
    if (isLowValue) {
      // 低值易耗品：一条记录，存多个数量
      globalSeq++
      const id = String(globalSeq)
      const prefix = data.locationId ? data.locationId.slice(0, 4) : 'HX01'
      const code = prefix + '-' + (data.categoryId || 'ZC07') + '-' + String(globalSeq).padStart(6, '0')
      const asset = {
        id: id, 
        code: code, 
        name: data.name, 
        model: data.model || '',
        categoryId: data.categoryId, 
        categoryName: data.categoryName || '',
        locationId: data.locationId, 
        locationName: data.locationName || '',
        status: 'IDLE', 
        custodian: data.custodianId || '', 
        custodianName: data.custodianName || '',
        quantity: qty, 
        inUseCount: 0, 
        pendingQuantity: 0,
        unit: data.unit || '件', 
        price: parseFloat(data.price) || 0,
        purchaseDate: data.purchaseDate || '',
        inspectionCycle: parseInt(data.inspectionCycle) || 0,
        nextInspectionDate: data.nextInspectionDate || '',
        inventoryEnabled: !!data.inventoryEnabled,
        alertEnabled: !!data.alertEnabled, 
        alertMin: parseInt(data.alertMin) || 0,
        images: data.images || [],
        created_at: new Date().toISOString().split('T')[0], 
        updated_at: ''
      }
      assets.push(asset)
      auditLogs.push(makeAuditLog('CREATE', '资产:' + id, data.custodianId || 'u004', 
        '新增资产：' + asset.name + 
        '，数量：' + asset.quantity + asset.unit + 
        '，分类：' + (asset.categoryName || data.categoryName || '未知') + 
        '，存放地点：' + (asset.locationName || data.locationName || '未知')))
      respond(res, asset)
    } else {
      // 非低值易耗品：一条一个编码
      const createdAssets = []
      for (let i = 0; i < qty; i++) {
        globalSeq++
        const id = String(globalSeq)
        const prefix = data.locationId ? data.locationId.slice(0, 4) : 'HX01'
        const code = prefix + '-' + (data.categoryId || 'ZC01') + '-' + String(globalSeq).padStart(6, '0')
        const asset = {
          id: id, 
          code: code, 
          name: data.name, 
          model: data.model || '',
          categoryId: data.categoryId, 
          categoryName: data.categoryName || '',
          locationId: data.locationId, 
          locationName: data.locationName || '',
          status: 'IDLE', 
          custodian: data.custodianId || '', 
          custodianName: data.custodianName || '',
          quantity: 1, 
          inUseCount: 0, 
          pendingQuantity: 0,
          unit: data.unit || '件', 
          price: parseFloat(data.price) || 0,
          purchaseDate: data.purchaseDate || '',
          inspectionCycle: parseInt(data.inspectionCycle) || 0,
          nextInspectionDate: data.nextInspectionDate || '',
          inventoryEnabled: !!data.inventoryEnabled,
          alertEnabled: !!data.alertEnabled, 
          alertMin: parseInt(data.alertMin) || 0,
          images: data.images || [],
          created_at: new Date().toISOString().split('T')[0], 
          updated_at: ''
        }
        assets.push(asset)
        createdAssets.push(asset)
      }
      auditLogs.push(makeAuditLog('CREATE', '资产:' + createdAssets[0].id, data.custodianId || 'u004', 
        '批量新增资产：' + data.name + 
        '，数量：' + qty + data.unit + 
        '，分类：' + (data.categoryName || '未知') + 
        '，存放地点：' + (data.locationName || '未知')))
      respond(res, createdAssets)
    }
  } catch (error) {
    next(error)
  }
})

app.put('/api/assets/:id', async function(req, res, next) {
  try {
    await delay()
    const idx = assets.findIndex(function(a) { return a.id === req.params.id })
    if (idx === -1) return res.status(404).json({ code: 404, message: '资产不存在' })
    assets[idx] = Object.assign(assets[idx], req.body, { updated_at: new Date().toISOString().split('T')[0] })
    respond(res, enrichAsset(assets[idx], categories, locations))
  } catch (error) {
    next(error)
  }
})

app.delete('/api/assets/:id', async function(req, res, next) {
  try {
    await delay()
    const idx = assets.findIndex(function(a) { return a.id === req.params.id })
    if (idx === -1) return res.status(404).json({ code: 404, message: '资产不存在' })
    assets.splice(idx, 1)
    respond(res, { ok: true })
  } catch (error) {
    next(error)
  }
})

app.put('/api/assets/:id/inspection-complete', async function(req, res, next) {
  try {
    await delay()
    const asset = assets.find(function(a) { return a.id === req.params.id })
    if (!asset) return res.status(404).json({ code: 404, message: '资产不存在' })
    asset.status = 'IN_USE'
    asset.lastInspectionDate = req.body.lastInspectionDate || new Date().toISOString().split('T')[0]
    if (asset.inspectionCycle > 0) {
      const next = new Date(asset.lastInspectionDate)
      next.setDate(next.getDate() + asset.inspectionCycle)
      asset.nextInspectionDate = next.toISOString().split('T')[0]
    }
    asset.updated_at = new Date().toISOString().split('T')[0]
    auditLogs.push(makeAuditLog('INSPECTION', '资产:' + asset.id, req.body.operator || 'u004', '检测完成：' + asset.name))
    respond(res, asset)
  } catch (error) {
    next(error)
  }
})

app.put('/api/assets/:id/repair-complete', async function(req, res, next) {
  try {
    await delay()
    const asset = assets.find(function(a) { return a.id === req.params.id })
    if (!asset) return res.status(404).json({ code: 404, message: '资产不存在' })
    asset.status = 'IN_USE'
    asset.updated_at = new Date().toISOString().split('T')[0]
    respond(res, asset)
  } catch (error) {
    next(error)
  }
})

app.get('/api/applications/:id/detail', async function(req, res, next) {
  try {
    await delay()
    const app = applications.find(function(a) { return a.id === req.params.id })
    if (!app) return res.status(404).json({ code: 404, message: '申请不存在' })
    const logs = auditLogs.filter(function(l) { return l.target.includes(req.params.id) })
    respond(res, { app: app, auditLogs: logs })
  } catch (error) {
    next(error)
  }
})

app.post('/api/config/categories', async function(req, res, next) {
  try {
    await delay()
    const data = req.body
    const cat = { id: data.code || 'CAT' + Date.now(), name: data.name, parentId: data.parentId || '' }
    categories.push(cat)
    respond(res, cat)
  } catch (error) {
    next(error)
  }
})

app.put('/api/config/categories/:id', async function(req, res, next) {
  try {
    await delay()
    const idx = categories.findIndex(function(c) { return c.id === req.params.id })
    if (idx === -1) return res.status(404).json({ code: 404, message: '分类不存在' })
    categories[idx] = Object.assign(categories[idx], req.body)
    respond(res, categories[idx])
  } catch (error) {
    next(error)
  }
})

app.delete('/api/config/categories/:id', async function(req, res, next) {
  try {
    await delay()
    const idx = categories.findIndex(function(c) { return c.id === req.params.id })
    if (idx === -1) return res.status(404).json({ code: 404, message: '分类不存在' })
    categories.splice(idx, 1)
    respond(res, { ok: true })
  } catch (error) {
    next(error)
  }
})

app.post('/api/config/locations', async function(req, res, next) {
  try {
    await delay()
    const data = req.body
    const loc = { id: 'LOC' + Date.now(), name: data.name, parentId: data.parentId || '' }
    locations.push(loc)
    respond(res, loc)
  } catch (error) {
    next(error)
  }
})

app.put('/api/config/locations/:id', async function(req, res, next) {
  try {
    await delay()
    const idx = locations.findIndex(function(l) { return l.id === req.params.id })
    if (idx === -1) return res.status(404).json({ code: 404, message: '地点不存在' })
    locations[idx] = Object.assign(locations[idx], req.body)
    respond(res, locations[idx])
  } catch (error) {
    next(error)
  }
})

app.delete('/api/config/locations/:id', async function(req, res, next) {
  try {
    await delay()
    const idx = locations.findIndex(function(l) { return l.id === req.params.id })
    if (idx === -1) return res.status(404).json({ code: 404, message: '地点不存在' })
    locations.splice(idx, 1)
    respond(res, { ok: true })
  } catch (error) {
    next(error)
  }
})

app.get('/api/config/alert-settings', async function(req, res, next) {
  try {
    await delay()
    const alertAssetsList = assets.filter(function(a) { 
      return a.alertEnabled && (a.quantity - a.inUseCount) <= a.alertMin 
    })
    respond(res, { 
      alertEnabled: alertSettings.alertEnabled, 
      alertMin: alertSettings.alertMin, 
      alertAssets: alertAssetsList.map(function(a) { 
        return { id: a.id, name: a.name, code: a.code, quantity: a.quantity, inUseCount: a.inUseCount, alertMin: a.alertMin } 
      }), 
      inspectionWarningDays: alertSettings.inspectionWarningDays 
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/config/alert-settings', async function(req, res, next) {
  try {
    await delay()
    alertSettings = { ...alertSettings, ...req.body }
    respond(res, { ok: true, settings: alertSettings })
  } catch (error) {
    next(error)
  }
})

app.get('/api/applications/pending-list', async function(req, res, next) {
  try {
    await delay()
    const pending = applications.filter(function(a) { return a.status === 'PENDING' }).reverse()
    const processed = applications.filter(function(a) { return a.status !== 'PENDING' }).reverse()
    respond(res, { pending: pending, processed: processed })
  } catch (error) {
    next(error)
  }
})

app.get('/api/applications/pending-count', async function(req, res, next) {
  try {
    await delay()
    respond(res, { count: applications.filter(function(a) { return a.status === 'PENDING' }).length })
  } catch (error) {
    next(error)
  }
})

app.get('/api/approvals/pending-list', async function(req, res, next) {
  try {
    await delay()
    const pending = applications.filter(function(a) { return a.status === 'PENDING' }).reverse()
    const processed = applications.filter(function(a) { return a.status !== 'PENDING' }).reverse()
    respond(res, { pending: pending, processed: processed })
  } catch (error) {
    next(error)
  }
})

app.get('/api/approvals/pending-count', async function(req, res, next) {
  try {
    await delay()
    respond(res, { count: applications.filter(function(a) { return a.status === 'PENDING' }).length })
  } catch (error) {
    next(error)
  }
})

app.get('/api/inventory/tasks', async function(req, res, next) {
  try {
    await delay()
    respondList(res, inventoryTasks)
  } catch (error) {
    next(error)
  }
})

app.get('/api/inventory/tasks/:id', async function(req, res, next) {
  try {
    await delay()
    const task = inventoryTasks.find(function(t) { return t.id === req.params.id })
    if (!task) return res.status(404).json({ code: 404, message: '盘点任务不存在' })
    respond(res, task)
  } catch (error) {
    next(error)
  }
})

app.put('/api/inventory/tasks/:id/asset', async function(req, res, next) {
  try {
    await delay()
    const task = inventoryTasks.find(function(t) { return t.id === req.params.id })
    if (!task) return res.status(404).json({ code: 404, message: '盘点任务不存在' })
    const { assetId, actualQty } = req.body
    const asset = task.assetList.find(function(a) { return a.assetId === assetId })
    if (!asset) return res.status(404).json({ code: 404, message: '资产不在盘点任务中' })
    asset.actualQty = actualQty
    asset.difference = actualQty - asset.expectedQty
    asset.scanned = true
    task.scanned = task.assetList.filter(function(a) { return a.scanned }).length
    respond(res, { ok: true, task: task })
  } catch (error) {
    next(error)
  }
})

app.post('/api/inventory/tasks/:id/scan', async function(req, res, next) {
  try {
    await delay()
    const task = inventoryTasks.find(function(t) { return t.id === req.params.id })
    if (!task) return res.status(404).json({ code: 404, message: '盘点任务不存在' })
    const { assetId } = req.body
    const asset = task.assetList.find(function(a) { return a.assetId === assetId })
    if (!asset) return res.status(404).json({ code: 404, message: '资产不在盘点任务中' })
    asset.scanned = true
    if (asset.actualQty === 0) {
      asset.actualQty = asset.expectedQty
      asset.difference = 0
    }
    task.scanned = task.assetList.filter(function(a) { return a.scanned }).length
    respond(res, { ok: true, task: task })
  } catch (error) {
    next(error)
  }
})

app.post('/api/inventory/tasks/:id/complete', async function(req, res, next) {
  try {
    await delay()
    const task = inventoryTasks.find(function(t) { return t.id === req.params.id })
    if (!task) return res.status(404).json({ code: 404, message: '盘点任务不存在' })
    task.status = '已完成'
    task.completedAt = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
    
    // 统计盘点结果
    let totalSurplus = 0, totalDeficit = 0
    const surplusItems = []
    const deficitItems = []
    const allItems = []
    
    task.assetList.forEach(function(item) {
      let itemDetail = item.name + '（账面：' + item.expectedQty + '，实盘：' + (item.actualQty !== null ? item.actualQty : '未盘点') + '）'
      if (item.difference > 0) {
        totalSurplus += item.difference
        surplusItems.push(item.name + ' +' + item.difference)
        itemDetail += ' → 盘盈 +' + item.difference
      } else if (item.difference < 0) {
        totalDeficit += Math.abs(item.difference)
        deficitItems.push(item.name + ' ' + item.difference)
        itemDetail += ' → 盘亏 ' + item.difference
      } else if (item.actualQty !== null) {
        itemDetail += ' → 账实相符'
      }
      allItems.push(itemDetail)
    })
    
    let detail = '完成盘点任务：' + task.locationName + '\n'
    detail += '共盘点：' + task.total + '项\n'
    detail += '资产详情：\n'
    allItems.forEach(function(item, index) {
      detail += (index + 1) + '. ' + item + '\n'
    })
    detail += '\n结论：'
    if (totalSurplus > 0 || totalDeficit > 0) {
      if (totalSurplus > 0) {
        detail += '盘盈：' + totalSurplus + '（' + surplusItems.join('；') + '）'
      }
      if (totalSurplus > 0 && totalDeficit > 0) {
        detail += '；'
      }
      if (totalDeficit > 0) {
        detail += '盘亏：' + totalDeficit + '（' + deficitItems.join('；') + '）'
      }
    } else {
      detail += '所有资产账实相符'
    }
    
    auditLogs.push(makeAuditLog('INVENTORY', '任务:' + task.id, 'u004', detail))
    
    respond(res, { ok: true, task: task })
  } catch (error) {
    next(error)
  }
})

app.post('/api/inventory/tasks/:id/cancel', async function(req, res, next) {
  try {
    await delay()
    const task = inventoryTasks.find(function(t) { return t.id === req.params.id })
    if (!task) return res.status(404).json({ code: 404, message: '盘点任务不存在' })
    task.status = '已取消'
    auditLogs.push(makeAuditLog('INVENTORY', '任务:' + task.id, 'u004', 
      '取消盘点任务：' + task.locationName + 
      '，原盘点资产：' + task.total + '项'))
    respond(res, { ok: true, task: task })
  } catch (error) {
    next(error)
  }
})

app.post('/api/inventory/deficit-to-loss', async function(req, res, next) {
  try {
    await delay()
    const { taskId, items } = req.body
    const task = inventoryTasks.find(t => t.id === taskId)
    if (!task) {
      return res.status(404).json({ code: 404, message: '盘点任务不存在' })
    }
    
    const processedCount = []
    items.forEach(item => {
      const asset = task.assetList?.find(a => a.assetId === item.assetId)
      // 检查是否已经处理过
      if (asset && !asset.lossHandled) {
        const appId = 'APP' + String(applications.length + 100).slice(-3) + String(Date.now()).slice(-2)
        const app = {
          id: appId,
          type: 'scrap',
          assetId: item.assetId,
          assetName: item.assetName,
          assetCode: item.assetCode,
          applicantId: 'u004',
          applicantName: '管理员',
          reason: '盘亏报损',
          quantity: Math.abs(item.deficit),
          status: 'PENDING',
          approverId: '',
          handledAt: '',
          createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
          images: [],
          suggestScrap: true,
          problem: '盘亏'
        }
        applications.push(app)
        // 标记为已处理
        asset.lossHandled = true
        processedCount.push(item.assetId)
        auditLogs.push(makeAuditLog('APPLY', '申请:' + appId, 'u004', 
          '盘亏报损：' + item.assetName + 
          '，资产编码：' + item.assetCode + 
          '，盘亏数量：' + Math.abs(item.deficit) + 
          '，盘点任务：' + task.locationName))
      }
    })
    
    respond(res, { ok: true, processedCount: processedCount.length })
  } catch (error) {
    next(error)
  }
})

app.post('/api/inventory/surplus-to-asset', async function(req, res, next) {
  try {
    await delay()
    const { taskId, assetId } = req.body
    const task = inventoryTasks.find(t => t.id === taskId)
    const item = task?.assetList?.find(a => a.assetId === assetId)
    
    // 检查是否已经处理过
    if (!item) {
      return res.status(404).json({ code: 404, message: '资产不存在' })
    }
    if (item.surplusHandled) {
      return res.status(400).json({ code: 400, message: '该资产已处理过盘盈入库' })
    }
    
    const appId = 'APP' + String(applications.length + 100).slice(-3) + String(Date.now()).slice(-2)
    const app = {
      id: appId,
      type: 'receive',
      assetId: item.assetId,
      assetName: item.name,
      assetCode: item.code,
      applicantId: 'u004',
      applicantName: '管理员',
      reason: '盘盈入库',
      quantity: item.difference,
      status: 'PENDING',
      approverId: '',
      handledAt: '',
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      images: [],
      suggestScrap: false,
      problem: ''
    }
    applications.push(app)
    // 标记为已处理
    item.surplusHandled = true
    auditLogs.push(makeAuditLog('APPLY', '申请:' + appId, 'u004', 
      '盘盈入库：' + item.name + 
      '，资产编码：' + item.code + 
      '，盘盈数量：' + item.difference + 
      '，盘点任务：' + task.locationName))
    
    respond(res, { ok: true })
  } catch (error) {
    next(error)
  }
})

app.post('/api/inventory/tasks', async function(req, res, next) {
  try {
    await delay()
    const data = req.body
    
    // 1. 获取完整的地点路径（如：一级 > 二级 > 三级）
    function getFullLocationPath(locationId) {
      const path = []
      let currentId = locationId
      while (currentId) {
        const loc = locations.find(l => l.id === currentId)
        if (loc) {
          path.unshift(loc.name)
          currentId = loc.parentId || ''
        } else {
          break
        }
      }
      return path.join(' > ')
    }
    
    // 2. 获取该地点及其所有子地点的 ID
    function getAllChildLocationIds(parentId) {
      const ids = [parentId]
      const children = locations.filter(l => l.parentId === parentId)
      children.forEach(child => {
        ids.push(...getAllChildLocationIds(child.id))
      })
      return ids
    }
    const locationIds = getAllChildLocationIds(data.locationId)
    const fullLocationPath = getFullLocationPath(data.locationId)
    
    // 3. 获取该地点及其子地点下的所有资产
    const assetList = assets.filter(function(a) {
      // 排除已报废资产
      if (a.status === 'SCRAPPED') return false
      // 只在指定地点及其子地点下
      if (!locationIds.includes(a.locationId)) return false
      // 根据参数决定是否排除易耗品
      if (!data.includeConsumables) {
        const cat = categories.find(c => c.id === a.categoryId)
        if (isLowValueConsumable(a.categoryId, cat?.name)) return false
      }
      return true
    }).map(function(a) {
      const cat = categories.find(c => c.id === a.categoryId)
      return {
        assetId: a.id,
        name: a.name,
        code: a.code,
        categoryId: a.categoryId,
        categoryName: a.categoryName || (cat?.name) || '',
        locationId: a.locationId,
        locationName: getFullLocationPath(a.locationId),
        expectedQty: a.quantity - a.inUseCount,
        actualQty: null, // 初始为空，需要用户录入
        difference: null, // 初始无差异
        scanned: false,
        images: a.images || []
      }
    })
    
    // 4. 创建任务
    const task = { 
      id: 'TASK' + Date.now(), 
      locationId: data.locationId, 
      locationName: fullLocationPath, 
      status: '进行中', 
      includeConsumables: !!data.includeConsumables,
      assetList: assetList, 
      total: assetList.length, 
      scanned: 0, 
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'), 
      completedAt: '' 
    }
    
    inventoryTasks.push(task)
    // 统计盘点信息
    let surplusCount = 0, deficitCount = 0
    task.assetList.forEach(function(a) { if (a.expectedQty > 0) surplusCount += a.expectedQty })
    auditLogs.push(makeAuditLog('INVENTORY', '任务:' + task.id, 'u004', 
      '创建盘点任务：' + fullLocationPath + 
      '，盘点资产：' + task.total + '项' + 
      (data.includeConsumables ? '（含易耗品）' : '（不含易耗品）') + 
      '，备注：' + (data.remark || '无')))
    respond(res, task)
  } catch (error) {
    next(error)
  }
})

app.get('/api/l3/dashboard', async function(req, res, next) {
  try {
    await delay()
    const totalAssets = assets.length
    const inUseCount = assets.filter(function(a) { return a.status === 'IN_USE' }).length
    const idleCount = assets.filter(function(a) { return a.status === 'IDLE' }).length
    const inspectionCount = assets.filter(function(a) { return a.status === 'INSPECTION' }).length
    const scrappedCount = assets.filter(function(a) { 
      const cat = categories.find(c => c.id === a.categoryId)
      return a.status === 'SCRAPPED' && !isLowValueConsumable(a.categoryId, cat?.name) 
    }).length
    const lowStockAssets = assets.filter(function(a) { 
      return a.alertEnabled && parseInt(a.quantity || 0) <= parseInt(a.alertMin || 0) 
    })
    const lowStockCount = lowStockAssets.length
    const maintenanceAssets = assets.filter(function(a) { return a.status === 'MAINTENANCE' })
    const maintenanceCount = maintenanceAssets.length
    const alertCount = maintenanceCount + lowStockCount
    const pendingCount = applications.filter(function(a) { return a.status === 'PENDING' }).length
    const now = new Date().toISOString().split('T')[0]
    const expiredAssets = assets.filter(function(a) { return a.nextInspectionDate && a.nextInspectionDate < now })
    const expiredCount = expiredAssets.length
    const thirtyDaysLater = new Date()
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
    const thirtyDaysLaterStr = thirtyDaysLater.toISOString().split('T')[0]
    const inspectionWarningAssets = assets.filter(function(a) { 
      return a.nextInspectionDate && a.nextInspectionDate >= now && a.nextInspectionDate <= thirtyDaysLaterStr 
    })
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const monthTasks = inventoryTasks.filter(function(t) { return new Date(t.createdAt) >= monthStart })
    let totalSurplus = 0
    let totalDeficit = 0
    inventoryTasks.forEach(function(t) {
      if (t.assetList) {
        t.assetList.forEach(function(item) {
          if (item.difference > 0) totalSurplus += item.difference
          if (item.difference < 0) totalDeficit += Math.abs(item.difference)
        })
      }
    })
    respond(res, {
      totalAssets: totalAssets,
      inUseCount: inUseCount,
      idleCount: idleCount,
      maintenanceCount: maintenanceCount,
      lowStockCount: lowStockCount,
      alertCount: alertCount,
      inspectionCount: inspectionCount,
      expiredCount: expiredCount,
      pendingCount: pendingCount,
      monthCount: monthTasks.length,
      quarterCount: inventoryTasks.length,
      totalSurplus: totalSurplus,
      totalDeficit: totalDeficit,
      scrappedCount: scrappedCount,
      alertAssets: lowStockAssets,
      maintenanceAssets: maintenanceAssets,
      inspectionWarningAssets: inspectionWarningAssets,
      expiredAssets: expiredAssets
    })
  } catch (error) {
    next(error)
  }
})

// 解析并预览导入数据
app.post('/api/assets/import/preview', async function(req, res, next) {
  try {
    await delay()
    
    // 简单的multipart处理（生产环境建议使用multer库）
    let body = []
    req.on('data', chunk => body.push(chunk))
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(body)
        const text = buffer.toString('utf-8')
        
        // 尝试解析为CSV
        let parsedData = []
        try {
          // 查找CSV内容
          const csvMatch = text.match(/资产名称[\s\S]*?(?=--)/)
          if (csvMatch) {
            const csvText = csvMatch[0].trim()
            parsedData = parseCSV(csvText)
          }
        } catch (e) {
          console.log('Parse error:', e)
        }
        
        // 验证数据
        const previewData = parsedData.map((row, idx) => validateRow(row, idx))
        currentPreviewData = previewData.filter(item => item.valid)
        
        respond(res, previewData)
      } catch (error) {
        next(error)
      }
    })
  } catch (error) {
    next(error)
  }
})

// 执行导入
app.post('/api/assets/import', async function(req, res, next) {
  try {
    await delay()
    
    let successCount = 0
    const today = new Date().toISOString().split('T')[0]
    
    currentPreviewData.forEach((item) => {
      if (!item.valid) return
      
      // 判断是否为易耗品
      const category = categories.find(c => c.id === item.categoryId)
      const isConsumable = isLowValueConsumable(item.categoryId, category?.name)
      
      if (isConsumable) {
        // 易耗品：一条记录
        globalSeq++
        const asset = {
          id: String(globalSeq),
          code: 'HX01-' + item.categoryId + '-' + String(globalSeq).padStart(6, '0'),
          name: item.name,
          model: item.model,
          categoryId: item.categoryId,
          categoryName: category?.name || '',
          locationId: item.locationId,
          locationName: item.locationName,
          status: 'IDLE',
          custodian: '',
          custodianName: item.custodianName,
          quantity: item.quantity,
          inUseCount: 0,
          pendingQuantity: 0,
          unit: item.unit,
          price: item.price,
          purchaseDate: item.purchaseDate || today,
          inspectionCycle: item.inspectionEnabled ? item.inspectionCycle : 0,
          nextInspectionDate: item.nextInspectionDate || '',
          inventoryEnabled: item.inventoryEnabled,
          alertEnabled: item.alertEnabled,
          alertMin: item.alertMin,
          images: [],
          created_at: today,
          updated_at: ''
        }
        assets.push(asset)
        successCount++
      } else {
        // 非易耗品：按数量逐条创建
        for (let i = 0; i < item.quantity; i++) {
          globalSeq++
          const asset = {
            id: String(globalSeq),
            code: 'HX01-' + item.categoryId + '-' + String(globalSeq).padStart(6, '0'),
            name: item.name,
            model: item.model,
            categoryId: item.categoryId,
            categoryName: category?.name || '',
            locationId: item.locationId,
            locationName: item.locationName,
            status: 'IDLE',
            custodian: '',
            custodianName: item.custodianName,
            quantity: 1,
            inUseCount: 0,
            pendingQuantity: 0,
            unit: item.unit,
            price: item.price,
            purchaseDate: item.purchaseDate || today,
            inspectionCycle: item.inspectionEnabled ? item.inspectionCycle : 0,
            nextInspectionDate: item.nextInspectionDate || '',
            inventoryEnabled: item.inventoryEnabled,
            alertEnabled: item.alertEnabled,
            alertMin: item.alertMin,
            images: [],
            created_at: today,
            updated_at: ''
          }
          assets.push(asset)
          successCount++
        }
      }
    })
    
    // 记录审计日志
    if (successCount > 0) {
      auditLogs.push(makeAuditLog('CREATE', '批量导入', 'u004', 
        `批量导入资产：成功 ${successCount} 条`))
    }
    
    respond(res, { successCount, failCount: 0 })
  } catch (error) {
    next(error)
  }
})



app.use(function(err, req, res, next) {
  console.error(err.stack)
  res.status(500).json({ code: 500, message: '服务器内部错误' })
})

app.listen(PORT, function() {
  console.log('Mock Server running on http://localhost:' + PORT)
  console.log('Assets:', assets.length, 'Categories:', categories.length, 'Locations:', locations.length)
})