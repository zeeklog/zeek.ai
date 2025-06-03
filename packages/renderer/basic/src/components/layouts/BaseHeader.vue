<script lang="ts" setup>
import { Minus, FullScreen, Close, RefreshRight } from '@element-plus/icons-vue';
import { ref } from 'vue';
import TabList from '../HeaderTab/TabList.vue';
import { useAppStore } from '@/stores/app';
import { validateAndFormatUrl } from '@/util/util';
import {useRouter} from "vue-router";
import ShadowText from './ShadowText.vue'
import TextHighLight from './TextHighLight.vue'

const router = useRouter();
const store = useAppStore();
const newTabUrl = ref('');

// 创建新标签页（带 URL）
async function newTabWithUrl() {
  try {
    let url = newTabUrl.value.trim();
    if (!url) return;
    url = validateAndFormatUrl(url);
    console.log('open url', url);
    const { tabId, tabs } = window?.$tabs?.newTab(url);
    store.updateActiveTabId(tabId);
    store.updateTabs(tabs);
    newTabUrl.value = '';
  } catch (error) {
    console.error('Failed to create new tab with URL:', error);
  }
}

const minimize = () => window.mia?.send('minimize-window');
const maximize = () => window.mia?.send('maximize-window');
const close = () => window.mia?.send('close-window');
const flash = () => window.mia?.send('request-reload');
const openBlog = async () => {
  const tab = store.tabs.filter(tab => tab.isHome || tab.isFixed);
  if (tab?.[0]?.id) {
    window.$tabs?.activeTab(tab[0].id);
    store.updateActiveTabId(tab[0].id);
    router.push({ path: '/'});
  } else {
    console.error('missing home tab');
  }
};
</script>

<template>
  <el-menu
    active-text-color="#000000"
    class="el-menu-demo fixed top-0 z-999 w-full Header"
    mode="horizontal"
    :ellipsis="false"
    style="-webkit-app-region: drag; display: flex; align-items: stretch;"
  >
    <!-- 左侧固定宽度 Logo -->
    <el-menu-item
      index="/"
      class="pointer"
      style=" flex: 0 0 100px;-webkit-app-region: no-drag;"
      @click="openBlog"
    >
      <div class="flex items-center justify-center gap-2 h-full">
<!--        <img src="/img/logo.png" class="h-25px" alt="Logo"   style="-webkit-app-region: no-drag;"/>-->
        <ShadowText
          class="!text-1.5em flex items-center flex-start"
          shadow-color="white"
        >
          极客
          <TextHighLight  class="h-1em rounded-lg bg-gradient-to-r from-purple-300 to-orange-300" style="line-height: 1">ai</TextHighLight>
        </ShadowText>
      </div>
    </el-menu-item>

    <!-- 中间自适应宽度 TabList -->
    <el-menu-item style="flex: 1; min-width: 0;">
      <TabList h="full" />
    </el-menu-item>

    <!-- 右侧固定宽度操作区域 -->
    <el-menu-item
      style="flex: 0 0 350px; padding: 0;"
    >
      <div class="flex items-center justify-end gap-2 h-full px-2">
        <div class="search-container flex-1 hidden-md-and-down" style="-webkit-app-region: no-drag;" >
          <el-input
            v-model="newTabUrl"
            placeholder="使用AI搜索或打开链接"
            @keyup.enter="newTabWithUrl"
          />
        </div>
        <el-icon class="cursor-pointer"  style="-webkit-app-region: no-drag;" @click.stop="flash"><RefreshRight /></el-icon>
        <el-icon class="cursor-pointer"  style="-webkit-app-region: no-drag;" @click.stop="minimize"><Minus /></el-icon>
        <el-icon class="cursor-pointer"  style="-webkit-app-region: no-drag;" @click.stop="maximize"><FullScreen /></el-icon>
        <el-icon class="cursor-pointer"  style="-webkit-app-region: no-drag;" @click.stop="close"><Close /></el-icon>
      </div>
    </el-menu-item>
  </el-menu>
</template>

<style lang="scss">
.Header {
  background: $custom-basic_color;
  height: 60px; /* 固定高度，可根据需要调整 */
}
.ep-menu--horizontal .ep-menu-item:not(.is-disabled):hover, .ep-menu--horizontal .ep-menu-item:not(.is-disabled):focus {
  background-color: $custom-basic_color !important;
  color: $custom-text_color !important;
}
.ep-menu--horizontal .ep-menu-item:not(.is-disabled):hover {
  background-color: $custom-basic_color !important;
  color: $custom-text_color !important;
}
.ep-menu--horizontal .ep-menu-item.is-active {
  background-color: $custom-basic_color !important; /* 高亮时的背景色 */
  color: $custom-text_color !important; /* 高亮时的文字颜色 */
}

.el-menu-demo {
  padding: 0; /* 移除默认内边距 */
  border-bottom: none; /* 如果有默认下边框，可移除 */

  & > .el-menu-item {
    height: 100%; /* 确保子项填满容器高度 */
    margin: 0; /* 移除默认外边距 */
    padding: 0 10px; /* 统一内边距 */
  }

  /* 左侧 Logo 样式 */
  & > .el-menu-item:nth-child(1) {
    background-color: $custom-basic_color;
    color: #ffffff;
    &:hover, &:focus {
      background-color: $custom-basic_color !important;
      color: #ffffff !important;
    }
  }

  /* 中间 TabList 样式 */
  & > .el-menu-item:nth-child(2) {
    overflow: hidden; /* 防止内容溢出 */
  }

  /* 右侧操作区域样式 */
  & > .el-menu-item:nth-child(3) {
    background-color: $custom-basic_color;
    color: #ffffff;
    &:hover, &:focus {
      background-color: $custom-basic_color !important;
      color: #ffffff !important;
    }
  }
}

.cursor-pointer {
  cursor: pointer;
  transition: all .2s ease-in-out;
}
.cursor-pointer:hover {
  scale: 1.3;
  background: $custom-hover_bg_color !important;
  border-radius: 3px;
  box-shadow: 0 0 5px $custom-active_color !important;
}
.search-container {
  max-width: 250px; /* 限制搜索框宽度，防止挤压图标 */
}
</style>
