import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";

// Admin-only routes for managing topics
export async function adminTopicRoutes(server: FastifyInstance) {
  // Use JWT authentication first
  server.addHook("preHandler", server.authenticate);

  // Then check admin role
  server.addHook("preHandler", async (req: any, reply: any) => {
    if (!req.user || req.user.role !== "admin") {
      return reply.status(403).send({ message: "Access denied" });
    }
  });

  // Create a new topic
  server.post("/admin/topics", async (req: any, reply) => {
    const { title } = req.body as { title: string };

    if (!title) return reply.status(400).send({ message: "Title required" });

    try {
      const topic = await prisma.topic.create({
        data: { title },
      });

      return reply.send(topic);
    } catch (err: any) {
      if (err.code === "P2002") {
        return reply.status(400).send({ message: "Topic already exists" });
      }
      console.error(err);
      return reply.status(500).send({ message: "Internal server error" });
    }
  });

  // List all topics
  server.get("/admin/topics", async (_req, reply) => {
    const topics = await prisma.topic.findMany({
      orderBy: { createdAt: "desc" },
    });
    return reply.send(topics);
  });
}
