import { FastifyInstance } from "fastify";
import { TournamentController } from "../controllers/TournamentController";

export default async function tournamentRoutes(fastify: FastifyInstance) {
  const tournamentController = new TournamentController();

  // POST /tournaments - Crea un nuovo torneo
  fastify.post(
    "/tournaments",
    tournamentController.createTournament.bind(tournamentController)
  );

  // GET /tournaments - Lista tutti i tornei
  fastify.get(
    "/tournaments",
    tournamentController.listTournaments.bind(tournamentController)
  );

  // GET /tournaments/:id - Ottiene i dettagli di un torneo
  fastify.get(
    "/tournaments/:id",
    tournamentController.getTournament.bind(tournamentController)
  );

  // POST /tournaments/:id/register - Registra un giocatore al torneo
  fastify.post<{
    Params: { id: string };
    Body: { alias: string; user_id?: number };
  }>(
    "/tournaments/:id/register",
    {
      preHandler: [fastify.authenticate],
    },
    tournamentController.registerPlayer.bind(tournamentController)
  );

  // DELETE /tournaments/:id/register/:registrationId - Rimuove una registrazione
  fastify.delete<{ Params: { id: string; registrationId: string } }>(
    "/tournaments/:id/register/:registrationId",
    {
      preHandler: [fastify.authenticate],
    },
    tournamentController.unregisterPlayer.bind(tournamentController)
  );

  // GET /tournaments/:id/registrations - Lista le registrazioni di un torneo
  fastify.get<{ Params: { id: string } }>(
    "/tournaments/:id/registrations",
    tournamentController.getRegistrations.bind(tournamentController)
  );

  // POST /tournaments/:id/start - Avvia un torneo
  fastify.post<{ Params: { id: string } }>(
    "/tournaments/:id/start",
    {
      preHandler: [fastify.authenticate],
    },
    tournamentController.startTournament.bind(tournamentController)
  );

  // GET /tournaments/:id/bracket - Ottiene il bracket di un torneo
  fastify.get<{ Params: { id: string } }>(
    "/tournaments/:id/bracket",
    tournamentController.getBracket.bind(tournamentController)
  );

  // GET /tournaments/:id/next-matches - Ottiene i prossimi match da giocare
  fastify.get<{ Params: { id: string } }>(
    "/tournaments/:id/next-matches",
    tournamentController.getNextMatches.bind(tournamentController)
  );

  // GET /tournaments/:id/stats - Ottiene le statistiche di un torneo
  fastify.get<{ Params: { id: string } }>(
    "/tournaments/:id/stats",
    tournamentController.getTournamentStats.bind(tournamentController)
  );

  // POST /tournaments/:id/cancel - Cancella un torneo
  fastify.post<{ Params: { id: string } }>(
    "/tournaments/:id/cancel",
    {
      preHandler: [fastify.authenticate],
    },
    tournamentController.cancelTournament.bind(tournamentController)
  );

  // POST /tournaments/:id/matches/:matchId/complete - Callback quando un match viene completato
  fastify.post<{ Params: { id: string; matchId: string } }>(
    "/tournaments/:id/matches/:matchId/complete",
    {
      preHandler: [fastify.authenticate],
    },
    tournamentController.onMatchCompleted.bind(tournamentController)
  );
}
