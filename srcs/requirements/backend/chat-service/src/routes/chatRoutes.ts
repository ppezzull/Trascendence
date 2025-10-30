import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ChatController } from "../controllers/ChatController";
import { BlockController } from "../controllers/BlockController";
import { InvitationController } from "../controllers/InvitationController";

async function chatRoutes(fastify: FastifyInstance) {
  const chatController = new ChatController();
  const blockController = new BlockController();
  const invitationController = new InvitationController();

  // ==================== THREAD ROUTES ====================

  fastify.post<{ Body: { otherUserId: number } }>(
    "/threads/dm",
    {
      schema: {
        description: "Crea o ottieni un thread DM con un altro utente",
        tags: ["Chat"],
        summary: "Crea/Ottieni thread DM",
        body: {
          type: "object",
          required: ["otherUserId"],
          properties: {
            otherUserId: { type: "number" },
          },
        },
        response: {
          200: {
            description: "Thread esistente o creato",
            type: "object",
            properties: {
              id: { type: "number" },
              is_group: { type: "number" },
              members: { type: "array", items: { type: "number" } },
              created_at: { type: "string" },
              updated_at: { type: "string" },
            },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    chatController.createOrGetDMThread.bind(chatController)
  );

  fastify.get(
    "/threads",
    {
      schema: {
        description: "Ottieni tutti i thread dell'utente",
        tags: ["Chat"],
        summary: "Lista thread utente",
        response: {
          200: {
            description: "Lista dei thread",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                is_group: { type: "number" },
                members: { type: "array", items: { type: "number" } },
                created_at: { type: "string" },
                updated_at: { type: "string" },
                lastMessage: {
                  type: "object",
                  nullable: true,
                  properties: {
                    id: { type: "number" },
                    content: { type: "string" },
                    sender_id: { type: "number" },
                    created_at: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    chatController.getUserThreads.bind(chatController)
  );

  // ==================== MESSAGE ROUTES ====================

  fastify.get<{
    Querystring: { threadId: number; limit: number; before?: number };
  }>(
    "/messages",
    {
      schema: {
        description: "Ottieni i messaggi di un thread",
        tags: ["Chat"],
        summary: "Lista messaggi thread",
        querystring: {
          type: "object",
          required: ["threadId"],
          properties: {
            threadId: { type: "number" },
            limit: { type: "number", default: 50 },
            before: { type: "number" },
          },
        },
        response: {
          200: {
            description: "Lista dei messaggi",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                thread_id: { type: "number" },
                sender_id: { type: "number" },
                content: { type: "string" },
                is_system: { type: "number" },
                created_at: { type: "string" },
              },
            },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    chatController.getThreadMessages.bind(chatController)
  );

  fastify.post<{ Body: { threadId: number; content: string } }>(
    "/messages",
    {
      schema: {
        description: "Invia un messaggio in un thread",
        tags: ["Chat"],
        summary: "Invia messaggio",
        body: {
          type: "object",
          required: ["threadId", "content"],
          properties: {
            threadId: { type: "number" },
            content: { type: "string", minLength: 1, maxLength: 2000 },
          },
        },
        response: {
          201: {
            description: "Messaggio inviato",
            type: "object",
            properties: {
              id: { type: "number" },
              thread_id: { type: "number" },
              sender_id: { type: "number" },
              content: { type: "string" },
              is_system: { type: "number" },
              created_at: { type: "string" },
            },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    chatController.sendMessage.bind(chatController)
  );

  fastify.delete<{ Params: { messageId: string } }>(
    "/messages/:messageId",
    {
      schema: {
        description: "Elimina un messaggio",
        tags: ["Chat"],
        summary: "Elimina messaggio",
        params: {
          type: "object",
          properties: {
            messageId: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Messaggio eliminato",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    chatController.deleteMessage.bind(chatController)
  );

  // ==================== BLOCK ROUTES ====================

  fastify.post<{ Body: { blockedUserId: number } }>(
    "/blocks",
    {
      schema: {
        description: "Blocca un utente",
        tags: ["Blocks"],
        summary: "Blocca utente",
        body: {
          type: "object",
          required: ["blockedUserId"],
          properties: {
            blockedUserId: { type: "number" },
          },
        },
        response: {
          201: {
            description: "Utente bloccato",
            type: "object",
            properties: {
              blocker_id: { type: "number" },
              blocked_id: { type: "number" },
              created_at: { type: "string" },
            },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    blockController.blockUser.bind(blockController)
  );

  fastify.delete<{ Body: { blockedUserId: number } }>(
    "/blocks",
    {
      schema: {
        description: "Sblocca un utente",
        tags: ["Blocks"],
        summary: "Sblocca utente",
        body: {
          type: "object",
          required: ["blockedUserId"],
          properties: {
            blockedUserId: { type: "number" },
          },
        },
        response: {
          200: {
            description: "Utente sbloccato",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    blockController.unblockUser.bind(blockController)
  );

  fastify.get(
    "/blocks",
    {
      schema: {
        description: "Ottieni la lista degli utenti bloccati",
        tags: ["Blocks"],
        summary: "Lista utenti bloccati",
        response: {
          200: {
            description: "Lista utenti bloccati",
            type: "object",
            properties: {
              blockedUsers: { type: "array", items: { type: "number" } },
            },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    blockController.getBlockedUsers.bind(blockController)
  );

  fastify.get<{ Params: { targetUserId: string } }>(
    "/blocks/:targetUserId",
    {
      schema: {
        description: "Verifica se un utente è bloccato",
        tags: ["Blocks"],
        summary: "Verifica blocco",
        params: {
          type: "object",
          properties: {
            targetUserId: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Stato blocco",
            type: "object",
            properties: {
              isBlocked: { type: "boolean" },
            },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    blockController.checkBlock.bind(blockController)
  );

  // ==================== INVITATION ROUTES ====================

  fastify.post<{ Body: { toUserId: number; gameType: string } }>(
    "/invitations",
    {
      schema: {
        description: "Crea un invito a giocare",
        tags: ["Invitations"],
        summary: "Crea invito",
        body: {
          type: "object",
          required: ["toUserId"],
          properties: {
            toUserId: { type: "number" },
            gameType: { type: "string", default: "pong" },
          },
        },
        response: {
          201: {
            description: "Invito creato",
            type: "object",
            properties: {
              id: { type: "number" },
              from_user_id: { type: "number" },
              to_user_id: { type: "number" },
              game_type: { type: "string" },
              status: { type: "string" },
              created_at: { type: "string" },
              updated_at: { type: "string" },
            },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    invitationController.createInvitation.bind(invitationController)
  );

  fastify.post<{ Params: { invitationId: string } }>(
    "/invitations/:invitationId/accept",
    {
      schema: {
        description: "Accetta un invito",
        tags: ["Invitations"],
        summary: "Accetta invito",
        params: {
          type: "object",
          properties: {
            invitationId: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Invito accettato",
            type: "object",
            properties: {
              id: { type: "number" },
              from_user_id: { type: "number" },
              to_user_id: { type: "number" },
              game_type: { type: "string" },
              status: { type: "string" },
              match_id: { type: "number", nullable: true },
              created_at: { type: "string" },
              updated_at: { type: "string" },
            },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    invitationController.acceptInvitation.bind(invitationController)
  );

  fastify.post<{ Params: { invitationId: string } }>(
    "/invitations/:invitationId/decline",
    {
      schema: {
        description: "Rifiuta un invito",
        tags: ["Invitations"],
        summary: "Rifiuta invito",
        params: {
          type: "object",
          properties: {
            invitationId: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Invito rifiutato",
            type: "object",
            properties: {
              id: { type: "number" },
              status: { type: "string" },
            },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    invitationController.declineInvitation.bind(invitationController)
  );

  fastify.delete<{ Params: { invitationId: string } }>(
    "/invitations/:invitationId",
    {
      schema: {
        description: "Cancella un invito (solo mittente)",
        tags: ["Invitations"],
        summary: "Cancella invito",
        params: {
          type: "object",
          properties: {
            invitationId: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Invito cancellato",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    invitationController.cancelInvitation.bind(invitationController)
  );

  fastify.get(
    "/invitations/received",
    {
      schema: {
        description: "Ottieni inviti ricevuti",
        tags: ["Invitations"],
        summary: "Inviti ricevuti",
        response: {
          200: {
            description: "Lista inviti ricevuti",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                from_user_id: { type: "number" },
                to_user_id: { type: "number" },
                game_type: { type: "string" },
                status: { type: "string" },
                created_at: { type: "string" },
                updated_at: { type: "string" },
              },
            },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    invitationController.getReceivedInvitations.bind(invitationController)
  );

  fastify.get(
    "/invitations/sent",
    {
      schema: {
        description: "Ottieni inviti inviati",
        tags: ["Invitations"],
        summary: "Inviti inviati",
        response: {
          200: {
            description: "Lista inviti inviati",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                from_user_id: { type: "number" },
                to_user_id: { type: "number" },
                game_type: { type: "string" },
                status: { type: "string" },
                created_at: { type: "string" },
                updated_at: { type: "string" },
              },
            },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    invitationController.getSentInvitations.bind(invitationController)
  );
}

export default chatRoutes;
