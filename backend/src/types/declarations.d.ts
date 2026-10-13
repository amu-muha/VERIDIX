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

declare module "bcrypt" {
  export function hash(data: string | Buffer, saltOrRounds: string | number): Promise<string>;
  export function compare(data: string | Buffer, encrypted: string): Promise<boolean>;
  export function genSalt(rounds?: number): Promise<string>;
  export function hashSync(data: string | Buffer, saltOrRounds: string | number): string;
  export function compareSync(data: string | Buffer, encrypted: string): boolean;
}
