import { getCategories, getLocations } from '@/api/config'

// 构造分类树
export async function fetchCategoryTree() {
  const res = await getCategories()
  const list = res.data || []
  const map = {}
  list.forEach(item => { map[item.id] = { ...item, children: [] } })
  const roots = []
  list.forEach(item => {
    if (!item.parentId || item.parentId === item.id) {
      roots.push(map[item.id])
    } else if (map[item.parentId]) {
      map[item.parentId].children.push(map[item.id])
    }
  })
  return roots
}

// 构造地点树
export async function fetchLocationTree() {
  const res = await getLocations()
  const list = res.data || []
  const map = {}
  list.forEach(item => { map[item.id] = { ...item, children: [] } })
  const roots = []
  list.forEach(item => {
    if (!item.parentId || item.parentId === item.id) {
      roots.push(map[item.id])
    } else if (map[item.parentId]) {
      map[item.parentId].children.push(map[item.id])
    }
  })
  return roots
}

// 扁平树转级联选择数据（用于 van-cascader）
export function treeToCascader(nodes, depth = 0) {
  return nodes.map(node => ({
    text: node.name,
    value: node.id,
    children: node.children?.length ? treeToCascader(node.children, depth + 1) : undefined,
    level: depth
  }))
}
