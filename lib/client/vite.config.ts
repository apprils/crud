
import { resolve } from "path";

import { defineConfig } from "vite";

import { peerDependencies } from "../../package.json"; 

export default defineConfig({

  build: {
    minify: false,
    outDir: "../../pkg/client",
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, "index.ts"),
      formats: [ "es", "cjs" ],
      fileName: (format, name) => `${ name }.${ format.replace("es", "mjs") }`,
    },
    rollupOptions: {
      external: Object.keys(peerDependencies),
    },
  },

})

