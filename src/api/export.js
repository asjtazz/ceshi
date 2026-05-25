const BASE_URL = import.meta.env.VITE_APP_BASE_API
const SERVER_BASE = BASE_URL.replace(/\/api\/?$/, '')
export const exportAssets = () => window.open(SERVER_BASE + '/api/export/assets', '_blank')
export const exportAuditLogs = () => window.open(SERVER_BASE + '/api/export/audit-logs', '_blank')
export const exportDebts = () => window.open(SERVER_BASE + '/api/export/debts', '_blank')
