import { FastifyRequest, FastifyReply } from "fastify";
import { MatchModel } from "../models/MatchModel";
import { GameModel } from "../models/GameModel";
import { StatsModel } from "../models/StatsModel";
import { TournamentModel } from "../models/TournamentModel";
import db from "../database/connection";

export class MatchController {
  /**
   * Crea una nuova partita
   */
  async createMatch(
    request: FastifyRequest<{
      Body: {
        game_id: number;
        player_ids: number[];
        settings?: Record<string, string>;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { game_id, player_ids, settings } = request.body;

      // Verifica che il gioco esista
      const game = GameModel.getGameById(game_id);
      if (!game) {
        return reply.status(404).send({ error: "Game not found" });
      }

      // Verifica numero giocatori
      if (
        player_ids.length < game.min_players ||
        player_ids.length > game.max_players
      ) {
        return reply.status(400).send({
          error: `Invalid number of players. Expected ${game.min_players}-${game.max_players}`,
        });
      }

      // Valida le impostazioni se fornite
      if (settings) {
        const validation = GameModel.validateSettings(game_id, settings);
        if (!validation.valid) {
          return reply.status(400).send({
            error: "Invalid settings",
            details: validation.errors,
          });
        }
      }

      // Crea la partita
      const match = MatchModel.createMatch(game_id, player_ids);

      // Applica le impostazioni se fornite
      if (settings && match.id) {
        MatchModel.setMatchSettings(match.id, settings);
      }

      const matchWithPlayers = MatchModel.getMatchWithPlayers(match.id!);
      return reply.status(201).send(matchWithPlayers);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }

  /**
   * Ottieni dettagli di una partita
   */
  async getMatch(
    request: FastifyRequest<{ Params: { matchId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const matchId = parseInt(request.params.matchId);
      const match = MatchModel.getMatchWithPlayers(matchId);

      if (!match) {
        return reply.status(404).send({ error: "Match not found" });
      }

      return reply.send(match);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }

  /**
   * Segna un giocatore come pronto
   */
  async setPlayerReady(
    request: FastifyRequest<{
      Params: { matchId: string };
      Body: { user_id: number; ready: boolean };
    }>,
    reply: FastifyReply
  ) {
    try {
      const matchId = parseInt(request.params.matchId);
      const { user_id, ready } = request.body;

      const success = MatchModel.setPlayerReady(matchId, user_id, ready);

      if (!success) {
        return reply.status(404).send({ error: "Player not found in match" });
      }

      // Se tutti sono pronti, avvia la partita
      if (ready && MatchModel.areAllPlayersReady(matchId)) {
        MatchModel.startMatch(matchId);
      }

      const match = MatchModel.getMatchWithPlayers(matchId);
      return reply.send(match);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }

  /**
   * Aggiorna il punteggio di un giocatore
   */
  async updateScore(
    request: FastifyRequest<{
      Params: { matchId: string };
      Body: { user_id: number; score: number };
    }>,
    reply: FastifyReply
  ) {
    try {
      // Log per debug
      console.log("Request body:", request.body);
      console.log("Request headers:", request.headers);

      const matchId = parseInt(request.params.matchId);
      const { user_id, score } = request.body;

      const success = MatchModel.updatePlayerScore(matchId, user_id, score);

      if (!success) {
        return reply.status(404).send({ error: "Player not found in match" });
      }

      const match = MatchModel.getMatchWithPlayers(matchId);
      return reply.send(match);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }

  /**
   * Termina una partita
   */
  async finishMatch(
    request: FastifyRequest<{
      Params: { matchId: string };
      Body: { winner_id?: number };
    }>,
    reply: FastifyReply
  ) {
    try {
      const matchId = parseInt(request.params.matchId);
      const { winner_id } = request.body;

      const match = MatchModel.findById(matchId);
      if (!match) {
        return reply.status(404).send({ error: "Match not found" });
      }

      console.log("matchensommamammamamammama", matchId);
      console.log("winner_idensommamammamamammama", winner_id);

      // Termina la partita
      const success = MatchModel.finishMatch(matchId, winner_id);

      if (!success) {
        return reply.status(400).send({ error: "Cannot finish match" });
      }

      // Verifica se la partita fa parte di un torneo
      const tournamentMatchStmt = db.prepare(`
        SELECT tm.tournament_id
        FROM tournament_matches tm
        WHERE tm.match_id = ?
      `);
      const tournamentMatch = tournamentMatchStmt.get(matchId) as
        | { tournament_id: number }
        | undefined;

      console.log(
        `finishMatch: Checking if match ${matchId} is part of a tournament. Result:`,
        tournamentMatch
      );

      // Se la partita fa parte di un torneo, aggiorna lo stato del torneo
      if (tournamentMatch) {
        console.log(
          `finishMatch: Match ${matchId} is part of tournament ${tournamentMatch.tournament_id}. Updating tournament progress.`
        );
        TournamentModel.updateTournamentProgress(
          tournamentMatch.tournament_id,
          matchId
        );
      } else {
        console.log(
          `finishMatch: Match ${matchId} is not part of any tournament.`
        );
      }

      // Aggiorna le statistiche dei giocatori
      const players = MatchModel.getMatchPlayers(matchId);

      for (const player of players) {
        const won = player.user_id === winner_id;
        const opponentPlayer = players.find(
          (p) => p.user_id !== player.user_id
        );

        // Ottieni le statistiche del giocatore
        const playerStats = StatsModel.getOrCreateStats(
          player.user_id,
          match.game_id
        );

        // Ottieni le statistiche dell'avversario
        const opponentStats = opponentPlayer
          ? StatsModel.getOrCreateStats(opponentPlayer.user_id, match.game_id)
          : { elo_rating: 1000 }; // Default se non trovato

        const eloChange = StatsModel.calculateEloChange(
          playerStats.elo_rating,
          opponentStats.elo_rating,
          won
        );

        StatsModel.updateAfterMatch(
          player.user_id,
          match.game_id,
          won,
          player.score,
          eloChange
        );
      }

      const updatedMatch = MatchModel.getMatchWithPlayers(matchId);
      return reply.send(updatedMatch);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }

  /**
   * Cancella una partita
   */
  async cancelMatch(
    request: FastifyRequest<{
      Params: { matchId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const matchId = parseInt(request.params.matchId);

      const match = MatchModel.findById(matchId);
      if (!match) {
        return reply.status(404).send({ error: "Match not found" });
      }

      // Verifica che la partita sia in stato pending (prima che i giocatori siano pronti)
      if (match.status !== "pending") {
        return reply.status(400).send({
          error: "Cannot cancel match",
          details: `Match is already ${match.status}. Only pending matches can be cancelled.`,
        });
      }

      // Annulla la partita
      const success = MatchModel.cancelMatch(matchId);

      if (!success) {
        return reply.status(500).send({ error: "Failed to cancel match" });
      }

      const updatedMatch = MatchModel.getMatchWithPlayers(matchId);
      return reply.send({
        ...updatedMatch,
        message: "Match successfully cancelled",
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }

  /**
   * Ottieni lo storico partite di un utente
   */
  async getUserMatches(
    request: FastifyRequest<{
      Params: { userId: string };
      Querystring: { game_id?: string; limit?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = parseInt(request.params.userId);
      const gameId = request.query.game_id
        ? parseInt(request.query.game_id)
        : undefined;
      const limit = request.query.limit ? parseInt(request.query.limit) : 50;

      const matches = MatchModel.getUserMatches(userId, gameId, limit);
      return reply.send(matches);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }
}

export default MatchController;
