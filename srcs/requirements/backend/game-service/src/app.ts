import Fastify, {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import dotenv from "dotenv";
import metricsPlugin from "fastify-metrics";

// Carica le variabili d'ambiente
dotenv.config();

// Importa le rotte
import gameRoutes from "./routes/gameRoutes";

// Importa il sistema di migrazioni
import runMigrations from "./database/migrate";

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
      service: process.env.SERVICE_NAME || 'game-service',
      environment: process.env.NODE_ENV || 'development',
    },
  },
});

// ==================== PLUGINS ====================

async function registerPlugins() {
  // Abilita CORS
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  });

  // Abilita Helmet per la sicurezza
  await fastify.register(helmet, {
    global: true,
  });

  // Configura JWT (DEVE usare lo stesso secret dello user-service)
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || "supersecret",
  });

  // Configura Swagger per la documentazione API
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: "Game Service API",
        description:
          "API per la gestione dei giochi (Pong, Breakout), match, statistiche e matchmaking per Trascendence",
        version: "1.0.0",
      },
      host: `${process.env.HOST || "localhost"}:${process.env.PORT || 3003}`,
      schemes: ["http"],
      consumes: ["application/json"],
      produces: ["application/json"],
      tags: [
        { name: "Games", description: "Gestione giochi e impostazioni" },
        { name: "Matches", description: "Creazione e gestione partite" },
        { name: "Stats", description: "Statistiche utenti e leaderboard" },
        { name: "Matchmaking", description: "Sistema di matchmaking" },
      ],
      securityDefinitions: {
        Bearer: {
          type: "apiKey",
          name: "Authorization",
          in: "header",
          description: 'JWT token nel formato: "Bearer {token}"',
        },
      },
      security: [{ Bearer: [] }],
    },
  });

  // Configura Swagger UI
  await fastify.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
    staticCSP: true,
  });

  // Registra Prometheus metrics endpoint
  await fastify.register(metricsPlugin, {
    endpoint: '/metrics',
    defaultMetrics: { enabled: true },
    routeMetrics: { enabled: true },
  });
}

// ==================== AUTHENTICATION DECORATOR ====================

fastify.decorate(
  "authenticate",
  async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: "Unauthorized" });
    }
  }
);

// Dichiarazione TypeScript per il decorator
declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

// ==================== ROUTES ====================

function registerRoutes() {
  // Rotta di health check
  fastify.get("/health", async (request, reply) => {
    return {
      status: "ok",
      service: "game-service",
      timestamp: new Date().toISOString(),
    };
  });

  // Registra le rotte dei giochi
  fastify.register(gameRoutes, { prefix: "/api" });
}

// ==================== STARTUP ====================

async function start() {
  try {
    // Esegui le migrazioni del database
    fastify.log.info("🎮 Esecuzione migrazioni database...");
    runMigrations();

    // Registra i plugin
    await registerPlugins();

    // Registra le rotte
    registerRoutes();

    // Avvia il server
    const port = parseInt(process.env.PORT || "3003", 10);
    const host = process.env.HOST || "127.0.0.1";

    await fastify.listen({ port, host });

    fastify.log.info(`🚀 Game Service in ascolto su http://${host}:${port}`);
    fastify.log.info(
      `📚 Documentazione API disponibile su http://${host}:${port}/docs`
    );
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// ==================== GRACEFUL SHUTDOWN ====================

process.on("SIGINT", async () => {
  fastify.log.info("⏹️  Chiusura del server in corso...");
  await fastify.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  fastify.log.info("⏹️  Chiusura del server in corso...");
  await fastify.close();
  process.exit(0);
});

// Avvia l'applicazione
start();

export default fastify;
