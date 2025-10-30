import db from "../database/connection";

// ==================== TYPES ====================

export interface Game {
  id?: number;
  name: string;
  display_name: string;
  description?: string;
  max_players: number;
  min_players: number;
  is_active: number;
  created_at?: string;
}

export interface GameSetting {
  id?: number;
  game_id: number;
  name: string;
  display_name: string;
  type: "boolean" | "number" | "select" | "slider";
  default_value: string;
  options?: string; // JSON array of options
  description?: string;
}

// ==================== GAME MODEL ====================

export class GameModel {
  /**
   * Ottieni tutti i giochi disponibili
   */
  static getAllGames(activeOnly: boolean = true): Game[] {
    let query = "SELECT * FROM games";

    if (activeOnly) {
      query += " WHERE is_active = 1";
    }

    query += " ORDER BY id ASC";

    const stmt = db.prepare(query);
    return stmt.all() as Game[];
  }

  /**
   * Ottieni un gioco per ID
   */
  static getGameById(id: number): Game | null {
    const stmt = db.prepare("SELECT * FROM games WHERE id = ?");
    const game = stmt.get(id) as Game | undefined;
    return game || null;
  }

  /**
   * Ottieni un gioco per nome
   */
  static getGameByName(name: string): Game | null {
    const stmt = db.prepare("SELECT * FROM games WHERE name = ?");
    const game = stmt.get(name) as Game | undefined;
    return game || null;
  }

  /**
   * Ottieni le impostazioni disponibili per un gioco
   */
  static getGameSettings(gameId: number): GameSetting[] {
    const stmt = db.prepare(`
      SELECT * FROM game_settings
      WHERE game_id = ?
      ORDER BY id ASC
    `);

    return stmt.all(gameId) as GameSetting[];
  }

  /**
   * Ottieni una specifica impostazione di gioco
   */
  static getGameSetting(
    gameId: number,
    settingName: string
  ): GameSetting | null {
    const stmt = db.prepare(`
      SELECT * FROM game_settings
      WHERE game_id = ? AND name = ?
    `);

    const setting = stmt.get(gameId, settingName) as GameSetting | undefined;
    return setting || null;
  }

  /**
   * Valida le impostazioni fornite per un gioco
   */
  static validateSettings(
    gameId: number,
    settings: Record<string, string>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const gameSettings = this.getGameSettings(gameId);

    for (const [key, value] of Object.entries(settings)) {
      const setting = gameSettings.find((s) => s.name === key);

      if (!setting) {
        errors.push(`Unknown setting: ${key}`);
        continue;
      }

      // Valida il tipo di valore
      switch (setting.type) {
        case "boolean":
          if (value !== "true" && value !== "false") {
            errors.push(`${key} must be 'true' or 'false'`);
          }
          break;

        case "number":
          if (isNaN(Number(value))) {
            errors.push(`${key} must be a number`);
          }
          break;

        case "select":
          if (setting.options) {
            const validOptions = JSON.parse(setting.options);
            if (!validOptions.includes(value)) {
              errors.push(`${key} must be one of: ${validOptions.join(", ")}`);
            }
          }
          break;

        case "slider":
          if (isNaN(Number(value))) {
            errors.push(`${key} must be a number`);
          }
          break;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default GameModel;
