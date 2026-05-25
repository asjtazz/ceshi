# 固定资产管理 H5 微应用 - 修改方案

## 1. 代码问题分析

通过对项目代码的深入分析，发现了以下需要修复的问题：

---

## 2. 关键问题与修复方案

### 2.1 问题 1: 服务端代码语法错误 (高优先级)

**位置**: `server/index.js` 第 477 行

**问题描述**:
```javascript
if (req.body.method) d.payMethod.push({ 
  amount: payAmount,  // ❌ payAmount 变量未定义！
  method: req.body.method, 
  date: new Date().toLocaleString('zh-CN',{hour12:false}).replace(/\//g,'-') 
});
```

**修复方案**:
需要在该函数中定义 `payAmount` 变量，或者从 `req.body` 中获取金额。

---

### 2.2 问题 2: 服务端代码结构错误 (高优先级)

**位置**: `server/index.js` 第 537 行

**问题描述**:
```javascript
app.listen(PORT, function() {
  console.log('Mock Server running on http://localhost:' + PORT)
  console.log('Assets: ' + assets.length + ' | Categories: ' + categories.length + ' | Locations: ' + locations.length)
})// ===== Asset CRUD =====  // ❌ 注释错误地放在了这里！
app.post('/api/assets', async function(req, res) { ... })
```

`app.listen()` 应该放在所有路由定义之后，而不是中间！这会导致后面的路由无法正常注册。

**修复方案**:
将 `app.listen()` 移动到文件末尾。

---

### 2.3 问题 3: 服务端缺少统一错误处理 (中优先级)

**问题描述**:
所有的路由处理器都没有 try-catch 包裹，一旦出现异常会导致整个服务崩溃。

**修复方案**:
1. 添加统一的错误处理中间件
2. 或者为每个 async 路由处理器添加 try-catch

---

### 2.4 问题 4: 预警设置未持久化 (低优先级)

**问题描述**:
在 `server/index.js` 中，`POST /api/config/alert-settings` 接口只是简单返回成功，但没有将设置保存到任何变量中。

**修复方案**:
在服务端添加 `alertSettings` 全局变量来存储预警配置。

---

### 2.5 问题 5: 存放地点数据缺少第三级 (低优先级)

**问题描述**:
虽然前端支持三级地点选择，但 `server/index.js` 中的 `locations` 数组只有两级数据。

**修复方案**:
补充第三级地点数据，例如：
```javascript
{ id:'HX010101', name:'总经理办公室', parentId:'HX0101' },
{ id:'HX010102', name:'财务室', parentId:'HX0101' },
```

---

## 3. 具体修复步骤

### 步骤 1: 修复服务端代码语法和结构问题

让我们修复 `server/index.js` 中的问题：

#### 修复 1.1: 修复第 477 行的未定义变量
```javascript
// 在 app.put('/api/debts/:id', ...) 函数中
// 添加 payAmount 定义
var payAmount = parseFloat(req.body.amount) || 0;  // 新增
if (req.body.method) d.payMethod.push({ 
  amount: payAmount,  // 现在可以使用了
  method: req.body.method, 
  date: new Date().toLocaleString('zh-CN',{hour12:false}).replace(/\//g,'-') 
});
```

#### 修复 1.2: 移动 app.listen() 到文件末尾
将 `app.listen()` 调用从第 537 行移动到文件最后。

#### 修复 1.3: 添加预警设置持久化
```javascript
// 在文件顶部添加
var alertSettings = {
  alertEnabled: true,
  alertMin: 5,
  inspectionWarningDays: 30
};

// 修改 POST /api/config/alert-settings 接口
app.post('/api/config/alert-settings', async function(req, res) {
  await delay()
  alertSettings = { ...alertSettings, ...req.body }  // 保存设置
  respond(res, { ok: true, settings: alertSettings })
})
```

---

## 4. 遗留问题改进建议

除了上述 bug 修复外，以下是对项目的改进建议：

### 4.1 代码质量改进
- 添加 ESLint 规范检查
- 添加 Prettier 自动格式化
- 为关键函数添加 JSDoc 注释

### 4.2 功能完善建议
1. **告警页面类型筛选**: 实现 `AlertsPage.vue` 按类型筛选的功能
2. **盘盈盘亏完善**: 完善盘点任务的 items 数据结构和相关逻辑
3. **欠款联想输入**: 添加欠款单位联想输入功能
4. **L3 欠款人员配置 UI**: 在 ProfilePage 或新增页面添加欠款权限配置 UI
5. **L1 首页 UI 美化**: 增加卡片阴影或背景色区分不同栏目

### 4.3 钉钉集成准备
- 在 `src/utils/dd.js` 中完善钉钉 JSAPI 的封装
- 实现钉钉免登流程
- 添加钉钉消息推送功能

---

## 5. 修复优先级总结

| 优先级 | 问题 | 影响 |
|--------|------|------|
| 🔴 高 | 服务端语法和结构错误 | 导致服务无法正常运行 |
| 🟡 中 | 缺少统一错误处理 | 服务不稳定，容易崩溃 |
| 🟢 低 | 其他遗留问题 | 功能不完善，但不影响核心使用 |

---

## 6. 验证步骤

修复完成后，请按以下步骤验证：

1. 启动服务 `npm run dev:full`
2. 访问 http://localhost:3003
3. 使用测试账号登录，测试各角色功能
4. 测试欠款管理的添加、编辑、还款功能
5. 测试资产新增功能
6. 确认所有 API 端点正常响应

---

*文档版本: v1.0*
*最后更新: 2026-05-21*
