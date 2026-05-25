<template>
  <AppShell title="编码规则">
    <div class="code-rules-page">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-empty description="暂无编码规则" v-if="!rules.length && !loading" />
        <div class="rule-list" v-else>
          <div
            v-for="r in rules"
            :key="r.id"
            class="rule-card"
            @click="goEdit(r)"
          >
            <div class="rule-header">
              <span class="rule-name">{{ r.name }}</span>
              <van-tag :type="r.enabled ? 'success' : 'default'">{{ r.enabled ? '启用' : '停用' }}</van-tag>
            </div>
            <div class="rule-pattern">
              <code>{{ r.pattern }}</code>
            </div>
            <p class="rule-desc">{{ r.description }}</p>
          </div>
        </div>
      </van-pull-refresh>

      <div class="fab" @click="goEdit(null)">
        <van-icon name="plus" size="24" color="#fff" />
      </div>
    </div>

    <van-popup v-model:show="showEdit" position="bottom" round style="height: 70%">
      <div class="edit-rule">
        <van-nav-bar :title="editingRule ? '编辑规则' : '新建规则'" left-text="取消" right-text="保存" @click-left="showEdit = false" @click-right="onSave" />
        <div style="padding: 16px;">
          <van-field v-model="form.name" label="规则名称" placeholder="请输入" />
          <van-field v-model="form.pattern" label="编码模板" placeholder="如: {LOC}-{CAT}-{SEQ}" />
          <van-field v-model="form.description" label="说明" placeholder="编码规则说明（选填）" />
          <van-field name="enabled" label="启用状态">
            <template #input><van-switch v-model="form.enabled" size="20" /></template>
          </van-field>
        </div>
      </div>
    </van-popup>
  </AppShell>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast } from 'vant'
import { getCodeRules, saveCodeRules } from '@/api/config'
import AppShell from '@/components/global/AppShell.vue'

const rules = ref([])
const showEdit = ref(false)
const editingRule = ref(null)
const loading = ref(false)
const refreshing = ref(false)
const form = ref({ name: '', pattern: '', description: '', enabled: true })

function goEdit(r) {
  editingRule.value = r
  form.value = r ? { ...r } : { name: '', pattern: '', description: '', enabled: true }
  showEdit.value = true
}

async function onSave() {
  if (!form.value.name || !form.value.pattern) return showToast('请填写名称和编码模板')
  await saveCodeRules([form.value])
  showToast('保存成功'); showEdit.value = false; loadData()
}

async function loadData() {
  loading.value = true
  const res = await getCodeRules()
  rules.value = res.data?.list || []
  loading.value = false
}
function onRefresh() { loadData().finally(() => refreshing.value = false) }
onMounted(loadData)
</script>

<style scoped>
.code-rules-page { min-height: 100vh; padding-bottom: 80px; }
.rule-list { padding: 12px; }
.rule-card {
  background: #fff; border-radius: 10px; padding: 14px; margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04); cursor: pointer;
}
.rule-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.rule-name { font-size: 15px; font-weight: 600; }
.rule-pattern { background: #f5f5f5; border-radius: 6px; padding: 8px 12px; margin-bottom: 8px; }
.rule-pattern code { font-size: 13px; color: #722ed1; font-family: monospace; }
.rule-desc { font-size: 12px; color: #999; }
.fab {
  position: fixed; bottom: 70px; right: 20px; z-index: 100;
  width: 50px; height: 50px; border-radius: 50%;
  background: #ff4d4f; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(255,77,79,0.4); cursor: pointer;
}
</style>