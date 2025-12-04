import Database from "better-sqlite3";
import db from "../database/connection";
import jwt from "jsonwebtoken";

// Funzione di utilità per inviare messaggi al chat-service
async function sendTournamentMatchMessage(
  player1Id: number,
  player2Id: number,
  tournamentName: string,
  matchId: number
): Promise<void> {
  try {
    // Prepara il messaggio per il chat-service
    const messageContent = `Sei stato associato con un altro giocatore per il torneo "${tournamentName}". Partita ID: ${matchId}. Buona fortuna!`;

    console.log("messageContent", messageContent);

    // URL del chat-service dalle variabili d'ambiente
    const chatServiceUrl =
      process.env.CHAT_SERVICE_URL || "http://localhost:3002";

    // Crea un token JWT per la comunicazione server-to-server
    // Usiamo un payload speciale che identifica questa come una comunicazione di sistema
    const systemToken = jwt.sign(
      {
        userId: 0, // ID 0 per identificare il sistema
        system: true, // Flag per identificare che è una comunicazione di sistema
        service: "game-service", // Identifica il servizio mittente
      },
      process.env.JWT_SECRET || "supersecret",
      { expiresIn: "5m" } // Token di breve durata per sicurezza
    );

    // Funzione helper per inviare un messaggio a un giocatore specifico
    const sendMessageToPlayer = async (
      playerId: number,
      otherPlayerId: number
    ) => {
      // Crea un thread DM tra il sistema e il giocatore
      const threadResponse = await fetch(
        `${chatServiceUrl}/api/chat/threads/dm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${systemToken}`,
          },
          body: JSON.stringify({
            otherUserId: playerId,
          }),
        }
      );

      console.log(`threadResponse per giocatore ${playerId}:`, threadResponse);

      if (!threadResponse.ok) {
        console.error(
          `Errore nella creazione del thread DM per il giocatore ${playerId}:`,
          threadResponse.statusText
        );
        return;
      }

      const threadData = await threadResponse.json();
      const threadId = threadData.id;

      // Personalizza il messaggio per il giocatore
      const personalizedMessage = `Sei stato associato con il giocatore ${otherPlayerId} per il torneo "${tournamentName}". Partita ID: ${matchId}. Buona fortuna!`;

      // Invia il messaggio nel thread
      const messageResponse = await fetch(
        `${chatServiceUrl}/api/chat/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${systemToken}`,
          },
          body: JSON.stringify({
            threadId: threadId,
            content: personalizedMessage,
          }),
        }
      );

      if (!messageResponse.ok) {
        console.error(
          `Errore nell'invio del messaggio al giocatore ${playerId}:`,
          messageResponse.statusText
        );
        return;
      }

      console.log(
        `Messaggio di torneo inviato con successo al giocatore ${playerId}`
      );
    };

    // Invia il messaggio a entrambi i giocatori in parallelo
    await Promise.all([
      sendMessageToPlayer(player1Id, player2Id),
      sendMessageToPlayer(player2Id, player1Id),
    ]);

    console.log(
      `Messaggi di torneo inviati con successo ai giocatori ${player1Id} e ${player2Id}`
    );
  } catch (error) {
    console.error("Errore nell'invio dei messaggi di torneo:", error);
  }
}

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
    players?: Array<{ alias: string; user_id?: number }>;
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

    const tournamentId = result.lastInsertRowid as number;

    // Se sono forniti i giocatori, registrali e crea il bracket
    if (data.players && data.players.length > 0) {
      // Registra i giocatori
      const registrations: TournamentRegistration[] = [];
      for (const player of data.players) {
        const registration = this.registerPlayer(
          tournamentId,
          player.alias,
          player.user_id
        );
        registrations.push(registration);
      }

      // Crea il bracket completo
      this.createCompleteBracket(tournamentId, registrations);
    }

    return this.getById(tournamentId) as Tournament;
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
      throw new Error("Tournament is not in registration phase");
    }

    // Verifica che il torneo non sia pieno
    const currentRegistrations = this.getRegistrations(tournamentId);
    if (currentRegistrations.length >= tournament.max_players) {
      throw new Error("Tournament is full");
    }

    // Verifica che l'utente non sia già registrato
    if (userId) {
      const existingUser = currentRegistrations.find(
        (reg) => reg.user_id === userId
      );
      if (existingUser) {
        throw new Error("User already registered");
      }
    }

    // Verifica che l'alias non sia già in uso
    const existingAlias = currentRegistrations.find(
      (reg) => reg.alias === alias
    );
    if (existingAlias) {
      throw new Error("Alias already in use");
    }

    const stmt = this.db.prepare(`
      INSERT INTO tournament_registrations (tournament_id, user_id, alias)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(tournamentId, userId || null, alias);
    return {
      id: result.lastInsertRowid as number,
      tournament_id: tournamentId,
      user_id: userId || null,
      alias,
      seed: null,
      eliminated: false,
      final_position: null,
      registered_at: new Date().toISOString(),
    };
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
   * Avvia un torneo
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

    // Se il bracket non è stato creato durante la creazione del torneo, crealo ora
    // Questo è per compatibilità con i tornei creati prima della modifica
    const bracketExists = this.db
      .prepare(
        `
      SELECT COUNT(*) as count FROM tournament_matches WHERE tournament_id = ?
    `
      )
      .get(tournamentId) as { count: number };

    if (bracketExists.count === 0) {
      this.createCompleteBracket(tournamentId, registrations);
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
      INSERT INTO matches (game_id, status)
      VALUES (?, 'in_progress')
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
      const matchResult = matchStmt.run(tournament.game_id);
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
   * Crea il bracket completo del torneo
   */
  private static createCompleteBracket(
    tournamentId: number,
    registrations: TournamentRegistration[]
  ): void {
    const tournament = this.getById(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Assegna i seed ai giocatori
    this.assignSeeds(tournamentId, registrations);

    // Genera il bracket in base al tipo di torneo
    if (tournament.tournament_type === "single_elimination") {
      this.createCompleteSingleEliminationBracket(tournamentId, registrations);
    } else {
      this.createCompleteDoubleEliminationBracket(tournamentId, registrations);
    }
  }

  /**
   * Crea il bracket completo per eliminazione singola
   */
  private static createCompleteSingleEliminationBracket(
    tournamentId: number,
    registrations: TournamentRegistration[]
  ): void {
    const tournament = this.getById(tournamentId)!;
    const numPlayers = registrations.length;

    // Usa il numero effettivo di giocatori per calcolare il bracket
    // Se il numero di giocatori non è una potenza di 2, alcuni avranno un bye
    const totalRounds = Math.ceil(Math.log2(numPlayers));

    // Calcola quanti giocatori devono avere un bye nel primo round
    const nextPowerOf2 = Math.pow(2, totalRounds);
    const firstRoundMatches = Math.floor(numPlayers / 2);
    const playersWithBye = numPlayers % 2;

    // Crea tutti i match del torneo
    const matchStmt = this.db.prepare(`
      INSERT INTO matches (game_id, status)
      VALUES (?, 'pending')
    `);

    const tournamentMatchStmt = this.db.prepare(`
      INSERT INTO tournament_matches (tournament_id, match_id, round, match_number, bracket_type)
      VALUES (?, ?, ?, ?, 'winners')
    `);

    // Mappa per tenere traccia dei match creati e dei loro ID
    const matchMap: Map<string, number> = new Map();

    // Crea i match del primo round
    let matchNumber = 1;
    let playerIndex = 0;

    // Crea i match del primo round con i giocatori disponibili
    while (playerIndex < numPlayers - 1) {
      const matchResult = matchStmt.run(tournament.game_id);
      const matchId = matchResult.lastInsertRowid as number;

      tournamentMatchStmt.run(tournamentId, matchId, 1, matchNumber);
      matchMap.set(`1-${matchNumber}`, matchId);

      // Assegna i giocatori al match
      if (
        registrations[playerIndex]?.user_id !== null &&
        registrations[playerIndex]?.user_id !== undefined
      ) {
        this.addPlayerToMatch(
          matchId,
          registrations[playerIndex].user_id!,
          1,
          true
        );
      }
      if (
        registrations[playerIndex + 1]?.user_id !== null &&
        registrations[playerIndex + 1]?.user_id !== undefined
      ) {
        this.addPlayerToMatch(
          matchId,
          registrations[playerIndex + 1].user_id!,
          2,
          true
        );
      }

      playerIndex += 2;
      matchNumber++;
    }

    // Se c'è un giocatore rimasto (numero dispare di giocatori), avrà un bye
    if (playerIndex < numPlayers) {
      // Questo giocatore passerà direttamente al secondo round
      // Lo gestiremo quando creeremo i match del secondo round
    }

    // Calcola il numero di giocatori che parteciperanno al secondo round
    // (metà dei giocatori del primo round + eventuali bye)
    let playersInCurrentRound = Math.floor(numPlayers / 2) + (numPlayers % 2);
    let currentRound = 2;

    // Crea i match per i round successivi
    while (playersInCurrentRound > 1) {
      const matchesInCurrentRound = Math.floor(playersInCurrentRound / 2);

      for (let i = 1; i <= matchesInCurrentRound; i++) {
        const matchResult = matchStmt.run(tournament.game_id);
        const matchId = matchResult.lastInsertRowid as number;

        tournamentMatchStmt.run(tournamentId, matchId, currentRound, i);
        matchMap.set(`${currentRound}-${i}`, matchId);
      }

      // Aggiorna i next_match_id dei match del round precedente
      if (currentRound > 1) {
        const prevRoundMatches =
          currentRound === 2
            ? Math.floor(numPlayers / 2) // Round 1
            : Math.floor((Math.floor(numPlayers / 2) + (numPlayers % 2)) / 2); // Round 2

        for (let i = 1; i <= prevRoundMatches; i++) {
          const prevMatchId = matchMap.get(`${currentRound - 1}-${i}`);
          const nextMatchId = matchMap.get(
            `${currentRound}-${Math.ceil(i / 2)}`
          );

          if (prevMatchId && nextMatchId) {
            const updateStmt = this.db.prepare(`
              UPDATE tournament_matches 
              SET next_match_id = ?
              WHERE match_id = ?
            `);
            updateStmt.run(nextMatchId, prevMatchId);
          }
        }

        // Se c'è un giocatore con bye nel primo round, assegnalo al primo match del secondo round
        if (currentRound === 2 && numPlayers % 2 === 1) {
          const firstMatchSecondRound = matchMap.get(`2-1`);
          if (
            firstMatchSecondRound &&
            registrations[numPlayers - 1]?.user_id !== null &&
            registrations[numPlayers - 1]?.user_id !== undefined
          ) {
            this.addPlayerToMatch(
              firstMatchSecondRound,
              registrations[numPlayers - 1].user_id!,
              1,
              true
            );
          }
        }
      }

      playersInCurrentRound =
        matchesInCurrentRound + (playersInCurrentRound % 2);
      currentRound++;
    }
  }

  /**
   * Aggiunge un giocatore a un match
   */
  private static addPlayerToMatch(
    matchId: number,
    userId: number,
    position: number,
    sendNotification: boolean = true
  ): void {
    console.log(
      `addPlayerToMatch: Called with matchId=${matchId}, userId=${userId}, position=${position}, sendNotification=${sendNotification}`
    );

    const playerStmt = db.prepare(`
      INSERT INTO match_players (match_id, user_id, position)
      VALUES (?, ?, ?)
    `);
    playerStmt.run(matchId, userId, position);

    console.log(`addPlayerToMatch: Player added to match successfully`);

    // Verifica se ora ci sono due giocatori nel match
    const playersCountStmt = db.prepare(`
      SELECT COUNT(*) as count, GROUP_CONCAT(user_id) as player_ids
      FROM match_players 
      WHERE match_id = ?
    `);
    const playersResult = playersCountStmt.get(matchId) as {
      count: number;
      player_ids: string;
    };

    console.log(
      `addPlayerToMatch: Players in match: count=${playersResult.count}, ids=${playersResult.player_ids}`
    );

    // Se ci sono esattamente due giocatori e sendNotification è true, invia un messaggio di notifica
    if (playersResult.count === 2 && sendNotification) {
      console.log(
        `addPlayerToMatch: Sending notification for match with 2 players`
      );
      const playerIds = playersResult.player_ids
        .split(",")
        .map((id) => parseInt(id));
      const [player1Id, player2Id] = playerIds;

      // Ottieni informazioni sul torneo e sul match
      const tournamentMatchStmt = db.prepare(`
        SELECT tm.tournament_id, t.name as tournament_name
        FROM tournament_matches tm
        JOIN tournaments t ON tm.tournament_id = t.id
        WHERE tm.match_id = ?
      `);
      const tournamentInfo = tournamentMatchStmt.get(matchId) as {
        tournament_id: number;
        tournament_name: string;
      };

      if (tournamentInfo) {
        console.log(
          `addPlayerToMatch: Tournament info found: ${tournamentInfo.tournament_name}`
        );
        // Invia il messaggio in modo asincrono senza bloccare il flusso principale
        sendTournamentMatchMessage(
          player1Id,
          player2Id,
          tournamentInfo.tournament_name,
          matchId
        ).catch((error) => {
          console.error("Errore nell'invio del messaggio di torneo:", error);
        });
      } else {
        console.log(
          `addPlayerToMatch: No tournament info found for match ${matchId}`
        );
      }
    } else if (playersResult.count === 2 && !sendNotification) {
      // Se ci sono due giocatori ma sendNotification è false, invia comunque una notifica
      // perché potrebbe essere un vincitore che viene aggiunto a una partita successiva
      console.log(
        `addPlayerToMatch: Sending notification for tournament match with 2 players (sendNotification=false)`
      );
      const playerIds = playersResult.player_ids
        .split(",")
        .map((id) => parseInt(id));
      const [player1Id, player2Id] = playerIds;

      // Ottieni informazioni sul torneo e sul match
      const tournamentMatchStmt = db.prepare(`
        SELECT tm.tournament_id, t.name as tournament_name
        FROM tournament_matches tm
        JOIN tournaments t ON tm.tournament_id = t.id
        WHERE tm.match_id = ?
      `);
      const tournamentInfo = tournamentMatchStmt.get(matchId) as {
        tournament_id: number;
        tournament_name: string;
      };

      if (tournamentInfo) {
        console.log(
          `addPlayerToMatch: Tournament info found: ${tournamentInfo.tournament_name}`
        );
        // Invia il messaggio in modo asincrono senza bloccare il flusso principale
        sendTournamentMatchMessage(
          player1Id,
          player2Id,
          tournamentInfo.tournament_name,
          matchId
        ).catch((error) => {
          console.error("Errore nell'invio del messaggio di torneo:", error);
        });
      } else {
        console.log(
          `addPlayerToMatch: No tournament info found for match ${matchId}`
        );
      }
    } else {
      console.log(
        `addPlayerToMatch: Not sending notification. Players count: ${playersResult.count}, sendNotification: ${sendNotification}`
      );
    }
  }

  /**
   * Crea il bracket completo per eliminazione doppia
   */
  private static createCompleteDoubleEliminationBracket(
    tournamentId: number,
    registrations: TournamentRegistration[]
  ): void {
    // Per ora implementiamo una versione semplificata
    // che crea solo il bracket winners iniziale
    this.createCompleteSingleEliminationBracket(tournamentId, registrations);

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
      WHERE tm.tournament_id = ? AND m.status IN ('pending', 'in_progress')
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
      WHERE tm.tournament_id = ? AND m.status = 'pending'
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
    console.log(
      `updateTournamentProgress: Called with tournamentId=${tournamentId}, matchId=${matchId}`
    );

    const tournament = this.getById(tournamentId);
    if (!tournament || tournament.status !== "in_progress") {
      console.log(
        `updateTournamentProgress: Tournament not found or not in progress. Status: ${tournament?.status}`
      );
      return;
    }

    // Ottieni i dettagli del match completato
    const matchStmt = this.db.prepare(`
      SELECT * FROM matches WHERE id = ?
    `);
    const match = matchStmt.get(matchId) as any;

    console.log(`updateTournamentProgress: Match details:`, match);

    // Modifica: controlla se lo stato è 'finished' invece di 'completed'
    if (!match || match.status !== "finished" || !match.winner_id) {
      console.log(
        `updateTournamentProgress: Match not finished or no winner. Status: ${match?.status}, Winner: ${match?.winner_id}`
      );
      return;
    }

    // Ottieni i dettagli del match nel torneo
    const tournamentMatchStmt = this.db.prepare(`
      SELECT * FROM tournament_matches WHERE match_id = ?
    `);
    const tournamentMatch = tournamentMatchStmt.get(matchId) as any;

    console.log(
      `updateTournamentProgress: Tournament match details:`,
      tournamentMatch
    );

    if (!tournamentMatch || !tournamentMatch.next_match_id) {
      console.log(
        `updateTournamentProgress: No tournament match or no next match. Next match ID: ${tournamentMatch?.next_match_id}`
      );
      return;
    }

    // Aggiungi il vincitore al match successivo
    const nextMatchStmt = this.db.prepare(`
      SELECT * FROM tournament_matches WHERE id = ?
    `);
    const nextTournamentMatch = nextMatchStmt.get(
      tournamentMatch.next_match_id
    ) as any;

    console.log(
      `updateTournamentProgress: Next tournament match details:`,
      nextTournamentMatch
    );

    if (!nextTournamentMatch) {
      console.log(
        `updateTournamentProgress: Next tournament match not found with ID ${tournamentMatch.next_match_id}`
      );
      return;
    }

    // Determina la posizione del vincitore nel match successivo
    // Controlla quanti giocatori sono già stati assegnati a quel match
    const playersCountStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM match_players WHERE match_id = ?
    `);
    const playersCount = playersCountStmt.get(nextTournamentMatch.match_id) as {
      count: number;
    };

    console.log(
      `updateTournamentProgress: Players count in next match: ${playersCount.count}`
    );

    const position = playersCount.count + 1;

    console.log(
      `updateTournamentProgress: Adding winner ${match.winner_id} to next match ${nextTournamentMatch.match_id} at position ${position}`
    );

    // Aggiungi il vincitore al match successivo
    this.addPlayerToMatch(
      nextTournamentMatch.match_id,
      match.winner_id,
      position,
      true // Non inviare notifica quando si aggiunge un vincitore a un match esistente
    );

    console.log(
      `updateTournamentProgress: Winner added to next match successfully`
    );

    // Verifica se tutti i match sono completati
    // Modifica: controlla se lo stato è 'finished' invece di 'completed'
    const incompleteStmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM tournament_matches tm
      JOIN matches m ON tm.match_id = m.id
      WHERE tm.tournament_id = ? AND m.status != 'finished'
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
        SUM(CASE WHEN m.status = 'finished' THEN 1 ELSE 0 END) as completed_matches,
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
