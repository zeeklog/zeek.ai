<script lang="ts" setup>
import { Document, Menu as IconMenu, Location, Setting } from '@element-plus/icons-vue';
import { appCategoryList } from '@/api/api.ts';
import { ref } from 'vue';
import { useAppStore } from '@/stores/app';
import { useRouter } from 'vue-router';

const router = useRouter();
const store = useAppStore();
const category = ref([]);
const activeMenu = ref(''); // 用于跟踪当前激活的菜单项

async function getAppCategoryList() {
  const cache = localStorage.getItem('app-category-cache');
  if (cache) {
    category.value = JSON.parse(cache);
  }
  return await appCategoryList().then((res) => {
    category.value = res.data;
    store.updateAppCategory(res.data);
    localStorage.setItem('app-category-cache', JSON.stringify(category.value));
    // 初始化时设置默认激活项（可选）
    if (res.data.length > 0) {
      activeMenu.value = res.data[0].id.toString();
    }
  });
}

function handleOpen(key: string, keyPath: string[]) {
  console.log(key, keyPath);
}

function handleClose(key: string, keyPath: string[]) {
  console.log(key, keyPath);
}

const openApp = (item) => {
  store.updateOpenAppCategoryId(item.id);
};

const openBlog = (url) => {
  window.$tabs?.newTab(url);
};

const gotoSets = (item) => {
  activeMenu.value = item.id.toString(); // 更新激活的菜单项
  if (item.url) {
    openBlog(item.url);
  } else {
    const tab = store.tabs.filter((tab) => tab.isHome || tab.isFixed);
    if (tab && tab[0] && tab[0].id) {
      window.$tabs?.activeTab(tab[0].id);
      store.updateActiveTabId(tab[0].id);
    } else {
      console.error('missing home tab');
    }
    router.push({ path: '/', hash: `#${item.alias}` });
    scrollToSection(item.alias);
  }
};

const scrollToSection = (sectionId: string) => {
  const scrollContainer = document.body.querySelector('#scrollContainer');
  if (scrollContainer) {
    const target = scrollContainer.querySelector(`#${sectionId}`);
    if (target) {
      const offsetTop = target.getBoundingClientRect().top - scrollContainer.getBoundingClientRect().top - 20;
      scrollContainer.scrollTo({
        top: offsetTop + scrollContainer.scrollTop,
        behavior: 'smooth',
      });
    }
  }
};

const gotoLocalApp = () => {
  activeMenu.value = 'tools'; // 设置工具箱的 index
  window?.$tabs?.newTab(import.meta.env.MODE === 'development' ? 'http://localhost:6173': `tools://`);
};

getAppCategoryList();
</script>

<template>
  <el-menu
    :default-active="activeMenu"
    class="min-w-[130px] w-[130px] baseSide bg-filter-glass Side h-[100vh]"
    @open="handleOpen"
    @close="handleClose"
  >
    <el-menu-item
      v-for="item in category"
      :key="item.id"
      :index="item.id.toString()"
      class="hoverScale"
      @click="gotoSets(item)"
    >
      <el-icon size="22" class="hoverScale">
        <img class="w-22px h-22px" :src="`./img/${item.alias}.png`" alt="" />
      </el-icon>
      <template #title>
        {{ item.title }}
      </template>
    </el-menu-item>
    <el-menu-item class="hoverScale" :index="'tools'" @click="gotoLocalApp()">
      <el-icon size="22" class="hoverScale">
        <img class="w-22px h-22px" :src="`./img/design.png`" alt="" />
      </el-icon>
      <template #title>
        工具箱
      </template>
    </el-menu-item>
  </el-menu>
</template>

<style scoped lang="scss">


.Side {
  background: $custom-basic_color;
  color: $custom-text_color;
  box-shadow: 4px 0px 20px $custom-third_color;
  max-height: calc(100vh - 60px); /* 减去 mt-60px 的顶部间距 */
  overflow-y: auto; /* 启用垂直滚动 */
  overflow-x: hidden;
  scrollbar-width: none; /* 自定义滚动条宽度（Firefox） */
}

/* 自定义滚动条样式（Webkit 浏览器，如 Chrome、Safari） */
.Side::-webkit-scrollbar {
  width: 0; /* 滚动条宽度 */
}

.Side::-webkit-scrollbar-thumb {
  background-color: $custom-third_color; /* 滚动条滑块颜色 */
  border-radius: 4px;
}

.Side::-webkit-scrollbar-track {
  background: $custom-basic_color; /* 滚动条轨道颜色 */
}

.ep-menu--vertical .ep-menu-item:not(.is-disabled):hover {
  background-color: $custom-hover_bg_color !important;
  color: $custom-text_color !important;
}

.ep-menu--vertical .ep-menu-item.is-active {
  background-color: $custom-active_color !important; /* 高亮时的背景色 */
  color: $custom-text_color !important; /* 高亮时的文字颜色 */
}
</style>
