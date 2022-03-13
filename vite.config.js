// vite.config.js
const path = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'tiny',
      fileName: (format) => `lil-gui.${format === 'es' ? 'esm' : format}.js`
    },
  }
})
