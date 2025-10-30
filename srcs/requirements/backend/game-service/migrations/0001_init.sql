-- Tabella dei giochi disponibili
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  max_players INTEGER NOT NULL DEFAULT 2,
  min_players INTEGER NOT NULL DEFAULT 2,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Inserisci i giochi di default
INSERT OR IGNORE INTO games (id, name, display_name, description, max_players, min_players) VALUES
  (1, 'pong', 'Pong', 'Classic Pong game - two paddles and a ball', 2, 2),
  (2, 'breakout', 'Breakout', 'Break bricks with a ball and paddle', 1, 1);

-- Tabella delle partite
CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  winner_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  started_at TEXT,
  finished_at TEXT,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  CHECK (status IN ('pending', 'in_progress', 'finished', 'cancelled'))
);

-- Tabella dei giocatori in una partita
CREATE TABLE IF NOT EXISTS match_players (
  match_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 1,
  is_ready INTEGER NOT NULL DEFAULT 0,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (match_id, user_id),
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

-- Tabella delle statistiche utente per gioco
CREATE TABLE IF NOT EXISTS user_game_stats (
  user_id INTEGER NOT NULL,
  game_id INTEGER NOT NULL,
  matches_played INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  highest_score INTEGER NOT NULL DEFAULT 0,
  elo_rating INTEGER NOT NULL DEFAULT 1000,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, game_id),
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- Tabella delle impostazioni di gioco disponibili
CREATE TABLE IF NOT EXISTS game_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  type TEXT NOT NULL,
  default_value TEXT NOT NULL,
  options TEXT,
  description TEXT,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  CHECK (type IN ('boolean', 'number', 'select', 'slider')),
  UNIQUE(game_id, name)
);

-- Inserisci le impostazioni di default per Pong
INSERT OR IGNORE INTO game_settings (game_id, name, display_name, type, default_value, options, description) VALUES
  (1, 'ball_speed', 'Ball Speed', 'select', 'normal', '["slow", "normal", "fast"]', 'Speed of the ball'),
  (1, 'winning_score', 'Winning Score', 'select', '5', '["3", "5", "7", "10"]', 'Points needed to win'),
  (1, 'paddle_size', 'Paddle Size', 'select', 'normal', '["small", "normal", "large"]', 'Size of the paddles'),
  (1, 'power_ups', 'Power-ups', 'boolean', 'false', NULL, 'Enable power-ups during game');

-- Inserisci le impostazioni di default per Breakout
INSERT OR IGNORE INTO game_settings (game_id, name, display_name, type, default_value, options, description) VALUES
  (2, 'difficulty', 'Difficulty', 'select', 'normal', '["easy", "normal", "hard"]', 'Game difficulty level'),
  (2, 'lives', 'Lives', 'select', '3', '["1", "3", "5"]', 'Number of lives'),
  (2, 'brick_rows', 'Brick Rows', 'select', '5', '["3", "5", "7"]', 'Number of brick rows'),
  (2, 'power_ups', 'Power-ups', 'boolean', 'true', NULL, 'Enable power-ups');

-- Tabella delle impostazioni applicate a una partita
CREATE TABLE IF NOT EXISTS match_settings (
  match_id INTEGER NOT NULL,
  setting_id INTEGER NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (match_id, setting_id),
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (setting_id) REFERENCES game_settings(id) ON DELETE CASCADE
);

-- Tabella della coda di matchmaking
CREATE TABLE IF NOT EXISTS matchmaking_queue (
  user_id INTEGER NOT NULL,
  game_id INTEGER NOT NULL,
  elo_rating INTEGER NOT NULL DEFAULT 1000,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, game_id),
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- Indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_matches_game ON matches(game_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_created ON matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_players_user ON match_players(user_id);
CREATE INDEX IF NOT EXISTS idx_user_game_stats_user ON user_game_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_game_stats_game ON user_game_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_user_game_stats_elo ON user_game_stats(elo_rating DESC);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_game ON matchmaking_queue(game_id, elo_rating);
