<template>
  <div class="app-shell">
    <div class="shell-header">
      <van-icon name="arrow-left" @click="goBack" v-if="showBack" />
      <span class="shell-title">{{ title }}</span>
      <slot name="right" />
    </div>
    <div class="shell-content">
      <slot />
    </div>
    <div class="shell-tabbar" v-if="tabs?.length">
      <div
        v-for="tab in tabs"
        :key="tab.name"
        class="tab-item"
        :class="{ active: currentTab === tab.name }"
        @click="switchTab(tab)"
      >
        <van-icon :name="tab.icon" size="22" />
        <span>{{ tab.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'

defineProps({
  title: { type: String, default: '' },
  showBack: { type: Boolean, default: true },
  tabs: { type: Array, default: null }
})
const router = useRouter()
const route = useRoute()
const currentTab = ref('')

function goBack() { router.back() }
function switchTab(tab) { router.push(tab.path) }
</script>

<script>
import { ref } from 'vue'
export default { name: 'AppShell' }
</script>

<style scoped>
.app-shell { display: flex; flex-direction: column; min-height: 100vh; }
.shell-header {
  position: sticky; top: 0; z-index: 100;
  background: #fff; height: 46px; padding: 0 12px;
  display: flex; align-items: center; gap: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  font-size: 17px; font-weight: 600;
}
.shell-content { flex: 1; padding-bottom: 60px; }
.shell-tabbar {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
  background: #fff; display: flex; box-shadow: 0 -1px 6px rgba(0,0,0,0.06);
}
.tab-item {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 3px; padding: 8px 0; color: #999; font-size: 11px; cursor: pointer;
}
.tab-item.active { color: #1989fa; }
</style>