type AdminDemoStoreRecord = Map<string, unknown>;

const adminDemoStore: AdminDemoStoreRecord = new Map();

const clone = <T>(value: T): T => {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value));
  }
};

export const getAdminDemoState = <T>(key: string, fallback: T): T => {
  if (!adminDemoStore.has(key)) {
    adminDemoStore.set(key, clone(fallback));
  }

  return adminDemoStore.get(key) as T;
};

export const setAdminDemoState = <T>(key: string, state: T): T => {
  adminDemoStore.set(key, clone(state));
  return state;
};

export const createAdminDemoId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;
