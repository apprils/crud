import { resolve, join } from "path";

import fsx from "fs-extra";

import { renderToFile } from "./render";

const CWD = process.cwd();

export function resolvePath(...path: string[]): string {
  return resolve(CWD, join(...path));
}

export function filesGeneratorFactory() {
  const generatedFiles = new Set<string>();

  function generateFile<RenderContext = {}>(
    outfile: string,
    render: { template: string; context: RenderContext },
  ): Promise<void>;

  function generateFile(outfile: string, content: string): Promise<void>;

  function generateFile(...args: any[]) {
    const [outfile, rest] = args;
    generatedFiles.add(outfile);
    return typeof rest === "string"
      ? fsx.outputFile(resolvePath(outfile), rest, "utf8")
      : renderToFile(resolvePath(outfile), rest.template, rest.context);
  }
  return {
    generateFile,
    persistGeneratedFiles(outfile: string, lineMapper?: (f: string) => string) {
      return persistGeneratedFiles(
        outfile,
        lineMapper ? [...generatedFiles].map(lineMapper) : [...generatedFiles],
      );
    },
  };
}

export function persistGeneratedFiles(outfile: string, entries: string[]) {
  return fsx.outputFile(
    resolvePath("../var/.cache/generatedFiles", outfile),
    [...entries].join("\n"),
  );
}
