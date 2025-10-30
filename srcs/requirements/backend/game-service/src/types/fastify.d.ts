import { FastifyRequest } from "fastify";
import "@fastify/jwt";

// Estendi il tipo JWT
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      id: number;
      userId?: number;
      username: string;
      email: string;
    };
    user: {
      id: number;
      username: string;
      email: string;
    };
  }
}
