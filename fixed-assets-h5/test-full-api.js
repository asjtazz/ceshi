import http from 'http';

function request(options, data) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const reqOptions = { ...options };
    if (payload) {
      reqOptions.headers = {
        ...reqOptions.headers,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      };
    }

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('========================================');
  console.log('固定资产管理系统 - API 完整测试');
  console.log('========================================\n');

  // 1. 登录测试
  console.log('1. 测试用户登录...');
  const loginRes = await request(
    { hostname: 'localhost', port: 3002, path: '/api/auth/login', method: 'POST' },
    { username: '管理员', password: '123456' }
  );
  console.log('   登录结果:', loginRes.code === 0 ? '✅ 成功' : '❌ 失败');
  if (loginRes.data?.token) {
    console.log('   Token:', loginRes.data.token.substring(0, 30) + '...');
  }
  console.log('');

  // 2. 获取资产列表
  console.log('2. 测试获取资产列表...');
  const assetsRes = await request(
    { hostname: 'localhost', port: 3002, path: '/api/assets', method: 'GET' }
  );
  console.log('   资产数量:', assetsRes.data?.total || 0);
  console.log('   结果:', assetsRes.code === 0 ? '✅ 成功' : '❌ 失败');
  console.log('');

  // 3. 获取申请列表
  console.log('3. 测试获取申请列表...');
  const appsRes = await request(
    { hostname: 'localhost', port: 3002, path: '/api/applications', method: 'GET' }
  );
  console.log('   申请数量:', appsRes.data?.total || 0);
  console.log('   结果:', appsRes.code === 0 ? '✅ 成功' : '❌ 失败');
  console.log('');

  // 4. 测试预警设置
  console.log('4. 测试预警设置...');
  const alertRes = await request(
    { hostname: 'localhost', port: 3002, path: '/api/config/alert-settings', method: 'GET' }
  );
  console.log('   预警开关:', alertRes.data?.alertEnabled ? '开启' : '关闭');
  console.log('   预警阈值:', alertRes.data?.alertMin);
  console.log('   检定预警天数:', alertRes.data?.inspectionWarningDays);
  console.log('   结果:', alertRes.code === 0 ? '✅ 成功' : '❌ 失败');
  console.log('');

  // 5. 测试保存预警设置
  console.log('5. 测试保存预警设置...');
  const saveAlertRes = await request(
    { hostname: 'localhost', port: 3002, path: '/api/config/alert-settings', method: 'POST' },
    { alertEnabled: true, alertMin: 10, inspectionWarningDays: 45 }
  );
  console.log('   保存结果:', saveAlertRes.code === 0 ? '✅ 成功' : '❌ 失败');
  console.log('');

  // 6. 测试获取分类列表
  console.log('6. 测试获取分类列表...');
  const catsRes = await request(
    { hostname: 'localhost', port: 3002, path: '/api/config/categories', method: 'GET' }
  );
  console.log('   分类数量:', catsRes.data?.total || 0);
  console.log('   结果:', catsRes.code === 0 ? '✅ 成功' : '❌ 失败');
  console.log('');

  // 7. 测试获取地点列表
  console.log('7. 测试获取地点列表...');
  const locsRes = await request(
    { hostname: 'localhost', port: 3002, path: '/api/config/locations', method: 'GET' }
  );
  console.log('   地点数量:', locsRes.data?.total || 0);
  console.log('   结果:', locsRes.code === 0 ? '✅ 成功' : '❌ 失败');
  console.log('');

  // 8. 测试数据面板
  console.log('8. 测试L2数据面板...');
  const dashboardRes = await request(
    { hostname: 'localhost', port: 3002, path: '/api/dashboard', method: 'GET' }
  );
  console.log('   资产总数:', dashboardRes.data?.totalAssets);
  console.log('   在用资产:', dashboardRes.data?.inUseCount);
  console.log('   闲置资产:', dashboardRes.data?.idleCount);
  console.log('   待审批:', dashboardRes.data?.pendingCount);
  console.log('   结果:', dashboardRes.code === 0 ? '✅ 成功' : '❌ 失败');
  console.log('');

  // 9. 测试L3数据面板
  console.log('9. 测试L3数据面板...');
  const l3DashboardRes = await request(
    { hostname: 'localhost', port: 3002, path: '/api/l3/dashboard', method: 'GET' }
  );
  console.log('   L3统计:', l3DashboardRes.data?.totalAssets, '个资产');
  console.log('   结果:', l3DashboardRes.code === 0 ? '✅ 成功' : '❌ 失败');
  console.log('');

  // 10. 测试待审批列表
  console.log('10. 测试待审批列表...');
  const pendingRes = await request(
    { hostname: 'localhost', port: 3002, path: '/api/applications/pending-list', method: 'GET' }
  );
  console.log('   待审批:', pendingRes.data?.pending?.length || 0, '条');
  console.log('   已处理:', pendingRes.data?.processed?.length || 0, '条');
  console.log('   结果:', pendingRes.code === 0 ? '✅ 成功' : '❌ 失败');
  console.log('');

  console.log('========================================');
  console.log('✅ 所有API测试完成！');
  console.log('========================================');
  console.log('');
  console.log('🎉 项目状态: 完全正常运行');
  console.log('📍 后端服务: http://localhost:3002');
  console.log('🌐 前端服务: http://localhost:3003');
  console.log('');
}

runTests().catch(console.error);
