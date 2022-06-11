const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  terser: {
    minify: 'terser',
  },
  pluginOptions: {
    electronBuilder: {
      preload: './src/preload.ts',
      chainWebpackMainProcess: config => {
        config.module
          .rule('babel')
          .test(/CacheAccessor|ipcHandlers\.ts$/)
          .use('babel')
          .loader('babel-loader')

          .options({
            presets: [
              ['@babel/preset-env', { modules: false }],
              '@babel/preset-typescript'
            ],
            plugins: ['@babel/plugin-proposal-class-properties']
          })
      }
    }
  },

  configureWebpack: (config) => {
    config.resolve.fallback = {
      path: require.resolve('path-browserify'),
      fs: require.resolve('browserify-fs'),
      constants: require.resolve('constants-browserify'),
      stream: require.resolve('stream-browserify'),
      crypto: require.resolve('crypto-browserify'),
    }
  }
})
