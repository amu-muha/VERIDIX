import { FastifyInstance } from "fastify";
import { evaluateContent } from "../services/aiService.js";

export async function aiTestRoutes(fastify: FastifyInstance) {
  // Public/Dev testing endpoint to dry-run the AI Gatekeeper without persisting thoughts
  fastify.post("/test-ai", async (request, reply) => {
    const { prompt } = request.body as { prompt: string };

    if (!prompt || typeof prompt !== "string") {
      return reply.status(400).send({ error: "A valid 'prompt' string is required." });
    }

    try {
      const evaluation = await evaluateContent(prompt);
      return reply.send({ success: true, evaluation });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Gatekeeper analysis failed", detail: error.message });
    }
  });
}