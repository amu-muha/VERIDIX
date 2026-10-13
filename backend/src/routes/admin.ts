import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";

export async function adminRoutes(server: FastifyInstance) {
  // Pre-handlers: JWT authentication followed by Admin role verification
  server.addHook("preHandler", server.authenticate);
  server.addHook("preHandler", async (req: any, reply: any) => {
    if (!req.user || req.user.role?.toLowerCase() !== "admin") {
      return reply.status(403).send({ message: "Forbidden: Admin access required." });
    }
  });

  // 1. GET /admin/stats - System Telemetry KPI Metrics
  server.get("/stats", async (_req, reply) => {
    try {
      const [totalLogs, blockedLogs, safeLogs, totalThoughts, totalUsers, totalTopics] =
        await Promise.all([
          prisma.auditLog.count(),
          prisma.auditLog.count({ where: { decision: "BLOCK" } }),
          prisma.auditLog.count({ where: { decision: "SAFE" } }),
          prisma.thought.count(),
          prisma.user.count(),
          prisma.topic.count(),
        ]);

      const blockRate = totalLogs > 0 ? Math.round((blockedLogs / totalLogs) * 100) : 0;
      const approvalRate = totalLogs > 0 ? 100 - blockRate : 100;

      // Violation categories breakdown
      const violations = await prisma.auditLog.groupBy({
        by: ["category"],
        where: { decision: "BLOCK" },
        _count: { category: true },
        orderBy: { _count: { category: "desc" } },
        take: 5,
      });

      return reply.send({
        totalVerifications: totalLogs,
        approvedCount: safeLogs,
        blockedCount: blockedLogs,
        approvalRate,
        blockRate,
        totalThoughts,
        totalUsers,
        totalTopics,
        topViolations: violations.map((v) => ({
          category: v.category || "Unknown",
          count: v._count.category,
        })),
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ message: "Failed to fetch admin telemetry stats", error: err.message });
    }
  });

  // 2. GET /admin/audit-logs - Filterable Audit Log Trail
  server.get("/audit-logs", async (req, reply) => {
    const { decision, riskLevel, limit = 50 } = req.query as {
      decision?: string;
      riskLevel?: string;
      limit?: string;
    };

    try {
      const where: any = {};
      if (decision && decision !== "ALL") {
        where.decision = decision;
      }
      if (riskLevel && riskLevel !== "ALL") {
        where.riskLevel = riskLevel;
      }

      const logs = await prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { timestamp: "desc" },
        take: Math.min(Number(limit) || 50, 100),
      });

      return reply.send(logs);
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ message: "Failed to fetch audit logs", error: err.message });
    }
  });

  // 3. GET /admin/topics - List all topics with thoughts count
  server.get("/topics", async (_req, reply) => {
    try {
      const topics = await prisma.topic.findMany({
        include: {
          _count: {
            select: { thoughts: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return reply.send(topics);
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ message: "Failed to fetch topics", error: err.message });
    }
  });

  // 4. POST /admin/topics - Create topic
  server.post("/topics", async (req, reply) => {
    const { title } = req.body as { title: string };
    if (!title || !title.trim()) {
      return reply.status(400).send({ message: "Topic title is required." });
    }

    try {
      const topic = await prisma.topic.create({
        data: { title: title.trim() },
      });
      return reply.status(201).send(topic);
    } catch (err: any) {
      if (err.code === "P2002") {
        return reply.status(400).send({ message: "A topic with this title already exists." });
      }
      server.log.error(err);
      return reply.status(500).send({ message: "Internal server error" });
    }
  });

  // 5. DELETE /admin/topics/:id - Delete topic
  server.delete("/topics/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      // First delete associated thoughts
      await prisma.thought.deleteMany({ where: { topicId: Number(id) } });
      const deleted = await prisma.topic.delete({ where: { id: Number(id) } });
      return reply.send({ message: "Topic deleted successfully", topic: deleted });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ message: "Failed to delete topic", error: err.message });
    }
  });

  // 6. GET /admin/thoughts - List all thoughts for moderation
  server.get("/thoughts", async (_req, reply) => {
    try {
      const thoughts = await prisma.thought.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          topic: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return reply.send(thoughts);
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ message: "Failed to fetch thoughts", error: err.message });
    }
  });

  // 7. DELETE /admin/thoughts/:id - Delete thought
  server.delete("/thoughts/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const deleted = await prisma.thought.delete({ where: { id: Number(id) } });
      return reply.send({ message: "Thought deleted successfully", thought: deleted });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ message: "Failed to delete thought", error: err.message });
    }
  });
}
