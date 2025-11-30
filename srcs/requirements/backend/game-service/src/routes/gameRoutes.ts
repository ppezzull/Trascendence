import { FastifyInstance } from "fastify";
import { GameController } from "../controllers/GameController";
import { MatchController } from "../controllers/MatchController";
import { StatsController } from "../controllers/StatsController";
import { MatchmakingController } from "../controllers/MatchmakingController";
import { TournamentController } from "../controllers/TournamentController";

async function gameRoutes(fastify: FastifyInstance) {
  const gameController = new GameController();
  const matchController = new MatchController();
  const statsController = new StatsController();
  const matchmakingController = new MatchmakingController();
  const tournamentController = new TournamentController();

  // ==================== GAME ROUTES ====================

  fastify.get(
    "/games",
    {
      schema: {
        description: "Lista tutti i giochi disponibili",
        tags: ["Games"],
        summary: "Lista giochi",
        response: {
          200: {
            description: "Lista giochi",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                name: { type: "string" },
                display_name: { type: "string" },
                description: { type: "string" },
                max_players: { type: "number" },
                min_players: { type: "number" },
              },
            },
          },
        },
      },
    },
    gameController.listGames.bind(gameController)
  );

  fastify.get<{ Params: { gameId: string } }>(
    "/games/:gameId",
    {
      schema: {
        description: "Dettagli di un gioco",
        tags: ["Games"],
        params: {
          type: "object",
          properties: {
            gameId: { type: "string" },
          },
        },
      },
    },
    gameController.getGame.bind(gameController)
  );

  fastify.get<{ Params: { gameId: string } }>(
    "/games/:gameId/settings",
    {
      schema: {
        description: "Ottieni le impostazioni disponibili per un gioco",
        tags: ["Games"],
        params: {
          type: "object",
          properties: {
            gameId: { type: "string" },
          },
        },
      },
    },
    gameController.getGameSettings.bind(gameController)
  );

  // ==================== MATCH ROUTES ====================

  fastify.post<{
    Body: {
      game_id: number;
      player_ids: number[];
      settings?: Record<string, string>;
    };
  }>(
    "/matches",
    {
      schema: {
        description: "Crea una nuova partita",
        tags: ["Matches"],
        body: {
          type: "object",
          required: ["game_id", "player_ids"],
          properties: {
            game_id: { type: "number" },
            player_ids: { type: "array", items: { type: "number" } },
            settings: { type: "object" },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    matchController.createMatch.bind(matchController)
  );

  fastify.get<{ Params: { matchId: string } }>(
    "/matches/:matchId",
    {
      schema: {
        description: "Dettagli di una partita",
        tags: ["Matches"],
      },
      onRequest: [fastify.authenticate],
    },
    matchController.getMatch.bind(matchController)
  );

  fastify.post<{
    Params: { matchId: string };
    Body: { user_id: number; ready: boolean };
  }>(
    "/matches/:matchId/ready",
    {
      schema: {
        description: "Segna un giocatore come pronto",
        tags: ["Matches"],
        body: {
          type: "object",
          required: ["user_id", "ready"],
          properties: {
            user_id: { type: "number" },
            ready: { type: "boolean" },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    matchController.setPlayerReady.bind(matchController)
  );

  fastify.post<{
    Params: { matchId: string };
    Body: { user_id: number; score: number };
  }>(
    "/matches/:matchId/score",
    {
      schema: {
        description: "Aggiorna il punteggio di un giocatore",
        tags: ["Matches"],
        body: {
          type: "object",
          required: ["user_id", "score"],
          properties: {
            user_id: { type: "number" },
            score: { type: "number" },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    matchController.updateScore.bind(matchController)
  );

  fastify.post<{
    Params: { matchId: string };
    Body: { winner_id?: number };
  }>(
    "/matches/:matchId/finish",
    {
      schema: {
        description: "Termina una partita",
        tags: ["Matches"],
        body: {
          type: "object",
          properties: {
            winner_id: { type: "number" },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    matchController.finishMatch.bind(matchController)
  );

  fastify.post<{
    Params: { matchId: string };
  }>(
    "/matches/:matchId/cancel",
    {
      schema: {
        description: "Annulla una partita prima che inizi",
        tags: ["Matches"],
        params: {
          type: "object",
          properties: {
            matchId: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Partita annullata",
            type: "object",
            properties: {
              id: { type: "number" },
              status: { type: "string" },
              message: { type: "string" },
            },
          },
          400: {
            description: "Impossibile annullare la partita",
            type: "object",
            properties: {
              error: { type: "string" },
              details: { type: "string" },
            },
          },
          404: {
            description: "Partita non trovata",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    matchController.cancelMatch.bind(matchController)
  );

  fastify.get<{
    Params: { userId: string };
    Querystring: { game_id?: string; limit?: string };
  }>(
    "/users/:userId/matches",
    {
      schema: {
        description: "Storico partite di un utente",
        tags: ["Matches"],
      },
      onRequest: [fastify.authenticate],
    },
    matchController.getUserMatches.bind(matchController)
  );

  // ==================== STATS ROUTES ====================

  fastify.get<{ Params: { userId: string; gameId: string } }>(
    "/users/:userId/stats/:gameId",
    {
      schema: {
        description: "Statistiche utente per un gioco",
        tags: ["Stats"],
      },
      onRequest: [fastify.authenticate],
    },
    statsController.getUserGameStats.bind(statsController)
  );

  fastify.get<{ Params: { userId: string } }>(
    "/users/:userId/stats",
    {
      schema: {
        description: "Tutte le statistiche di un utente",
        tags: ["Stats"],
      },
      onRequest: [fastify.authenticate],
    },
    statsController.getAllUserStats.bind(statsController)
  );

  fastify.get<{
    Params: { gameId: string };
    Querystring: { limit?: string; offset?: string };
  }>(
    "/leaderboard/:gameId",
    {
      schema: {
        description: "Leaderboard di un gioco",
        tags: ["Stats"],
      },
    },
    statsController.getLeaderboard.bind(statsController)
  );

  fastify.get<{ Params: { userId: string; gameId: string } }>(
    "/users/:userId/rank/:gameId",
    {
      schema: {
        description: "Ranking di un utente",
        tags: ["Stats"],
      },
      onRequest: [fastify.authenticate],
    },
    statsController.getUserRank.bind(statsController)
  );

  // ==================== MATCHMAKING ROUTES ====================

  fastify.post<{ Body: { game_id: number } }>(
    "/matchmaking/join",
    {
      schema: {
        description: "Entra nella coda di matchmaking",
        tags: ["Matchmaking"],
        body: {
          type: "object",
          required: ["game_id"],
          properties: {
            game_id: { type: "number" },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    matchmakingController.joinQueue.bind(matchmakingController)
  );

  fastify.post<{ Body: { game_id?: number } }>(
    "/matchmaking/leave",
    {
      schema: {
        description: "Esci dalla coda di matchmaking",
        tags: ["Matchmaking"],
      },
      onRequest: [fastify.authenticate],
    },
    matchmakingController.leaveQueue.bind(matchmakingController)
  );

  fastify.post<{ Body: { game_id: number; elo_range?: number } }>(
    "/matchmaking/find",
    {
      schema: {
        description: "Cerca una partita",
        tags: ["Matchmaking"],
        body: {
          type: "object",
          required: ["game_id"],
          properties: {
            game_id: { type: "number" },
            elo_range: { type: "number" },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    matchmakingController.findMatch.bind(matchmakingController)
  );

  fastify.get<{ Params: { gameId: string } }>(
    "/matchmaking/queue/:gameId",
    {
      schema: {
        description: "Stato della coda matchmaking",
        tags: ["Matchmaking"],
      },
      onRequest: [fastify.authenticate],
    },
    matchmakingController.getQueueStatus.bind(matchmakingController)
  );

  // ==================== TOURNAMENT ROUTES ====================

  fastify.post<{
    Body: {
      name: string;
      game_id: number;
      max_players?: number;
      min_players?: number;
      tournament_type?: "single_elimination" | "double_elimination";
      settings?: Record<string, any>;
    };
  }>(
    "/tournaments",
    {
      schema: {
        description: "Crea un nuovo torneo",
        tags: ["Tournaments"],
        summary: "Crea torneo",
        body: {
          type: "object",
          required: ["name", "game_id"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 100 },
            game_id: { type: "number" },
            max_players: { type: "number", default: 8 },
            min_players: { type: "number", default: 2 },
            tournament_type: {
              type: "string",
              enum: ["single_elimination", "double_elimination"],
              default: "single_elimination",
            },
            settings: { type: "object" },
          },
        },
        response: {
          201: {
            description: "Torneo creato",
            type: "object",
            properties: {
              id: { type: "number" },
              name: { type: "string" },
              game_id: { type: "number" },
              status: { type: "string" },
              tournament_type: { type: "string" },
            },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    tournamentController.createTournament.bind(tournamentController)
  );

  fastify.get<{
    Querystring: {
      status?: string;
      game_id?: number;
      limit?: number;
      offset?: number;
    };
  }>(
    "/tournaments",
    {
      schema: {
        description: "Lista tutti i tornei",
        tags: ["Tournaments"],
        summary: "Lista tornei",
        querystring: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["registration", "in_progress", "completed", "cancelled"],
            },
            game_id: { type: "number" },
            limit: { type: "number", default: 50 },
            offset: { type: "number", default: 0 },
          },
        },
        response: {
          200: {
            description: "Lista tornei",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                name: { type: "string" },
                game_id: { type: "number" },
                status: { type: "string" },
                max_players: { type: "number" },
                created_at: { type: "string" },
              },
            },
          },
        },
      },
    },
    tournamentController.listTournaments.bind(tournamentController)
  );

  fastify.get<{ Params: { id: string } }>(
    "/tournaments/:id",
    {
      schema: {
        description: "Dettagli di un torneo",
        tags: ["Tournaments"],
        summary: "Dettagli torneo",
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Dettagli torneo",
            type: "object",
            properties: {
              id: { type: "number" },
              name: { type: "string" },
              game_id: { type: "number" },
              status: { type: "string" },
              tournament_type: { type: "string" },
              max_players: { type: "number" },
              winner_id: { type: "number" },
            },
          },
        },
      },
    },
    tournamentController.getTournament.bind(tournamentController)
  );

  fastify.post<{
    Params: { id: string };
    Body: { alias: string; user_id?: number };
  }>(
    "/tournaments/:id/register",
    {
      schema: {
        description: "Registra un giocatore al torneo",
        tags: ["Tournaments"],
        summary: "Registra giocatore",
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
        body: {
          type: "object",
          required: ["alias"],
          properties: {
            alias: { type: "string", minLength: 1, maxLength: 50 },
            user_id: { type: "number" },
          },
        },
        response: {
          201: {
            description: "Registrazione completata",
            type: "object",
            properties: {
              id: { type: "number" },
              tournament_id: { type: "number" },
              alias: { type: "string" },
              registered_at: { type: "string" },
            },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    tournamentController.registerPlayer.bind(tournamentController)
  );

  fastify.delete<{ Params: { id: string; registrationId: string } }>(
    "/tournaments/:id/register/:registrationId",
    {
      schema: {
        description: "Rimuove una registrazione dal torneo",
        tags: ["Tournaments"],
        summary: "Rimuovi registrazione",
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
            registrationId: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Registrazione rimossa",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    tournamentController.unregisterPlayer.bind(tournamentController)
  );

  fastify.get<{ Params: { id: string } }>(
    "/tournaments/:id/registrations",
    {
      schema: {
        description: "Lista le registrazioni di un torneo",
        tags: ["Tournaments"],
        summary: "Lista registrazioni",
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Lista registrazioni",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                tournament_id: { type: "number" },
                alias: { type: "string" },
                user_id: { type: "number" },
                seed: { type: "number" },
                eliminated: { type: "boolean" },
                registered_at: { type: "string" },
              },
            },
          },
        },
      },
    },
    tournamentController.getRegistrations.bind(tournamentController)
  );

  fastify.post<{ Params: { id: string } }>(
    "/tournaments/:id/start",
    {
      schema: {
        description: "Avvia un torneo e genera il bracket",
        tags: ["Tournaments"],
        summary: "Avvia torneo",
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Torneo avviato",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              bracket: { type: "object" },
            },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    tournamentController.startTournament.bind(tournamentController)
  );

  fastify.get<{ Params: { id: string } }>(
    "/tournaments/:id/bracket",
    {
      schema: {
        description: "Ottiene il bracket completo di un torneo",
        tags: ["Tournaments"],
        summary: "Bracket torneo",
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Bracket del torneo",
            type: "object",
            properties: {
              tournament: { type: "object" },
              registrations: { type: "array" },
              matches: { type: "array" },
              current_round: { type: "number" },
              next_matches: { type: "array" },
            },
          },
        },
      },
    },
    tournamentController.getBracket.bind(tournamentController)
  );

  fastify.get<{ Params: { id: string } }>(
    "/tournaments/:id/next-matches",
    {
      schema: {
        description: "Ottiene i prossimi match da giocare nel torneo",
        tags: ["Tournaments"],
        summary: "Prossimi match",
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Prossimi match",
            type: "object",
            properties: {
              tournament_id: { type: "number" },
              next_matches: { type: "array" },
            },
          },
        },
      },
    },
    tournamentController.getNextMatches.bind(tournamentController)
  );

  fastify.get<{ Params: { id: string } }>(
    "/tournaments/:id/stats",
    {
      schema: {
        description: "Ottiene le statistiche di un torneo",
        tags: ["Tournaments"],
        summary: "Statistiche torneo",
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Statistiche torneo",
            type: "object",
            properties: {
              total_players: { type: "number" },
              total_matches: { type: "number" },
              completed_matches: { type: "number" },
              current_round: { type: "number" },
              total_rounds: { type: "number" },
            },
          },
        },
      },
    },
    tournamentController.getTournamentStats.bind(tournamentController)
  );

  fastify.post<{ Params: { id: string } }>(
    "/tournaments/:id/cancel",
    {
      schema: {
        description: "Cancella un torneo",
        tags: ["Tournaments"],
        summary: "Cancella torneo",
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Torneo cancellato",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    tournamentController.cancelTournament.bind(tournamentController)
  );

  fastify.post<{ Params: { id: string; matchId: string } }>(
    "/tournaments/:id/matches/:matchId/complete",
    {
      schema: {
        description:
          "Callback interno quando un match del torneo viene completato (aggiorna progressione)",
        tags: ["Tournaments"],
        summary: "Match completato",
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
            matchId: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Progressione torneo aggiornata",
            type: "object",
            properties: {
              success: { type: "boolean" },
              tournament_status: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
      onRequest: [fastify.authenticate],
    },
    tournamentController.onMatchCompleted.bind(tournamentController)
  );
}

export default gameRoutes;
