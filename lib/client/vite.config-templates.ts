import { basename, join, resolve } from "path";
import { readdir, writeFile } from "fs/promises";

import { type UserConfig, defineConfig } from "vite";

import { sfcDts } from "./sfc";

type FindReplace = [find: string | RegExp, replace: string | RegExp | Function];

const replaceMap: Record<string, FindReplace[]> = {
  "Layout.vue": [
    [
      /^/,
      `import type { ItemT } from "@crud:virtual-module-placeholder/base";\n`,
    ],
  ],

  "CreateDialog.vue": [
    [
      /^/,
      `import type { ItemT, ItemI } from "@crud:virtual-module-placeholder/base";\n`,
    ],
  ],
};

export default defineConfig(async (): Promise<UserConfig> => {
  for (const entry of await readdir(resolve(__dirname, "templates"), {
    withFileTypes: true,
  })) {
    if (!entry.isFile() || !/\.vue$/.test(entry.name)) {
      continue;
    }

    for (let { name, text } of sfcDts(join(entry.path, entry.name))) {
      if (basename(name) !== entry.name + ".d.ts") {
        continue;
      }

      for (const [find, replace] of replaceMap[entry.name] || []) {
        text = tryReplace(basename(name), text, find, replace);
      }

      await writeFile(
        resolve(__dirname, `templates/${basename(name)}`),
        text,
        "utf8",
      );
    }
  }

  return {
    build: {
      minify: false,
      outDir: "../../pkg/client",
      emptyOutDir: false,
      lib: {
        entry: resolve(__dirname, "templates.ts"),
        formats: ["es"],
        fileName: "templates",
      },
    },
  };
});

function tryReplace(
  file: string,
  text: string,
  find: FindReplace[0],
  replace: FindReplace[1],
) {
  const before = text;
  const after = text.replace(
    find,
    // @ts-expect-error
    replace,
  );
  if (after === before) {
    throw `${file} - failed replacing ${JSON.stringify(find.toString())}`;
  }
  return after;
}
