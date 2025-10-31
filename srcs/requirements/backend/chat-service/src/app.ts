import Fastify, {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import dotenv from "dotenv";

// Carica le variabili d'ambiente
dotenv.config();

// Importa le rotte
import chatRoutes from "./routes/chatRoutes";
import wsRoutes from "./routes/wsRoutes";

// Importa il sistema di migrazioni
import runMigrations from "./database/migrate";

// Crea l'istanza di Fastify
const fastify: FastifyInstance = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
  },
});

// ==================== PLUGINS ====================

async function registerPlugins() {
  // Abilita CORS
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  });

  // Abilita Helmet per la sicurezza (con eccezione per WebSocket)
  await fastify.register(helmet, {
    global: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  });

  // Configura JWT (DEVE usare lo stesso secret dello user-service)
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || "supersecret",
  });

  // Abilita WebSocket
  await fastify.register(websocket, {
    options: {
      maxPayload: 1048576, // 1MB
      verifyClient: (info, next) => {
        // La verifica dell'autenticazione avviene nella route handler
        next(true);
      },
    },
  });

  // Configura Swagger per la documentazione API
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: "Chat Service API",
        description:
          "API per il sistema di chat del progetto Trascendence. Include messaggistica real-time, blocco utenti, inviti a giocare e presenza.",
        version: "1.0.0",
      },
      host: `${process.env.HOST || "localhost"}:${process.env.PORT || 3002}`,
      schemes: ["http"],
      consumes: ["application/json"],
      produces: ["application/json"],
      tags: [
        {
          name: "Chat",
          description: "Operazioni relative ai messaggi e conversazioni",
        },
        {
          name: "Blocks",
          description: "Gestione blocco/sblocco utenti",
        },
        {
          name: "Invitations",
          description: "Inviti a giocare tra utenti",
        },
        {
          name: "WebSocket",
          description: "WebSocket per comunicazione real-time",
        },
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
      service: "chat-service",
      timestamp: new Date().toISOString(),
    };
  });

  // Registra le rotte della chat
  fastify.register(chatRoutes, { prefix: "/api/chat" });

  // Registra le rotte WebSocket
  fastify.register(wsRoutes, { prefix: "/api/chat" });

  // Rotta per ottenere le statistiche del servizio (debug)
  fastify.get(
    "/api/chat/stats",
    {
      schema: {
        description: "Ottieni statistiche del servizio chat",
        tags: ["Chat"],
        summary: "Statistiche servizio",
        response: {
          200: {
            description: "Statistiche",
            type: "object",
            properties: {
              connectedUsers: { type: "number" },
              totalThreads: { type: "number" },
              totalMessages: { type: "number" },
            },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { wsController } = await import(
        "./controllers/WebSocketController"
      );
      const db = await import("./database/connection");

      // Query per ottenere statistiche
      const threadsCount = db.default
        .prepare("SELECT COUNT(*) as count FROM threads")
        .get() as { count: number };
      const messagesCount = db.default
        .prepare("SELECT COUNT(*) as count FROM messages")
        .get() as { count: number };

      return {
        connectedUsers: wsController.getConnectedUsersCount(),
        totalThreads: threadsCount.count,
        totalMessages: messagesCount.count,
      };
    }
  );
}

// ==================== STARTUP ====================

async function start() {
  try {
    // Esegui le migrazioni del database
    fastify.log.info("🔄 Esecuzione migrazioni database...");
    runMigrations();

    // Registra i plugin
    await registerPlugins();

    // Registra le rotte
    registerRoutes();

    // Avvia il server
    const port = parseInt(process.env.PORT || "3002", 10);
    const host = process.env.HOST || "127.0.0.1";

    await fastify.listen({ port, host });

    fastify.log.info(`🚀 Chat Service in ascolto su http://${host}:${port}`);
    fastify.log.info(
      `📚 Documentazione API disponibile su http://${host}:${port}/docs`
    );
    fastify.log.info(
      `🔌 WebSocket endpoint: ws://${host}:${port}/api/chat/ws?token=YOUR_JWT`
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
