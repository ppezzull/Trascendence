import db from "../database/connection";

// ==================== TYPES ====================

export interface UserGameStats {
  user_id: number;
  game_id: number;
  matches_played: number;
  wins: number;
  losses: number;
  draws: number;
  total_score: number;
  highest_score: number;
  elo_rating: number;
  created_at?: string;
  updated_at?: string;
}

export interface Leaderboard {
  user_id: number;
  elo_rating: number;
  wins: number;
  matches_played: number;
}

// ==================== STATS MODEL ====================

export class StatsModel {
  /**
   * Ottieni o crea statistiche per un utente e un gioco
   */
  static getOrCreateStats(userId: number, gameId: number): UserGameStats {
    let stats = this.getStats(userId, gameId);

    if (!stats) {
      const stmt = db.prepare(`
        INSERT INTO user_game_stats (user_id, game_id)
        VALUES (?, ?)
      `);

      stmt.run(userId, gameId);
      stats = this.getStats(userId, gameId) as UserGameStats;
    }

    return stats;
  }

  /**
   * Ottieni le statistiche di un utente per un gioco
   */
  static getStats(userId: number, gameId: number): UserGameStats | null {
    const stmt = db.prepare(`
      SELECT * FROM user_game_stats
      WHERE user_id = ? AND game_id = ?
    `);

    const stats = stmt.get(userId, gameId) as UserGameStats | undefined;
    return stats || null;
  }

  /**
   * Ottieni tutte le statistiche di un utente
   */
  static getAllUserStats(userId: number): UserGameStats[] {
    const stmt = db.prepare(`
      SELECT * FROM user_game_stats
      WHERE user_id = ?
      ORDER BY matches_played DESC
    `);

    return stmt.all(userId) as UserGameStats[];
  }

  /**
   * Aggiorna le statistiche dopo una partita
   */
  static updateAfterMatch(
    userId: number,
    gameId: number,
    won: boolean,
    score: number,
    eloChange: number = 0
  ): UserGameStats {
    // Assicurati che esistano le statistiche
    this.getOrCreateStats(userId, gameId);

    const stmt = db.prepare(`
      UPDATE user_game_stats
      SET matches_played = matches_played + 1,
          wins = wins + ?,
          losses = losses + ?,
          total_score = total_score + ?,
          highest_score = MAX(highest_score, ?),
          elo_rating = elo_rating + ?,
          updated_at = datetime('now')
      WHERE user_id = ? AND game_id = ?
    `);

    stmt.run(won ? 1 : 0, won ? 0 : 1, score, score, eloChange, userId, gameId);

    return this.getStats(userId, gameId) as UserGameStats;
  }

  /**
   * Calcola il cambiamento ELO
   */
  static calculateEloChange(
    playerElo: number,
    opponentElo: number,
    won: boolean,
    kFactor: number = 32
  ): number {
    // Formula ELO standard
    const expectedScore =
      1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
    const actualScore = won ? 1 : 0;
    const eloChange = Math.round(kFactor * (actualScore - expectedScore));

    return eloChange;
  }

  /**
   * Ottieni la leaderboard per un gioco
   */
  static getLeaderboard(
    gameId: number,
    limit: number = 100,
    offset: number = 0
  ): Leaderboard[] {
    const stmt = db.prepare(`
      SELECT user_id, elo_rating, wins, matches_played
      FROM user_game_stats
      WHERE game_id = ?
      ORDER BY elo_rating DESC
      LIMIT ? OFFSET ?
    `);

    return stmt.all(gameId, limit, offset) as Leaderboard[];
  }

  /**
   * Ottieni la posizione di un utente nella leaderboard
   */
  static getUserRank(userId: number, gameId: number): number | null {
    const stmt = db.prepare(`
      SELECT COUNT(*) + 1 as rank
      FROM user_game_stats
      WHERE game_id = ? 
        AND elo_rating > (
          SELECT elo_rating 
          FROM user_game_stats 
          WHERE user_id = ? AND game_id = ?
        )
    `);

    const result = stmt.get(gameId, userId, gameId) as
      | { rank: number }
      | undefined;
    return result?.rank || null;
  }

  /**
   * Ottieni statistiche aggregate per un gioco
   */
  static getGameStats(gameId: number): {
    total_matches: number;
    total_players: number;
    avg_elo: number;
  } | null {
    const stmt = db.prepare(`
      SELECT 
        SUM(matches_played) / 2 as total_matches,
        COUNT(DISTINCT user_id) as total_players,
        AVG(elo_rating) as avg_elo
      FROM user_game_stats
      WHERE game_id = ?
    `);

    const stats = stmt.get(gameId) as
      | { total_matches: number; total_players: number; avg_elo: number }
      | undefined;

    return stats || null;
  }

  /**
   * Reset statistiche (per testing)
   */
  static resetStats(userId: number, gameId: number): boolean {
    const stmt = db.prepare(`
      UPDATE user_game_stats
      SET matches_played = 0,
          wins = 0,
          losses = 0,
          draws = 0,
          total_score = 0,
          highest_score = 0,
          elo_rating = 1000,
          updated_at = datetime('now')
      WHERE user_id = ? AND game_id = ?
    `);

    const result = stmt.run(userId, gameId);
    return result.changes > 0;
  }
}

export default StatsModel;
