<template>
  <div class="custom-toolbar" style="-webkit-app-region: drag;">
    <div class="tabs" ref="tabsContainer" style="max-width: calc(100%)">
      <div
        v-for="(tab, index) in tabs"
        :key="tab.id"
        :class="{ 'tab-item': true, active: tab.id === activeTabId }"
        :style="{ width: index === 0? '4em': (tabWidth + 'px' )}"
        style="-webkit-app-region: no-drag;"
        @click="switchTab(tab.id)"
        v-show="!tab.isFixed"
      >
        <span class="ellipsis tabTitle">{{ formatTabTitle(tab) || 'Untitled' }}</span>
        <span v-if="!tab.isFixed" class="close" @click.stop="closeTab(tab.id)">×</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useAppStore } from '@/stores/app';
import { ElMessage } from 'element-plus';
import { validateAndFormatUrl } from '@/util/util'; // 假设工具函数已存在

const store = useAppStore()
// 数据和状态
const tabsContainer = ref(null);
const newTabUrl = ref('');
const tabWidth = ref(150); // 初始宽度，动态计算后更新

// 计算属性
const tabs = computed(() => store.tabs);
const activeTabId = computed(() => store.activeTabId);

// 监听tabs变化，调整tabs宽度和展示模式
watch(() => tabs.value, () => {
  updateTabWidth()
})

// 检查 window.$tabs 是否可用
function ensureTabsApi() {
  if (!window.$tabs) {
    console.error('window.$tabs is undefined');
    ElMessage.error('Tabs API is unavailable. Please try refreshing the application.');
    throw new Error('Tabs API is unavailable');
  }
  return window.$tabs;
}

// 创建新标签页
async function newTab(url = 'about:blank') {
  const $tabsApi = ensureTabsApi();
  try {
    const { tabId, tabs } = await $tabsApi.newTab(url);
    store.updateActiveTabId(tabId);
    store.updateTabs(tabs);
  } catch (error) {
    console.error('Failed to create new tab:', error);
  }
}

// 关闭标签页
function closeTab(tabId) {
  if (typeof tabId === 'undefined' || tabId === null) {
    console.error('closeTab: tabId is undefined or null');
    return;
  }
  const $tabsApi = ensureTabsApi();
  $tabsApi.closeTab(tabId);
}

// 切换标签页
async function switchTab(tabId) {
  if (typeof tabId === 'undefined' || tabId === null) {
    console.error('switchTab: tabId is undefined or null');
    return;
  }
  console.log('Switching to tab:', tabId);
  const $tabsApi = ensureTabsApi();
  store.updateActiveTabId(tabId);
  $tabsApi.switchTab(tabId);
}

// 获取所有标签页
async function fetchTabs() {
  const $tabsApi = ensureTabsApi();
  try {
    const tabs = await $tabsApi.getTabs();
    console.log('app2render:', tabs);
    store.updateTabs(tabs);
    if (!activeTabId.value && tabs.length > 0) {
      store.updateActiveTabId(tabs[0].id);
    }
  } catch (error) {
    console.error('Failed to fetch tabs:', error);
  }
}

// 更新标签页
async function updateTabs(tabs) {
  store.updateTabs(tabs);
  if (!activeTabId.value && tabs.length > 0) {
    store.updateActiveTabId(tabs[0].id);
  }
}

// 格式化标签标题
function formatTabTitle(tab) {
  return tab.title || '新建标签';
}

// 动态计算标签宽度
function updateTabWidth() {
  const container = tabsContainer.value;
  if (!container) return;

  const availableWidth = container.offsetWidth - 50; // 标签栏总宽度
  const tabCount = tabs.value.length;

  if (tabCount === 0) {
    tabWidth.value = 150; // 默认宽度
  } else {
    tabWidth.value = Math.min(Math.max(availableWidth / tabCount, 10), 150); // 动态计算宽度
  }
}

// 生命周期钩子
onMounted(async () => {
  const $tabsApi = ensureTabsApi();

  $tabsApi.onUpdateTabs(async (tabs, activeTabId) => {
    console.log('Received tabs update:', tabs);
    await updateTabs(tabs);
    if (activeTabId) {
      store.updateActiveTabId(activeTabId);
    }
  });

  $tabsApi.onClearCache(() => {
    store.$reset(); // 重置 Pinia 状态
    // 假设有一个路由器跳转到登录页
    // router.push('/login');
  });

  $tabsApi.onSwitchTabError(error => {
    ElMessage.error(`Switch tab error: ${error}`);
  });

  await fetchTabs();

  // 监听窗口 resize 事件
  window.addEventListener('resize', updateTabWidth);
  nextTick(() => updateTabWidth()); // 初始渲染后计算宽度
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateTabWidth);
});
</script>

<style scoped>
.custom-toolbar {
  display: flex;
  align-items: center;
  padding: 0 10px;
  width: 100%;
}

.tabs {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  overflow-x: hidden;
  white-space: nowrap;
  justify-content: flex-start;
  gap: 5px;
}

.tab-item {
  padding: 5px 10px;
  height: 30px;
  background: rgba(255, 255, 255, 0.2); /* 半透明白色背景 */
  backdrop-filter: blur(10px); /* 毛玻璃效果 */
  cursor: pointer;
  border-radius: 4px;
  display: inline-flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s ease, color 0.2s ease;
  flex-shrink: 0;
  overflow: hidden;
}
.tab-item::after {
  content: ' ';
  border-right: 1px solid #0000001c;
  width: 1px;
  height: 20px;
  position: absolute;
  right: 0;
}
.tab-item.active::after {
  border-right: unset;
}
.tab-item:hover {
  background: rgba(255, 255, 255, 0.2); /* 半透明白色背景 */
  backdrop-filter: blur(5px); /* 毛玻璃效果 */
  color: #000;
}

.tab-item.active {
  background: #FFFFFF;
  color: #000000;
}

.tab-item.active:hover {
  background: #f5f5f5;
}

.tabTitle {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.close {
  margin-left: 5px;
  font-weight: bold;
  cursor: pointer;
}

.close:hover {
  color: #ff4444;
}

.search-container {
  flex: 0 0 auto;
  margin-left: 10px;
}

.el-input__inner {
  height: 40px !important;
}
</style>
