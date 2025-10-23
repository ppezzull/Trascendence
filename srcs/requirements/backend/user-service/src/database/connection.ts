import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Definisci un tipo per il database
type DatabaseType = Database.Database;

// Percorso del database
const dbPath = path.join(__dirname, "../../data", "users.db");

// Assicurati che la directory del database esista
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Crea la connessione al database
const db: DatabaseType = new Database(dbPath);

// Configura il database
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Funzione per chiudere la connessione
export function closeDatabase(): void {
  db.close();
}

// Esporta l'istanza del database come default export
export default db;
