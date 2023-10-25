
import type { EnvMiddleware as Middleware  } from "./@types";

type Methods =
  | "env"

export default function <StateT, ContextT>(): {
  [key in Methods]: Middleware<StateT, ContextT>;
} {

  return {

    env(env, next) {
      env.body = {}
    },

  }

}

