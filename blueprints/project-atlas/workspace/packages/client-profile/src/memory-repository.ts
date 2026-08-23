import type { ProfileCorrection, ProfileRepository, ProfileSnapshot } from "./contracts.ts";
export class MemoryProfileRepository implements ProfileRepository {
  private readonly snapshots = new Map<string, ProfileSnapshot>();
  private readonly corrections = new Map<string, ProfileCorrection[]>();
  public seed(snapshot: ProfileSnapshot): void {
    this.snapshots.set(snapshot.root.clientRef, snapshot);
  }
  public async find(clientRef: string): Promise<ProfileSnapshot | undefined> {
    return this.snapshots.get(clientRef);
  }
  public async saveCorrection(correction: ProfileCorrection): Promise<void> {
    const items = this.corrections.get(correction.profileRef) ?? [];
    this.corrections.set(correction.profileRef, [...items, correction]);
  }
  public async listCorrections(profileRef: string): Promise<readonly ProfileCorrection[]> {
    return Object.freeze([...(this.corrections.get(profileRef) ?? [])]);
  }
}
