import { FastifyRequest, FastifyReply } from "fastify";
import { TournamentModel } from "../models/TournamentModel";
import { MatchModel } from "../models/MatchModel";
import { GameModel } from "../models/GameModel";

export class TournamentController {
  /**
   * POST /tournaments - Crea un nuovo torneo
   */
  async createTournament(
    request: FastifyRequest<{
      Body: {
        name: string;
        game_id: number;
        max_players?: number;
        min_players?: number;
        tournament_type?: "single_elimination" | "double_elimination";
        settings?: Record<string, any>;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const {
        name,
        game_id,
        max_players,
        min_players,
        tournament_type,
        settings,
      } = request.body;

      if (!name || !game_id) {
        return reply
          .status(400)
          .send({ error: "Missing required fields: name, game_id" });
      }

      // Verifica che il gioco esista
      const game = GameModel.getGameById(game_id);
      if (!game) {
        return reply.status(404).send({ error: "Game not found" });
      }

      const tournament = TournamentModel.create({
        name,
        game_id,
        max_players,
        min_players,
        tournament_type,
        settings,
      });

      return reply.status(201).send(tournament);
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * GET /tournaments - Lista tutti i tornei
   */
  async listTournaments(
    request: FastifyRequest<{
      Querystring: {
        status?: string;
        game_id?: number;
        limit?: number;
        offset?: number;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { status, game_id, limit, offset } = request.query;

      const tournaments = TournamentModel.list({
        status,
        game_id: game_id ? parseInt(game_id.toString()) : undefined,
        limit: limit ? parseInt(limit.toString()) : undefined,
        offset: offset ? parseInt(offset.toString()) : undefined,
      });

      return reply.send(tournaments);
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * GET /tournaments/:id - Ottiene i dettagli di un torneo
   */
  async getTournament(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const tournamentId = parseInt(request.params.id);
      const tournament = TournamentModel.getById(tournamentId);

      if (!tournament) {
        return reply.status(404).send({ error: "Tournament not found" });
      }

      return reply.send(tournament);
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * POST /tournaments/:id/register - Registra un giocatore al torneo
   */
  async registerPlayer(
    request: FastifyRequest<{
      Params: { id: string };
      Body: {
        alias: string;
        user_id?: number;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const tournamentId = parseInt(request.params.id);
      const { alias, user_id } = request.body;

      if (!alias) {
        return reply
          .status(400)
          .send({ error: "Missing required field: alias" });
      }

      const registration = TournamentModel.registerPlayer(
        tournamentId,
        alias,
        user_id
      );

      return reply.status(201).send(registration);
    } catch (error: any) {
      request.log.error(error);
      if (
        error.message.includes("not found") ||
        error.message.includes("closed") ||
        error.message.includes("full")
      ) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * DELETE /tournaments/:id/register/:registrationId - Rimuove una registrazione
   */
  async unregisterPlayer(
    request: FastifyRequest<{
      Params: { id: string; registrationId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const tournamentId = parseInt(request.params.id);
      const registrationId = parseInt(request.params.registrationId);

      TournamentModel.unregisterPlayer(tournamentId, registrationId);

      return reply.send({ success: true, message: "Player unregistered" });
    } catch (error: any) {
      request.log.error(error);
      if (
        error.message.includes("not found") ||
        error.message.includes("Cannot unregister")
      ) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * GET /tournaments/:id/registrations - Lista le registrazioni di un torneo
   */
  async getRegistrations(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const tournamentId = parseInt(request.params.id);
      const registrations = TournamentModel.getRegistrations(tournamentId);

      return reply.send(registrations);
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * POST /tournaments/:id/start - Avvia un torneo
   */
  async startTournament(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const tournamentId = parseInt(request.params.id);
      const bracket = TournamentModel.startTournament(tournamentId);

      return reply.send({
        success: true,
        message: "Tournament started",
        bracket,
      });
    } catch (error: any) {
      request.log.error(error);
      if (
        error.message.includes("not found") ||
        error.message.includes("not in registration") ||
        error.message.includes("Not enough players")
      ) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * GET /tournaments/:id/bracket - Ottiene il bracket di un torneo
   */
  async getBracket(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const tournamentId = parseInt(request.params.id);
      const bracket = TournamentModel.getBracket(tournamentId);

      return reply.send(bracket);
    } catch (error: any) {
      request.log.error(error);
      if (error.message.includes("not found")) {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * GET /tournaments/:id/next-matches - Ottiene i prossimi match da giocare
   */
  async getNextMatches(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const tournamentId = parseInt(request.params.id);
      const nextMatchIds = TournamentModel.getNextMatches(tournamentId);

      // Recupera i dettagli dei match
      const matches = nextMatchIds.map((matchId) => {
        return MatchModel.getMatchWithPlayers(matchId);
      });

      return reply.send({
        tournament_id: tournamentId,
        next_matches: matches,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * GET /tournaments/:id/stats - Ottiene le statistiche di un torneo
   */
  async getTournamentStats(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const tournamentId = parseInt(request.params.id);
      const stats = TournamentModel.getStats(tournamentId);

      return reply.send(stats);
    } catch (error: any) {
      request.log.error(error);
      if (error.message.includes("not found")) {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * POST /tournaments/:id/cancel - Cancella un torneo
   */
  async cancelTournament(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const tournamentId = parseInt(request.params.id);
      TournamentModel.cancelTournament(tournamentId);

      return reply.send({
        success: true,
        message: "Tournament cancelled",
      });
    } catch (error: any) {
      request.log.error(error);
      if (
        error.message.includes("not found") ||
        error.message.includes("Cannot cancel")
      ) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * POST /tournaments/:id/matches/:matchId/complete - Callback quando un match viene completato
   */
  async onMatchCompleted(
    request: FastifyRequest<{
      Params: { id: string; matchId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const tournamentId = parseInt(request.params.id);
      const matchId = parseInt(request.params.matchId);

      // Aggiorna lo stato del torneo
      TournamentModel.updateTournamentProgress(tournamentId, matchId);

      const tournament = TournamentModel.getById(tournamentId);

      return reply.send({
        success: true,
        tournament_status: tournament?.status,
        message:
          tournament?.status === "completed"
            ? "Tournament completed"
            : "Match completed, tournament continues",
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: error.message });
    }
  }
}
