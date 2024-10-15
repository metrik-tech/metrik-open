import Redis from "ioredis";

export const redisFactory = (prefix?: string) => {
  // const redis = new Redis({
  //   host: "redis.iad1.metrik.app",
  //   port: 6379,
  //   password: env.REDIS_PASSWORD,
  //   keyPrefix: prefix ?? undefined,
  // });

  const newRedis = new Redis(process.env.REDIS_URL!, {
    keyPrefix: prefix ?? undefined,
  });

  return newRedis;
};
