import db from "../database/connection";

// ==================== TYPES ====================

export interface Match {
  id?: number;
  game_id: number;
  status: "pending" | "in_progress" | "finished" | "cancelled";
  winner_id?: number;
  created_at?: string;
  started_at?: string;
  finished_at?: string;
}

export interface MatchPlayer {
  match_id: number;
  user_id: number;
  score: number;
  position: number;
  is_ready: number;
  joined_at?: string;
}

export interface MatchSetting {
  match_id: number;
  setting_id: number;
  value: string;
}

export interface MatchWithPlayers extends Match {
  players: MatchPlayer[];
  settings?: MatchSetting[];
}

// ==================== MATCH MODEL ====================

export class MatchModel {
  /**
   * Crea una nuova partita
   */
  static createMatch(gameId: number, playerIds: number[]): Match {
    const insertMatch = db.prepare(`
      INSERT INTO matches (game_id, status)
      VALUES (?, 'pending')
    `);

    const result = insertMatch.run(gameId);
    const matchId = result.lastInsertRowid as number;

    // Aggiungi i giocatori
    const insertPlayer = db.prepare(`
      INSERT INTO match_players (match_id, user_id, position)
      VALUES (?, ?, ?)
    `);

    playerIds.forEach((userId, index) => {
      insertPlayer.run(matchId, userId, index + 1);
    });

    return this.findById(matchId) as Match;
  }

  /**
   * Trova una partita per ID
   */
  static findById(id: number): Match | null {
    const stmt = db.prepare("SELECT * FROM matches WHERE id = ?");
    const match = stmt.get(id) as Match | undefined;
    return match || null;
  }

  /**
   * Ottieni i dettagli completi di una partita con giocatori
   */
  static getMatchWithPlayers(matchId: number): MatchWithPlayers | null {
    const match = this.findById(matchId);
    if (!match) return null;

    const players = this.getMatchPlayers(matchId);
    const settings = this.getMatchSettings(matchId);

    return {
      ...match,
      players,
      settings,
    };
  }

  /**
   * Ottieni i giocatori di una partita
   */
  static getMatchPlayers(matchId: number): MatchPlayer[] {
    const stmt = db.prepare(`
      SELECT * FROM match_players
      WHERE match_id = ?
      ORDER BY position ASC
    `);

    return stmt.all(matchId) as MatchPlayer[];
  }

  /**
   * Ottieni le impostazioni applicate a una partita
   */
  static getMatchSettings(matchId: number): MatchSetting[] {
    const stmt = db.prepare(`
      SELECT * FROM match_settings
      WHERE match_id = ?
    `);

    return stmt.all(matchId) as MatchSetting[];
  }

  /**
   * Applica impostazioni a una partita
   */
  static setMatchSettings(
    matchId: number,
    settings: Record<string, string>
  ): void {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO match_settings (match_id, setting_id, value)
      VALUES (?, ?, ?)
    `);

    for (const [settingId, value] of Object.entries(settings)) {
      stmt.run(matchId, parseInt(settingId), value);
    }
  }

  /**
   * Segna un giocatore come pronto
   */
  static setPlayerReady(
    matchId: number,
    userId: number,
    ready: boolean
  ): boolean {
    const stmt = db.prepare(`
      UPDATE match_players
      SET is_ready = ?
      WHERE match_id = ? AND user_id = ?
    `);

    const result = stmt.run(ready ? 1 : 0, matchId, userId);
    return result.changes > 0;
  }

  /**
   * Verifica se tutti i giocatori sono pronti
   */
  static areAllPlayersReady(matchId: number): boolean {
    const stmt = db.prepare(`
      SELECT COUNT(*) as total, SUM(is_ready) as ready
      FROM match_players
      WHERE match_id = ?
    `);

    const result = stmt.get(matchId) as { total: number; ready: number };
    return result.total > 0 && result.total === result.ready;
  }

  /**
   * Avvia una partita
   */
  static startMatch(matchId: number): boolean {
    const stmt = db.prepare(`
      UPDATE matches
      SET status = 'in_progress', started_at = datetime('now')
      WHERE id = ? AND status = 'pending'
    `);

    const result = stmt.run(matchId);
    return result.changes > 0;
  }

  /**
   * Termina una partita
   */
  static finishMatch(matchId: number, winnerId?: number): boolean {
    const stmt = db.prepare(`
      UPDATE matches
      SET status = 'finished', 
          winner_id = ?,
          finished_at = datetime('now')
      WHERE id = ? AND status = 'in_progress'
    `);

    const result = stmt.run(winnerId || null, matchId);
    return result.changes > 0;
  }

  /**
   * Aggiorna il punteggio di un giocatore
   */
  static updatePlayerScore(
    matchId: number,
    userId: number,
    score: number
  ): boolean {
    const stmt = db.prepare(`
      UPDATE match_players
      SET score = ?
      WHERE match_id = ? AND user_id = ?
    `);

    const result = stmt.run(score, matchId, userId);
    return result.changes > 0;
  }

  /**
   * Cancella una partita
   */
  static cancelMatch(matchId: number): boolean {
    const stmt = db.prepare(`
      UPDATE matches
      SET status = 'cancelled'
      WHERE id = ? AND status = 'pending'
    `);

    const result = stmt.run(matchId);
    return result.changes > 0;
  }

  /**
   * Ottieni le partite di un utente
   */
  static getUserMatches(
    userId: number,
    gameId?: number,
    limit: number = 50
  ): Match[] {
    let query = `
      SELECT m.* FROM matches m
      INNER JOIN match_players mp ON m.id = mp.match_id
      WHERE mp.user_id = ?
    `;

    const params: any[] = [userId];

    if (gameId) {
      query += " AND m.game_id = ?";
      params.push(gameId);
    }

    query += " ORDER BY m.created_at DESC LIMIT ?";
    params.push(limit);

    const stmt = db.prepare(query);
    return stmt.all(...params) as Match[];
  }

  /**
   * Ottieni le partite attive
   */
  static getActiveMatches(gameId?: number): Match[] {
    let query = `
      SELECT * FROM matches
      WHERE status IN ('pending', 'in_progress')
    `;

    if (gameId) {
      query += " AND game_id = ?";
      const stmt = db.prepare(query);
      return stmt.all(gameId) as Match[];
    }

    const stmt = db.prepare(query);
    return stmt.all() as Match[];
  }
}

export default MatchModel;
