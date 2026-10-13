import * as dotenv from "dotenv";
dotenv.config();

import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import jwt from "@fastify/jwt";

// Route modules
import { authRoutes } from "./routes/auth.js";
import { thoughtRoutes } from "./routes/thoughts.js";
import { topicRoutes } from "./routes/topics.js";
import { adminRoutes } from "./routes/admin.js";
import { aiTestRoutes } from "./routes/aiTest.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
  }
}

export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV === "test" ? false : true,
  });

  // 1. CORS Configuration for Frontend Integration
  await app.register(cors, {
    origin: true, // Allow frontend dev server and production clients
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
  });

  // 2. Rate Limiting Middleware
  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
  });

  // 3. JWT Authentication Setup
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "veridix-fallback-jwt-secret-key-change-in-production",
  });

  // 4. Auth Decorator Guard
  app.decorate("authenticate", async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({
        statusCode: 401,
        error: "Unauthorized",
        message: "Invalid, expired, or missing authentication token.",
      });
    }
  });

  // 5. Health Check Endpoints
  app.get("/", async () => {
    return {
      name: "VERIDIX AI Gatekeeper API",
      status: "healthy",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    };
  });

  app.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // 6. Route Registration
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(topicRoutes, { prefix: "/topics" });
  await app.register(thoughtRoutes);
  await app.register(adminRoutes, { prefix: "/admin" });
  await app.register(aiTestRoutes);

  return app;
}

// If executed directly, bootstrap the server
if (process.argv[1]?.endsWith("app.ts") || process.argv[1]?.endsWith("app.js")) {
  const start = async () => {
    try {
      const app = await createApp();
      const port = Number(process.env.PORT) || 3000;
      await app.listen({ port, host: "0.0.0.0" });
      console.log(`🛡️  VERIDIX AI Gatekeeper is ONLINE on http://localhost:${port}`);
    } catch (err) {
      console.error("Failed to start VERIDIX server:", err);
      process.exit(1);
    }
  };
  start();
}