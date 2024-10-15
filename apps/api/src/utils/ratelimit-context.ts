import { Context, Options } from "elysia-rate-limit";
import type { Redis } from "ioredis";

import { redisFactory } from "./redis";

interface Item {
  count: number;
  nextReset: Date;
}

export class RedisContext implements Context {
  private redis!: Redis;
  private duration!: number;

  public constructor() {}

  public init(options: Options) {
    this.redis = redisFactory("ratelimit:");
  }

  public async increment(key: string) {
    const now = new Date();
    const value = await this.redis.get(key);

    if (value === null) {
      await this.redis.set(key, JSON.stringify({ count: 1, nextReset: now }));
      return { count: 1, nextReset: now };
    }

    const item = JSON.parse(value) as Item;

    if (item.nextReset < now) {
      await this.redis.set(key, JSON.stringify({ count: 1, nextReset: now }));
      return { count: 1, nextReset: now };
    }

    item.count++;
    await this.redis.set(key, JSON.stringify(item));

    return item;
  }

  public async decrement(key: string) {
    const value = await this.redis.get(key);

    if (value === null) {
      return;
    }

    const item = JSON.parse(value) as Item;

    item.count--;

    await this.redis.set(key, JSON.stringify(item));

    return;
  }

  public async reset(key?: string) {
    if (typeof key === "string") this.redis.del(key);
    else this.redis.disconnect();
  }

  public async kill() {
    this.redis.disconnect();
  }
}
