# 🚀 钉钉版固定资产管理 - 快速部署指南

## 一键部署到 Netlify

### 方法一：使用 Netlify Drop（最简单）

1. **构建项目**
   ```bash
   npm install
   npm run build:dingtalk
   ```

2. **打开 Netlify Drop**
   - 浏览器访问：https://app.netlify.com/drop

3. **上传文件**
   - 将整个项目文件夹拖拽到页面上传区域

4. **等待部署完成**
   - 约1-2分钟后获得访问地址

### 方法二：从 GitHub 部署

1. Fork 此项目到您的 GitHub
2. 访问 https://app.netlify.com
3. 点击 "Add new site" → "Import an existing project"
4. 连接 GitHub 并选择仓库
5. 配置构建命令和发布目录：
   - Build command: `npm run build:dingtalk`
   - Publish directory: `dist`
6. 点击 "Deploy site"

---

## 📱 钉钉应用配置

### 开发测试阶段（使用 Mock API）

1. 在 Netlify 环境变量中设置：
   ```
   VITE_USE_MOCK=true
   ```

2. 在钉钉开放平台创建企业内部应用：
   - 首页地址：`https://your-site-id.netlify.app/dingtalk`
   - PC端首页：`https://your-site-id.netlify.app`

3. 发布应用并设置可见范围

### 生产阶段（真实后端）

1. 部署后端服务
2. 配置环境变量：
   ```
   VITE_USE_MOCK=false
   VITE_API_BASE_URL=https://your-api-server.com/api
   VITE_DINGTALK_CORP_ID=your_corp_id
   ```

---

## 📦 文件结构说明

```
fixed-assets-h5/
├── src/
│   ├── views/
│   │   ├── DingtalkEntryPage.vue  # 钉钉登录页
│   │   └── EntryPage.vue           # 普通登录页
│   ├── utils/
│   │   └── dingtalk.js             # 钉钉 SDK 封装
│   └── api/
│       └── request.js              # API 请求（支持钉钉环境）
├── .env.dingtalk                   # 钉钉环境变量
├── netlify.toml                    # Netlify 部署配置
├── DINGTALK_DEPLOY.md             # 详细部署文档
└── package.json                    # 项目配置
```

---

## 🛠 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev:dingtalk

# 启动 Mock 服务
npm run server

# 同时启动前端和后端
npm run dev:full

# 构建钉钉版本
npm run build:dingtalk
```

访问：http://localhost:5173/dingtalk

---

## 📚 更多文档

- 详细部署文档：[DINGTALK_DEPLOY.md](./DINGTALK_DEPLOY.md)
- 项目说明：[README.md](./README.md)（如有）

---

## 💡 提示

- 首次部署建议先使用 Mock 模式验证前端功能
- 生产环境请配置 HTTPS 和 CORS
- 钉钉用户数据建议与企业组织架构同步
