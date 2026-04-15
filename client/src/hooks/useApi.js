import { useCallback } from "react";
import { useAuth } from "./useAuth.js";
import { api } from "../utils/api.js";

export function useApi() {
  const { getToken } = useAuth();

  const authedRequest = useCallback(
    async (method, url, data, config) => {
      const token = await getToken();
      return api.request(method, url, data, token, config);
    },
    [getToken]
  );

  return {
    get: (url, config) => authedRequest("get", url, null, config),
    post: (url, data, config) => authedRequest("post", url, data, config),
    put: (url, data, config) => authedRequest("put", url, data, config),
    del: (url, config) => authedRequest("delete", url, null, config)
  };
}
