import db from "../database/connection";

// ==================== TYPES ====================

export interface Invitation {
  id?: number;
  from_user_id: number;
  to_user_id: number;
  game_type: string;
  status: "pending" | "accepted" | "declined" | "expired";
  match_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateInvitationRequest {
  from_user_id: number;
  to_user_id: number;
  game_type?: string;
}

// ==================== INVITATION MODEL ====================

export class InvitationModel {
  /**
   * Crea un nuovo invito a giocare
   */
  static createInvitation(data: CreateInvitationRequest): Invitation {
    const stmt = db.prepare(`
      INSERT INTO invitations (from_user_id, to_user_id, game_type)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(
      data.from_user_id,
      data.to_user_id,
      data.game_type || "pong"
    );

    return this.findById(result.lastInsertRowid as number) as Invitation;
  }

  /**
   * Trova un invito per ID
   */
  static findById(id: number): Invitation | null {
    const stmt = db.prepare("SELECT * FROM invitations WHERE id = ?");
    const invitation = stmt.get(id) as Invitation | undefined;
    return invitation || null;
  }

  /**
   * Accetta un invito
   */
  static acceptInvitation(id: number, matchId?: number): Invitation | null {
    const stmt = db.prepare(`
      UPDATE invitations
      SET status = 'accepted',
          match_id = ?,
          updated_at = datetime('now')
      WHERE id = ? AND status = 'pending'
    `);

    stmt.run(matchId || null, id);

    return this.findById(id);
  }

  /**
   * Rifiuta un invito
   */
  static declineInvitation(id: number): Invitation | null {
    const stmt = db.prepare(`
      UPDATE invitations
      SET status = 'declined',
          updated_at = datetime('now')
      WHERE id = ? AND status = 'pending'
    `);

    stmt.run(id);

    return this.findById(id);
  }

  /**
   * Segna gli inviti scaduti (es. dopo X minuti)
   */
  static expireOldInvitations(minutesOld: number = 10): number {
    const stmt = db.prepare(`
      UPDATE invitations
      SET status = 'expired',
          updated_at = datetime('now')
      WHERE status = 'pending'
        AND datetime(created_at, '+' || ? || ' minutes') < datetime('now')
    `);

    const result = stmt.run(minutesOld);
    return result.changes;
  }

  /**
   * Ottieni gli inviti ricevuti da un utente
   */
  static getReceivedInvitations(
    userId: number,
    status?: Invitation["status"]
  ): Invitation[] {
    let query = `
      SELECT * FROM invitations
      WHERE to_user_id = ?
    `;

    const params: any[] = [userId];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY created_at DESC";

    const stmt = db.prepare(query);
    return stmt.all(...params) as Invitation[];
  }

  /**
   * Ottieni gli inviti inviati da un utente
   */
  static getSentInvitations(
    userId: number,
    status?: Invitation["status"]
  ): Invitation[] {
    let query = `
      SELECT * FROM invitations
      WHERE from_user_id = ?
    `;

    const params: any[] = [userId];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY created_at DESC";

    const stmt = db.prepare(query);
    return stmt.all(...params) as Invitation[];
  }

  /**
   * Ottieni tutti gli inviti pending tra due utenti
   */
  static getPendingInvitationBetweenUsers(
    userId1: number,
    userId2: number
  ): Invitation | null {
    const stmt = db.prepare(`
      SELECT * FROM invitations
      WHERE ((from_user_id = ? AND to_user_id = ?)
         OR  (from_user_id = ? AND to_user_id = ?))
        AND status = 'pending'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    const invitation = stmt.get(userId1, userId2, userId2, userId1) as
      | Invitation
      | undefined;
    return invitation || null;
  }

  /**
   * Cancella un invito (solo se sei il mittente)
   */
  static cancelInvitation(id: number, userId: number): boolean {
    const stmt = db.prepare(`
      UPDATE invitations
      SET status = 'declined',
          updated_at = datetime('now')
      WHERE id = ? AND from_user_id = ? AND status = 'pending'
    `);

    const result = stmt.run(id, userId);
    return result.changes > 0;
  }

  /**
   * Elimina tutti gli inviti di un utente (utile per GDPR/cancellazione account)
   */
  static deleteAllUserInvitations(userId: number): void {
    const stmt = db.prepare(`
      DELETE FROM invitations
      WHERE from_user_id = ? OR to_user_id = ?
    `);

    stmt.run(userId, userId);
  }
}

export default InvitationModel;
