import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  createUserSchema,
  updateUserSchema,
  loginSchema,
  userIdSchema,
  updateStatsSchema,
  friendRequestSchema,
  friendResponseSchema,
  searchUsersSchema,
  paginationSchema,
} from "../schemas/userSchemas";
import { UserController } from "../controllers/UserController";

// Schemi di risposta riutilizzabili
const successResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    message: { type: "string" },
  },
  required: ["success", "message"],
};

const dataResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    message: { type: "string" },
    data: {},
  },
  required: ["success", "message", "data"],
};

const errorResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    message: { type: "string" },
    errors: { type: "array", items: { type: "string" } },
  },
  required: ["success", "message"],
};

// Definizione dei tipi per le richieste
type CreateUserRequest = FastifyRequest<{
  Body: typeof createUserSchema._type;
}>;

type UpdateUserRequest = FastifyRequest<{
  Params: typeof userIdSchema._type;
  Body: typeof updateUserSchema._type;
}>;

type LoginRequest = FastifyRequest<{
  Body: typeof loginSchema._type;
}>;

type GetUserRequest = FastifyRequest<{
  Params: typeof userIdSchema._type;
}>;

type UpdateStatsRequest = FastifyRequest<{
  Params: typeof userIdSchema._type;
  Body: typeof updateStatsSchema._type;
}>;

type FriendRequestRequest = FastifyRequest<{
  Body: typeof friendRequestSchema._type;
}>;

type FriendResponseRequest = FastifyRequest<{
  Params: typeof userIdSchema._type;
  Body: typeof friendResponseSchema._type;
}>;

type SearchUsersRequest = FastifyRequest<{
  Querystring: typeof searchUsersSchema._type;
}>;

type GetFriendsRequest = FastifyRequest<{
  Params: typeof userIdSchema._type;
  Querystring: typeof paginationSchema._type;
}>;

