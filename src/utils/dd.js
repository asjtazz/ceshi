let ddSDK = null

try {
  ddSDK = window.dd
} catch {}

export function isDingTalk() {
  return !!ddSDK
}

export function initDingTalk() {
  return new Promise((resolve) => {
    if (!ddSDK) { resolve(false); return }
    ddSDK.ready(() => resolve(true))
    ddSDK.error((err) => {
      console.error('钉钉SDK初始化失败:', err)
      resolve(false)
    })
  })
}

export function getAuthCode() {
  return new Promise((resolve, reject) => {
    if (!ddSDK) { reject(new Error('非钉钉环境')); return }
    ddSDK.runtime.permission.requestAuthCode({
      corpId: import.meta.env.VITE_DD_CORP_ID,
      success: (res) => resolve(res.code),
      fail: (err) => reject(err)
    })
  })
}

export function scan() {
  return new Promise((resolve, reject) => {
    if (!ddSDK) {
      setTimeout(() => resolve({ text: 'HX0101-ZC031-000001' }), 500)
      return
    }
    ddSDK.biz.util.scan({
      type: 'all',
      success: (res) => resolve(res),
      fail: (err) => reject(err)
    })
  })
}

export function setTitle(title) {
  if (!ddSDK) return
  ddSDK.biz.navigation.setTitle({ title })
}

export function setRightButton(text, onClick) {
  if (!ddSDK) return
  ddSDK.biz.navigation.setRight({
    show: true,
    control: true,
    text,
    onSuccess: () => { if (onClick) onClick() },
    onFail: () => {}
  })
}

export function hideRightButton() {
  if (!ddSDK) return
  ddSDK.biz.navigation.setRight({ show: false })
}

export function chooseContact(opts) {
  return new Promise((resolve, reject) => {
    if (!ddSDK) { reject(new Error('非钉钉环境')); return }
    ddSDK.biz.contact.choose({
      multiple: opts?.multiple || false,
      users: opts?.users || [],
      corpId: import.meta.env.VITE_DD_CORP_ID,
      max: opts?.max || 1,
      success: (res) => resolve(res),
      fail: (err) => reject(err)
    })
  })
}

export function getLocation() {
  return new Promise((resolve, reject) => {
    if (!ddSDK) { reject(new Error('非钉钉环境')); return }
    ddSDK.device.geolocation.get({
      targetAccuracy: 100,
      coordinate: 0,
      withReGeocode: false,
      useNative: true,
      success: (res) => resolve(res),
      fail: (err) => reject(err)
    })
  })
}