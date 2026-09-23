export function getPublicBaseUrl(): string {
  return (process.env.AUTH_URL ?? process.env.PUBLIC_BASE_URL ?? "").replace(
    /\/$/,
    "",
  );
}
