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

async function testReturnWithLinkage() {
  console.log('========================================');
  console.log('归还申请联动功能测试');
  console.log('========================================\n');

  // 1. 先获取一个在用资产（L1用户张三的资产）
  console.log('1. 获取张三名下的在用资产...');
  const assetsRes = await request(
    { hostname: 'localhost', port: 3002, path: '/api/assets?custodian=u001', method: 'GET' }
  );
  const userAssets = assetsRes.data?.list?.filter(a => a.inUseCount > 0) || [];
  console.log('   张三名下的在用资产:', userAssets.length, '个');
  
  if (userAssets.length > 0) {
    const testAsset = userAssets[0];
    console.log('   测试资产:', testAsset.name);
    console.log('   资产编码:', testAsset.code);
    console.log('   当前在用数量:', testAsset.inUseCount);
    console.log('   ✅ 成功\n');

    // 2. 测试提交归还申请（带联动信息）
    console.log('2. 测试提交归还申请（建议报修）...');
    const returnAppRes = await request(
      { hostname: 'localhost', port: 3002, path: '/api/applications', method: 'POST' },
      {
        type: 'return',
        assetId: testAsset.id,
        assetName: testAsset.name,
        assetCode: testAsset.code,
        applicantId: 'u001',
        applicantName: '张三',
        reason: '设备损坏',
        quantity: 1,
        suggestRepair: true,
        suggestScrap: false,
        problem: '设备显示屏异常'
      }
    );
    
    if (returnAppRes.code === 0) {
      console.log('   ✅ 申请提交成功');
      console.log('   申请ID:', returnAppRes.data?.id);
      console.log('   申请类型:', returnAppRes.data?.type);
      console.log('   建议报修:', returnAppRes.data?.suggestRepair);
      console.log('   建议报废:', returnAppRes.data?.suggestScrap);
      console.log('   问题描述:', returnAppRes.data?.problem);
      console.log('   状态:', returnAppRes.data?.status);
      
      // 3. 测试审批通过
      console.log('\n3. 测试审批通过...');
      const approveRes = await request(
        { hostname: 'localhost', port: 3002, path: `/api/applications/${returnAppRes.data?.id}/approve`, method: 'PUT' },
        { approverId: 'u004' }
      );
      
      console.log('   审批结果:', approveRes.data?.status === 'APPROVED' ? '✅ 通过' : '❌ 失败');
      console.log('   审批人:', approveRes.data?.approverId);
      
      // 4. 验证资产数量变化
      console.log('\n4. 验证资产数量变化...');
      const updatedAssetRes = await request(
        { hostname: 'localhost', port: 3002, path: `/api/assets/${testAsset.id}`, method: 'GET' }
      );
      console.log('   归还后在用数量:', updatedAssetRes.data?.inUseCount);
      console.log('   归还前在用数量:', testAsset.inUseCount);
      console.log('   变化:', testAsset.inUseCount - updatedAssetRes.data?.inUseCount, '个');
      
    } else {
      console.log('   ❌ 申请提交失败:', returnAppRes.message);
    }
  } else {
    console.log('   ⚠️  没有找到可测试的资产');
  }

  console.log('\n========================================');
  console.log('✅ 归还申请联动功能测试完成');
  console.log('========================================\n');
  
  // 5. 测试预警设置保存
  console.log('5. 测试预警设置功能...');
  const alertRes = await request(
    { hostname: 'localhost', port: 3002, path: '/api/config/alert-settings', method: 'POST' },
    { alertEnabled: true, alertMin: 8, inspectionWarningDays: 45 }
  );
  console.log('   预警设置保存:', alertRes.code === 0 ? '✅ 成功' : '❌ 失败');
  console.log('   新的预警阈值:', alertRes.data?.settings?.alertMin);
  console.log('   新的检定预警天数:', alertRes.data?.settings?.inspectionWarningDays);
  
  console.log('\n========================================');
  console.log('🎉 所有功能测试完成！');
  console.log('========================================');
}

testReturnWithLinkage().catch(console.error);
