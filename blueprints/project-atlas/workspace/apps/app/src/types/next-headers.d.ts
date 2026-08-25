declare module "next/headers" {
  type RequestCookie = Readonly<{ name?: string; value: string }>;
  type ReadonlyCookieStore = Readonly<{ get(name: string): RequestCookie | undefined }>;
  type ReadonlyHeaders = Headers;
  export function cookies(): Promise<ReadonlyCookieStore>;
  export function headers(): Promise<ReadonlyHeaders>;
}
