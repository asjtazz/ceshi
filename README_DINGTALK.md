# 钉钉版固定资产管理 - 部署指南

## ✅ 项目已准备好部署！

### 📁 生成的文件
- `dist/` - 生产构建产物（可直接部署）
- `netlify.toml` - Netlify 部署配置
- `.env.dingtalk` - 钉钉环境配置模板
- `DINGTALK_DEPLOY.md` - 详细钉钉集成文档
- `DEPLOY_QUICKSTART.md` - 快速部署指南

---

## 🚀 快速部署（3 步）

### 1. 部署到 Netlify
```bash
# 方案一：使用 Netlify Drop （最简单）
# 打开 https://app.netlify.com/drop
# 将整个项目文件夹拖放到页面上

# 方案二：从 GitHub 部署
# 1. 将项目推送到您的 GitHub 仓库
# 2. 访问 https://app.netlify.com
# 3. 点击 "Add new site" -> "Import an existing project"
# 4. 连接 GitHub 并选择仓库
# 5. 配置构建命令：npm run build
# 6. 配置发布目录：dist
# 7. 点击 Deploy
```

### 2. 配置钉钉应用（开发模式先跳过）
```
钉钉开放平台：https://open-dingtalk.com/

开发模式（先不用配置）：
- VITE_USE_MOCK=true  # 使用本地 Mock API
- 直接测试功能
```

### 3. 访问应用
```
钉钉内访问：https://your-site-id.netlify.app/dingtalk
浏览器访问：https://your-site-id.netlify.app/
```

---

## 📱 钉钉应用配置（生产环境）

### 1. 创建企业内部应用
```
登录钉钉开放平台
→ 应用开发 → 企业内部应用
→ 点击创建应用
→ 填写基本信息：
  应用名称：固定资产管理
  应用描述：企业固定资产全生命周期管理系统
→ 确定创建
```

### 2. 配置应用信息
```
凭证与基础信息 → 获取：
  AppKey
  AppSecret
  AgentId

配置首页地址：
  应用首页：https://your-site-id.netlify.app/dingtalk
  电脑端首页：https://your-site-id.netlify.app/

配置权限：
  contact.user.base          - 获取用户基本信息
  contact.user.mobile.phone_number - 获取手机号
  contact.user.async        - 获取部门用户
  im.message                - 发送消息通知
```

### 3. 发布应用
```
版本管理与发布
→ 点击发布
→ 设置可见范围（全员或指定部门）
→ 确认发布
```

---

## 🖥️ 本地开发

```bash
# 安装依赖
npm install

# 启动本地开发（带 Mock 服务器）
npm run dev

# 启动 Mock 后端服务
npm run server

# 启动钉钉环境开发
npm run dev:dingtalk

# 构建生产版本
npm run build:dingtalk
```

---

## 📊 功能清单

### ✅ 已实现功能
- 📋 资产管理（新增/编辑/删除/搜索/筛选）
- 🔍 资产盘点（创建任务/执行盘点/盘盈盘亏处理）
- 📝 申请审批（领用/归还/维修/报废/调拨）
- 📱 钉钉登录（免登/模拟登录）
- 📄 审计日志（全流程操作记录）
- 📥 批量导入资产
- 📤 导出 Excel
- 👥 三级权限（L1/L2/L3）

### 📁 文件结构
```
fixed-assets-h5/
├── dist/                          # 生产构建
├── src/
│   ├── views/
│   │   ├── DingtalkEntryPage.vue   # 钉钉登录页
│   │   └── ...
│   ├── utils/
│   │   └── dingtalk.js             # 钉钉 SDK 工具
│   └── api/
├── server/                         # Mock 后端
├── netlify.toml                    # Netlify 配置
└── package.json
```

---

## 🔧 环境变量

在 Netlify 后台 → Site settings → Environment variables：

```bash
# 开发模式（使用 Mock API）
VITE_USE_MOCK=true

# 生产模式
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://your-api-server.com/api
VITE_DINGTALK_CORP_ID=your-corp-id
VITE_DINGTALK_APP_KEY=your-app-key
VITE_DINGTALK_APP_SECRET=your-app-secret
VITE_DINGTALK_AGENT_ID=your-agent-id
```

---

## 📚 更多文档

- 详细部署文档：`DINGTALK_DEPLOY.md`
- 快速启动指南：`DEPLOY_QUICKSTART.md`

---

## 🎉 测试账号

| 角色 | 账号 | 密码 | 权限 |
|------|------|------|------|
| L1 员工 | 13800000001 | - | 查看资产、提交申请 |
| L2 管理员 | admin | - | 资产管理、审批、盘点 |
| L3 超管 | manager | - | 系统配置、审计日志 |

---

## 💡 提示

1. **开发阶段**：使用 Mock API 测试功能
2. **生产部署**：准备好后端 API 服务
3. **数据备份**：建议使用云数据库（Supabase/阿里云等）

---

## 📞 帮助

部署过程中遇到问题？
- 查看 `DINGTALK_DEPLOY.md`
- 访问 Netlify 文档：https://docs.netlify.com/
- 访问钉钉开发文档：https://open-dingtalk.com/document
