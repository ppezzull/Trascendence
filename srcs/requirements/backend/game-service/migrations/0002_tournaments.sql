-- Migration 0002: Tournament System
-- Aggiunge supporto per tornei con bracket system

-- Tabella tornei
CREATE TABLE IF NOT EXISTS tournaments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  game_id INTEGER NOT NULL,
  max_players INTEGER NOT NULL DEFAULT 8,
  min_players INTEGER NOT NULL DEFAULT 2,
  tournament_type TEXT NOT NULL DEFAULT 'single_elimination', -- single_elimination, double_elimination
  status TEXT NOT NULL DEFAULT 'registration', -- registration, in_progress, completed, cancelled
  winner_id INTEGER,
  created_by INTEGER, -- user_id dell'organizzatore (opzionale)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  started_at TEXT,
  completed_at TEXT,
  settings TEXT, -- JSON con impostazioni specifiche del torneo
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  CHECK (status IN ('registration', 'in_progress', 'completed', 'cancelled')),
  CHECK (tournament_type IN ('single_elimination', 'double_elimination')),
  CHECK (max_players >= min_players),
  CHECK (min_players >= 2)
);

-- Tabella registrazioni al torneo
CREATE TABLE IF NOT EXISTS tournament_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  user_id INTEGER, -- NULL se è un alias temporaneo
  alias TEXT NOT NULL, -- nickname del giocatore nel torneo
  seed INTEGER, -- posizione iniziale nel bracket (assegnata all'inizio)
  eliminated BOOLEAN NOT NULL DEFAULT 0,
  final_position INTEGER, -- posizione finale (1=vincitore, 2=secondo, etc.)
  registered_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  UNIQUE(tournament_id, alias),
  UNIQUE(tournament_id, user_id) -- un utente può iscriversi solo una volta
);

-- Tabella match del torneo (collega match normali al torneo)
CREATE TABLE IF NOT EXISTS tournament_matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  match_id INTEGER NOT NULL UNIQUE, -- riferimento al match nella tabella matches
  round INTEGER NOT NULL, -- 1=primo turno, 2=secondo, etc. (finale è l'ultimo)
  match_number INTEGER NOT NULL, -- posizione nel round (es. match 1, 2, 3, 4 del round 1)
  bracket_type TEXT NOT NULL DEFAULT 'winners', -- winners, losers (per double elimination)
  next_match_id INTEGER, -- ID del prossimo match in caso di vittoria
  loser_next_match_id INTEGER, -- ID del prossimo match in caso di sconfitta (double elimination)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (next_match_id) REFERENCES tournament_matches(id),
  FOREIGN KEY (loser_next_match_id) REFERENCES tournament_matches(id),
  CHECK (bracket_type IN ('winners', 'losers')),
  UNIQUE(tournament_id, round, match_number, bracket_type)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_game ON tournaments(game_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament ON tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_user ON tournament_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_match ON tournament_matches(match_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_round ON tournament_matches(tournament_id, round);

