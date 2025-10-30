import db from "../database/connection";

// ==================== TYPES ====================

export interface Block {
  blocker_id: number;
  blocked_id: number;
  created_at?: string;
}

// ==================== BLOCK MODEL ====================

export class BlockModel {
  /**
   * Blocca un utente
   */
  static blockUser(blockerId: number, blockedId: number): Block {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO blocks (blocker_id, blocked_id)
      VALUES (?, ?)
    `);

    stmt.run(blockerId, blockedId);

    return {
      blocker_id: blockerId,
      blocked_id: blockedId,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Sblocca un utente
   */
  static unblockUser(blockerId: number, blockedId: number): boolean {
    const stmt = db.prepare(`
      DELETE FROM blocks
      WHERE blocker_id = ? AND blocked_id = ?
    `);

    const result = stmt.run(blockerId, blockedId);
    return result.changes > 0;
  }

  /**
   * Verifica se un utente ha bloccato un altro
   */
  static isBlocked(blockerId: number, blockedId: number): boolean {
    const stmt = db.prepare(`
      SELECT 1 FROM blocks
      WHERE blocker_id = ? AND blocked_id = ?
    `);

    return stmt.get(blockerId, blockedId) !== undefined;
  }

  /**
   * Verifica se due utenti si sono bloccati a vicenda (in qualsiasi direzione)
   */
  static isBlockedBidirectional(userId1: number, userId2: number): boolean {
    const stmt = db.prepare(`
      SELECT 1 FROM blocks
      WHERE (blocker_id = ? AND blocked_id = ?)
         OR (blocker_id = ? AND blocked_id = ?)
    `);

    return stmt.get(userId1, userId2, userId2, userId1) !== undefined;
  }

  /**
   * Ottieni tutti gli utenti bloccati da un utente
   */
  static getBlockedUsers(blockerId: number): number[] {
    const stmt = db.prepare(`
      SELECT blocked_id FROM blocks
      WHERE blocker_id = ?
      ORDER BY created_at DESC
    `);

    const blocks = stmt.all(blockerId) as { blocked_id: number }[];
    return blocks.map((b) => b.blocked_id);
  }

  /**
   * Ottieni tutti gli utenti che hanno bloccato un determinato utente
   */
  static getBlockers(blockedId: number): number[] {
    const stmt = db.prepare(`
      SELECT blocker_id FROM blocks
      WHERE blocked_id = ?
      ORDER BY created_at DESC
    `);

    const blocks = stmt.all(blockedId) as { blocker_id: number }[];
    return blocks.map((b) => b.blocker_id);
  }

  /**
   * Elimina tutti i blocchi di un utente (utile per GDPR/cancellazione account)
   */
  static deleteAllUserBlocks(userId: number): void {
    const stmt = db.prepare(`
      DELETE FROM blocks
      WHERE blocker_id = ? OR blocked_id = ?
    `);

    stmt.run(userId, userId);
  }
}

export default BlockModel;
