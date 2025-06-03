// 定义 Pinia Store
import { defineStore } from 'pinia'
export const  useAppStore = defineStore('app', {
  state: () => ({
    tabs: [],
    activeTabId: null,
    appCategory: [],
    currentCategoryId: null,

  }),
  actions: {
    updateTabs(tabs) {
      this.tabs = tabs;
    },
    updateAppCategory(appCategory) {
      this.appCategory = appCategory;
    },
    updateOpenAppCategoryId(category) {
      this.currentCategoryId = category;
    },
    updateActiveTabId(tabId) {
      this.activeTabId = tabId;
    },
  },
});
