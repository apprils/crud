import { readFile, readdir } from "node:fs/promises";
import { join, resolve, basename } from "node:path";

import type { DefaultTemplates } from "./@types";

export default async function readTemplates(): Promise<DefaultTemplates> {
  const root = resolve(__dirname, "templates");

  const entries = await readdir(root, {
    withFileTypes: true,
    recursive: true,
  });

  const files = entries
    .filter((e) => e.isFile())
    .sort((a, b) => {
      // sorting to place .tpl files at the end
      // to make sure they would override .ts ones
      const atpl = a.name.includes(".tpl");
      const btpl = b.name.includes(".tpl");
      if (atpl && btpl) {
        return 0;
      }
      if (atpl) {
        return 1;
      }
      if (btpl) {
        return -1;
      }
      return 0;
    });

  const templateMap: Record<
    string,
    Record<string, { file: string; content: string }>
  > = {
    api: {},
    client: {},
  };

  for (const file of files) {
    const base = basename(file.path.replace(root, ""));
    const name = file.name.replace(/\.tpl$/, "");

    if (base in templateMap) {
      templateMap[base][name] = {
        file: join(file.path, file.name),
        content: await readFile(join(file.path, file.name), "utf8"),
      };
    }
  }

  return templateMap as DefaultTemplates;
}
