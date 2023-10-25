
import type { RetrieveMiddleware as Middleware } from "./@types";

type Methods =
  | "init"
  | "query"
  | "returning"
  | "before"
  | "retrieve"
  | "after"
  | "serialize"
  | "response"

export default function <QueryBuilderT, RecordT, StateT, ContextT>(): {
  [key in Methods]: Middleware<QueryBuilderT, RecordT, StateT, ContextT>;
} {

  return {

    init(env, next) {

      const { crud } = env

      crud.query = crud.dbi.clone().where(crud.primaryKey, env.params._id)
      crud.returning = []

      return next()

    },

    query(env, next) {
      return next()
    },

    returning(env, next) {
      return next()
    },

    before(env, next) {
      return next()
    },

    async retrieve(env, next) {

      const { crud } = env
      const { query }: any = crud

      const returning = crud.returning.length
        ? [ crud.primaryKey, ...crud.returning ]
        : "*"

      const item: RecordT = await query.first(returning)

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

