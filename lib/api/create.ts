
import type { CreateMiddleware as Middleware } from "./@types";

type Methods =
  | "init"
  | "returning"
  | "dataset"
  | "before"
  | "create"
  | "after"
  | "serialize"
  | "response"

export default function <RecordT, StateT, ContextT>(): {
  [key in Methods]: Middleware<RecordT, StateT, ContextT>;
} {

  return {

    async init(env, next) {
      env.crud.returning = []
      return next()
    },

    returning(env, next) {
      return next()
    },

    dataset(env, next) {
      return next()
    },

    before(env, next) {
      return next()
    },

    async create(env, next) {

      const { crud } = env

      const returning = crud.returning.length
        ? [ crud.primaryKey, ...crud.returning ]
        : "*"

      const [ item ] = await crud.dbi
        .insert(crud.dataset)
        .returning(returning)

      if (!item) {
        return
      }

      if (crud.returningExclude.length) {

        crud.item = Object.entries(item).reduce((memo, [ col, val ]) => ({
          ...memo,
          ...crud.returningExclude.includes(col)
            ? {}
            : { [col]: val }
        }), {} as RecordT)

      }
      else {
        crud.item = item
      }

      return next()

    },

    after(env, next) {
      return next()
    },

    serialize(env, next) {
      return next()
    },

    response(env, next) {
      env.body = env.crud.item
      return next()
    },

  }

}

