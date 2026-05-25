import request from './request'

// 登录
export const login = (data) => request.post('/auth/login', data)

// 刷新 Token
export const refreshToken = (data) => request.post('/auth/refresh', data)

// 获取用户列表
export const getUsers = () => request.get('/users')
export const updateUser = (id, data) => request.put('/users/' + id, data)

