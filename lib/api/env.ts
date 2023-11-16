
import type { EnvMiddleware as Middleware  } from "./@types";

type Methods =
  | "define"
  | "env"
  | "response"

export default function <EnvT, StateT, ContextT>(): {
  [key in Methods]: Middleware<EnvT, StateT, ContextT>;
} {

  return {

    define(env, next) {
      env.crudEnv = {}
      return next()
    },

    env(env, next) {
      env.crudEnv = {}
      return next()
    },

    response(env, next) {
      env.body = env.crudEnv
      return next()
    },

  }

}

