import db from "../database/connection";

// ==================== TYPES ====================

export interface Presence {
  user_id: number;
  status: "online" | "offline" | "away";
  last_seen?: string;
}

// ==================== PRESENCE MODEL ====================

export class PresenceModel {
  /**
   * Aggiorna lo stato di presenza di un utente
   */
  static updatePresence(userId: number, status: Presence["status"]): Presence {
    const stmt = db.prepare(`
      INSERT INTO presence (user_id, status, last_seen)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        status = excluded.status,
        last_seen = excluded.last_seen
    `);

    stmt.run(userId, status);

    return this.getPresence(userId) as Presence;
  }

  /**
   * Ottieni lo stato di presenza di un utente
   */
  static getPresence(userId: number): Presence | null {
    const stmt = db.prepare(`
      SELECT * FROM presence
      WHERE user_id = ?
    `);

    const presence = stmt.get(userId) as Presence | undefined;
    return presence || null;
  }

  /**
   * Ottieni lo stato di presenza di più utenti
   */
  static getMultiplePresences(userIds: number[]): Presence[] {
    if (userIds.length === 0) return [];

    const placeholders = userIds.map(() => "?").join(",");
    const stmt = db.prepare(`
      SELECT * FROM presence
      WHERE user_id IN (${placeholders})
    `);

    return stmt.all(...userIds) as Presence[];
  }

  /**
   * Segna un utente come online
   */
  static setOnline(userId: number): Presence {
    return this.updatePresence(userId, "online");
  }

  /**
   * Segna un utente come offline
   */
  static setOffline(userId: number): Presence {
    return this.updatePresence(userId, "offline");
  }

  /**
   * Segna un utente come away
   */
  static setAway(userId: number): Presence {
    return this.updatePresence(userId, "away");
  }

  /**
   * Ottieni tutti gli utenti online
   */
  static getOnlineUsers(): number[] {
    const stmt = db.prepare(`
      SELECT user_id FROM presence
      WHERE status = 'online'
    `);

    const users = stmt.all() as { user_id: number }[];
    return users.map((u) => u.user_id);
  }

  /**
   * Segna come offline gli utenti inattivi oltre X minuti
   */
  static expireInactiveUsers(minutesInactive: number = 5): number {
    const stmt = db.prepare(`
      UPDATE presence
      SET status = 'offline'
      WHERE status != 'offline'
        AND datetime(last_seen, '+' || ? || ' minutes') < datetime('now')
    `);

    const result = stmt.run(minutesInactive);
    return result.changes;
  }

  /**
   * Elimina la presenza di un utente (utile per GDPR/cancellazione account)
   */
  static deleteUserPresence(userId: number): void {
    const stmt = db.prepare(`
      DELETE FROM presence
      WHERE user_id = ?
    `);

    stmt.run(userId);
  }
}

export default PresenceModel;
