import { FastifyRequest, FastifyReply } from "fastify";
import UserModel from "../models/User";

interface GoogleUserInfo {
  sub: string; // Google user ID
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export class OAuthController {
  // Callback di Google OAuth
  async googleCallback(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      // Ottieni il token da Google OAuth2
      const token =
        await request.server.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
          request
        );

      // Ottieni le informazioni dell'utente da Google
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${token.token.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Errore nel recupero delle informazioni utente da Google"
        );
      }

      const googleUser: GoogleUserInfo = await response.json();

      // Cerca se l'utente esiste già tramite google_id
      let user = await UserModel.findByGoogleId(googleUser.sub);

      if (!user) {
        // Cerca se esiste un utente con la stessa email
        user = await UserModel.findByEmail(googleUser.email);

        if (user) {
          // Collega l'account Google all'account esistente
          user = await UserModel.linkGoogleAccount(user.id!, googleUser.sub);
        } else {
          // Crea un nuovo utente
          const username = googleUser.email.split("@")[0] + "_" + Date.now();
          user = await UserModel.createOAuthUser({
            google_id: googleUser.sub,
            email: googleUser.email,
            username: username,
            display_name: googleUser.name || googleUser.email,
            avatar_url: googleUser.picture,
            oauth_provider: "google",
            is_verified: googleUser.email_verified,
          });
        }
      }

      if (!user) {
        return reply.redirect(
          `${process.env.FRONTEND_URL}/login?error=authentication_failed`
        );
      }

      // Genera il token JWT
      const jwtToken = request.server.jwt.sign(
        { id: user.id, username: user.username },
        { expiresIn: "7d" }
      );

      // Redirect al frontend con il token
      return reply.redirect(
        `${process.env.FRONTEND_URL}/oauth/callback?token=${jwtToken}`
      );
    } catch (error) {
      request.log.error(error);
      return reply.redirect(
        `${process.env.FRONTEND_URL}/login?error=oauth_error`
      );
    }
  }

  // Inizia il flusso di autenticazione Google
  async googleLogin(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      // Redirect alla pagina di autorizzazione di Google
      return request.server.googleOAuth2.generateAuthorizationUri(
        request,
        reply,
        (err, authorizationUri) => {
          if (err) {
            request.log.error(err);
            return reply.status(500).send({
              success: false,
              message: "Errore durante l'avvio dell'autenticazione Google",
            });
          }
          return reply.redirect(authorizationUri);
        }
      );
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        message: "Errore durante l'avvio dell'autenticazione Google",
      });
    }
  }
}

export default OAuthController;
