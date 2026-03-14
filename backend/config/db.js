import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

export async function connectDB() {
  const uri = process.env.MONGODB_URI || "";
  mongoose.set("strictQuery", true);
  
  const options = {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s
  };

  if (uri) {
    try {
      await mongoose.connect(uri, options);
    } catch (err) {
      console.warn("⚠️ Remote MongoDB failed, falling back to in-memory DB...");
      const mem = await MongoMemoryServer.create();
      const memUri = mem.getUri("zodo");
      await mongoose.connect(memUri, options);
    }
  } else {
    const mem = await MongoMemoryServer.create();
    const memUri = mem.getUri("zodo");
    await mongoose.connect(memUri, options);
  }
}
