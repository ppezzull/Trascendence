import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import oauth2 from "@fastify/oauth2";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import dotenv from "dotenv";
import metricsPlugin from "fastify-metrics";

// Carica le variabili d'ambiente
dotenv.config();

// Importa le rotte
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";

// Crea l'istanza di Fastify con Pino logger
const fastify: FastifyInstance = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
    formatters: {
      level: (label: string) => {
        return { level: label };
      },
    },
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
    base: {
      service: process.env.SERVICE_NAME || 'user-service',
      environment: process.env.NODE_ENV || 'development',
    },
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

  // Configura Google OAuth2
  await fastify.register(oauth2, {
    name: "googleOAuth2",
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID || "",
        secret: process.env.GOOGLE_CLIENT_SECRET || "",
      },
      auth: oauth2.GOOGLE_CONFIGURATION,
    },
    // Non usiamo startRedirectPath per gestire manualmente le routes e farle apparire in Swagger
    callbackUri: `${
      process.env.BACKEND_URL || "http://localhost:3001"
    }/api/auth/google/callback`,
    scope: ["profile", "email"],
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
      host: `${process.env.HOST || "localhost"}:${process.env.PORT || 3001}`,
      schemes: ["http"],
      consumes: ["application/json"],
      produces: ["application/json"],
      tags: [
        { name: "Users", description: "Operazioni relative agli utenti" },
        { name: "Auth", description: "Autenticazione OAuth2" },
      ],
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

  // Registra Prometheus metrics endpoint
  await fastify.register(metricsPlugin, {
    endpoint: '/metrics',
    defaultMetrics: { enabled: true },
    routeMetrics: { enabled: true },
  });
}

// Registra le rotte
function registerRoutes() {
  fastify.register(userRoutes, { prefix: "/api/users" });
  fastify.register(authRoutes, { prefix: "/api/auth" });

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
    const port = parseInt(process.env.PORT || "3001", 10);
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
