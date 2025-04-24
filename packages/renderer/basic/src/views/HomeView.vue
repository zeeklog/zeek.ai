<script setup lang="ts">
import { appList } from '@/api/api.ts';
import { ref, computed } from 'vue';
import { useAppStore } from '@/stores/app';
import GradientButton from '../components/layouts/GradentButton.vue'
import ParticlesBg from '../components/layouts/ParticlesBg.vue'
import { validateAndFormatUrl } from '@/util/util';

const search = ref('')

const getAppCache = async () => {
  const cache = await window?.mia?.app?.getAppCache(import.meta.env.VITE_APP_CACHE_KEY || 'app.cache');
  apps.value = cache;
  return;
};
getAppCache();

const store = useAppStore();
const apps = ref(() => JSON.parse(localStorage.getItem('app-cache') || '[]'));

const appCategory = computed(() => store.appCategory);

const getAppList = async () => {
  await appList().then((res) => {
    apps.value = res.data;
    localStorage.setItem('app-cache', JSON.stringify(apps.value));
    window?.mia?.send('set-app-cache', {
      cacheKey: import.meta.env.VITE_APP_CACHE_KEY || 'app.cache',
      data: res.data,
    });
  });
};

const recommendApps = computed(() => {
  return Object.keys(apps.value)
    .map((item) => apps?.value[item])
    .flat()
    .filter((app) => app.is_recommend);
});

const openApp = (app: object) => {
  window.$tabs?.newTab(app.url);
};

const vpnTips = '需要科学上网（vpn）才能访问';
const zjcc = 'Made in China';
getAppList();

// 光晕位置和悬停状态的响应式变量
const glowStates = ref({});

const handleMouseMove = (e: MouseEvent, appId: string) => {
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // 转换为百分比
  const xPercent = (mouseX / rect.width) * 100;
  const yPercent = (mouseY / rect.height) * 100;

  // 更新光晕位置
  glowStates.value[appId] = { ...glowStates.value[appId], x: xPercent, y: yPercent };
};

const handleMouseEnter = (appId: string) => {
  // 初始化光晕位置和悬停状态
  glowStates.value[appId] = { x: 50, y: 50, isHovered: true };
};

const handleMouseLeave = (appId: string) => {
  // 恢复光晕位置并设置悬停状态为 false
  glowStates.value[appId] = { x: glowStates.value[appId].x, y: glowStates.value[appId].y, isHovered: false };
};
// 创建新标签页（带 URL）
async function newTabWithUrl() {
  try {
    let url = search.value.trim();
    if (!url) return;
    url = validateAndFormatUrl(url);
    console.log('open url', url);
    const { tabId, tabs } = window?.$tabs?.newTab(url);
    store.updateActiveTabId(tabId);
    store.updateTabs(tabs);
    search.value = '';
  } catch (error) {
    console.error('Failed to create new tab with URL:', error);
  }
}

</script>