// Funzione per registrare le rotte degli utenti
async function userRoutes(fastify: FastifyInstance) {
  const userController = new UserController();

  // Rotta per la registrazione di un nuovo utente
  fastify.post(
    "/register",
    {
      schema: {
        description: "Registra un nuovo utente",
        tags: ["Users"],
        body: {
          type: "object",
          properties: {
            username: {
              type: "string",
              minLength: 3,
              maxLength: 30,
              pattern: "^[a-zA-Z0-9_]+$",
            },
            email: {
              type: "string",
              format: "email",
            },
            password: {
              type: "string",
              minLength: 8,
              pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
            },
            display_name: {
              type: "string",
              minLength: 1,
              maxLength: 50,
            },
          },
          required: ["username", "email", "password"],
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  username: { type: "string" },
                  email: { type: "string" },
                  display_name: { type: "string" },
                  created_at: { type: "string" },
                },
                required: [
                  "id",
                  "username",
                  "email",
                  "display_name",
                  "created_at",
                ],
              },
            },
            required: ["success", "message", "data"],
          },
          400: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              errors: { type: "array", items: { type: "string" } },
            },
            required: ["success", "message"],
          },
        },
      },
    },
    async (request: CreateUserRequest, reply: FastifyReply) => {
      return userController.register(request, reply);
    }
  );

  // Rotta per il login
  fastify.post(
    "/login",
    {
      schema: {
        description: "Effettua il login di un utente",
        tags: ["Users"],
        body: {
          type: "object",
          properties: {
            email: {
              type: "string",
              format: "email",
            },
            password: {
              type: "string",
              minLength: 1,
            },
          },
          required: ["email", "password"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  token: { type: "string" },
                  user: {
                    type: "object",
                    properties: {
                      id: { type: "number" },
                      username: { type: "string" },
                      email: { type: "string" },
                      display_name: { type: "string" },
                    },
                    required: ["id", "username", "email", "display_name"],
                  },
                },
                required: ["token", "user"],
              },
            },
            required: ["success", "message", "data"],
          },
          401: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
            required: ["success", "message"],
          },
        },
      },
    },
    async (request: LoginRequest, reply: FastifyReply) => {
      return userController.login(request, reply);
    }
  );

  // Rotta per ottenere il profilo di un utente
  fastify.get(
    "/:id",
    {
      schema: {
        description: "Ottiene il profilo di un utente",
        tags: ["Users"],
        params: {
          type: "object",
          properties: {
            id: {
              type: "number",
              minimum: 1,
            },
          },
          required: ["id"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  username: { type: "string" },
                  email: { type: "string" },
                  display_name: { type: "string" },
                  avatar_url: { type: "string" },
                  is_active: { type: "boolean" },
                  is_verified: { type: "boolean" },
                  created_at: { type: "string" },
                  stats: {
                    type: "object",
                    properties: {
                      wins: { type: "number" },
                      losses: { type: "number" },
                      tournaments_played: { type: "number" },
                      tournaments_won: { type: "number" },
                    },
                  },
                },
                required: [
                  "id",
                  "username",
                  "email",
                  "display_name",
                  "is_active",
                  "is_verified",
                  "created_at",
                ],
              },
            },
            required: ["success", "data"],
          },
          404: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
            required: ["success", "message"],
          },
        },
      },
    },
    async (request: GetUserRequest, reply: FastifyReply) => {
      return userController.getProfile(request, reply);
    }
  );

  // Rotta per aggiornare i dati di un utente
  fastify.put(
    "/:id",
    {
      schema: {
        description: "Aggiorna i dati di un utente",
        tags: ["Users"],
        params: {
          type: "object",
          properties: {
            id: {
              type: "number",
              minimum: 1,
            },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            username: {
              type: "string",
              minLength: 3,
              maxLength: 30,
              pattern: "^[a-zA-Z0-9_]+$",
            },
            email: {
              type: "string",
              format: "email",
            },
            display_name: {
              type: "string",
              minLength: 1,
              maxLength: 50,
            },
            avatar_url: {
              type: "string",
              format: "uri",
            },
          },
        },
        headers: {
          type: "object",
          properties: {
            Authorization: { type: "string" },
          },
          required: ["Authorization"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  username: { type: "string" },
                  email: { type: "string" },
                  display_name: { type: "string" },
                  avatar_url: { type: "string" },
                  updated_at: { type: "string" },
                },
                required: [
                  "id",
                  "username",
                  "email",
                  "display_name",
                  "updated_at",
                ],
              },
            },
            required: ["success", "message", "data"],
          },
          401: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
            required: ["success", "message"],
          },
          403: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
            required: ["success", "message"],
          },
          404: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
            required: ["success", "message"],
          },
        },
      },
    },
    async (request: UpdateUserRequest, reply: FastifyReply) => {
      return userController.updateUser(request, reply);
    }
  );

  // Rotta per eliminare un utente
  fastify.delete(
    "/:id",
    {
      schema: {
        description: "Elimina un utente",
        tags: ["Users"],
        params: {
          type: "object",
          properties: {
            id: {
              type: "number",
              minimum: 1,
            },
          },
          required: ["id"],
        },
        headers: {
          type: "object",
          properties: {
            Authorization: { type: "string" },
          },
          required: ["Authorization"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
            required: ["success", "message"],
          },
          401: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
            required: ["success", "message"],
          },
          403: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
            required: ["success", "message"],
          },
          404: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
            required: ["success", "message"],
          },
        },
      },
    },
    async (request: GetUserRequest, reply: FastifyReply) => {
      return userController.deleteUser(request, reply);
    }
  );

  // Rotta per ottenere le statistiche di un utente
  fastify.get(
    "/:id/stats",
    {
      schema: {
        description: "Ottiene le statistiche di un utente",
        tags: ["Users"],
        params: {
          type: "object",
          properties: {
            id: {
              type: "number",
              minimum: 1,
            },
          },
          required: ["id"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  wins: { type: "number" },
                  losses: { type: "number" },
                  tournaments_played: { type: "number" },
                  tournaments_won: { type: "number" },
                },
                required: [
                  "wins",
                  "losses",
                  "tournaments_played",
                  "tournaments_won",
                ],
              },
            },
            required: ["success", "data"],
          },
          404: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
            required: ["success", "message"],
          },
        },
      },
    },
    async (request: GetUserRequest, reply: FastifyReply) => {
      return userController.getStats(request, reply);
    }
  );

  // Rotta per aggiornare le statistiche di un utente
  fastify.put(
    "/:id/stats",
    {
      schema: {
        description: "Aggiorna le statistiche di un utente",
        tags: ["Users"],
        params: {
          type: "object",
          properties: {
            id: {
              type: "number",
              minimum: 1,
            },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            wins: {
              type: "number",
              minimum: 0,
            },
            losses: {
              type: "number",
              minimum: 0,
            },
            tournaments_played: {
              type: "number",
              minimum: 0,
            },
            tournaments_won: {
              type: "number",
              minimum: 0,
            },
          },
        },
        headers: {
          type: "object",
          properties: {
            Authorization: { type: "string" },
          },
          required: ["Authorization"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  wins: { type: "number" },
                  losses: { type: "number" },
                  tournaments_played: { type: "number" },
                  tournaments_won: { type: "number" },
                },
                required: [
                  "wins",
                  "losses",
                  "tournaments_played",
                  "tournaments_won",
                ],
              },
            },
            required: ["success", "message", "data"],
          },
          401: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
            required: ["success", "message"],
          },
          403: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
            required: ["success", "message"],
          },
          404: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
            required: ["success", "message"],
          },
        },
      },
    },
    async (request: UpdateStatsRequest, reply: FastifyReply) => {
      return userController.updateStats(request, reply);
    }
  );

  // Rotta per cercare utenti
  fastify.get(
    "/search",
    {
      schema: {
        description: "Cerca utenti",
        tags: ["Users"],
        querystring: {
          type: "object",
          properties: {
            q: {
              type: "string",
              minLength: 1,
              maxLength: 50,
            },
            page: {
              type: "number",
              minimum: 1,
              default: 1,
            },
            limit: {
              type: "number",
              minimum: 1,
              maximum: 100,
              default: 20,
            },
          },
          required: ["q"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  users: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "number" },
                        username: { type: "string" },
                        display_name: { type: "string" },
                        avatar_url: { type: "string" },
                      },
                      required: ["id", "username", "display_name"],
                    },
                  },
                  pagination: {
                    type: "object",
                    properties: {
                      page: { type: "number" },
                      limit: { type: "number" },
                      total: { type: "number" },
                      pages: { type: "number" },
                    },
                    required: ["page", "limit", "total", "pages"],
                  },
                },
                required: ["users", "pagination"],
              },
            },
            required: ["success", "data"],
          },
        },
      },
    },
    async (request: SearchUsersRequest, reply: FastifyReply) => {
      return userController.searchUsers(request, reply);
    }
  );

  // Rotta per inviare una richiesta di amicizia
  fastify.post(
    "/friends/request",
    {
      schema: {
        description: "Invia una richiesta di amicizia",
        tags: ["Users", "Friends"],
        body: {
          type: "object",
          properties: {
            addressee_id: {
              type: "number",
              minimum: 1,
            },
          },
          required: ["addressee_id"],
        },
        headers: {
          type: "object",
          properties: {
            Authorization: { type: "string" },
          },
          required: ["Authorization"],
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  requester_id: { type: "number" },
                  addressee_id: { type: "number" },
                  status: { type: "string" },
                  created_at: { type: "string" },
                },
                required: [
                  "id",
                  "requester_id",
                  "addressee_id",
                  "status",
                  "created_at",
                ],
              },
            },
            required: ["success", "message", "data"],
          },
          401: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
            required: ["success", "message"],
          },
          404: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
            required: ["success", "message"],
          },
        },
      },
    },
    async (request: FriendRequestRequest, reply: FastifyReply) => {
      return userController.sendFriendRequest(request, reply);
    }
  );

  // Rotta per rispondere a una richiesta di amicizia
  fastify.post(
    "/friends/:id/respond",
    {
      schema: {
        description: "Rispondi a una richiesta di amicizia",
        tags: ["Users", "Friends"],
        params: {
          type: "object",
          properties: {
            id: {
              type: "number",
              minimum: 1,
            },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["accept", "reject"],
            },
          },
          required: ["action"],
        },
        headers: {
          type: "object",
          properties: {
            Authorization: { type: "string" },
          },
          required: ["Authorization"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  status: { type: "string" },
                  updated_at: { type: "string" },
                },
                required: ["id", "status", "updated_at"],
              },
            },
            required: ["success", "message", "data"],
          },
          401: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
            required: ["success", "message"],
          },
          403: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
            required: ["success", "message"],
          },
          404: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
            required: ["success", "message"],
          },
        },
      },
    },
    async (request: FriendResponseRequest, reply: FastifyReply) => {
      return userController.respondFriendRequest(request, reply);
    }
  );

  // Rotta per ottenere gli amici di un utente
  fastify.get(
    "/:id/friends",
    {
      schema: {
        description: "Ottieni gli amici di un utente",
        tags: ["Users", "Friends"],
        params: {
          type: "object",
          properties: {
            id: {
              type: "number",
              minimum: 1,
            },
          },
          required: ["id"],
        },
        querystring: {
          type: "object",
          properties: {
            page: {
              type: "number",
              minimum: 1,
              default: 1,
            },
            limit: {
              type: "number",
              minimum: 1,
              maximum: 100,
              default: 20,
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  friends: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "number" },
                        username: { type: "string" },
                        display_name: { type: "string" },
                        avatar_url: { type: "string" },
                      },
                      required: ["id", "username", "display_name"],
                    },
                  },
                  pagination: {
                    type: "object",
                    properties: {
                      page: { type: "number" },
                      limit: { type: "number" },
                      total: { type: "number" },
                      pages: { type: "number" },
                    },
                    required: ["page", "limit", "total", "pages"],
                  },
                },
                required: ["friends", "pagination"],
              },
            },
            required: ["success", "data"],
          },
          404: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
            required: ["success", "message"],
          },
        },
      },
    },
    async (request: GetFriendsRequest, reply: FastifyReply) => {
      return userController.getFriends(request, reply);
    }
  );

  // Rotta per ottenere le richieste di amicizia in sospeso
  fastify.get(
    "/friends/pending",
    {
      schema: {
        description: "Ottieni le richieste di amicizia in sospeso",
        tags: ["Users", "Friends"],
        headers: {
          type: "object",
          properties: {
            Authorization: { type: "string" },
          },
          required: ["Authorization"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    requester_id: { type: "number" },
                    addressee_id: { type: "number" },
                    status: { type: "string" },
                    created_at: { type: "string" },
                    username: { type: "string" },
                    display_name: { type: "string" },
                  },
                  required: [
                    "id",
                    "requester_id",
                    "addressee_id",
                    "status",
                    "created_at",
                    "username",
                    "display_name",
                  ],
                },
              },
            },
            required: ["success", "data"],
          },
          401: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
            required: ["success", "message"],
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return userController.getPendingFriendRequests(request, reply);
    }
  );
}

export default userRoutes;
