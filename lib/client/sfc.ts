import { createHash } from "crypto";

import {
  parse,
  compileTemplate,
  compileScript,
  rewriteDefault,
} from "vue/compiler-sfc";

import { createProgram } from "vue-tsc";
import ts from "typescript";

/** inspired from vitejs/vite-plugin-vue */
export function sfcParser(src: string, opt: { file: string }): string {
  const { file } = opt;
  const { descriptor } = parse(src, { filename: file });

  const id = createHash("sha256").update(file).digest("hex").substring(0, 10);

  const scriptCompiled = compileScript(descriptor, { id: `${id}:script` });

  const scriptCode = rewriteDefault(scriptCompiled.content, "_sfc_main", [
    "typescript",
  ]);

  const templateCompiled = compileTemplate({
    source: descriptor.template?.content || "",
    id: `${id}:template`,
    filename: file,
  });

  const templateCode = templateCompiled.code.replace(
    /\nexport (function|const) (render|ssrRender)/,
    "\n$1 _sfc_$2",
  );

  const stylesCode: string[] = [];
  const cssModules: string[] = [];

  const attachedProps: {
    render: string;
    __scopeId?: string;
    __cssModules?: string;
  } = {
    render: "_sfc_render",
  };

  for (const [index, style] of descriptor.styles.entries()) {
    const lang = style.attrs.lang || "css";

    const cssModulesMap: Record<string, string> = {};

    const query: Record<string, string | true> = {
      vue: "",
      type: "style",
      index: String(index),
    };

    if (style.scoped) {
      query.src = id;
      query.scoped = id;
      attachedProps.__scopeId = JSON.stringify(`data-v-${id}`);
    } else {
      query.src = true;
    }

    query[style.module ? `lang.module.${lang}` : `lang.${lang}`] = "";

    const url = [
      file,
      Object.entries(query)
        .map((a) => (a[1] ? a.join("=") : a[0]))
        .join("&"),
    ].join("?");

    if (style.module) {
      const styleVar = `style${index}`;

      const exposedName =
        typeof style.module === "string" ? style.module : "$style";

      stylesCode.push(`import ${styleVar} from ${JSON.stringify(url)}`);

      cssModulesMap[exposedName] = styleVar;
    } else {
      stylesCode.push(`import ${JSON.stringify(url)}`);
    }

    if (Object.keys(cssModulesMap).length) {
      const mappingCode = Object.entries(cssModulesMap)
        .map(([k, v]) => `"${k}": ${v}`)
        .join(", ");
      stylesCode.push(`const cssModules${index} = { ${mappingCode} }`);
      cssModules.push(`cssModules${index}`);
    }
  }

  if (cssModules.length) {
    attachedProps.__cssModules = `Object.assign({}, ${cssModules.join(", ")})`;
  }

  const attachedPropsStr = Object.entries(attachedProps)
    .map((a) => a.join(": "))
    .join(", ");

  return [
    scriptCode,
    templateCode,
    ...stylesCode,
    `export default Object.assign(_sfc_main, { ${attachedPropsStr} })`,
  ].join("\n\n");
}

/** inspired from qmhc/vite-plugin-dts */
export function sfcDts(sfcFile: string): { name: string; text: string }[] {
  const compilerOptions: ts.CompilerOptions = {
    declaration: true,
    emitDeclarationOnly: true,
  };

  const host = ts.createCompilerHost(compilerOptions);

  const program = createProgram({
    host,
    rootNames: [sfcFile],
    options: compilerOptions,
  });

  const { outputFiles } = program.__vue.languageService.getEmitOutput(
    `${sfcFile}.ts`,
    true,
    true,
  );

  return outputFiles;
}
