import { FastifyRequest, FastifyReply } from "fastify";
import { ChatModel } from "../models/ChatModel";
import { BlockModel } from "../models/BlockModel";
import {
  CreateDMThreadRequest,
  SendMessageRequest,
  GetMessagesRequest,
} from "../schemas/chatSchemas";

export class ChatController {
  /**
   * Crea o ottieni un thread DM con un altro utente
   */
  async createOrGetDMThread(
    request: FastifyRequest<{ Body: CreateDMThreadRequest }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user!.id;
      const { otherUserId } = request.body;

      // Verifica che non stia cercando di creare un DM con se stesso
      if (userId === otherUserId) {
        return reply.status(400).send({
          error: "Cannot create DM with yourself",
        });
      }

      // Verifica che non ci siano blocchi tra gli utenti
      const isBlocked = BlockModel.isBlockedBidirectional(userId, otherUserId);
      if (isBlocked) {
        return reply.status(403).send({
          error: "Cannot create DM with blocked user",
        });
      }

      // Trova o crea il thread DM
      const thread = ChatModel.findOrCreateDMThread(userId, otherUserId);
      const members = ChatModel.getThreadMembers(thread.id!);

      return reply.send({
        ...thread,
        members,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Internal server error",
      });
    }
  }

  /**
   * Ottieni tutti i thread dell'utente
   */
  async getUserThreads(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id;

      const threads = ChatModel.getUserThreads(userId);

      // Per ogni thread, aggiungi l'ultimo messaggio
      const threadsWithLastMessage = threads.map((thread) => {
        const lastMessage = ChatModel.getLastMessage(thread.id!);
        return {
          ...thread,
          lastMessage,
        };
      });

      return reply.send(threadsWithLastMessage);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Internal server error",
      });
    }
  }

  /**
   * Ottieni i messaggi di un thread
   */
  async getThreadMessages(
    request: FastifyRequest<{ Querystring: GetMessagesRequest }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user!.id;
      const { threadId, limit, before } = request.query;

      // Verifica che l'utente sia membro del thread
      const isMember = ChatModel.isUserInThread(threadId, userId);
      if (!isMember) {
        return reply.status(403).send({
          error: "Not a member of this thread",
        });
      }

      const messages = ChatModel.getThreadMessages(threadId, limit, before);

      return reply.send(messages);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Internal server error",
      });
    }
  }

  /**
   * Invia un messaggio in un thread
   */
  async sendMessage(
    request: FastifyRequest<{ Body: SendMessageRequest }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user!.id;
      const { threadId, content } = request.body;

      // Verifica che l'utente sia membro del thread
      const isMember = ChatModel.isUserInThread(threadId, userId);
      if (!isMember) {
        return reply.status(403).send({
          error: "Not a member of this thread",
        });
      }

      // Ottieni gli altri membri del thread
      const members = ChatModel.getThreadMembers(threadId);
      const otherMembers = members.filter((id) => id !== userId);

      // Verifica che nessuno degli altri membri abbia bloccato l'utente
      for (const otherUserId of otherMembers) {
        if (BlockModel.isBlocked(otherUserId, userId)) {
          return reply.status(403).send({
            error: "You are blocked by one of the thread members",
          });
        }
      }

      // Crea il messaggio
      const message = ChatModel.createMessage(threadId, userId, content);

      // TODO: Invia notifica WebSocket agli altri membri

      return reply.status(201).send(message);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Internal server error",
      });
    }
  }

  /**
   * Elimina un messaggio
   */
  async deleteMessage(
    request: FastifyRequest<{ Params: { messageId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user!.id;
      const messageId = parseInt(request.params.messageId);

      const deleted = ChatModel.deleteMessage(messageId, userId);

      if (!deleted) {
        return reply.status(404).send({
          error: "Message not found or not authorized",
        });
      }

      return reply.send({
        success: true,
        message: "Message deleted",
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Internal server error",
      });
    }
  }
}

export default ChatController;
