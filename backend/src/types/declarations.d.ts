import "@fastify/jwt";
import { JWT } from "@fastify/jwt";

declare module "fastify" {
  interface FastifyInstance {
    jwt: JWT;
    authenticate: (request: any, reply: any) => Promise<void>;
  }
  interface FastifyRequest {
    jwt: JWT;
    user: {
      sub: number | string;
      role: string;
      [key: string]: any;
    };
  }
}
