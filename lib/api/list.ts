
import type { ListMiddleware as Middleware } from "./@types";

type Methods =
  | "init"
  | "query"
  | "returning"
  | "filters"
  | "sort"
  | "paginate"
  | "before"
  | "list"
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

    filters(env, next) {
      return next()
    },

    sort(env, next) {
      const { query }: any = env.crud
      query.orderBy(env.crud.primaryKey, "desc")
      return next()
    },

    async paginate(env, next) {

      const { crud } = env
      const { query }: any = crud

      const dataset = query.clone()

      const totalItems = await dataset.countRows()
      const totalPages = Math.ceil(totalItems / crud.itemsPerPage)

      let currentPage = Number(env.query._page || 0)

      if (currentPage < 1) {
        currentPage = 1
      }

      if (currentPage > totalPages) {
        currentPage = totalPages
      }

      let nextPage = currentPage + 1

      if (nextPage > totalPages) {
        nextPage = 0
      }

      let prevPage = currentPage - 1

      if (prevPage < 1) {
        prevPage = 0
      }

      let minPage = currentPage - crud.sidePages

      if ((currentPage + crud.sidePages) > totalPages) {
        minPage = totalPages - (crud.sidePages * 2)
      }

      if (minPage < 1) {
        minPage = 1
      }

      let maxPage = currentPage + crud.sidePages

      if (currentPage < crud.sidePages) {
        maxPage = crud.sidePages * 2
      }

      if (maxPage > totalPages) {
        maxPage = totalPages
      }

      let offset = (currentPage - 1) * crud.itemsPerPage

      if (offset < 0) {
        offset = 0
      }

      crud.pager = {
        totalItems,
        totalPages,
        currentPage,
        nextPage,
        prevPage,
        offset,
      }

      return next()

    },

    before(env, next) {
      return next()
    },

    async list(env, next) {

      const { crud } = env
      const { query }: any = crud

      const returning = crud.returning.length
        ? [ crud.primaryKey, ...crud.returning ]
        : "*"

      const items = await query
        .select(returning)
        .offset(crud.pager.offset)
        .limit(crud.itemsPerPage)

      if (crud.returningExclude.length) {
        crud.items = items.map(function(item: any): RecordT {
          return Object.entries(item).reduce((memo, [ col, val ]) => ({
            ...memo,
            ...crud.returningExclude.includes(col)
              ? {}
              : { [col]: val }
          }), {} as RecordT)
        })
      }
      else {
        crud.items = items
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

      env.body = {
        items: env.crud.items,
        pager: env.crud.pager,
      }

      return next()

    },

  }

}

