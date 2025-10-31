import db from "../database/connection";
import { StatsModel } from "./StatsModel";

// ==================== TYPES ====================

export interface QueueEntry {
  user_id: number;
  game_id: number;
  elo_rating: number;
  joined_at: string;
}

export interface MatchmakingResult {
  success: boolean;
  match_id?: number;
  opponent_id?: number;
  message?: string;
}

// ==================== MATCHMAKING MODEL ====================

export class MatchmakingModel {
  /**
   * Aggiungi un utente alla coda di matchmaking
   */
  static joinQueue(userId: number, gameId: number): boolean {
    // Ottieni ELO dell'utente
    const stats = StatsModel.getOrCreateStats(userId, gameId);

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO matchmaking_queue (user_id, game_id, elo_rating)
      VALUES (?, ?, ?)
    `);

    try {
      stmt.run(userId, gameId, stats.elo_rating);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Rimuovi un utente dalla coda
   */
  static leaveQueue(userId: number, gameId?: number): boolean {
    let query = "DELETE FROM matchmaking_queue WHERE user_id = ?";
    const params: any[] = [userId];

    if (gameId !== undefined) {
      query += " AND game_id = ?";
      params.push(gameId);
    }

    const stmt = db.prepare(query);
    const result = stmt.run(...params);
    return result.changes > 0;
  }

  /**
   * Verifica se un utente è in coda
   */
  static isInQueue(userId: number, gameId: number): boolean {
    const stmt = db.prepare(`
      SELECT 1 FROM matchmaking_queue
      WHERE user_id = ? AND game_id = ?
    `);

    return stmt.get(userId, gameId) !== undefined;
  }

  /**
   * Trova un avversario per matchmaking
   */
  static findOpponent(
    userId: number,
    gameId: number,
    eloRange: number = 200
  ): QueueEntry | null {
    const userEntry = this.getQueueEntry(userId, gameId);
    if (!userEntry) return null;

    const stmt = db.prepare(`
      SELECT * FROM matchmaking_queue
      WHERE game_id = ? 
        AND user_id != ?
        AND elo_rating BETWEEN ? AND ?
      ORDER BY joined_at ASC
      LIMIT 1
    `);

    const opponent = stmt.get(
      gameId,
      userId,
      userEntry.elo_rating - eloRange,
      userEntry.elo_rating + eloRange
    ) as QueueEntry | undefined;

    return opponent || null;
  }

  /**
   * Trova qualsiasi avversario disponibile (fallback)
   */
  static findAnyOpponent(userId: number, gameId: number): QueueEntry | null {
    const stmt = db.prepare(`
      SELECT * FROM matchmaking_queue
      WHERE game_id = ? AND user_id != ?
      ORDER BY joined_at ASC
      LIMIT 1
    `);

    const opponent = stmt.get(gameId, userId) as QueueEntry | undefined;
    return opponent || null;
  }

  /**
   * Ottieni entry della coda per un utente
   */
  static getQueueEntry(userId: number, gameId: number): QueueEntry | null {
    const stmt = db.prepare(`
      SELECT * FROM matchmaking_queue
      WHERE user_id = ? AND game_id = ?
    `);

    const entry = stmt.get(userId, gameId) as QueueEntry | undefined;
    return entry || null;
  }

  /**
   * Ottieni tutti gli utenti in coda per un gioco
   */
  static getQueueForGame(gameId: number): QueueEntry[] {
    const stmt = db.prepare(`
      SELECT * FROM matchmaking_queue
      WHERE game_id = ?
      ORDER BY joined_at ASC
    `);

    return stmt.all(gameId) as QueueEntry[];
  }

  /**
   * Ottieni statistiche della coda
   */
  static getQueueStats(gameId: number): {
    total_players: number;
    avg_wait_time: number;
    avg_elo: number;
  } {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total_players,
        AVG(CAST((julianday('now') - julianday(joined_at)) * 24 * 60 AS INTEGER)) as avg_wait_time,
        AVG(elo_rating) as avg_elo
      FROM matchmaking_queue
      WHERE game_id = ?
    `);

    const stats = stmt.get(gameId) as
      | { total_players: number; avg_wait_time: number; avg_elo: number }
      | undefined;

    return (
      stats || {
        total_players: 0,
        avg_wait_time: 0,
        avg_elo: 1000,
      }
    );
  }

  /**
   * Pulisci entry vecchie dalla coda (oltre X minuti)
   */
  static cleanOldEntries(minutesOld: number = 30): number {
    const stmt = db.prepare(`
      DELETE FROM matchmaking_queue
      WHERE datetime(joined_at, '+' || ? || ' minutes') < datetime('now')
    `);

    const result = stmt.run(minutesOld);
    return result.changes;
  }
}

export default MatchmakingModel;
