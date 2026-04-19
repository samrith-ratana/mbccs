import type { AuthStoreData, SessionRecord } from "@/models/auth";
import type { UserRecord } from "@/models/user";
import type { StoreAdapter } from "@/lib/storage";

const DEFAULT_STORE: AuthStoreData = { users: [], sessions: [] };

function normalizeStore(store: AuthStoreData | null | undefined): AuthStoreData {
  if (!store) return { ...DEFAULT_STORE };
  return {
    users: Array.isArray(store.users) ? store.users : [],
    sessions: Array.isArray(store.sessions) ? store.sessions : [],
  };
}

export class DataService {
  private store: StoreAdapter<AuthStoreData>;

  constructor(store: StoreAdapter<AuthStoreData>) {
    this.store = store;
  }

  async read(): Promise<AuthStoreData> {
    const raw = await this.store.read();
    return normalizeStore(raw);
  }

  async write(next: AuthStoreData) {
    await this.store.write(normalizeStore(next));
  }

  async update(mutator: (current: AuthStoreData) => AuthStoreData | Promise<AuthStoreData>) {
    return this.store.update((current) => mutator(normalizeStore(current)));
  }

  async getUsers(): Promise<UserRecord[]> {
    const { users } = await this.read();
    return users;
  }

  async saveUsers(users: UserRecord[]) {
    await this.update((store) => ({ ...store, users }));
  }

  async getSessions(): Promise<SessionRecord[]> {
    const { sessions } = await this.read();
    return sessions;
  }

  async saveSessions(sessions: SessionRecord[]) {
    await this.update((store) => ({ ...store, sessions }));
  }
}