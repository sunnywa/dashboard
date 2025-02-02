import { URL, fileURLToPath } from 'url';

import vue from '@vitejs/plugin-vue2';
import vueJsx from '@vitejs/plugin-vue2-jsx';
import { VuetifyResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';
import { chunkSplitPlugin } from 'vite-plugin-chunk-split';
import Markdown from 'vite-plugin-vue-markdown';
import VueSetupExtend from 'vite-plugin-vue-setup-extend';
import inheritAttrs from 'vite-plugin-vue-setup-inherit-attrs';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
  },
  plugins: [
    vue({ include: [/\.vue$/, /\.md$/] }),
    inheritAttrs() as any,
    Markdown(),
    Components({
      resolvers: [VuetifyResolver()],
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
      dts: false,
    }),
    vueJsx(),
    chunkSplitPlugin({
      strategy: 'default',
      customSplitting: {
        'vuetify-vendor': ['vuetify'],
        xterm: ['xterm', 'xterm-addon-fit'],
        'base-tool': ['js-yaml', 'js-base64', 'ajv', 'vuedraggable', 'brace'],
        highlight: ['highlight.js'],
        'vue-slider-component': ['vue-slider-component'],
        moment: ['moment'],
        'vue-table-dynamic': ['vue-table-dynamic'],
        'vue-i18n': ['vue-i18n'],
        '@kubegems': ['@kubegems/api', '@kubegems/extension', '@kubegems/libs'],
        '@iconify-json/logos': ['@iconify-json/logos'],
        '@iconify-json/mdi': ['@iconify-json/mdi'],
      },
    }),
    VueSetupExtend(),
  ],
  envPrefix: 'VUE_APP_',
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@import "@/scss/variables.scss";',
      },
      sass: {
        additionalData: ['@import "@/scss/variables.scss"', ''].join('\n'),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 2048,
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    proxy: {
      '/api/v1/edge-': {
        target: 'http://172.16.23.231:30001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1/, '/v1'),
      },
      '/api/v1': {
        // target: 'http://10.12.32.41:8020',
        target: 'http://local.kubegems.io:30939',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1/, '/v1'),
        ws: true,
      },
      '/realtime/': {
        target: 'http://local.kubegems.io:8020',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/realtime\//, '/'),
        ws: true,
      },
      '/api/lokiExport/': {
        target: 'http://local.kubegems.io:8020',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/lokiExport\//, '/lokiExport/'),
      },
    },
  },
});
