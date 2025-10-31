import db from "../database/connection";

// ==================== TYPES ====================

export interface Thread {
  id?: number;
  is_group: number;
  name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ThreadMember {
  thread_id: number;
  user_id: number;
  joined_at?: string;
}

export interface Message {
  id?: number;
  thread_id: number;
  sender_id: number;
  content: string;
  is_system: number;
  created_at?: string;
}

export interface ThreadWithMembers extends Thread {
  members: number[];
}

export interface MessageWithSender extends Message {
  sender_username?: string;
  sender_display_name?: string;
  sender_avatar_url?: string;
}

// ==================== CHAT MODEL ====================

export class ChatModel {
  /**
   * Crea un nuovo thread di conversazione
   */
  static createThread(isGroup: boolean = false, name?: string): Thread {
    const stmt = db.prepare(`
      INSERT INTO threads (is_group, name)
      VALUES (?, ?)
    `);

    const result = stmt.run(isGroup ? 1 : 0, name || null);

    return {
      id: result.lastInsertRowid as number,
      is_group: isGroup ? 1 : 0,
      name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Trova un thread per ID
   */
  static findThreadById(threadId: number): Thread | null {
    const stmt = db.prepare("SELECT * FROM threads WHERE id = ?");
    const thread = stmt.get(threadId) as Thread | undefined;
    return thread || null;
  }

  /**
   * Trova o crea un thread DM tra due utenti
   */
  static findOrCreateDMThread(userId1: number, userId2: number): Thread {
    // Cerca un thread esistente tra questi due utenti
    const stmt = db.prepare(`
      SELECT t.* FROM threads t
      WHERE t.is_group = 0
        AND EXISTS (
          SELECT 1 FROM thread_members tm1
          WHERE tm1.thread_id = t.id AND tm1.user_id = ?
        )
        AND EXISTS (
          SELECT 1 FROM thread_members tm2
          WHERE tm2.thread_id = t.id AND tm2.user_id = ?
        )
        AND (
          SELECT COUNT(*) FROM thread_members tm
          WHERE tm.thread_id = t.id
        ) = 2
    `);

    const existingThread = stmt.get(userId1, userId2) as Thread | undefined;

    if (existingThread) {
      return existingThread;
    }

    // Se non esiste, creane uno nuovo
    const thread = this.createThread(false);
    this.addMemberToThread(thread.id!, userId1);
    this.addMemberToThread(thread.id!, userId2);

    return thread;
  }

  /**
   * Aggiungi un membro a un thread
   */
  static addMemberToThread(threadId: number, userId: number): void {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO thread_members (thread_id, user_id)
      VALUES (?, ?)
    `);
    stmt.run(threadId, userId);
  }

  /**
   * Rimuovi un membro da un thread
   */
  static removeMemberFromThread(threadId: number, userId: number): void {
    const stmt = db.prepare(`
      DELETE FROM thread_members
      WHERE thread_id = ? AND user_id = ?
    `);
    stmt.run(threadId, userId);
  }

  /**
   * Ottieni i membri di un thread
   */
  static getThreadMembers(threadId: number): number[] {
    const stmt = db.prepare(`
      SELECT user_id FROM thread_members
      WHERE thread_id = ?
    `);
    const members = stmt.all(threadId) as { user_id: number }[];
    return members.map((m) => m.user_id);
  }

  /**
   * Verifica se un utente è membro di un thread
   */
  static isUserInThread(threadId: number, userId: number): boolean {
    const stmt = db.prepare(`
      SELECT 1 FROM thread_members
      WHERE thread_id = ? AND user_id = ?
    `);
    return stmt.get(threadId, userId) !== undefined;
  }

  /**
   * Ottieni tutti i thread di un utente
   */
  static getUserThreads(userId: number): ThreadWithMembers[] {
    const stmt = db.prepare(`
      SELECT t.* FROM threads t
      INNER JOIN thread_members tm ON t.id = tm.thread_id
      WHERE tm.user_id = ?
      ORDER BY t.updated_at DESC
    `);

    const threads = stmt.all(userId) as Thread[];

    return threads.map((thread) => ({
      ...thread,
      members: this.getThreadMembers(thread.id!),
    }));
  }

  /**
   * Crea un nuovo messaggio
   */
  static createMessage(
    threadId: number,
    senderId: number,
    content: string,
    isSystem: boolean = false
  ): Message {
    // Aggiorna il timestamp del thread
    const updateThreadStmt = db.prepare(`
      UPDATE threads
      SET updated_at = datetime('now')
      WHERE id = ?
    `);
    updateThreadStmt.run(threadId);

    // Crea il messaggio
    const stmt = db.prepare(`
      INSERT INTO messages (thread_id, sender_id, content, is_system)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(threadId, senderId, content, isSystem ? 1 : 0);

    return {
      id: result.lastInsertRowid as number,
      thread_id: threadId,
      sender_id: senderId,
      content,
      is_system: isSystem ? 1 : 0,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Ottieni i messaggi di un thread con paginazione
   */
  static getThreadMessages(
    threadId: number,
    limit: number = 50,
    before?: number
  ): Message[] {
    let query = `
      SELECT * FROM messages
      WHERE thread_id = ?
    `;

    const params: any[] = [threadId];

    if (before) {
      query += " AND id < ?";
      params.push(before);
    }

    query += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);

    const stmt = db.prepare(query);
    const messages = stmt.all(...params) as Message[];

    // Restituisci i messaggi in ordine cronologico
    return messages.reverse();
  }

  /**
   * Ottieni l'ultimo messaggio di un thread
   */
  static getLastMessage(threadId: number): Message | null {
    const stmt = db.prepare(`
      SELECT * FROM messages
      WHERE thread_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `);

    const message = stmt.get(threadId) as Message | undefined;
    return message || null;
  }

  /**
   * Elimina un messaggio
   */
  static deleteMessage(messageId: number, userId: number): boolean {
    const stmt = db.prepare(`
      DELETE FROM messages
      WHERE id = ? AND sender_id = ?
    `);

    const result = stmt.run(messageId, userId);
    return result.changes > 0;
  }

  /**
   * Ottieni il numero di messaggi non letti per un utente in un thread
   * (Questa è una implementazione semplificata, richiede tracking separato per una implementazione completa)
   */
  static getUnreadCount(threadId: number, userId: number): number {
    // Per ora restituisce 0, da implementare con una tabella di tracking lettura
    return 0;
  }
}

export default ChatModel;
