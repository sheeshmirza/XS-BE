//Reviewed

import mongoose from "mongoose";

import env from "./env";

const connectDatabase = async () => {
  if (!env.mongodbDbName) {
    throw new Error("MONGODB_DB_NAME is missing in environment variables");
  }
  if (!env.mongodbUri) {
    throw new Error("MONGODB_URI is missing in environment variables");
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongodbUri, {
    dbName: env.mongodbDbName,
  });
  console.log("MongoDB connected");
};

export { connectDatabase };
