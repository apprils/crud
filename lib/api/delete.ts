
import type { DeleteMiddleware as Middleware } from "./@types";

type Methods =
  | "init"
  | "query"
  | "returning"
  | "before"
  | "delete"
  | "after"
  | "serialize"
  | "response"

export default function <QueryBuilderT, RecordT, StateT, ContextT>(): {
  [key in Methods]: Middleware<QueryBuilderT, RecordT, StateT, ContextT>;
} {

  return {

    init(env, next) {

      env.crud.query = env.crud.dbi.clone()
      env.crud.returning = []

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

    async delete(env, next) {

      const { crud } = env
      const { query }: any = crud

      const [ item ] = await query
        .where(crud.primaryKey, env.params._id)
        .delete()
        .returning([
          crud.primaryKey,
          ...crud.returning.filter((c) => !crud.returningExclude.includes(c))
        ])

      if (!item) {
        return
      }

      crud.item = item

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

