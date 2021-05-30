/**
 * @type {import('vite').UserConfig}
 */

 
// import path from "path"
// import glob from "glob"

const config = {
  // root: path.join(__dirname, "src"),
  // build: {
  //   outDir: path.join(__dirname, "/dist"),
  //   rollupOptions: {
  //     input: glob.sync(path.resolve(__dirname, "src", "*.html")),
  //   },
  // },
  root: 'src',
  server: {
    open: '/index.html'
  },
  build: {
    minify: false,
    manifest: true,
    outDir: '../dist'
  }
}

export default config