import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";

export async function thoughtRoutes(server: FastifyInstance) {
  
  server.post("/thoughts", { preHandler: [server.authenticate] }, async (request, reply) => {
    const { content, topicId } = request.body as { content: string; topicId: number };
    const user = request.user as { sub: string | number }; 

    try {
      // 1. Precise Prompt (Telling Gemini exactly how to behave)
      const prompt = `
        System: You are an AI Content Moderator.
        Analyze the following text for: Hate speech, violence, harassment, or illegal acts.
        Response Format (Strict JSON): {"status": "SAFE" | "BLOCK", "reason": "short explanation"}
        
        Text to analyze: "${content}"
      `;

      // 2. Call Gemini
      // @ts-ignore
      const result = await server.gatekeeper.generateContent(prompt);
      const responseText = result.response.text();
      
      console.log("🤖 AI Raw Response:", responseText); // See exactly what the AI said in your terminal

      // 3. CLEANING: Remove Markdown backticks if Gemini added them
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      
      let analysis;
      try {
        analysis = JSON.parse(cleanJson);
      } catch (parseError) {
        console.error("❌ JSON Parse Error. Raw text was:", responseText);
        return reply.status(500).send({ message: "AI response format error" });
      }

      // 4. THE GATE: Block if necessary
      if (analysis.status === "BLOCK") {
        return reply.status(403).send({ 
          message: "Blocked by AI Gatekeeper", 
          reason: analysis.reason 
        });
      }

      // 5. SAVE: Only if SAFE
      const thought = await prisma.thought.create({
        data: {
          content,
          topicId: Number(topicId),
          userId: Number(user.sub), // Ensuring it's a number for Prisma
          score: 1,
          category: analysis.reason || "General",
          flagged: false
        }
      });

      return reply.status(201).send({ message: "Approved", data: thought });

    } catch (error: any) {
      // Log the specific error to the terminal
      server.log.error("Gatekeeper Error:", error);
      
      // If it's a quota error (429), give a better message
      if (error.message?.includes("429")) {
        return reply.status(429).send({ message: "AI is busy (Quota exceeded). Try again in a minute." });
      }

      return reply.status(500).send({ message: "Moderation failed", detail: error.message });
    }
  });
}