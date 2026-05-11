import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export const jwtPlugin = fp(async (server: FastifyInstance) => {
  // Register the base JWT logic
  server.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || "super-secret-key",
  });

  // This adds .authenticate to the server instance
  server.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });
});