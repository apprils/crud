
import { resolve } from "path";

import { defineConfig } from "vite";
import vuePlugin from "@vitejs/plugin-vue";
import checkerPlugin from "vite-plugin-checker";
import dtsPlugin from "vite-plugin-dts";

import { peerDependencies } from "../../package.json";

export default defineConfig({

  build: {
    minify: false,
    outDir: "../../pkg/client",
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, "index.ts"),
      formats: [ "es" ],
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: Object.keys(peerDependencies),
    },
  },

  plugins: [
    vuePlugin(),
    checkerPlugin({ vueTsc: true }),
    dtsPlugin({ insertTypesEntry: true }),
  ],

})

