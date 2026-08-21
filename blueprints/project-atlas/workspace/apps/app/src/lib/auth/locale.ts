import { authCopy, resolveAuthLocale } from "@atlas/i18n";

export function currentAuthCopy(locale?: string) {
  return authCopy[resolveAuthLocale(locale ?? process.env.ATLAS_DEFAULT_LOCALE)];
}
