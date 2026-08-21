declare module "next/headers" {
  type RequestCookie = Readonly<{ name?: string; value: string }>;
  type ReadonlyCookieStore = Readonly<{ get(name: string): RequestCookie | undefined }>;
  export function cookies(): Promise<ReadonlyCookieStore>;
}
