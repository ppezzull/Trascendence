import { FastifyRequest, FastifyReply } from "fastify";
import { InvitationModel } from "../models/InvitationModel";
import { BlockModel } from "../models/BlockModel";
import {
  CreateInvitationRequest,
  InvitationActionRequest,
} from "../schemas/chatSchemas";

export class InvitationController {
  /**
   * Crea un invito a giocare
   */
  async createInvitation(
    request: FastifyRequest<{ Body: CreateInvitationRequest }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user!.id;
      const { toUserId, gameType } = request.body;

      // Verifica che non stia invitando se stesso
      if (userId === toUserId) {
        return reply.status(400).send({
          error: "Cannot invite yourself",
        });
      }

      // Verifica che non ci siano blocchi
      const isBlocked = BlockModel.isBlockedBidirectional(userId, toUserId);
      if (isBlocked) {
        return reply.status(403).send({
          error: "Cannot invite blocked user",
        });
      }

      // Verifica che non ci sia già un invito pending
      const existingInvite = InvitationModel.getPendingInvitationBetweenUsers(
        userId,
        toUserId
      );
      if (existingInvite) {
        return reply.status(409).send({
          error: "There is already a pending invitation",
          invitation: existingInvite,
        });
      }

      const invitation = InvitationModel.createInvitation({
        from_user_id: userId,
        to_user_id: toUserId,
        game_type: gameType,
      });

      // TODO: Invia notifica WebSocket al destinatario

      return reply.status(201).send(invitation);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Internal server error",
      });
    }
  }

  /**
   * Accetta un invito
   */
  async acceptInvitation(
    request: FastifyRequest<{ Params: { invitationId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user!.id;
      const invitationId = parseInt(request.params.invitationId);

      // Ottieni l'invito
      const invitation = InvitationModel.findById(invitationId);
      if (!invitation) {
        return reply.status(404).send({
          error: "Invitation not found",
        });
      }

      // Verifica che l'utente sia il destinatario
      if (invitation.to_user_id !== userId) {
        return reply.status(403).send({
          error: "Not authorized to accept this invitation",
        });
      }

      // Verifica che l'invito sia ancora pending
      if (invitation.status !== "pending") {
        return reply.status(400).send({
          error: "Invitation is no longer pending",
          invitation,
        });
      }

      // TODO: Creare una partita nel game-service e ottenere il matchId
      const matchId = undefined; // Placeholder per integrazione futura

      const updatedInvitation = InvitationModel.acceptInvitation(
        invitationId,
        matchId
      );

      // TODO: Notifica entrambi gli utenti via WebSocket

      return reply.send(updatedInvitation);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Internal server error",
      });
    }
  }

  /**
   * Rifiuta un invito
   */
  async declineInvitation(
    request: FastifyRequest<{ Params: { invitationId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user!.id;
      const invitationId = parseInt(request.params.invitationId);

      // Ottieni l'invito
      const invitation = InvitationModel.findById(invitationId);
      if (!invitation) {
        return reply.status(404).send({
          error: "Invitation not found",
        });
      }

      // Verifica che l'utente sia il destinatario
      if (invitation.to_user_id !== userId) {
        return reply.status(403).send({
          error: "Not authorized to decline this invitation",
        });
      }

      // Verifica che l'invito sia ancora pending
      if (invitation.status !== "pending") {
        return reply.status(400).send({
          error: "Invitation is no longer pending",
          invitation,
        });
      }

      const updatedInvitation = InvitationModel.declineInvitation(invitationId);

      // TODO: Notifica il mittente via WebSocket

      return reply.send(updatedInvitation);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Internal server error",
      });
    }
  }

  /**
   * Cancella un invito (solo se sei il mittente)
   */
  async cancelInvitation(
    request: FastifyRequest<{ Params: { invitationId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user!.id;
      const invitationId = parseInt(request.params.invitationId);

      const cancelled = InvitationModel.cancelInvitation(invitationId, userId);

      if (!cancelled) {
        return reply.status(404).send({
          error: "Invitation not found or not authorized",
        });
      }

      return reply.send({
        success: true,
        message: "Invitation cancelled",
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Internal server error",
      });
    }
  }

  /**
   * Ottieni gli inviti ricevuti
   */
  async getReceivedInvitations(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id;

      const invitations = InvitationModel.getReceivedInvitations(
        userId,
        "pending"
      );

      return reply.send(invitations);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Internal server error",
      });
    }
  }

  /**
   * Ottieni gli inviti inviati
   */
  async getSentInvitations(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id;

      const invitations = InvitationModel.getSentInvitations(userId);

      return reply.send(invitations);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Internal server error",
      });
    }
  }
}

export default InvitationController;
