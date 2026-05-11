import { FastifyInstance } from 'fastify';

export async function aiTestRoutes(fastify: FastifyInstance) {
  fastify.post('/test-ai', async (request, reply) => {
    const { prompt } = request.body as { prompt: string };

    try {
      // Access the model we decorated in app.ts
      const model = (fastify as any).gemini; 
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      return { success: true, response: text };
    } catch (error) {
      return reply.status(500).send({ error: "Gemini failed to respond" });
    }
  });
}