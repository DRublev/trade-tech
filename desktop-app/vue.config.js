const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  terser: {
    minify: 'terser',
  },
  pluginOptions: {
    electronBuilder: {
      preload: './src/preload.ts',
    }
  },

  configureWebpack: (config) => {
    config.resolve.fallback = {
      path: require.resolve('path-browserify'),
      fs: require.resolve('browserify-fs'),
      constants: require.resolve('constants-browserify'),
      stream: require.resolve('stream-browserify'),
    }
  }
})
