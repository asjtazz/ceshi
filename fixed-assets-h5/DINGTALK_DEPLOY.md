# 钉钉版固定资产管理系统 - 部署文档

## 一、Netlify 快速部署

### 1.1 部署步骤

1. **打开 Netlify Drop**
   - 访问 https://app.netlify.com/drop
   
2. **构建项目**
   - 本地执行 `npm run build`
   - 或者直接部署源文件（Netlify会自动构建）

3. **上传文件**
   - 将整个项目文件夹（包含 package.json）拖拽到 Netlify Drop 页面
   
4. **配置环境变量（可选）**
   - 在 Netlify 后台 → Site settings → Environment variables
   - 添加以下变量（钉钉环境）:
     ```
     VITE_USE_MOCK=true
     VITE_DINGTALK_CORP_ID=your_corp_id_here
     VITE_API_BASE_URL=https://your-api-domain.com/api
     ```

### 1.2 使用 Netlify 部署按钮

将此仓库推送到 GitHub 后，可使用：

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=your_repo_url)

---

## 二、钉钉应用配置

### 2.1 创建钉钉企业内部应用

1. 登录 [钉钉开放平台](https://open-dingtalk.com/)
2. 进入 **应用开发** → **企业内部应用**
3. 点击 **创建应用**
4. 填写基本信息：
   - 应用名称：固定资产管理
   - 应用描述：企业固定资产全生命周期管理系统
5. 点击 **确定创建**

### 2.2 配置应用信息

1. **获取凭证**
   - 在 **凭证与基础信息** 中获取：
     - AppKey
     - AppSecret
     - AgentId
   
2. **配置服务器出口IP**
   - Netlify IP 段（可选，安全起见配置）

3. **配置首页地址**
   - 应用首页地址：`https://your-site-id.netlify.app/dingtalk`
   - 电脑端首页：`https://your-site-id.netlify.app/`

4. **配置权限**
   - 在 **权限管理** 中申请：
     - `contact.user.base`：获取用户基本信息
     - `contact.user.mobile.phone_number`：获取用户手机号
     - `contact.user.async`：获取部门用户
     - `im.message`：发送消息通知

### 2.3 发布应用

1. 在 **版本管理与发布** 中点击 **发布**
2. 设置可见范围（全员或指定部门）
3. 点击 **确认发布**

---

## 三、后端服务（Mock/真实API）

### 3.1 开发环境：使用 Mock 服务

本地启动 Mock 服务：

```bash
npm run server
```

配置环境变量：
```
VITE_USE_MOCK=true
```

### 3.2 生产环境：部署后端

后端可部署到：
- Vercel
- Railway
- 阿里云/腾讯云服务器
- 钉钉云开发

**API 接口要求：**

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/dingtalk` | POST | 钉钉登录 |
| `/api/assets` | GET/POST | 资产管理 |
| `/api/assets/:id` | GET/PUT/DELETE | 资产详情 |
| `/api/approvals` | GET/POST/PUT | 审批管理 |
| `/api/inventory` | GET/POST/PUT | 盘点管理 |
| `/api/users` | GET | 用户管理 |
| `/api/audit-logs` | GET | 审计日志 |

---

## 四、数据库选择

### 4.1 云数据库推荐

- **Supabase**（PostgreSQL）：免费额度够用
- **Firebase**：免费套餐
- **钉钉云开发数据库**：深度集成
- **MongoDB Atlas**：免费512MB

### 4.2 图片存储

- **阿里云 OSS** / **腾讯云 COS**
- **Supabase Storage**
- **钉钉云存储**

---

## 五、本地开发测试

### 5.1 测试钉钉环境

钉钉开发者工具下载：
https://open-dingtalk.com/tools

使用开发者工具调试：
1. 打开「钉钉开发者工具」
2. 选择「企业内部应用」
3. 输入开发地址 `http://localhost:5173/dingtalk`
4. 扫码登录测试

### 5.2 浏览器测试

在非钉钉环境访问 `/dingtalk` 会显示开发模式模拟界面。

---

## 六、常见问题

### Q1: 钉钉登录提示无权限？
A: 检查：
   - 应用是否发布
   - 用户是否在可见范围内
   - 权限配置是否正确申请并通过

### Q2: 图片无法上传？
A: 需要配置跨域（CORS）或使用钉钉内置上传

### Q3: 消息通知收不到？
A: 检查 `im.message` 权限是否申请

---

## 七、下一步建议

1. **完善后端接口**：根据 Mock 接口实现真实 API
2. **数据迁移**：将现有数据迁移到云数据库
3. **安全加固**：HTTPS、JWT、权限控制
4. **性能优化**：CDN 加速、图片优化
5. **监控告警**：错误日志、性能监控

---

## 联系与支持

部署过程中如有问题，可查看：
- 钉钉开发文档：https://open-dingtalk.com/document
- Netlify 文档：https://docs.netlify.com/
