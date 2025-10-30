import { FastifyRequest } from "fastify";
import { SocketStream } from "@fastify/websocket";
import { PresenceModel } from "../models/PresenceModel";

interface WebSocketConnection {
  userId: number;
  username: string;
  socket: SocketStream;
}

export class WebSocketController {
  private connections: Map<number, WebSocketConnection> = new Map();

  /**
   * Gestisce una nuova connessione WebSocket
   */
  async handleConnection(connection: SocketStream, request: FastifyRequest) {
    const user = request.user;

    if (!user) {
      connection.socket.close(1008, "Unauthorized");
      return;
    }

    const userId = user.id;

    // Aggiungi la connessione alla mappa
    this.connections.set(userId, {
      userId,
      username: user.username,
      socket: connection,
    });

    // Segna l'utente come online
    PresenceModel.setOnline(userId);

    request.log.info(`WebSocket: User ${user.username} (${userId}) connected`);

    // Notifica agli altri utenti che questo utente è online
    this.broadcastPresenceUpdate(userId, "online");

    // Gestisci i messaggi in arrivo
    connection.socket.on("message", (message: Buffer) => {
      this.handleMessage(userId, message, request);
    });

    // Gestisci la disconnessione
    connection.socket.on("close", () => {
      this.handleDisconnection(userId, request);
    });

    // Gestisci gli errori
    connection.socket.on("error", (error: Error) => {
      request.log.error(`WebSocket error for user ${userId}: ${error.message}`);
    });

    // Invia un messaggio di benvenuto
    this.sendToUser(userId, {
      type: "connected",
      payload: {
        message: "Successfully connected to chat service",
        userId,
      },
    });
  }

  /**
   * Gestisce i messaggi ricevuti dal client
   */
  private handleMessage(
    userId: number,
    message: Buffer,
    request: FastifyRequest
  ) {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case "ping":
          this.sendToUser(userId, { type: "pong", payload: {} });
          break;

        case "presence:update":
          if (data.payload?.status) {
            PresenceModel.updatePresence(userId, data.payload.status);
            this.broadcastPresenceUpdate(userId, data.payload.status);
          }
          break;

        case "message:typing":
          // Notifica agli altri membri del thread che l'utente sta scrivendo
          if (data.payload?.threadId) {
            this.broadcastToThread(
              data.payload.threadId,
              {
                type: "message:typing",
                payload: {
                  userId,
                  threadId: data.payload.threadId,
                },
              },
              userId
            );
          }
          break;

        default:
          request.log.warn(
            `Unknown WebSocket message type: ${data.type} from user ${userId}`
          );
      }
    } catch (error) {
      request.log.error(
        `Error parsing WebSocket message from user ${userId}: ${error}`
      );
    }
  }

  /**
   * Gestisce la disconnessione di un utente
   */
  private handleDisconnection(userId: number, request: FastifyRequest) {
    const connection = this.connections.get(userId);

    if (connection) {
      request.log.info(`WebSocket: User ${connection.username} disconnected`);
      this.connections.delete(userId);

      // Segna l'utente come offline
      PresenceModel.setOffline(userId);

      // Notifica agli altri utenti
      this.broadcastPresenceUpdate(userId, "offline");
    }
  }

  /**
   * Invia un messaggio a un utente specifico
   */
  sendToUser(userId: number, data: any): boolean {
    const connection = this.connections.get(userId);

    if (connection && connection.socket.socket.readyState === 1) {
      try {
        connection.socket.socket.send(JSON.stringify(data));
        return true;
      } catch (error) {
        console.error(`Error sending message to user ${userId}:`, error);
        return false;
      }
    }

    return false;
  }

  /**
   * Invia un messaggio a più utenti
   */
  sendToUsers(userIds: number[], data: any): void {
    userIds.forEach((userId) => this.sendToUser(userId, data));
  }

  /**
   * Broadcast a tutti gli utenti connessi
   */
  broadcast(data: any, excludeUserId?: number): void {
    this.connections.forEach((connection, userId) => {
      if (userId !== excludeUserId) {
        this.sendToUser(userId, data);
      }
    });
  }

  /**
   * Broadcast un aggiornamento di presenza
   */
  private broadcastPresenceUpdate(
    userId: number,
    status: "online" | "offline" | "away"
  ): void {
    this.broadcast(
      {
        type: "presence:update",
        payload: {
          userId,
          status,
        },
      },
      userId
    );
  }

  /**
   * Broadcast a tutti i membri di un thread
   */
  broadcastToThread(threadId: number, data: any, excludeUserId?: number): void {
    // Nota: questa è una implementazione semplificata
    // In produzione, dovresti tenere traccia dei membri del thread
    // per evitare di fare query al DB ogni volta
    const ChatModel = require("../models/ChatModel").ChatModel;
    const members = ChatModel.getThreadMembers(threadId);

    members.forEach((userId: number) => {
      if (userId !== excludeUserId) {
        this.sendToUser(userId, data);
      }
    });
  }

  /**
   * Ottieni il numero di utenti connessi
   */
  getConnectedUsersCount(): number {
    return this.connections.size;
  }

  /**
   * Verifica se un utente è connesso
   */
  isUserConnected(userId: number): boolean {
    return this.connections.has(userId);
  }

  /**
   * Ottieni tutti gli utenti connessi
   */
  getConnectedUsers(): number[] {
    return Array.from(this.connections.keys());
  }
}

// Esporta un'istanza singleton
export const wsController = new WebSocketController();
export default wsController;
