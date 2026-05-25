<template>
  <div class="tree-selector">
    <van-field
      :model-value="displayValue"
      :label="label"
      :placeholder="placeholder || '请选择'"
      readonly
      is-link
      @click="showPicker = true"
    />
    <van-popup v-model:show="showPicker" position="bottom" round>
      <div class="tree-header van-hairline--bottom">
        <span class="tree-title">{{ title || label }}</span>
        <van-icon name="cross" @click="showPicker = false" />
      </div>
      <div class="tree-body">
        <div
          v-for="node in flatNodes"
          :key="node.id"
          class="tree-node"
          :class="{ selected: node.id === modelValue, disabled: node.disabled }"
          :style="{ paddingLeft: (node.level * 20 + 12) + 'px' }"
          @click="selectNode(node)"
        >
          <span v-if="node.children?.length" class="tree-toggle" @click.stop="toggleNode(node.id)">
            <van-icon :name="expandedKeys.has(node.id) ? 'arrow-down' : 'arrow'" size="12" />
          </span>
          <span v-else class="tree-toggle" />
          <span class="tree-label">{{ node.name }}</span>
          <van-icon v-if="node.id === modelValue" name="success" class="tree-check" size="16" />
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: String,
  nodes: { type: Array, default: () => [] },
  label: { type: String, default: '' },
  title: { type: String, default: '' },
  placeholder: String,
})
const emit = defineEmits(['update:modelValue'])

const showPicker = ref(false)
const expandedKeys = ref(new Set())

watch(() => props.nodes, (nodes) => {
  if (nodes?.length) {
    const expand = (list = []) => {
      list.forEach(n => {
        if (n.children?.length) expandedKeys.value.add(n.id)
        expand(n.children)
      })
    }
    expand(nodes)
  }
}, { immediate: true })

const flatNodes = computed(() => {
  const result = []
  const flatten = (list, level = 0) => {
    list.forEach(n => {
      result.push({ ...n, level })
      if (expandedKeys.value.has(n.id) && n.children?.length) flatten(n.children, level + 1)
    })
  }
  flatten(props.nodes)
  return result
})

const displayValue = computed(() => {
  const find = (list) => {
    for (const n of list) {
      if (n.id === props.modelValue) return n.name
      if (n.children?.length) { const f = find(n.children); if (f) return f }
    }
  }
  return find(props.nodes) || ''
})

function selectNode(node) {
  if (node.disabled) return
  emit('update:modelValue', node.id)
  showPicker.value = false
}

function toggleNode(id) {
  if (expandedKeys.value.has(id)) expandedKeys.value.delete(id)
  else expandedKeys.value.add(id)
}
</script>

<style scoped>
.tree-selector { display: block; }
.tree-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px; font-size: 16px; font-weight: 600;
}
.tree-body { max-height: 320px; overflow-y: auto; padding: 8px 0; }
.tree-node {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 12px; cursor: pointer; font-size: 14px;
  transition: background 0.15s;
}
.tree-node:active { background: #f5f5f5; }
.tree-node.selected { color: #1989fa; font-weight: 600; }
.tree-node.disabled { color: #ccc; cursor: not-allowed; }
.tree-toggle { width: 14px; flex-shrink: 0; }
.tree-label { flex: 1; }
.tree-check { color: #1989fa; margin-left: auto; }
</style>