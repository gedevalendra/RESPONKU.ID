import "server-only";
import { MongoClient, type Db } from "mongodb";
import { env } from "@/lib/env";

const globalForMongo = globalThis as unknown as {
  mongoPromise?: Promise<MongoClient>;
};

export async function getMongoDb(): Promise<Db | null> {
  if (!env.mongodbUri) return null;
  globalForMongo.mongoPromise ??= new MongoClient(env.mongodbUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  }).connect();
  try {
    return (await globalForMongo.mongoPromise).db(env.mongodbDbName);
  } catch (error) {
    globalForMongo.mongoPromise = undefined;
    console.error(
      "MongoDB connection failed:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
