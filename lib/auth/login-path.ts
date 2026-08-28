export const LOGIN_PATH = "/login";

export function loginUrl(options?: { error?: boolean; intent?: string }): string {
  const params = new URLSearchParams();
  if (options?.error) {
    params.set("error", "1");
  }
  if (options?.intent && options.intent !== "login") {
    params.set("intent", options.intent);
  }
  const query = params.toString();
  return query ? `${LOGIN_PATH}?${query}` : LOGIN_PATH;
}
