import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { evaluateContent } from "../services/aiService.js";

export async function thoughtRoutes(server: FastifyInstance) {
  // 1. GET all thoughts (Public or Authenticated)
  server.get("/thoughts", async (request, reply) => {
    const { topicId, limit = 50 } = request.query as { topicId?: string; limit?: string };

    try {
      const whereClause: any = {};
      if (topicId && !isNaN(Number(topicId))) {
        whereClause.topicId = Number(topicId);
      }

      const thoughts = await prisma.thought.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
          topic: {
            select: { id: true, title: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: Math.min(Number(limit) || 50, 100),
      });

      return reply.send(thoughts);
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ message: "Failed to retrieve thoughts", error: err.message });
    }
  });

  // 2. POST /thoughts - Submit thought through VERIDIX AI Gatekeeper
  server.post("/thoughts", { preHandler: [server.authenticate] }, async (request, reply) => {
    const { content, topicId } = request.body as { content: string; topicId: number };
    const user = (request as any).user as { sub: number | string; role: string };
    const userId = Number(user.sub);

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return reply.status(400).send({ message: "Content cannot be empty." });
    }

    if (!topicId || isNaN(Number(topicId))) {
      return reply.status(400).send({ message: "A valid topicId is required." });
    }

    try {
      // Verify topic exists
      const topic = await prisma.topic.findUnique({
        where: { id: Number(topicId) },
      });
      if (!topic) {
        return reply.status(404).send({ message: "Topic not found." });
      }

      // 1. Evaluate payload via AI Gatekeeper Engine
      const evaluation = await evaluateContent(content);

      // 2. Database Transaction: Persist AuditLog and Thought
      const result = await prisma.$transaction(async (tx: any) => {
        // Record audit trail
        const audit = await tx.auditLog.create({
          data: {
            userId,
            action: "CONTENT_VERIFICATION",
            inputContent: content,
            riskLevel: evaluation.riskLevel,
            riskScore: evaluation.riskScore,
            decision: evaluation.decision,
            category: evaluation.category,
            reason: evaluation.reason,
            ipAddress: request.ip || "127.0.0.1",
          },
        });

        if (evaluation.decision === "BLOCK") {
          return { blocked: true, evaluation, auditId: audit.id };
        }

        // Safe payload: create thought
        const thought = await tx.thought.create({
          data: {
            content,
            topicId: Number(topicId),
            userId,
            score: Math.max(1, Math.round((100 - evaluation.riskScore) / 20)),
            category: evaluation.category || "General",
            flagged: false,
          },
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
            topic: {
              select: { id: true, title: true },
            },
          },
        });

        return { blocked: false, evaluation, thought, auditId: audit.id };
      });

      // 3. Response handling based on Gatekeeper decision
      if (result.blocked) {
        return reply.status(403).send({
          statusCode: 403,
          error: "Forbidden",
          message: "Blocked by VERIDIX AI Gatekeeper",
          evaluation: result.evaluation,
          auditId: result.auditId,
        });
      }

      return reply.status(201).send({
        statusCode: 201,
        message: "Approved by VERIDIX AI Gatekeeper",
        evaluation: result.evaluation,
        data: result.thought,
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({
        statusCode: 500,
        error: "Internal Server Error",
        message: "Gatekeeper moderation failed",
        detail: err.message,
      });
    }
  });
}