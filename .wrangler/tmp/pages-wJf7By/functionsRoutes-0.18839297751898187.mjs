import { onRequestPost as __api_analyze_ts_onRequestPost } from "C:\\Users\\jsanc\\projects\\jobfit\\functions\\api\\analyze.ts"

export const routes = [
    {
      routePath: "/api/analyze",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_analyze_ts_onRequestPost],
    },
  ]