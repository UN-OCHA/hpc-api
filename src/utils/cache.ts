/**
 * Lightweight in-memory cache to speed-up authorization processes.
 * 
 * TODO: extend this with some cross-container cache such as redis or memcached
 */

import { createHash } from 'crypto';

const sha256 = (str: string) => createHash('sha256').update(str).digest('hex');

export type HIDInfo =
  {
    userId: string;
    given_name: string;
    family_name: string;
    email: string;
  }

export type HIDResponse =
  {
    type: 'success',
    info: HIDInfo,
  }
  | {
    type: 'forbidden',
    message: string,
  }

type CachedValue<T> = {
  value: T;
  time: Date;
}

export class HashTableCache<V> {

  /**
   * The number of milliseconds a value should remain vaild for
   */
  private readonly cacheItemLifetimeMs: number;

  private map = new Map<string, CachedValue<V>>();

  constructor(opts: {
    cacheItemLifetimeMs: number;
  }) {
    this.cacheItemLifetimeMs = opts.cacheItemLifetimeMs;
  }

  public store = (key: string, value: V, cacheTime?: Date) => {
    this.map.set(sha256(key), {
      value,
      time: cacheTime || new Date()
    });
    this.clearExpiredValues();
  }

  public get = (key: string) => {
    const item = this.map.get(sha256(key));
    if (item && item.time.getTime() + this.cacheItemLifetimeMs > Date.now()) {
      return item.value;
    } else {
      return null;
    }
  }

  public clearExpiredValues = () => {
    const now = Date.now();
    for (const [key, item] of this.map.entries()) {
      if (item.time.getTime() + this.cacheItemLifetimeMs < now) {
        this.map.delete(key);
      }
    }
  }

  public clear = () => this.map.clear()

  public size = () => this.map.size
}

export const HID_CACHE = new HashTableCache<HIDResponse>({
  cacheItemLifetimeMs: 5 * 60 * 1000, // 5 minutes
});

