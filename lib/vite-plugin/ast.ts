
import * as tsquery from "@phenomnomnominal/tsquery";

import {
  type CallExpression,
  type ImportSpecifier,
  type ImportDeclaration,
  type Expression,
  type Node,
} from "typescript";

const METHODS = [
  "envHandler",
  "retrieveHandler",
] as const

const METHODS_REGEX = new RegExp(`\\b(${ METHODS.join("|") })\\b`)

type Method = typeof METHODS[number]

type TypeDefinitions = {
  EnvT?: string;
  ItemAssetsT?: string;
}

export function parseFile(
  src: string,
): {
  typeDeclarations: string[];
} & TypeDefinitions {

  const ast = tsquery.ast(src)

  const callExpressions: CallExpression[] = tsquery.match(
    ast,
    "ExportAssignment ArrayLiteralExpression > CallExpression"
  )

  const importDeclarations: ImportDeclaration[] = tsquery.match(
    ast,
    "ImportDeclaration"
  )

  const interfaceDeclarations = tsquery.match(
    ast,
    "InterfaceDeclaration"
  )

  const typeAliasDeclarations = tsquery.match(
    ast,
    "TypeAliasDeclaration"
  )

  const typeDeclarations = new Set
  const typeDefinitions: TypeDefinitions = {}

  for (const node of importDeclarations) {

    // handling relative paths, namely replacing
    // ../ with ../../
    // ./ with ../
    const path = node.moduleSpecifier.getText()
      .replace(/^\W|\W$/g, "")      // removing quotes
      .replace(/^\.\.\//, "../../") // ../ -> ../../ (should go before ./)
      .replace(/^\.\//, "../")      // ./ -> ../

    for (const spec of tsquery.match(node, "ImportSpecifier") as ImportSpecifier[]) {

      if (node.importClause?.isTypeOnly) {
        typeDeclarations.add(`import type { ${ spec.getText() } } from "${ path }";`)
      }
      else if (spec.isTypeOnly) {
        typeDeclarations.add(`import { ${ spec.getText() } } from "${ path }";`)
      }

    }

  }

  for (const node of [
    ...interfaceDeclarations,
    ...typeAliasDeclarations,
  ]) {
    typeDeclarations.add(node.getText())
  }

  for (const exp of callExpressions) {

    const [ firstArg ] = exp.arguments

    if (!firstArg) {
      continue
    }

    const [ method ] = [ ...exp.expression.getText().match(METHODS_REGEX) || [] ] as Method[]

    if (!method || !METHODS.includes(method)) {
      continue
    }

    if (method === "retrieveHandler") {

      for (const node of [
        ...tsquery.match(
          firstArg,
          "ObjectLiteralExpression > MethodDeclaration > Identifier[name=assets]"
        ).map((e) => e.parent),
        ...tsquery.match(
          firstArg,
          "ObjectLiteralExpression > PropertyAssignment > Identifier[name=assets] ~ ArrowFunction"
        ),
      ]) {
        typeDefinitions.ItemAssetsT = getReturnType(node)
      }

    }
    else if (method === "envHandler") {
      typeDefinitions.EnvT = getReturnType(firstArg)
    }

  }

  return {
    typeDeclarations: [ ...typeDeclarations ] as string[],
    ...typeDefinitions
  }

}

function getReturnType(
  node: Expression | Node,
): string | undefined {

  const [ typeReference ] = tsquery.match(
    node,
    "TypeReference,TypeLiteral,AnyKeyword"
  ).filter((e) => e.parent === node)

  if (typeReference) {

    if (/^Promise(\s+)?</.test(typeReference.getText())) {

      const [ wrappedType ] = tsquery.match(
        typeReference,
        "TypeReference:first-child,TypeLiteral:first-child,AnyKeyword:first-child"
      )

      return wrappedType?.getText()

    }

    return typeReference.getText()

  }

}

