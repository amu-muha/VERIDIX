import * as dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import jwt from '@fastify/jwt';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Import all route handlers
import { authRoutes } from './routes/auth.js';
import { thoughtRoutes } from './routes/thoughts.js';
import { topicRoutes } from './routes/topics.js'; 

const server = Fastify({ logger: true });

// 1. JWT Setup
server.register(jwt, {
  secret: process.env.JWT_SECRET!
});

// 2. Auth Decorator
server.decorate("authenticate", async (request: any, reply: any) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: "Unauthorized: Invalid token." });
  }
});

// 3. AI Gatekeeper Model Initialization
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const gatekeeperModel = genAI.getGenerativeModel(
  { model: "gemini-2.5-flash" }, // 👈 Use the 2026 stable model
  { apiVersion: "v1" }            // 👈 Force the stable V1 API
);

server.decorate('gatekeeper', gatekeeperModel);

// 4. Route Registration (Prefixes are applied here)
server.register(authRoutes, { prefix: '/auth' });     // /auth/register, /auth/login
server.register(topicRoutes, { prefix: '/topics' });   // /topics
server.register(thoughtRoutes);                        // /thoughts (usually defined as /thoughts inside its file)

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await server.listen({ port, host: '0.0.0.0' });
    
    // Tip: This will log your actual route tree to the console so you can see the URLs
    console.log("Registered Routes:\n", server.printRoutes());
    
    console.log(`🛡️  AI Gatekeeper Backend is ONLINE on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();