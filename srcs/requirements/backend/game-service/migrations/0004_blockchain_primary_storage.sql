-- Migration 0004: Blockchain as Primary Storage
-- Rimuove dati ridondanti e rende la blockchain lo storage primario per i punteggi

-- Rimuovi la colonna score da match_players poiché i punteggi sono ora memorizzati sulla blockchain
-- La colonna score è rimossa perché i punteggi devono provenire solo dalla blockchain
DROP TABLE IF EXISTS temp_match_players_backup;
CREATE TABLE temp_match_players_backup AS SELECT * FROM match_players;

-- Droppa e ricrea la tabella match_players senza la colonna score
DROP TABLE match_players;

CREATE TABLE match_players (
  match_id INTEGER NOT NULL,
  user_id INTEGER,
  tournament_player_id INTEGER, -- Reference to tournament registration
  position INTEGER NOT NULL DEFAULT 1,
  is_ready INTEGER NOT NULL DEFAULT 0,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (match_id, user_id),
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

-- Ripristina i dati senza la colonna score
INSERT INTO match_players (match_id, user_id, position, is_ready, joined_at)
SELECT match_id, user_id, position, is_ready, joined_at
FROM temp_match_players_backup;

DROP TABLE temp_match_players_backup;

-- Aggiorna la tabella tournaments per rimuovere vecchie colonne e aggiungere nuove colonne blockchain
DROP TABLE IF EXISTS temp_tournaments_backup;
CREATE TABLE temp_tournaments_backup AS SELECT * FROM tournaments;

DROP TABLE tournaments;

CREATE TABLE tournaments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  game_id INTEGER NOT NULL,
  max_players INTEGER NOT NULL DEFAULT 8,
  min_players INTEGER NOT NULL DEFAULT 2,
  tournament_type TEXT NOT NULL DEFAULT 'single_elimination',
  status TEXT NOT NULL DEFAULT 'registration',
  winner_id INTEGER,
  winner_alias TEXT, -- Vincitore determinato dalla blockchain
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  started_at TEXT,
  completed_at TEXT,
  settings TEXT,
  -- Blockchain fields
  blockchain_tournament_id TEXT, -- Hash del nome del torneo sulla blockchain
  blockchain_transaction_hash TEXT, -- Hash della transazione di creazione
  blockchain_enabled INTEGER NOT NULL DEFAULT 1, -- Tutti i tornei sono su blockchain
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  CHECK (status IN ('registration', 'in_progress', 'completed', 'cancelled')),
  CHECK (tournament_type IN ('single_elimination', 'double_elimination')),
  CHECK (max_players >= min_players),
  CHECK (min_players >= 2),
  CHECK (blockchain_enabled IN (0, 1))
);

-- Ripristina i dati esistenti
INSERT INTO tournaments (
  id, name, game_id, max_players, min_players, tournament_type, status,
  winner_id, created_by, created_at, started_at, completed_at, settings,
  blockchain_enabled
)
SELECT
  id, name, game_id, max_players, min_players, tournament_type, status,
  winner_id, created_by, created_at, started_at, completed_at, settings,
  1 -- Tutti i tornei esistenti sono abilitati per blockchain
FROM temp_tournaments_backup;

DROP TABLE temp_tournaments_backup;

-- Crea indici ottimizzati
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_game ON tournaments(game_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_blockchain ON tournaments(blockchain_enabled);
CREATE INDEX IF NOT EXISTS idx_tournaments_tournament_id ON tournaments(blockchain_tournament_id);

CREATE INDEX IF NOT EXISTS idx_match_players_user ON match_players(user_id);
CREATE INDEX IF NOT EXISTS idx_match_players_tournament ON match_players(tournament_player_id);

-- Rimuovi la tabella blockchain_score_submissions poiché è ridondante
-- I dati sono sulla blockchain, non abbiamo bisogno di tracciarli nel database
DROP TABLE IF EXISTS blockchain_score_submissions;