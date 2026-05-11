import Fastify from "fastify";
import crypto from "crypto";
import * as dotenv from "dotenv";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { prisma } from "./db.js"; 
import { jwtPlugin } from "./plugins/jwt.js";
import { authRoutes } from "./routes/auth.js";
import { thoughtRoutes } from "./routes/thoughts.js";
import { adminTopicRoutes } from "./routes/adminTopics.js";

dotenv.config();

declare module 'fastify' {
  interface FastifyInstance {
    gemini: GenerativeModel;
    authenticate: any; // Now correctly recognized
  }
}

const server = Fastify({ logger: true });

// INITIALIZE GEMINI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: { responseMimeType: "application/json" } 
});
server.decorate('gemini', model);

// 2️⃣ Register JWT plugin properly
// By registering it first, .authenticate will be ready for the routes below
await server.register(jwtPlugin);

// 3️⃣ Register routes
server.register(authRoutes);
server.register(thoughtRoutes);
server.register(adminTopicRoutes);

// ... rest of your routes (/, /me, etc.) ...

const start = async () => {
  try {
    await server.listen({ port: 3000, host: "0.0.0.0" });
    console.log("🚀 Server running on http://localhost:3000");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();