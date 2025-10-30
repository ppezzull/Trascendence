import { FastifyRequest, FastifyReply } from "fastify";
import { StatsModel } from "../models/StatsModel";

export class StatsController {
  /**
   * Ottieni statistiche di un utente per un gioco
   */
  async getUserGameStats(
    request: FastifyRequest<{
      Params: { userId: string; gameId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = parseInt(request.params.userId);
      const gameId = parseInt(request.params.gameId);

      const stats = StatsModel.getOrCreateStats(userId, gameId);
      return reply.send(stats);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }

  /**
   * Ottieni tutte le statistiche di un utente
   */
  async getAllUserStats(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const userId = parseInt(request.params.userId);
      const stats = StatsModel.getAllUserStats(userId);
      return reply.send(stats);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }

  /**
   * Ottieni la leaderboard di un gioco
   */
  async getLeaderboard(
    request: FastifyRequest<{
      Params: { gameId: string };
      Querystring: { limit?: string; offset?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const gameId = parseInt(request.params.gameId);
      const limit = request.query.limit ? parseInt(request.query.limit) : 100;
      const offset = request.query.offset ? parseInt(request.query.offset) : 0;

      const leaderboard = StatsModel.getLeaderboard(gameId, limit, offset);
      return reply.send(leaderboard);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }

  /**
   * Ottieni il rank di un utente
   */
  async getUserRank(
    request: FastifyRequest<{
      Params: { userId: string; gameId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = parseInt(request.params.userId);
      const gameId = parseInt(request.params.gameId);

      const rank = StatsModel.getUserRank(userId, gameId);

      if (rank === null) {
        return reply.status(404).send({ error: "User stats not found" });
      }

      return reply.send({ rank });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }

  /**
   * Ottieni statistiche aggregate di un gioco
   */
  async getGameStats(
    request: FastifyRequest<{ Params: { gameId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const gameId = parseInt(request.params.gameId);
      const stats = StatsModel.getGameStats(gameId);

      if (!stats) {
        return reply
          .status(404)
          .send({ error: "No stats found for this game" });
      }

      return reply.send(stats);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }
}

export default StatsController;
