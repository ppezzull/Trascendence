import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import dotenv from "dotenv";

// Carica le variabili d'ambiente
dotenv.config();

// Importa le rotte
import userRoutes from "./routes/userRoutes";

// Crea l'istanza di Fastify
const fastify: FastifyInstance = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
  },
});

// Registra i plugin
async function registerPlugins() {
  // Abilita CORS
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || true,
  });

  // Abilita Helmet per la sicurezza
  await fastify.register(helmet);

  // Configura JWT
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || "supersecret",
  });

  // Configura Swagger per la documentazione API
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: "User Service API",
        description:
          "API per la gestione degli utenti nel progetto Trascendence",
        version: "1.0.0",
      },
      host: `${process.env.HOST || "localhost"}:${process.env.PORT || 3000}`,
      schemes: ["http"],
      consumes: ["application/json"],
      produces: ["application/json"],
      tags: [{ name: "Users", description: "Operazioni relative agli utenti" }],
    },
  });

  // Configura Swagger UI
  await fastify.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
  });
}

// Registra le rotte
function registerRoutes() {
  fastify.register(userRoutes, { prefix: "/api/users" });

  // Rotta di health check
  fastify.get("/health", async (request, reply) => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });
}

// Funzione di avvio
async function start() {
  try {
    // Registra i plugin
    await registerPlugins();

    // Registra le rotte
    registerRoutes();

    // Avvia il server
    const port = parseInt(process.env.PORT || "3000", 10);
    const host = process.env.HOST || "127.0.0.1";

    await fastify.listen({ port, host });
    fastify.log.info(`Server in ascolto su http://${host}:${port}`);
    fastify.log.info(
      `Documentazione API disponibile su http://${host}:${port}/docs`
    );
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Gestisci la chiusura del server
process.on("SIGINT", async () => {
  fastify.log.info("Chiusura del server in corso...");
  await fastify.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  fastify.log.info("Chiusura del server in corso...");
  await fastify.close();
  process.exit(0);
});

// Avvia l'applicazione
start();

export default fastify;