<template>
  <main class="mb-10em p-1em">
    <!-- <search-view></search-view> -->
    <div >
      <div id="chat" class="relative w-[100%] p-2em askAiSearch rounded shadow-lg z-0 box-border">
        <el-input
          class="w-[50%]  rounded-2 shadow-lg z-2 p-1em aiInput"
          type="textarea"
          :rows="5"
          placeholder="无障碍全球搜索"
          @keyup.enter="newTabWithUrl"
          v-model="search"></el-input>
        <GradientButton class="text-white pointer ml-1em  z-2" @click="newTabWithUrl" >🚀 提问</GradientButton>
        <ParticlesBg
          class="absolute w-[100%] w-full h-full top-[-5px]"
          :quantity="100"
          :ease="100"
          :color="'#FFF'"
          :staticity="10"
          refresh
        />
      </div>
      <h3 class="text-left" >推荐应用</h3>
      <el-row :gutter="10">
        <el-col
          :xs="12"
          :sm="8"
          :md="6"
          :lg="4"
          :xl="3"
          v-for="app in recommendApps"
          :key="app.id"
          @click="openApp(app)"
        >
          <div
            class="appItem flex justify-around border-rounded shadow-opacity-10 overflow-hidden mw-150px p-1em rounded-lg mb-1em pointer hoverScale app"
            :style="{
              '--x': (glowStates[app.id]?.x || 50) + '%',
              '--y': (glowStates[app.id]?.y || 50) + '%',
            }"
            @mousemove="handleMouseMove($event, app.id)"
            @mouseenter="handleMouseEnter(app.id)"
            @mouseleave="handleMouseLeave(app.id)"
          >
            <img class="w-3em h-3em mr-10px hoverScale" :src="app.icon" alt="" />
            <div class="text-left full">
              <el-tooltip :content="vpnTips" effect="dark" placement="top" v-if="app.is_block">
                <img src="@/assets/img/vpn.png" alt="" class="w-20x h-20px isBlock" />
              </el-tooltip>
              <el-tooltip :content="zjcc" effect="dark" placement="top" v-if="app.is_zjcc">
                <img src="@/assets/img/zjcc.png" alt="" class="w-20x h-20px isBlock" />
              </el-tooltip>
              <p class="ellipsis">{{ app.title }}</p>
              <el-tooltip :content="app.meta_descriptions" effect="dark" placement="bottom">
                <p class="ellipsis text-gray mt-3px inline-block w-7em">{{ app.meta_descriptions }}</p>
              </el-tooltip>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
    <div v-for="item in appCategory" :key="item.id" v-show="!item.url">
      <h3 class="text-left" :id="item.alias">{{ item.title }}</h3>
      <el-row :gutter="10">
        <el-col
          :xs="12"
          :sm="8"
          :md="6"
          :lg="4"
          :xl="3"
          v-for="app in apps[item.id]"
          :key="app.id"
          @click="openApp(app)"
          class="border-beam"
        >
          <div
            class="appItem flex justify-around border-rounded shadow-opacity-10 overflow-hidden mw-150px p-1em rounded-lg mb-1em pointer hoverScale app"
            :style="{
              '--x': (glowStates[app.id]?.x || 50) + '%',
              '--y': (glowStates[app.id]?.y || 50) + '%',
            }"
            @mousemove="handleMouseMove($event, app.id)"
            @mouseenter="handleMouseEnter(app.id)"
            @mouseleave="handleMouseLeave(app.id)"
          >
            <img class="w-3em h-3em mr-10px hoverScale" :src="app.icon" alt="" />
            <div class="text-left full">
              <el-tooltip :content="vpnTips" effect="dark" placement="top" v-if="app.is_block">
                <img src="@/assets/img/vpn.png" alt="" class="w-20x h-20px isBlock" />
              </el-tooltip>
              <el-tooltip :content="zjcc" effect="dark" placement="top" v-if="app.is_zjcc">
                <img src="@/assets/img/zjcc.png" alt="" class="w-20x h-20px isBlock" />
              </el-tooltip>
              <p class="ellipsis">{{ app.title }}</p>
              <el-tooltip :content="app.meta_descriptions" effect="dark" placement="bottom">
                <p class="ellipsis text-gray mt-3px inline-block w-7em">{{ app.meta_descriptions }}</p>
              </el-tooltip>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </main>
</template>

<style lang="scss">
.aiInput {
  background: $custom-basic_color;
}
.askAiSearch {
  background: linear-gradient(0deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0)), linear-gradient(90deg, rgba(124, 77, 255, 0.3) 0%, rgba(14, 165, 233, 0.3) 100%);
  display: flex;
  justify-content: center;
  align-items: flex-end;
}
.appItem {
  max-width: 200px;
  overflow: hidden;
  background: $custom-basic_color;
  transition: all ease 0.3s;
  position: relative;

  // 光晕效果
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(
        circle 200px at var(--x, 50%) var(--y, 50%),
        rgba(255, 92, 178, 0.58),
        transparent 50%
    );
    opacity: 0; // 默认不显示
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  // 仅在悬停时显示光晕
  &:hover::before {
    opacity: 1;
  }

  &:hover {
    background-color: rgba(124, 77, 255, 0.2) !important;
    color: $custom-text_color !important;
  }

  img {
    border-radius: 50%;
  }

  img:hover {
    box-shadow: 0 0 10px $custom-third_color;
  }

  .isBlock {
    position: absolute;
    top: 0;
    left: 0;
    font-size: 9px;
    color: $custom-text_color;
    padding: 2px 4px;
    border-radius: 8px;
  }
}
</style>
