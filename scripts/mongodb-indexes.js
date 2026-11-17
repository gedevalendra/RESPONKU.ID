// Run once with: node scripts/mongodb-indexes.js
// Requires MONGODB_URI and optional MONGODB_DB_NAME in .env.local.
const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI belum diisi");
const client = new MongoClient(process.env.MONGODB_URI);
client.connect().then(async () => {
  const db = client.db(process.env.MONGODB_DB_NAME || "responku");
  await Promise.all([
    db.collection("articles").createIndex({ slug: 1 }, { unique: true }),
    db.collection("articles").createIndex({ id: 1 }, { unique: true }),
    db.collection("articles").createIndex({ status: 1, date: -1 }),
    db.collection("articles").createIndex({ authorId: 1, date: -1 }),
    db.collection("articles").createIndex({ category: 1, date: -1 }),
    db.collection("articles").createIndex({ title: "text", dek: "text", content: "text" }),
    db.collection("article_events").createIndex({ articleSlug: 1, createdAt: -1 }),
    db.collection("article_events").createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 730 }),
    db.collection("oauth_users").createIndex({ provider: 1, providerUserId: 1 }, { unique: true }),
    db.collection("oauth_users").createIndex({ email: 1 }),
  ]);
  console.log("MongoDB indexes ready");
}).finally(() => client.close());
