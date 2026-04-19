export interface StoreAdapter<T> {
  read(): Promise<T>;
  write(data: T): Promise<void>;
  update(mutator: (current: T) => T | Promise<T>): Promise<T>;
}

export abstract class BaseStore<T> implements StoreAdapter<T> {
  abstract read(): Promise<T>;
  abstract write(data: T): Promise<void>;

  async update(mutator: (current: T) => T | Promise<T>): Promise<T> {
    const current = await this.read();
    const next = await mutator(current);
    await this.write(next);
    return next;
  }
}