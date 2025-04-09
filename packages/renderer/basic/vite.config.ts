import path from 'node:path'
import Vue from '@vitejs/plugin-vue'

import Unocss from 'unocss/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import VueRouter from 'unplugin-vue-router/vite'

import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`,
      '@': `${path.resolve(__dirname, 'src')}`,
    },
  },
  build: {
    cssCodeSplit: true, // 确保CSS按模块分割
    outDir: path.resolve(__dirname, '../dist/basic'), // 输出到 pack/basic
    emptyOutDir: true, // 清空输出目录, // 输出目录
    assetsDir: './assets', // 资源输出到 basic/assets
    rollupOptions: {
      // external: ['motion-v', 'tailwind-merge'],
    },
  },
  base: './', // Set the base path to "/basic/"
  server: {
    port: 5173, // 开发服务器端口
    // proxy: {
    //   '/tools': {
    //     target: 'http://localhost:6173', // renderer-tools 的开发服务器
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/tools/, '/tools'), // 移除 /tools 前缀
    //   },
    // }
  },

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "~/styles/element/index.scss" as *; `,
        api: 'modern-compiler',
      },
    },
  },

  plugins: [
    Vue(),

    // https://github.com/posva/unplugin-vue-router
    VueRouter({
      extensions: ['.vue', '.md'],
    }),

    Components({
      // allow auto load markdown components under `./src/components/`
      extensions: ['vue', 'md'],
      // allow auto import and register components used in markdown
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
      resolvers: [
        ElementPlusResolver({
          importStyle: 'sass',
        }),
      ],
      dts: 'src/components.d.ts',
    }),

    // https://github.com/antfu/unocss
    // see uno.config.ts for config
    Unocss(),
  ],

  ssr: {
    // TODO: workaround until they support native ESM
    noExternal: ['element-plus'],
  },
})
