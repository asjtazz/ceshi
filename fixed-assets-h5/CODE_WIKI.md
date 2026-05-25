# 固定资产管理 H5 微应用 - Code Wiki

## 1. 项目概述

### 1.1 项目简介
这是一个完全适配钉钉的固定资产管理 H5 微应用，实现了资产全生命周期管理，包括资产入库、领用、归还、调拨、报废、盘点等功能，支持多角色权限管理（员工 L1、管理员 L2、超管 L3）。

### 1.2 技术栈
- **前端框架**：Vue 3 (Composition API)
- **UI 组件库**：Vant 4
- **构建工具**：Vite 5
- **状态管理**：Pinia
- **路由**：Vue Router 4
- **HTTP 请求**：Axios
- **后端 Mock**：Express
- **数据可视化**：ECharts (可选)
- **其他**：file-saver、html2canvas、qrcode 等

### 1.3 项目状态
- 版本：V9
- 状态：BUG 修复完成，待进入钉钉接入与生产部署阶段

---

## 2. 项目架构

### 2.1 目录结构
```
fixed-assets-h5/
├── dist/                     # 构建输出
├── server/
│   └── index.js              # Express Mock Server（所有 API + 数据）
├── src/
│   ├── api/                  # API 封装
│   │   ├── approvals.js
│   │   ├── assets.js
│   │   ├── auth.js
│   │   ├── config.js
│   │   ├── dashboard.js
│   │   ├── debts.js
│   │   ├── export.js
│   │   ├── inventory.js
│   │   └── request.js        # Axios 实例配置
│   ├── components/           # 公共组件
│   │   ├── common/
│   │   │   ├── AppShell.vue
│   │   │   ├── DataTable.vue
│   │   │   ├── ExportButton.vue
│   │   │   ├── StatusBadge.vue
│   │   │   └── TreeSelector.vue
│   │   ├── global/
│   │   │   └── AppShell.vue
│   │   ├── l1/
│   │   │   ├── ApplyForm.vue
│   │   │   └── L1HomeCards.vue
│   │   ├── l2/
│   │   │   ├── ApprovalOverview.vue
│   │   │   └── DashboardPanel.vue
│   │   └── l3/
│   │       └── AuditLogViewer.vue
│   ├── router/
│   │   └── index.js          # 路由配置
│   ├── stores/
│   │   └── auth.js           # 认证状态管理
│   ├── styles/
│   │   └── global.css
│   ├── utils/
│   │   ├── constants.js      # 常量定义
│   │   ├── dd.js             # 钉钉 API 封装
│   │   └── tree.js           # 树结构工具
│   ├── views/                # 页面组件
│   │   ├── EntryPage.vue     # 登录页
│   │   ├── l1/               # 员工端（L1）
│   │   ├── l2/               # 管理员端（L2）
│   │   ├── l3/               # 超管端（L3）
│   │   └── debts/            # 欠款管理
│   ├── App.vue
│   └── main.js               # 入口文件
├── index.html
├── package.json
├── vite.config.js
├── start-bg.bat
├── start-servers.bat
└── H5开发方案.md
```

