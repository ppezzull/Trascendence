import { FastifyRequest, FastifyReply } from "fastify";
import { GameModel } from "../models/GameModel";

export class GameController {
  /**
   * Lista tutti i giochi
   */
  async listGames(request: FastifyRequest, reply: FastifyReply) {
    try {
      const games = GameModel.getAllGames(true);
      return reply.send(games);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }

  /**
   * Dettagli di un gioco
   */
  async getGame(
    request: FastifyRequest<{ Params: { gameId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const gameId = parseInt(request.params.gameId);
      const game = GameModel.getGameById(gameId);

      if (!game) {
        return reply.status(404).send({ error: "Game not found" });
      }

      return reply.send(game);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }

  /**
   * Ottieni le impostazioni di un gioco
   */
  async getGameSettings(
    request: FastifyRequest<{ Params: { gameId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const gameId = parseInt(request.params.gameId);
      const game = GameModel.getGameById(gameId);

      if (!game) {
        return reply.status(404).send({ error: "Game not found" });
      }

      const settings = GameModel.getGameSettings(gameId);
      return reply.send(settings);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }
}

export default GameController;
