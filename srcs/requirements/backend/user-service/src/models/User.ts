import db from "../database/connection";
import bcrypt from "bcrypt";

// Interfacce per i tipi di dato
export interface User {
  id?: number;
  username: string;
  email: string;
  password_hash: string;
  display_name?: string;
  avatar_url?: string;
  is_active?: boolean;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserStats {
  id?: number;
  user_id: number;
  wins?: number;
  losses?: number;
  tournaments_played?: number;
  tournaments_won?: number;
}

export interface Friendship {
  id?: number;
  requester_id: number;
  addressee_id: number;
  status: "pending" | "accepted" | "rejected";
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  stats?: UserStats;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  display_name?: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Classe UserModel con tutti i metodi per interagire con il database
export class UserModel {
  // Crea un nuovo utente
  static async create(userData: CreateUserRequest): Promise<User> {
    // Hash della password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);

    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, display_name)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      userData.username,
      userData.email,
      passwordHash,
      userData.display_name || userData.username
    );

    // Crea le statistiche iniziali per l'utente
    const statsStmt = db.prepare(`
      INSERT INTO user_stats (user_id)
      VALUES (?)
    `);
    statsStmt.run(result.lastInsertRowid as number);

    // Restituisci l'utente creato
    return this.findById(result.lastInsertRowid as number) as Promise<User>;
  }

  // Trova un utente per ID
  static async findById(id: number): Promise<User | null> {
    const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
    const user = stmt.get(id) as User | undefined;
    return user || null;
  }

  // Trova un utente per username
  static async findByUsername(username: string): Promise<User | null> {
    const stmt = db.prepare("SELECT * FROM users WHERE username = ?");
    const user = stmt.get(username) as User | undefined;
    return user || null;
  }

  // Trova un utente per email
  static async findByEmail(email: string): Promise<User | null> {
    const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
    const user = stmt.get(email) as User | undefined;
    return user || null;
  }

  // Verifica le credenziali di login
  static async verifyCredentials(
    email: string,
    password: string
  ): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  // Aggiorna un utente
  static async update(
    id: number,
    userData: UpdateUserRequest
  ): Promise<User | null> {
    // Costruisci dinamicamente la query di aggiornamento
    const fields: string[] = [];
    const values: any[] = [];

    if (userData.username !== undefined) {
      fields.push("username = ?");
      values.push(userData.username);
    }

    if (userData.email !== undefined) {
      fields.push("email = ?");
      values.push(userData.email);
    }

    if (userData.display_name !== undefined) {
      fields.push("display_name = ?");
      values.push(userData.display_name);
    }

    if (userData.avatar_url !== undefined) {
      fields.push("avatar_url = ?");
      values.push(userData.avatar_url);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const stmt = db.prepare(`
      UPDATE users SET ${fields.join(", ")}
      WHERE id = ?
    `);

    stmt.run(...values);

    return this.findById(id);
  }

  // Elimina un utente
  static async delete(id: number): Promise<boolean> {
    const stmt = db.prepare("DELETE FROM users WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Ottieni il profilo completo dell'utente con statistiche
  static async getProfile(id: number): Promise<UserProfile | null> {
    const userStmt = db.prepare("SELECT * FROM users WHERE id = ?");
    const user = userStmt.get(id) as User | undefined;

    if (!user) {
      return null;
    }

    const statsStmt = db.prepare("SELECT * FROM user_stats WHERE user_id = ?");
    const stats = statsStmt.get(id) as UserStats | undefined;

    // Rimuovi il campo password_hash dal profilo
    const { password_hash, ...userProfile } = user;

    return {
      ...userProfile,
      stats,
    } as UserProfile;
  }

  // Ottieni le statistiche di un utente
  static async getStats(id: number): Promise<UserStats | null> {
    const stmt = db.prepare("SELECT * FROM user_stats WHERE user_id = ?");
    const stats = stmt.get(id) as UserStats | undefined;
    return stats || null;
  }

  // Aggiorna le statistiche di un utente
  static async updateStats(
    id: number,
    statsData: Partial<UserStats>
  ): Promise<UserStats | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (statsData.wins !== undefined) {
      fields.push("wins = ?");
      values.push(statsData.wins);
    }

    if (statsData.losses !== undefined) {
      fields.push("losses = ?");
      values.push(statsData.losses);
    }

    if (statsData.tournaments_played !== undefined) {
      fields.push("tournaments_played = ?");
      values.push(statsData.tournaments_played);
    }

    if (statsData.tournaments_won !== undefined) {
      fields.push("tournaments_won = ?");
      values.push(statsData.tournaments_won);
    }

    if (fields.length === 0) {
      return this.getStats(id);
    }

    values.push(id);

    const stmt = db.prepare(`
      UPDATE user_stats SET ${fields.join(", ")}
      WHERE user_id = ?
    `);

    stmt.run(...values);

    return this.getStats(id);
  }

  // Invia una richiesta di amicizia
  static async sendFriendRequest(
    requesterId: number,
    addresseeId: number
  ): Promise<Friendship> {
    const stmt = db.prepare(`
      INSERT INTO friendships (requester_id, addressee_id)
      VALUES (?, ?)
    `);

    const result = stmt.run(requesterId, addresseeId);

    return this.getFriendship(
      result.lastInsertRowid as number
    ) as Promise<Friendship>;
  }

  // Ottieni una richiesta di amicizia per ID
  static async getFriendship(id: number): Promise<Friendship | null> {
    const stmt = db.prepare("SELECT * FROM friendships WHERE id = ?");
    const friendship = stmt.get(id) as Friendship | undefined;
    return friendship || null;
  }

  // Accetta una richiesta di amicizia
  static async acceptFriendRequest(id: number): Promise<Friendship | null> {
    const stmt = db.prepare(`
      UPDATE friendships 
      SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(id);

    return this.getFriendship(id);
  }

  // Rifiuta una richiesta di amicizia
  static async rejectFriendRequest(id: number): Promise<Friendship | null> {
    const stmt = db.prepare(`
      UPDATE friendships 
      SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(id);

    return this.getFriendship(id);
  }

  // Ottieni gli amici di un utente
  static async getFriends(userId: number): Promise<User[]> {
    const stmt = db.prepare(`
      SELECT u.* FROM users u
      JOIN friendships f ON (
        (f.requester_id = ? AND f.addressee_id = u.id) OR
        (f.addressee_id = ? AND f.requester_id = u.id)
      )
      WHERE f.status = 'accepted'
    `);

    return stmt.all(userId, userId) as User[];
  }

  // Ottieni le richieste di amicizia in sospeso per un utente
  static async getPendingFriendRequests(userId: number): Promise<Friendship[]> {
    const stmt = db.prepare(`
      SELECT f.*, u.username, u.display_name
      FROM friendships f
      JOIN users u ON f.requester_id = u.id
      WHERE f.addressee_id = ? AND f.status = 'pending'
    `);

    return stmt.all(userId) as Friendship[];
  }
}

export default UserModel;