### 2.2 整体架构图
```
┌─────────────────────────────────────────────────────────────────┐
│                         前端 (Vue 3)                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │  Views (页面)    │  │ Components (组件)│  │ Stores (状态) │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                     Vue Router                           │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API 层 (Axios + request.js)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Mock Server (Express)                        │
│              (所有 API 端点 + 内存数据存储)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 权限模型与角色

### 3.1 三端角色权限表

| 角色 | 路由前缀 | 职责范围 | 典型用户 |
|------|---------|---------|---------|
| L1（员工） | /l1/ | 领用/归还/报修/报废申请、查看名下资产、查看申请记录 | 张三、李四、王五、赵六 |
| L2（管理员） | /l2/ | 资产管理(CRUD)、审批、盘点、欠款管理、工作台 | 管理员(u004) |
| L3（超管） | /l3/ | 系统配置(分类/地点/审批流程/编码规则/预警)、用户权限管理、审计日志、数据总览 | 系统管理员 |

### 3.2 路由守卫机制
路由守卫在 `src/router/index.js` 中实现，根据用户角色拦截并跳转到对应首页。

---

## 4. 主要模块职责

### 4.1 认证模块 (`src/stores/auth.js`)
- 管理用户登录状态
- 存储用户信息、Token、角色等
- 从 localStorage 恢复登录状态
- 登录/登出功能

### 4.2 API 模块 (`src/api/`)
- **request.js**: Axios 实例配置，请求/响应拦截器
- **auth.js**: 登录认证、用户管理相关 API
- **assets.js**: 资产 CRUD、资产追踪相关 API
- **approvals.js**: 申请审批相关 API
- **debts.js**: 欠款管理相关 API
- **inventory.js**: 盘点相关 API
- **config.js**: 系统配置（分类、地点、流程等）相关 API
- **dashboard.js**: 数据看板相关 API
- **export.js**: 数据导出相关 API

### 4.3 路由模块 (`src/router/index.js`)
- 配置所有页面路由
- 实现角色权限路由守卫
- 路由懒加载

### 4.4 公共组件 (`src/components/`)
- **AppShell**: 应用壳组件，提供统一的导航栏、底部导航等
- **DataTable**: 数据表格组件
- **ExportButton**: 导出按钮组件
- **StatusBadge**: 状态标签组件
- **TreeSelector**: 树形选择器组件（用于分类、地点选择）

### 4.5 后端 Mock Server (`server/index.js`)
- 提供所有 API 端点
- 内存数据存储（无持久化）
- 包含资产、用户、申请、分类、地点等完整数据

---

## 5. 关键类与函数说明

### 5.1 前端关键代码

#### 5.1.1 `useAuthStore` (Pinia Store)
```javascript
// 文件: src/stores/auth.js
export const useAuthStore = defineStore('auth', () => {
  // 状态
  const userInfo = ref(null)
  
  // 计算属性
  const role = computed(() => userInfo.value?.role || '')
  const isLoggedIn = computed(() => !!userInfo.value)
  
  // 方法
  refreshFromStorage() // 从 localStorage 恢复登录状态
  setUser(user, token, refreshToken) // 设置用户信息
  logout() // 登出
})
```

#### 5.1.2 `request.js` Axios 配置
```javascript
// 文件: src/api/request.js
// - 基础 URL 配置
// - 请求拦截器：添加 Authorization header
// - 响应拦截器：统一错误处理、Token 刷新
```

#### 5.1.3 路由守卫
```javascript
// 文件: src/router/index.js
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (!to.meta.role) { next(); return }
  if (!authStore.isLoggedIn) { next('/'); return }
  if (authStore.role !== to.meta.role) { 
    next(`/${authStore.role.toLowerCase()}/home`); 
    return 
  }
  next()
})
```

### 5.2 后端关键代码 (Mock Server)

#### 5.2.1 核心工具函数
```javascript
// 文件: server/index.js
delay(ms) // 模拟网络延迟
respond(res, data, msg) // 统一响应格式
respondList(res, list, total) // 列表数据响应
enrichAsset(a, cats, locs) // 补充资产的分类和地点信息
makeAuditLog(action, target, operator, detail) // 生成审计日志
```

#### 5.2.2 主要数据结构
- **users**: 用户列表
- **assets**: 资产列表
- **applications**: 申请列表
- **categories**: 资产分类（树形结构）
- **locations**: 存放地点（树形结构）
- **approvalMapping**: 审批流程配置
- **auditLogs**: 审计日志
- **inventoryTasks**: 盘点任务
- **debts**: 欠款记录

#### 5.2.3 关键 API 端点
- `POST /api/auth/login` - 登录
- `GET /api/assets` - 获取资产列表
- `POST /api/applications` - 创建申请
- `PUT /api/applications/:id/approve` - 审批通过
- `PUT /api/applications/:id/reject` - 审批拒绝
- `GET /api/dashboard` - L2 数据看板
- `GET /api/l3/dashboard` - L3 数据看板
- `GET /api/debts` - 欠款列表

---

## 6. 依赖关系

### 6.1 package.json 依赖
```json
{
  "dependencies": {
    "axios": "^1.7.2",
    "echarts": "^5.5.0",
    "file-saver": "^2.0.5",
    "html2canvas": "^1.4.1",
    "pinia": "^2.1.7",
    "qrcode": "^1.5.3",
    "vant": "^4.9.0",
    "vue": "^3.4.0",
    "vue-request": "^2.0.0",
    "vue-router": "^4.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "concurrently": "^8.2.2",
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "pdfkit": "^0.15.0",
    "vite": "^5.4.0"
  }
}
```

---

## 7. 项目运行方式

### 7.1 开发环境
```bash
# 安装依赖
npm install

# 启动完整开发环境（前端 + 后端）
npm run dev:full

# 或者分别启动
npm run dev      # 前端 Vite (端口 3003)
npm run server   # 后端 Express (端口 3002)
```

### 7.2 访问地址
- 前端: http://localhost:3003
- 后端 API: http://localhost:3002/api

### 7.3 测试账号
| 角色 | 用户名 | 密码 |
|------|--------|------|
| L1（员工） | 张三/李四/王五/赵六 | 123456 |
| L2（管理员） | 管理员 | 123456 |
| L3（超管） | 系统管理员 | 123456 |

### 7.4 生产构建
```bash
# 构建
npm run build

