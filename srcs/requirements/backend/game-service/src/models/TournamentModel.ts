import Database from "better-sqlite3";
import db from "../database/connection";

export interface Tournament {
  id: number;
  name: string;
  game_id: number;
  max_players: number;
  min_players: number;
  tournament_type: "single_elimination" | "double_elimination";
  status: "registration" | "in_progress" | "completed" | "cancelled";
  winner_id: number | null;
  created_by: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  settings: string | null;
}

export interface TournamentRegistration {
  id: number;
  tournament_id: number;
  user_id: number | null;
  alias: string;
  seed: number | null;
  eliminated: boolean;
  final_position: number | null;
  registered_at: string;
}

export interface TournamentMatch {
  id: number;
  tournament_id: number;
  match_id: number;
  round: number;
  match_number: number;
  bracket_type: "winners" | "losers";
  next_match_id: number | null;
  loser_next_match_id: number | null;
  created_at: string;
}

export interface TournamentBracket {
  tournament: Tournament;
  registrations: TournamentRegistration[];
  matches: (TournamentMatch & {
    match_data: any; // dati del match dalla tabella matches
  })[];
  current_round: number;
  next_matches: number[];
}

export class TournamentModel {
  private static db: Database.Database = db;

  /**
   * Crea un nuovo torneo
   */
  static create(data: {
    name: string;
    game_id: number;
    max_players?: number;
    min_players?: number;
    tournament_type?: "single_elimination" | "double_elimination";
    created_by?: number;
    settings?: Record<string, any>;
  }): Tournament {
    const stmt = this.db.prepare(`
      INSERT INTO tournaments (name, game_id, max_players, min_players, tournament_type, created_by, settings)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.name,
      data.game_id,
      data.max_players || 8,
      data.min_players || 2,
      data.tournament_type || "single_elimination",
      data.created_by || null,
      data.settings ? JSON.stringify(data.settings) : null
    );

    return this.getById(result.lastInsertRowid as number) as Tournament;
  }

  /**
   * Ottiene un torneo per ID
   */
  static getById(id: number): Tournament | null {
    const stmt = this.db.prepare("SELECT * FROM tournaments WHERE id = ?");
    return stmt.get(id) as Tournament | null;
  }

  /**
   * Lista tutti i tornei con filtri opzionali
   */
  static list(filters?: {
    status?: string;
    game_id?: number;
    limit?: number;
    offset?: number;
  }): Tournament[] {
    let query = "SELECT * FROM tournaments WHERE 1=1";
    const params: any[] = [];

    if (filters?.status) {
      query += " AND status = ?";
      params.push(filters.status);
    }

    if (filters?.game_id) {
      query += " AND game_id = ?";
      params.push(filters.game_id);
    }

    query += " ORDER BY created_at DESC";

    if (filters?.limit) {
      query += " LIMIT ?";
      params.push(filters.limit);
      if (filters.offset) {
        query += " OFFSET ?";
        params.push(filters.offset);
      }
    }

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as Tournament[];
  }

  /**
   * Registra un giocatore al torneo
   */
  static registerPlayer(
    tournamentId: number,
    alias: string,
    userId?: number
  ): TournamentRegistration {
    const tournament = this.getById(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    if (tournament.status !== "registration") {
      throw new Error("Tournament registration is closed");
    }

    // Verifica se il torneo è pieno
    const currentPlayers = this.getRegistrations(tournamentId);
    if (currentPlayers.length >= tournament.max_players) {
      throw new Error("Tournament is full");
    }

    const stmt = this.db.prepare(`
      INSERT INTO tournament_registrations (tournament_id, user_id, alias)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(tournamentId, userId || null, alias);
    return this.getRegistrationById(
      result.lastInsertRowid as number
    ) as TournamentRegistration;
  }

  /**
   * Ottiene una registrazione per ID
   */
  static getRegistrationById(id: number): TournamentRegistration | null {
    const stmt = this.db.prepare(
      "SELECT * FROM tournament_registrations WHERE id = ?"
    );
    return stmt.get(id) as TournamentRegistration | null;
  }

  /**
   * Ottiene tutte le registrazioni di un torneo
   */
  static getRegistrations(tournamentId: number): TournamentRegistration[] {
    const stmt = this.db.prepare(`
      SELECT * FROM tournament_registrations 
      WHERE tournament_id = ? 
      ORDER BY registered_at ASC
    `);
    return stmt.all(tournamentId) as TournamentRegistration[];
  }

  /**
   * Rimuove una registrazione (solo se il torneo è ancora in registrazione)
   */
  static unregisterPlayer(tournamentId: number, registrationId: number): void {
    const tournament = this.getById(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    if (tournament.status !== "registration") {
      throw new Error("Cannot unregister after tournament has started");
    }

    const stmt = this.db.prepare(
      "DELETE FROM tournament_registrations WHERE id = ? AND tournament_id = ?"
    );
    const result = stmt.run(registrationId, tournamentId);

    if (result.changes === 0) {
      throw new Error("Registration not found");
    }
  }

  /**
   * Avvia un torneo generando il bracket
   */
  static startTournament(tournamentId: number): TournamentBracket {
    const tournament = this.getById(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    if (tournament.status !== "registration") {
      throw new Error("Tournament is not in registration phase");
    }

    const registrations = this.getRegistrations(tournamentId);
    if (registrations.length < tournament.min_players) {
      throw new Error(
        `Not enough players. Minimum ${tournament.min_players}, got ${registrations.length}`
      );
    }

    // Assegna i seed ai giocatori
    this.assignSeeds(tournamentId, registrations);

    // Genera il bracket in base al tipo di torneo
    if (tournament.tournament_type === "single_elimination") {
      this.generateSingleEliminationBracket(tournamentId, registrations);
    } else {
      this.generateDoubleEliminationBracket(tournamentId, registrations);
    }

    // Aggiorna lo stato del torneo
    const stmt = this.db.prepare(`
      UPDATE tournaments 
      SET status = 'in_progress', started_at = datetime('now') 
      WHERE id = ?
    `);
    stmt.run(tournamentId);

    return this.getBracket(tournamentId);
  }

  /**
   * Assegna i seed ai giocatori (ordine di registrazione)
   */
  private static assignSeeds(
    tournamentId: number,
    registrations: TournamentRegistration[]
  ): void {
    const stmt = this.db.prepare(
      "UPDATE tournament_registrations SET seed = ? WHERE id = ?"
    );

    registrations.forEach((reg, index) => {
      stmt.run(index + 1, reg.id);
    });
  }

  /**
   * Genera bracket per eliminazione singola
   */
  private static generateSingleEliminationBracket(
    tournamentId: number,
    registrations: TournamentRegistration[]
  ): void {
    const tournament = this.getById(tournamentId)!;
    const numPlayers = registrations.length;

    // Calcola il numero di round necessari
    const totalRounds = Math.ceil(Math.log2(numPlayers));

    // Calcola quanti giocatori devono avere un bye nel primo round
    const nextPowerOf2 = Math.pow(2, totalRounds);
    const firstRoundMatches = numPlayers - (nextPowerOf2 - numPlayers);
    const playersWithBye = numPlayers - firstRoundMatches * 2;

    const matchStmt = this.db.prepare(`
      INSERT INTO matches (game_id, status, settings)
      VALUES (?, 'scheduled', ?)
    `);

    const tournamentMatchStmt = this.db.prepare(`
      INSERT INTO tournament_matches (tournament_id, match_id, round, match_number, bracket_type)
      VALUES (?, ?, ?, ?, 'winners')
    `);

    const playerStmt = this.db.prepare(`
      INSERT INTO match_players (match_id, user_id, position)
      VALUES (?, ?, ?)
    `);

    // Primo round: crea i match tra i giocatori senza bye
    let matchNumber = 1;
    for (let i = 0; i < firstRoundMatches; i++) {
      const matchResult = matchStmt.run(
        tournament.game_id,
        tournament.settings || null
      );
      const matchId = matchResult.lastInsertRowid as number;

      tournamentMatchStmt.run(tournamentId, matchId, 1, matchNumber);

      // Assegna i giocatori al match
      const player1Idx = i * 2;
      const player2Idx = i * 2 + 1;

      if (registrations[player1Idx]?.user_id) {
        playerStmt.run(matchId, registrations[player1Idx].user_id, 1);
      }
      if (registrations[player2Idx]?.user_id) {
        playerStmt.run(matchId, registrations[player2Idx].user_id, 2);
      }

      matchNumber++;
    }

    // I giocatori con bye passano automaticamente al secondo round
    // (questo verrà gestito quando si creeranno i match del round successivo)
  }

  /**
   * Genera bracket per doppia eliminazione (implementazione base)
   */
  private static generateDoubleEliminationBracket(
    tournamentId: number,
    registrations: TournamentRegistration[]
  ): void {
    // Per ora implementiamo una versione semplificata
    // che crea solo il bracket winners iniziale
    this.generateSingleEliminationBracket(tournamentId, registrations);

    // TODO: Implementare il bracket losers completo
  }

  /**
   * Ottiene il bracket completo di un torneo
   */
  static getBracket(tournamentId: number): TournamentBracket {
    const tournament = this.getById(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const registrations = this.getRegistrations(tournamentId);

    const matchesStmt = this.db.prepare(`
      SELECT tm.*, m.*
      FROM tournament_matches tm
      JOIN matches m ON tm.match_id = m.id
      WHERE tm.tournament_id = ?
      ORDER BY tm.round, tm.match_number
    `);

    const matches = matchesStmt.all(tournamentId) as any[];

    // Calcola il round corrente e i prossimi match
    const currentRound = this.getCurrentRound(tournamentId);
    const nextMatches = this.getNextMatches(tournamentId);

    return {
      tournament,
      registrations,
      matches: matches.map((m) => ({
        id: m.id,
        tournament_id: m.tournament_id,
        match_id: m.match_id,
        round: m.round,
        match_number: m.match_number,
        bracket_type: m.bracket_type,
        next_match_id: m.next_match_id,
        loser_next_match_id: m.loser_next_match_id,
        created_at: m.created_at,
        match_data: {
          id: m.match_id,
          game_id: m.game_id,
          status: m.status,
          winner_id: m.winner_id,
          started_at: m.started_at,
          completed_at: m.completed_at,
        },
      })),
      current_round: currentRound,
      next_matches: nextMatches,
    };
  }

  /**
   * Calcola il round corrente del torneo
   */
  private static getCurrentRound(tournamentId: number): number {
    const stmt = this.db.prepare(`
      SELECT MIN(tm.round) as current_round
      FROM tournament_matches tm
      JOIN matches m ON tm.match_id = m.id
      WHERE tm.tournament_id = ? AND m.status IN ('scheduled', 'in_progress')
    `);

    const result = stmt.get(tournamentId) as { current_round: number | null };
    return result.current_round || 1;
  }

  /**
   * Ottiene gli ID dei prossimi match da giocare
   */
  static getNextMatches(tournamentId: number): number[] {
    const stmt = this.db.prepare(`
      SELECT tm.match_id
      FROM tournament_matches tm
      JOIN matches m ON tm.match_id = m.id
      WHERE tm.tournament_id = ? AND m.status = 'scheduled'
      ORDER BY tm.round, tm.match_number
      LIMIT 5
    `);

    const results = stmt.all(tournamentId) as { match_id: number }[];
    return results.map((r) => r.match_id);
  }

  /**
   * Aggiorna lo stato del torneo dopo il completamento di un match
   */
  static updateTournamentProgress(tournamentId: number, matchId: number): void {
    const tournament = this.getById(tournamentId);
    if (!tournament || tournament.status !== "in_progress") {
      return;
    }

    // Verifica se tutti i match sono completati
    const incompleteStmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM tournament_matches tm
      JOIN matches m ON tm.match_id = m.id
      WHERE tm.tournament_id = ? AND m.status != 'completed'
    `);

    const result = incompleteStmt.get(tournamentId) as { count: number };

    if (result.count === 0) {
      // Torneo completato, trova il vincitore
      const winnerStmt = this.db.prepare(`
        SELECT m.winner_id
        FROM tournament_matches tm
        JOIN matches m ON tm.match_id = m.id
        WHERE tm.tournament_id = ?
        ORDER BY tm.round DESC, tm.match_number DESC
        LIMIT 1
      `);

      const winner = winnerStmt.get(tournamentId) as {
        winner_id: number | null;
      };

      const updateStmt = this.db.prepare(`
        UPDATE tournaments 
        SET status = 'completed', 
            completed_at = datetime('now'),
            winner_id = ?
        WHERE id = ?
      `);

      updateStmt.run(winner?.winner_id || null, tournamentId);

      // Aggiorna le posizioni finali dei giocatori
      this.updateFinalPositions(tournamentId);
    }
  }

  /**
   * Calcola e aggiorna le posizioni finali dei giocatori
   */
  private static updateFinalPositions(tournamentId: number): void {
    // TODO: Implementare logica per calcolare le posizioni finali
    // basandosi sui round in cui ogni giocatore è stato eliminato
  }

  /**
   * Cancella un torneo (solo se non è ancora iniziato)
   */
  static cancelTournament(tournamentId: number): void {
    const tournament = this.getById(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    if (tournament.status === "completed") {
      throw new Error("Cannot cancel completed tournament");
    }

    const stmt = this.db.prepare(`
      UPDATE tournaments 
      SET status = 'cancelled', completed_at = datetime('now')
      WHERE id = ?
    `);

    stmt.run(tournamentId);
  }

  /**
   * Ottiene le statistiche di un torneo
   */
  static getStats(tournamentId: number): {
    total_players: number;
    total_matches: number;
    completed_matches: number;
    current_round: number;
    total_rounds: number;
  } {
    const tournament = this.getById(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const registrations = this.getRegistrations(tournamentId);
    const totalPlayers = registrations.length;
    const totalRounds = Math.ceil(Math.log2(totalPlayers));

    const matchStatsStmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total_matches,
        SUM(CASE WHEN m.status = 'completed' THEN 1 ELSE 0 END) as completed_matches,
        MAX(tm.round) as max_round
      FROM tournament_matches tm
      JOIN matches m ON tm.match_id = m.id
      WHERE tm.tournament_id = ?
    `);

    const stats = matchStatsStmt.get(tournamentId) as any;

    return {
      total_players: totalPlayers,
      total_matches: stats.total_matches || 0,
      completed_matches: stats.completed_matches || 0,
      current_round: this.getCurrentRound(tournamentId),
      total_rounds: totalRounds,
    };
  }
}
