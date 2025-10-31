import { FastifyInstance } from "fastify";
import { wsController } from "../controllers/WebSocketController";

async function wsRoutes(fastify: FastifyInstance) {
  // WebSocket route per la chat in tempo reale
  fastify.get(
    "/ws",
    {
      websocket: true,
      schema: {
        description:
          "WebSocket endpoint per comunicazione real-time. Richiede autenticazione JWT nel query param 'token'",
        tags: ["WebSocket"],
        summary: "WebSocket Chat",
        querystring: {
          type: "object",
          properties: {
            token: {
              type: "string",
              description: "JWT token per autenticazione",
            },
          },
        },
      },
    },
    async (connection, request) => {
      // Verifica l'autenticazione
      try {
        // Estrai il token dal query param
        const token =
          (request.query as any).token ||
          request.headers.authorization?.split(" ")[1];

        if (!token) {
          connection.socket.close(1008, "Missing authentication token");
          return;
        }

        // Verifica il JWT
        const decoded = await fastify.jwt.verify(token);
        const payload = decoded as any;
        request.user = {
          id: payload.id || payload.userId,
          username: payload.username,
          email: payload.email,
        };

        // Gestisci la connessione
        await wsController.handleConnection(connection, request);
      } catch (error) {
        request.log.error(`WebSocket authentication error: ${error}`);
        connection.socket.close(1008, "Invalid authentication token");
      }
    }
  );
}

export default wsRoutes;