# 预览构建结果
npm run preview
```

---

## 8. 数据模型

### 8.1 资产模型 (Asset)
```javascript
{
  id: string,
  code: string,           // 资产编码
  name: string,
  model: string,
  categoryId: string,
  categoryName: string,
  locationId: string,
  locationName: string,
  status: 'IN_USE'|'IDLE'|'MAINTENANCE'|'INSPECTION'|'SCRAPPED',
  custodian: string,      // 保管人 ID
  custodianName: string,
  quantity: number,
  inUseCount: number,
  unit: string,
  price: number,
  purchaseDate: string,
  inspectionCycle: number,
  nextInspectionDate: string,
  alertEnabled: boolean,
  alertMin: number,
  images: array,
  created_at: string,
  updated_at: string
}
```

### 8.2 申请模型 (Application)
```javascript
{
  id: string,
  type: 'receive'|'return'|'repair'|'scrap'|'loss'|'transfer',
  typeLabel: string,
  assetId: string,
  assetName: string,
  assetCode: string,
  applicantId: string,
  applicantName: string,
  reason: string,
  quantity: number,
  status: 'PENDING'|'APPROVED'|'REJECTED',
  approverId: string,
  handledAt: string,
  createdAt: string,
  images: array,
  suggestScrap: boolean,
  problem: string
}
```

### 8.3 欠款模型 (Debt)
```javascript
{
  id: string,
  debtorName: string,
  amount: number,
  paidAmount: number,
  balance: number,
  status: 'PENDING'|'OVERDUE'|'SETTLED',
  responsiblePerson: string,
  dueDate: string,
  remark: string,
  createdAt: string,
  updatedAt: string,
  operator: string,
  payMethod: array  // 还款记录
}
```

---

## 9. 常量定义

见 `src/utils/constants.js`，包含：
- 资产状态 (ASSET_STATUS)
- 申请类型 (APPLICATION_TYPES)
- 申请状态 (APPLICATION_STATUS)
- 申请理由 (RECEIVE_REASONS, SCRAP_REASONS)
- 检测周期 (INSPECTION_CYCLES)
- 单位 (ASSET_UNITS)
- 库存预警阈值 (STOCK_ALERT_THRESHOLD)

---

## 10. 后续开发计划

### Phase 1: V9 BUG 修复（已完成）
- ✅ 服务端修复
- ✅ L1/L2/L3 页面修复
- ✅ 路由/API 补全
- ✅ 构建验证

### Phase 2: 遗留问题修复
- ⏳ 存放地点三级数据
- ⏳ 告警页面类型筛选
- ⏳ 盘盈盘亏数据完善
- ⏳ 欠款联想输入+已核销回溯
- ⏳ L3 欠款人员配置 UI
- ⏳ L1 首页 UI 美化
- ⏳ 审批流程保存/加载验证
- ⏳ 预警设置持久化

### Phase 3: 钉钉微应用接入
- ⏳ 钉钉 JSAPI 鉴权
- ⏳ 钉钉免登
- ⏳ 钉钉工作台入口配置
- ⏳ 钉钉消息推送（审批通知/预警提醒）
- ⏳ 移动端适配优化

### Phase 4: 测试体系
- ⏳ 单元测试（Vitest）
- ⏳ 核心组件快照测试（3+ 组件）
- ⏳ API Mock 测试
- ⏳ E2E 流程测试

### Phase 5: 生产部署
- ⏳ Vite 打包优化
- ⏳ 环境变量配置（.env.production）
- ⏳ Nginx 反向代理
- ⏳ 真机调试
- ⏳ 上线检查清单

---

## 11. 代码风格规范

| 类别 | 规范 |
|------|------|
| Vue 文件 | `<script setup>` Composition API |
| 组件命名 | PascalCase (AssetDetailPage.vue) |
| 变量命名 | camelCase (activeNames) |
| 常量命名 | UPPER_SNAKE_CASE |
| 样式 | `<style scoped>` |
| 数据管理 | Pinia（全局认证状态） |
| API 请求 | Axios + @/api/ 模块化封装 |
| 路由守卫 | router.beforeEach 按 meta.role 拦截 |
| 服务端 | ES Modules（"type": "module"） |
| 函数风格 | async/await + try-catch |

---

*文档版本: v1.0*
*最后更新: 2026-05-21*
