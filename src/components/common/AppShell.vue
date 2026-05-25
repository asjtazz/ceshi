<template>
  <div class="app-shell">
    <van-nav-bar :title="title" :left-text="showBack ? '返回' : ''" :left-arrow="showBack" @click-left="$emit('back')" />
    <div class="app-content">
      <slot />
    </div>
    <van-tabbar v-if="!hideTabbar" v-model="active" @change="onTabChange" route>
      <van-tabbar-item icon="home-o" to="/l1/home">首页</van-tabbar-item>
      <van-tabbar-item icon="records" to="/l1/my-applications">申请</van-tabbar-item>
      <van-tabbar-item icon="bar-chart-o" to="/l2/home">管理</van-tabbar-item>
      <van-tabbar-item icon="setting-o" to="/l3/home">设置</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const props = defineProps({ title: { type: String, default: '' }, showBack: { type: Boolean, default: false }, hideTabbar: { type: Boolean, default: false } })
defineEmits(['back'])
const active = ref(0)
function onTabChange(index) {}
</script>

<style scoped>
.app-shell { min-height: 100vh; background: #f7f8fa; }
.app-content { padding-bottom: 50px; }
</style>