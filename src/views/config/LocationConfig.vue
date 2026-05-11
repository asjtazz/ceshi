<template>
  <div class="location-config-page">
    <van-nav-bar title="存放地点管理" left-arrow @click-left="$router.back()">
      <template #right>
        <van-icon name="plus" size="18" @click="showAddDialog = true" />
      </template>
    </van-nav-bar>

    <div class="tree-list">
      <div class="tree-item" v-for="site in locations" :key="site.name">
        <div class="tree-level-0">
          <van-icon :name="site.expanded ? 'location-o' : 'location'" color="#ee0a24" />
          <span class="site-name">{{ site.name }}</span>
          <van-tag plain size="small" style="margin-left:auto" @click="editLocation(site)">编辑</van-tag>
        </div>
        <div class="children" v-if="site.expanded">
          <div class="area-item" v-for="area in site.areas" :key="area">
            <span class="area-name">{{ area }}</span>
          </div>
        </div>
      </div>
    </div>

    <van-dialog v-model:show="showAddDialog" title="新增地点" show-cancel-button @confirm="addLocation" confirm-button-text="保存">
      <van-form @submit="addLocation" style="padding: 16px">
        <van-field v-model="formData.site" label="站点名称" placeholder="如 三号分站" />
        <van-field v-model="formData.area" label="区域名称" placeholder="如 检测车间" />
      </van-form>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { showSuccessToast } from 'vant'

const showAddDialog = ref(false)
const formData = ref({ site: '', area: '' })

const locations = ref([
  { name: '主站', expanded: true, areas: ['大厅', '检测车间', '办公室', '仓库'] },
  { name: '分站', expanded: true, areas: ['大厅', '检测车间', '办公室', '仓库'] }
])

function addLocation() {
  showSuccessToast('地点已添加')
  showAddDialog.value = false
}

function editLocation(item) {
  showSuccessToast('编辑功能开发中')
}
</script>

<style scoped>
.tree-list { padding: 12px; }
.tree-item { background: #fff; border-radius: 8px; margin-bottom: 8px; padding: 10px 14px; }
.tree-level-0 { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.site-name { font-weight: 500; }
.children { margin-top: 8px; padding-left: 24px; display: flex; flex-wrap: wrap; gap: 6px; }
.area-item { background: #f7f8fa; border-radius: 6px; padding: 4px 10px; font-size: 12px; color: #666; }
</style>