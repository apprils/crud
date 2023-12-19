
import type {
  CrudContext, Config,
  Dataset, ZodSchemaWrapper,
} from "./@types";

import config from "./config";

import returningFactory from "./returning";
import returningExcludeFactory from "./returningExclude";
import envFactory from "./env";

import listFactory from "./list";
import retrieveFactory from "./retrieve";
import createFactory from "./create";
import updateFactory from "./update";
import deleteFactory from "./delete";

export default function crudFactory<
  ItemT,
  QueryBuilder,
>(
  dbi: any,
  opt: {
    columns: (keyof ItemT)[],
    primaryKey?: keyof ItemT;
    zodSchema?: ZodSchemaWrapper;
    zodErrorHandler?: Function;
  }
) {

  const {
    columns,
    primaryKey,
    zodSchema,
    zodErrorHandler,
  } = { ...config as Config<ItemT>, ...opt }

  const returningLiteral = function(
    this: CrudContext<ItemT>
  ) {

    if (this.returning) {
      return [
        primaryKey,
        ...this.returning.filter((e) => e !== primaryKey)
      ]
    }

    if (this.returningExclude) {
      return [
        primaryKey,
        ...columns.filter((e) => e !== primaryKey && !this.returningExclude?.includes(e))
      ]
    }

    return "*"

  }

  const validatedDataset = function(
    this: CrudContext<
      ItemT,
      { dataset: Dataset, zodSchema: ZodSchemaWrapper, zodErrorHandler: Function }
    >
  ) {

    if (!this.dataset) {
      return
    }

    if (!this.zodSchema) {
      return this.dataset
    }

    try {
      this.zodSchema(this.dataset).parse(this.dataset)
    }
    catch(error: any) {
      throw this.zodErrorHandler?.(error) || error
    }

    return this.dataset

  }

  const ctxExtend: {
    crud: CrudContext<ItemT>,
  } = {
    crud: Object.defineProperties({} as CrudContext<ItemT>, {
      dbi: { get() { return dbi }, configurable: false },
      columns: { get() { return [ ...opt.columns ] }, configurable: false },
      primaryKey: { get() { return primaryKey }, configurable: false },
      returningLiteral: { get: returningLiteral, configurable: false },
      validatedDataset: { get: validatedDataset, configurable: false },
    }),
  }

  const init = function(ctx: any, next: any) {

    for (const [ key, value ] of Object.entries(ctxExtend)) {
      key in ctx || Object.defineProperty(ctx, key, {
        value,
        configurable: false,
        writable: false,
        enumerable: true,
      })
    }

    return next()

  }

  return {
    returning: returningFactory<ItemT>(init),
    returningExclude: returningExcludeFactory<ItemT>(init),
    envHandler: envFactory<ItemT>(init),
    listHandler: listFactory<ItemT, QueryBuilder>(init, config),
    retrieveHandler: retrieveFactory<ItemT, QueryBuilder>(init),
    createHandler: createFactory<ItemT>(init, { zodSchema, zodErrorHandler }),
    updateHandler: updateFactory<ItemT>(init, { zodSchema, zodErrorHandler }),
    deleteHandler: deleteFactory<ItemT>(init),
  }

}

