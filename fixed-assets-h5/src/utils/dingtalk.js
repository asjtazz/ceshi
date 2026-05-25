import { useLoadingStore } from '@/stores/loading'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

const isDingTalk = () => {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('dingtalk')
}

let ddSDK = null

export const initDingTalk = async () => {
  if (!isDingTalk()) {
    console.warn('非钉钉环境，使用模拟登录')
    return
  }

  try {
    // 动态加载钉钉SDK
    if (!window.dd) {
      const script = document.createElement('script')
      script.src = 'https://g.alicdn.com/dingding/open-develop/1.19.1/dingtalk.js'
      await new Promise((resolve, reject) => {
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })
    }
    ddSDK = window.dd
    return ddSDK
  } catch (error) {
    console.error('钉钉SDK加载失败:', error)
    throw error
  }
}

export const dingtalkLogin = async () => {
  const loading = useLoadingStore()
  const auth = useAuthStore()

  try {
    if (!isDingTalk()) {
      console.log('开发环境模拟登录')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockUsers = [
        { name: '张三', phone: '13800000001', role: 'L1', userid: 'mock_001' },
        { name: '李四', phone: '13800000002', role: 'L1', userid: 'mock_002' },
        { name: '赵六', phone: 'admin', role: 'L2', userid: 'mock_admin' },
        { name: '管理员', phone: 'manager', role: 'L3', userid: 'mock_manager' }
      ]
      
      const selectedUser = mockUsers[0]
      auth.setUser(selectedUser)
      
      router.push(`/${selectedUser.role.toLowerCase()}/home`)
      return
    }

    await initDingTalk()
    
    loading.startLoading('登录中…')
    
    // 获取免登授权码
    const authCode = await new Promise((resolve, reject) => {
      ddSDK.runtime.permission.requestAuthCode({
        corpId: import.meta.env.VITE_DINGTALK_CORP_ID,
        onSuccess: (result) => resolve(result.code),
        onFail: (err) => reject(err)
      })
    })
    
    // 使用授权码换取用户信息
    const userInfo = await exchangeCodeForUserInfo(authCode)
    
    // 登录应用
    auth.setUser(userInfo)
    
    // 跳转到首页
    router.push(`/${userInfo.role.toLowerCase()}/home`)
    
  } catch (error) {
    console.error('钉钉登录失败:', error)
    ddSDK.device.notification.toast({
      icon: 'error',
      text: '登录失败，请重试'
    })
  } finally {
    loading.stopLoading()
  }
}

export const exchangeCodeForUserInfo = async (authCode) => {
  // 这里应该调用您的后端API，通过authCode获取用户信息
  // 后端调用钉钉服务端API：GET https://oapi.dingtalk.com/topapi/v2/user/getuserinfo
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/dingtalk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authCode })
  })
  
  const data = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || '获取用户信息失败')
  }
  
  return data.user
}

export const sendDingtalkNotification = async (params) => {
  if (!isDingTalk()) return
  
  try {
    const { userIdList = [], title, text, url = '' } = params
    
    ddSDK.biz.chat.sendMessageToConversation({
      corpId: import.meta.env.VITE_DINGTALK_CORP_ID,
      users: userIdList,
      msg: {
        msgtype: 'markdown',
        markdown: {
          title: title,
          text: text + (url ? `\n[点击查看详情](${url})` : '')
        }
      },
      onSuccess: () => console.log('消息发送成功'),
      onFail: (err) => console.error('消息发送失败:', err)
    })
  } catch (error) {
    console.error('发送钉钉通知失败:', error)
  }
}

export const showDingtalkToast = (text, type = 'success') => {
  if (!isDingTalk()) {
    console.log(`[Toast] ${type}: ${text}`)
    return
  }
  
  ddSDK.device.notification.toast({
    icon: type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'success',
    text
  })
}

export const chooseDingtalkImage = async (options = {}) => {
  const { count = 3 } = options
  
  if (!isDingTalk()) {
    // 开发环境模拟
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          'https://via.placeholder.com/400x300/3498db/ffffff?text=Asset+1',
          'https://via.placeholder.com/400x300/2ecc71/ffffff?text=Asset+2'
        ])
      }, 300)
    })
  }
  
  return new Promise((resolve, reject) => {
    ddSDK.biz.util.chooseImage({
      count: count,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      onSuccess: (result) => resolve(result.filePaths),
      onFail: reject
    })
  })
}

export const uploadDingtalkImage = async (filePath) => {
  if (!isDingTalk()) {
    return Promise.resolve(`https://via.placeholder.com/400x300`)
  }
  
  return new Promise((resolve, reject) => {
    ddSDK.biz.util.uploadImage({
      url: `${import.meta.env.VITE_API_BASE_URL}/upload`,
      filePath: filePath,
      onSuccess: (result) => resolve(result.url),
      onFail: reject
    })
  })
}

export const navigateToDingtalkChat = async (userId) => {
  if (!isDingTalk()) {
    console.log('[Mock] 打开聊天:', userId)
    return
  }
  
  ddSDK.biz.chat.pickConversation({
    corpId: import.meta.env.VITE_DINGTALK_CORP_ID,
    isConfirm: 'false',
    users: [userId],
    onSuccess: (result) => {
      console.log('打开聊天:', result)
    },
    onFail: (err) => console.error('打开聊天失败:', err)
  })
}

export const setDingtalkTitle = (title) => {
  if (!isDingTalk()) {
    document.title = title
    return
  }
  
  ddSDK.biz.navigation.setTitle({
    title,
    onSuccess: () => {},
    onFail: () => {}
  })
}

export const scanDingtalkQRCode = async () => {
  if (!isDingTalk()) {
    return Promise.resolve(prompt('请输入模拟资产编码:'))
  }
  
  return new Promise((resolve, reject) => {
    ddSDK.biz.util.scan({
      type: 'qrCode',
      onSuccess: (result) => resolve(result.text),
      onFail: reject
    })
  })
}
