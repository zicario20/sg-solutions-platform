export const createFailClosedAuthOwnerPorts = () => ({
  resolveParty: async () => ({ kind: "unavailable" as const }),
  authorizeResource: async () => ({ kind: "denied" as const }),
});
