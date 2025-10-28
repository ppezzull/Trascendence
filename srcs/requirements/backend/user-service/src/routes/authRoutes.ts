import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { OAuthController } from "../controllers/OAuthController";

// Funzione per registrare le rotte di autenticazione OAuth
async function authRoutes(fastify: FastifyInstance) {
  const oauthController = new OAuthController();

  // Rotta per iniziare il flusso di autenticazione Google
  // NOTA: Questa route è gestita dal plugin @fastify/oauth2, ma la registriamo
  // anche qui per farla apparire nello Swagger
  fastify.get(
    "/google",
    {
      schema: {
        description:
          "Inizia il flusso di autenticazione Google OAuth2. Reindirizza l'utente alla pagina di autorizzazione di Google.",
        tags: ["Auth"],
        summary: "Login con Google",
        response: {
          302: {
            description: "Redirect alla pagina di autorizzazione Google",
            type: "null",
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Delega al plugin OAuth2 che gestisce il redirect
      return fastify.googleOAuth2.generateAuthorizationUri(request, reply);
    }
  );

  // Rotta di callback per Google OAuth
  fastify.get(
    "/google/callback",
    {
      schema: {
        description: "Callback per l'autenticazione Google OAuth2",
        tags: ["Auth"],
        querystring: {
          type: "object",
          properties: {
            code: { type: "string" },
            state: { type: "string" },
          },
        },
        response: {
          302: {
            description: "Redirect al frontend con il token",
            type: "null",
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return oauthController.googleCallback(request, reply);
    }
  );
}

export default authRoutes;
