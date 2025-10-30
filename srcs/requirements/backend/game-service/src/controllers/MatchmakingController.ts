import { FastifyRequest, FastifyReply } from "fastify";
import { MatchmakingModel } from "../models/MatchmakingModel";
import { MatchModel } from "../models/MatchModel";
import { GameModel } from "../models/GameModel";

export class MatchmakingController {
  /**
   * Entra nella coda di matchmaking
   */
  async joinQueue(
    request: FastifyRequest<{
      Body: { game_id: number };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user!.id;
      const { game_id } = request.body;

      // Verifica che il gioco esista
      const game = GameModel.getGameById(game_id);
      if (!game) {
        return reply.status(404).send({ error: "Game not found" });
      }

      // Verifica se l'utente è già in coda
      if (MatchmakingModel.isInQueue(userId, game_id)) {
        return reply.status(400).send({ error: "Already in queue" });
      }

      // Aggiungi alla coda
      const success = MatchmakingModel.joinQueue(userId, game_id);

      if (!success) {
        return reply.status(500).send({ error: "Failed to join queue" });
      }

      return reply.send({
        message: "Joined matchmaking queue",
        user_id: userId,
        game_id,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }

  /**
   * Esci dalla coda di matchmaking
   */
  async leaveQueue(
    request: FastifyRequest<{
      Body: { game_id?: number };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user!.id;
      const { game_id } = request.body;

      const success = MatchmakingModel.leaveQueue(userId, game_id);

      if (!success) {
        return reply.status(404).send({ error: "Not in queue" });
      }

      return reply.send({ message: "Left matchmaking queue" });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }

  /**
   * Cerca un avversario e crea una partita
   */
  async findMatch(
    request: FastifyRequest<{
      Body: { game_id: number; elo_range?: number };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user!.id;
      const { game_id, elo_range } = request.body;

      // Verifica che l'utente sia in coda
      if (!MatchmakingModel.isInQueue(userId, game_id)) {
        return reply.status(400).send({
          error: "Not in queue. Join queue first.",
        });
      }

      // Cerca un avversario
      let opponent = MatchmakingModel.findOpponent(
        userId,
        game_id,
        elo_range || 200
      );

      // Se non trova nessuno con ELO simile, cerca chiunque
      if (!opponent) {
        opponent = MatchmakingModel.findAnyOpponent(userId, game_id);
      }

      if (!opponent) {
        return reply.send({
          message: "No opponent found yet. Please wait...",
          in_queue: true,
        });
      }

      // Crea la partita
      const match = MatchModel.createMatch(game_id, [userId, opponent.user_id]);

      // Rimuovi entrambi dalla coda
      MatchmakingModel.leaveQueue(userId, game_id);
      MatchmakingModel.leaveQueue(opponent.user_id, game_id);

      const matchWithPlayers = MatchModel.getMatchWithPlayers(match.id!);

      return reply.status(201).send({
        message: "Match found!",
        match: matchWithPlayers,
        opponent_id: opponent.user_id,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }

  /**
   * Ottieni lo stato della coda
   */
  async getQueueStatus(
    request: FastifyRequest<{
      Params: { gameId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const gameId = parseInt(request.params.gameId);

      const stats = MatchmakingModel.getQueueStats(gameId);
      const queue = MatchmakingModel.getQueueForGame(gameId);

      return reply.send({
        stats,
        players_in_queue: queue.length,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }
}

export default MatchmakingController;
