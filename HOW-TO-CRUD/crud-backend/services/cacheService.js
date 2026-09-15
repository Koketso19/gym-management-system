const redis = require("redis");
const logging = require("../lib/classLogging");
const redisConfig = require("../config/sysconfig").REDIS;
const redisConnect = "redis://" + redisConfig.host + ":" + redisConfig.port;
const REDIS_DEFAULT_TTL = 86400; //seconds (86400s per day 24H)
const log = new logging("CacheService");
// Separate instances are required because a subscribed client enters a listening mode
const redisClient = redis.createClient({
  url: redisConnect || "redis://localhost:6379",
  //password: process.env.REDIS_PASSWORD || "",
  database: 0,
});
const pubclient = redisClient.duplicate();
const subclient = redisClient.duplicate();
redisClient.on("connect", () => {
  log.info("Redis routing client connected");
});
pubclient.on("connect", () => {
  log.info("Redis publisher client connected");
});
subclient.on("connect", () => {
  log.info("Redis subscriber client connected");
});
redisClient.on("ready", () => {
  log.info("Redis routing client ready");
});
pubclient.on("ready", () => {
  log.info("Redis publisher client ready");
});
subclient.on("ready", () => {
  log.info("Redis subscription client ready");
});
redisClient.on("error", (err) => {
  log.error("Redis routing client error:", err);
});
pubclient.on("error", (err) => {
  log.error("Redis publisher client error:", err);
});
subclient.on("error", (err) => {
  log.error("Redis subscriber client error:", err);
});

(async () => {
  await redisClient.connect();
  await pubclient.connect();
  await subclient.connect();
})();

async function RedisUpsertObjectAsync(collection, obj, key) {
  if (!collection) return null;
  if (!obj) return null;
  if (!key) return null;
  let redisKey = GenerateKey(collection, key);
  return await redisClient.set(redisKey, JSON.stringify(obj));
} /* RedisUpsertInfoAsync */

async function RedisUpsertObjectWithTtlAsync(
  collection,
  obj,
  key,
  ttl = REDIS_DEFAULT_TTL,
) {
  if (!collection) return null;
  if (!obj) return null;
  if (!key) return null;
  let redisKey = GenerateKey(collection, key);
  return await redisClient.set(redisKey, JSON.stringify(obj), "EX", ttl);
} /* RedisUpsertObjectWithTtlAsync */

//Get InfoObject from Redis
async function RedisGetObjectAsync(collection, key) {
  if (!collection) return null;
  if (!key) return null;
  let redisKey = GenerateKey(collection, key);
  var cachedData = await redisClient.get(redisKey);
  if (cachedData) {
    return JSON.parse(cachedData);
  }
  return null;
} /* RedisGetObjectAsync */

//Delete Info from Redis
//await RedisDeleteObjectAsync("REJECTED", "105");
async function RedisDeleteObjectAsync(collection, key) {
  if (!collection) return null;
  if (!key) return null;
  let redisKey = GenerateKey(collection, key);
  return await redisClient.del(redisKey);
} /* RedisDeleteObjectAsync */

async function PublishToRedisChannelAsync(channelID, data) {
  let stringData = JSON.stringify(data);
  try {
    const receiverCount = await pubclient.publish(channelID, stringData);
    log.info(
      `ChannelID ${channelID} | data ${stringData} | message received by ${receiverCount} subscribers`,
    );
    return receiverCount;
  } catch (error) {
    log.error(
      "Failed to publish data to channel " +
        channelID +
        " | data: " +
        stringData +
        " | " +
        error.message,
    );
    return -1;
  }
} /* PublishToRedisChannelAsync */

function GenerateKey(collection, key) {
  if (!collection) return null;
  if (!key) return null;
  let redisKey = collection.trim().toUpperCase() + ":" + key;
  return redisKey;
}

module.exports = {
  redisClient,
  pubclient,
  subclient,
  RedisUpsertObjectAsync,
  RedisUpsertObjectWithTtlAsync,
  RedisGetObjectAsync,
  RedisDeleteObjectAsync,
  PublishToRedisChannelAsync,
};
