
import type { UpdateMiddleware as Middleware  } from "./@types";

type Methods =
  | "init"
  | "returning"
  | "dataset"
  | "before"
  | "update"
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

    async update(env, next) {

      const { crud } = env

      const returning = crud.returning.length
        ? crud.returning
        : Object.keys(crud.dataset)

      const [ item ] = await crud.dbi.clone()
        .where(crud.primaryKey, env.params._id)
        .update(crud.dataset)
        .returning([
          crud.primaryKey,
          ...returning.filter((c) => !crud.returningExclude.includes(c))
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

