import db from "./connection";
import fs from "fs";
import path from "path";

/**
 * Esegue le migrazioni del database
 */
function runMigrations(): void {
  const migrationsDir = path.join(__dirname, "../../migrations");
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  console.log("🎮 Esecuzione delle migrazioni del database game-service...");

  for (const file of migrationFiles) {
    console.log(`  📄 Applicando migrazione: ${file}`);
    const migrationPath = path.join(migrationsDir, file);
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    try {
      // Esegui la migrazione in una transazione
      db.exec(migrationSQL);
      console.log(`  ✅ Migrazione ${file} completata con successo`);
    } catch (error) {
      console.error(`  ❌ Errore durante la migrazione ${file}:`, error);
      throw error;
    }
  }

  console.log("✅ Tutte le migrazioni sono state applicate con successo!");
}

// Esegui le migrazioni se questo script viene eseguito direttamente
if (require.main === module) {
  try {
    runMigrations();
    process.exit(0);
  } catch (error) {
    console.error("❌ Errore durante le migrazioni:", error);
    process.exit(1);
  }
}

export default runMigrations;
