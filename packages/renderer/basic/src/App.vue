<template>
  <el-config-provider namespace="ep">
    <div id="mainWindow">
      <BaseHeader />
      <div class="main-container flex h-100vh fixed top-[60px] left-0 w-[100%]">
        <BaseSide />
        <div class="custom-scroll-container w-full full h-100vh overflow-y-scroll" id="scrollContainer">
          <RouterView />
        </div>
      </div>
    </div>
<!--    <div class="text-gray hoverScale pointer">All Rights Reserved · Designed by Neo & build width ♥</div>-->
  </el-config-provider>
</template>

<style lang="scss">

#mainWindow {
  //background-image: url("@/assets/img/bg.jpg");
  //background-position: center center;
  //background-size: cover;
  transition: all 0.5s ease; // 添加整体过渡动画
  background: $custom-basic_color;
}

#app {
  text-align: center;
  color: var(--ep-text-color-primary);
  transition: all 0.5s ease; // 添加app容器过渡
}

.main-container {
  height: calc(100vh - var(--ep-menu-item-height) - 4px);
  transition: all 0.5s ease; // 添加主容器过渡
}

body {
  height: 100vh;
  overflow: hidden;
}

.custom-scroll-container {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: $custom-basic_color $custom-second_color;
  background: #000000;
  transition: all 0.5s ease; // 修改为all，包含更多属性变化

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: #e0e0e0;
  }
  &::-webkit-scrollbar-thumb {
    background: #FFFFFF;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #FFFFFF;
  }
}

// 添加媒体查询时的平滑过渡
@media screen and (max-width: 768px) {
  .main-container {
    transition: all 0.5s ease;
  }

  .custom-scroll-container {
    transition: all 0.5s ease;
  }
}
</style>

<script setup lang="ts">
// 可选：添加resize监听器
import { onMounted, onUnmounted } from 'vue'

const handleResize = () => {
  // 可以在这里添加额外的resize逻辑
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>
