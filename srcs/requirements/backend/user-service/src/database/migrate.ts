import db from "./connection";
import fs from "fs";
import path from "path";

// Interfaccia per la migrazione
interface Migration {
  id: number;
  name: string;
  sql: string;
}

// Directory delle migrazioni
const migrationsDir = path.join(__dirname, "../../migrations");

// Leggi tutte le migrazioni dalla directory
function loadMigrations(): Migration[] {
  const migrations: Migration[] = [];

  if (!fs.existsSync(migrationsDir)) {
    return migrations;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, "utf8");

    // Estrai l'ID dal nome del file (es. 0001_init.sql -> 1)
    const id = parseInt(file.split("_")[0], 10);
    const name = file.replace(/^\d+_/, "").replace(".sql", "");

    migrations.push({
      id,
      name,
      sql: content,
    });
  }

  return migrations;
}

// Crea la tabella delle migrazioni se non esiste
function createMigrationsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.exec(sql);
}

// Ottieni le migrazioni già eseguite
function getExecutedMigrations(): number[] {
  const stmt = db.prepare("SELECT id FROM migrations ORDER BY id");
  const rows = stmt.all() as { id: number }[];
  return rows.map((row) => row.id);
}

// Esegui una migrazione
function executeMigration(migration: Migration) {
  const transaction = db.transaction(() => {
    // Esegui la migrazione
    db.exec(migration.sql);

    // Registra la migrazione come eseguita
    const stmt = db.prepare("INSERT INTO migrations (id, name) VALUES (?, ?)");
    stmt.run(migration.id, migration.name);
  });

  transaction();
  console.log(
    `Migrazione ${migration.id} (${migration.name}) eseguita con successo`
  );
}

// Funzione principale per eseguire le migrazioni
export function runMigrations() {
  console.log("Inizio delle migrazioni...");

  // Crea la tabella delle migrazioni
  createMigrationsTable();

  // Carica tutte le migrazioni
  const migrations = loadMigrations();

  if (migrations.length === 0) {
    console.log("Nessuna migrazione trovata");
    return;
  }

  // Ottieni le migrazioni già eseguite
  const executedMigrations = getExecutedMigrations();

  // Esegui le migrazioni non ancora eseguite
  for (const migration of migrations) {
    if (!executedMigrations.includes(migration.id)) {
      executeMigration(migration);
    } else {
      console.log(
        `Migrazione ${migration.id} (${migration.name}) già eseguita`
      );
    }
  }

  console.log("Migrazioni completate");
}

// Se questo file viene eseguito direttamente, esegui le migrazioni
if (require.main === module) {
  try {
    runMigrations();
    process.exit(0);
  } catch (error) {
    console.error("Errore durante le migrazioni:", error);
    process.exit(1);
  }
}
