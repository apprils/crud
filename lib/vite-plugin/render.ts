
import fsx from "fs-extra";
import mustache from "mustache";

// disabling escape
mustache.escape = (s: string) => s

export const BANNER = `/**
* @generated file, do not modify manually!
*/`

export function render<Context = {}>(template: string, context: Context): string {
  return mustache.render(template, { ...context })
}

export async function renderToFile<Context = {}>(
  file: string,
  template: string,
  context: Context,
  opts: { overwrite?: boolean } = {},
): Promise<void> {

  if (opts?.overwrite === false) {
    if (await fsx.exists(file)) {
      return
    }
  }

  return fsx.outputFile(
    file,
    render(template, context),
    "utf8"
  )

}

