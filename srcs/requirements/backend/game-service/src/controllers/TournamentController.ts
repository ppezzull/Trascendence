import { FastifyRequest, FastifyReply } from "fastify";
import { TournamentModel } from "../models/TournamentModel";
import { MatchModel } from "../models/MatchModel";
import { GameModel } from "../models/GameModel";
import db from "../database/connection";

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

      console.log(
        `onMatchCompleted: Processing completion for tournament ${tournamentId}, match ${matchId}`
      );

      // Verifica lo stato del torneo
      const tournament = TournamentModel.getById(tournamentId);
      if (!tournament) {
        return reply.status(404).send({ error: "Tournament not found" });
      }

      if (tournament.status !== "in_progress") {
        return reply
          .status(400)
          .send({ error: "Tournament is not in progress" });
      }

      // Verifica lo stato della partita
      const match = MatchModel.findById(matchId);
      if (!match) {
        return reply.status(404).send({ error: "Match not found" });
      }

      console.log(
        `onMatchCompleted: Match status is ${match.status}, winner_id is ${match.winner_id}`
      );

      // Se la partita non è finita, non facciamo nulla
      if (match.status !== "finished" || !match.winner_id) {
        return reply
          .status(400)
          .send({ error: "Match is not finished or has no winner" });
      }

      // Verifica che la partita faccia parte del torneo
      const tournamentMatchStmt = db.prepare(`
        SELECT * FROM tournament_matches WHERE match_id = ?
      `);
      const tournamentMatch = tournamentMatchStmt.get(matchId) as any;

      if (!tournamentMatch || tournamentMatch.tournament_id !== tournamentId) {
        return reply
          .status(404)
          .send({ error: "Match is not part of this tournament" });
      }

      console.log(
        `onMatchCompleted: Match is part of tournament, next_match_id is ${tournamentMatch.next_match_id}`
      );

      // Verifica se questa è l'ultima partita del torneo
      const allMatchesStmt = db.prepare(`
        SELECT tm.*, m.status as match_status
        FROM tournament_matches tm
        JOIN matches m ON tm.match_id = m.id
        WHERE tm.tournament_id = ?
        ORDER BY tm.round DESC, tm.match_number DESC
      `);
      const allMatches = allMatchesStmt.all(tournamentId) as any[];

      // Trova il round più alto per determinare se questa è l'ultima partita
      const maxRound = Math.max(...allMatches.map((m) => m.round));
      const isFinalMatch =
        tournamentMatch.round === maxRound && !tournamentMatch.next_match_id;

      console.log(
        `onMatchCompleted: Is this the final match? ${isFinalMatch}, max round is ${maxRound}, current round is ${tournamentMatch.round}`
      );

      // Se c'è una partita successiva, aggiungi il vincitore
      if (tournamentMatch.next_match_id) {
        // Ottieni i dettagli della partita successiva
        const nextMatchStmt = db.prepare(`
          SELECT * FROM tournament_matches WHERE id = ?
        `);
        const nextTournamentMatch = nextMatchStmt.get(
          tournamentMatch.next_match_id
        ) as any;

        if (!nextTournamentMatch) {
          console.log(
            `onMatchCompleted: Next tournament match not found with ID ${tournamentMatch.next_match_id}`
          );
          return reply.status(500).send({ error: "Next match not found" });
        }

        console.log(
          `onMatchCompleted: Adding winner ${match.winner_id} to next match ${nextTournamentMatch.match_id}`
        );

        // Determina la posizione del vincitore nella partita successiva
        const playersCountStmt = db.prepare(`
          SELECT COUNT(*) as count FROM match_players WHERE match_id = ?
        `);
        const playersCount = playersCountStmt.get(
          nextTournamentMatch.match_id
        ) as {
          count: number;
        };

        const position = playersCount.count + 1;

        // Aggiungi il vincitore alla partita successiva
        const addPlayerStmt = db.prepare(`
          INSERT OR REPLACE INTO match_players (match_id, user_id, position)
          VALUES (?, ?, ?)
        `);
        addPlayerStmt.run(
          nextTournamentMatch.match_id,
          match.winner_id,
          position
        );

        console.log(
          `onMatchCompleted: Winner successfully added to next match at position ${position}`
        );
      } else {
        console.log(
          `onMatchCompleted: No next match, this might be final match`
        );
      }

      // Aggiorna lo stato del torneo
      TournamentModel.updateTournamentProgress(tournamentId, matchId);

      // Se questa è l'ultima partita, finalizza il torneo
      if (isFinalMatch) {
        console.log(
          `onMatchCompleted: This is the final match, completing tournament ${tournamentId} with winner ${match.winner_id}`
        );

        // Aggiorna lo stato del torneo a completato
        const updateTournamentStmt = db.prepare(`
          UPDATE tournaments 
          SET status = 'completed', 
              completed_at = datetime('now'),
              winner_id = ?
          WHERE id = ?
        `);
        updateTournamentStmt.run(match.winner_id, tournamentId);

        console.log(
          `onMatchCompleted: Tournament ${tournamentId} completed with winner ${match.winner_id}`
        );
      }

      // Ottieni lo stato aggiornato del torneo
      const updatedTournament = TournamentModel.getById(tournamentId);

      return reply.send({
        success: true,
        tournament_status: updatedTournament?.status,
        is_final_match: isFinalMatch,
        message:
          updatedTournament?.status === "completed"
            ? "Tournament completed"
            : "Match completed, tournament continues",
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: error.message });
    }
  }
}
