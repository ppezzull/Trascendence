-- Aggiungi colonne per l'autenticazione OAuth se non esistono già
-- SQLite non supporta IF NOT EXISTS per ALTER TABLE ADD COLUMN,
-- quindi usiamo un approccio che ignora gli errori

-- Verifica e aggiungi google_id
CREATE TABLE IF NOT EXISTS _users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  display_name TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT 1,
  is_verified BOOLEAN DEFAULT 0,
  google_id TEXT UNIQUE,
  oauth_provider TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copia i dati esistenti
INSERT INTO _users_new (id, username, email, password_hash, display_name, avatar_url, is_active, is_verified, created_at, updated_at)
SELECT id, username, email, password_hash, display_name, avatar_url, is_active, is_verified, created_at, updated_at
FROM users;

-- Sostituisci la vecchia tabella
DROP TABLE users;
ALTER TABLE _users_new RENAME TO users;

-- Ricrea gli indici
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

