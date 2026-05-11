// src/routes/topics.ts
import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";

export async function topicRoutes(server: FastifyInstance) {
  
  // 1. GET all topics
  // URL: GET http://127.0.0.1:3000/topics
  server.get("/", async (request, reply) => {
    try {
      const topics = await prisma.topic.findMany({
        orderBy: { createdAt: 'desc' } // Shows newest topics first
      });
      return topics;
    } catch (err) {
      server.log.error(err);
      return reply.status(500).send({ message: "Failed to fetch topics" });
    }
  });

  // 2. POST a new topic (Admin only)
  // URL: POST http://127.0.0.1:3000/topics
  server.post("/", { preHandler: [server.authenticate] }, async (request, reply) => {
    const { title } = request.body as { title: string };
    
    // Ensure title is provided
    if (!title) {
      return reply.status(400).send({ message: "Topic title is required." });
    }

    const user = request.user as { role: string };
    
    // Check role (Ensure this matches exactly what is in your DB, e.g., 'admin')
    if (user.role.toLowerCase() !== 'admin') {
      return reply.status(403).send({ message: "Only admins can create topics." });
    }

    try {
      const newTopic = await prisma.topic.create({
        data: { title }
      });
      
      return reply.status(201).send(newTopic);
    } catch (err: any) {
      // P2002 is the Prisma error code for Unique Constraint failed
      if (err.code === 'P2002') {
        return reply.status(400).send({ message: "This topic title already exists." });
      }
      
      server.log.error(err);
      return reply.status(500).send({ message: "Internal Server Error" });
    }
  });
}