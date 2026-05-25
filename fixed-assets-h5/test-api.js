import http from 'http';

const data = JSON.stringify({
  username: '管理员',
  password: '123456'
});

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('登录测试:');
    console.log(body);
  });
});

req.write(data);
req.end();
