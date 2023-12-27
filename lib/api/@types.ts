
import type {
  DefaultState,
  DefaultContext,
  Ctx as DefaultCtx,
} from "@appril/core/router";

export type Config<ItemT = any> = {
  primaryKey: keyof ItemT;
  itemsPerPage: number;
  sidePages: number;
}

export type CrudContext<ItemT, Extend = {}> = {
  readonly dbi: any;
  readonly columns: (keyof ItemT)[],
  readonly primaryKey: keyof ItemT;
  returning?: (keyof ItemT)[];
  returningExclude?: (keyof ItemT)[];
  returningLiteral: (keyof ItemT)[] | "*";
} & Extend

export type Context<ItemT, Extend = unknown> = DefaultContext & {
  readonly crud: CrudContext<ItemT, Extend>
}

export type Ctx<ItemT, Extend = unknown> = DefaultCtx<
  DefaultState,
  Context<ItemT, Extend>
>;

export type DefaultHandler<CtxT, ReturnT> = (ctx: CtxT) => Promise<ReturnT>;

export type CustomHandler<CtxT, ReturnT> = (
  ctx: CtxT,
  opt: { defaultHandler: DefaultHandler<CtxT, ReturnT> },
) => Promise<ReturnT>;

export type Dataset = Record<string, any>

export type GenericObject = Record<string, any>

