export function createSyntheticIdentityProvider() {
  return {
    testOnly: true as const,
    async signInWithPassword() {
      return { kind: "synthetic" as const };
    },
  };
}
