import { FastifyRequest, FastifyReply } from "fastify";
import { BlockModel } from "../models/BlockModel";
import { BlockUserRequest, UnblockUserRequest } from "../schemas/chatSchemas";

export class BlockController {
  /**
   * Blocca un utente
   */
  async blockUser(
    request: FastifyRequest<{ Body: BlockUserRequest }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user!.id;
      const { blockedUserId } = request.body;

      // Verifica che non stia cercando di bloccare se stesso
      if (userId === blockedUserId) {
        return reply.status(400).send({
          error: "Cannot block yourself",
        });
      }

      const block = BlockModel.blockUser(userId, blockedUserId);

      return reply.status(201).send(block);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Internal server error",
      });
    }
  }

  /**
   * Sblocca un utente
   */
  async unblockUser(
    request: FastifyRequest<{ Body: UnblockUserRequest }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user!.id;
      const { blockedUserId } = request.body;

      const unblocked = BlockModel.unblockUser(userId, blockedUserId);

      if (!unblocked) {
        return reply.status(404).send({
          error: "Block not found",
        });
      }

      return reply.send({
        success: true,
        message: "User unblocked",
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Internal server error",
      });
    }
  }

  /**
   * Ottieni la lista degli utenti bloccati
   */
  async getBlockedUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id;

      const blockedUserIds = BlockModel.getBlockedUsers(userId);

      return reply.send({
        blockedUsers: blockedUserIds,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Internal server error",
      });
    }
  }

  /**
   * Verifica se un utente è bloccato
   */
  async checkBlock(
    request: FastifyRequest<{ Params: { targetUserId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user!.id;
      const targetUserId = parseInt(request.params.targetUserId);

      const isBlocked = BlockModel.isBlocked(userId, targetUserId);

      return reply.send({
        isBlocked,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Internal server error",
      });
    }
  }
}

export default BlockController;
