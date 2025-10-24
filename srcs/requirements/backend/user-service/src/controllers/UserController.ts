import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateUserInput,
  UpdateUserInput,
  LoginInput,
  UpdateStatsInput,
  FriendRequestInput,
  FriendResponseInput,
  SearchUsersInput,
  PaginationInput,
} from "../schemas/userSchemas";
import UserModel, { UserProfile } from "../models/User";
import { runMigrations } from "../database/migrate";

// Interfacce per i tipi di risposta
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Classe UserController con tutti i metodi per gestire le richieste API
export class UserController {
  constructor() {
    // Esegui le migrazioni all'avvio del controller
    runMigrations();
  }

  // Registra un nuovo utente
  async register(
    request: FastifyRequest<{ Body: CreateUserInput }>,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const { username, email, password, display_name } = request.body;

      // Verifica se l'utente esiste già
      const existingUserByUsername = await UserModel.findByUsername(username);
      if (existingUserByUsername) {
        return reply.status(400).send({
          success: false,
          message: "Nome utente già in uso",
        });
      }

      const existingUserByEmail = await UserModel.findByEmail(email);
      if (existingUserByEmail) {
        return reply.status(400).send({
          success: false,
          message: "Email già in uso",
        });
      }

      // Crea il nuovo utente
      const newUser = await UserModel.create({
        username,
        email,
        password,
        display_name,
      });

      // Rimuovi il campo password_hash dalla risposta
      const { password_hash, ...userResponse } = newUser;

      return reply.status(201).send({
        success: true,
        message: "Utente registrato con successo",
        data: userResponse,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        message: "Errore durante la registrazione dell'utente",
      });
    }
  }

  // Effettua il login di un utente
  async login(
    request: FastifyRequest<{ Body: LoginInput }>,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const { email, password } = request.body;

      // Verifica le credenziali
      const user = await UserModel.verifyCredentials(email, password);
      if (!user) {
        return reply.status(401).send({
          success: false,
          message: "Credenziali non valide",
        });
      }

      // Genera il token JWT
      const token = request.server.jwt.sign(
        { id: user.id, username: user.username },
        { expiresIn: "7d" }
      );

      // Rimuovi il campo password_hash dalla risposta
      const { password_hash, ...userResponse } = user;

      return reply.status(200).send({
        success: true,
        message: "Login effettuato con successo",
        data: {
          token,
          user: userResponse,
        },
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        message: "Errore durante il login",
      });
    }
  }

  // Ottieni il profilo di un utente
  async getProfile(
    request: FastifyRequest<{ Params: { id: number } }>,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const { id } = request.params;

      const userProfile = await UserModel.getProfile(id);
      if (!userProfile) {
        return reply.status(404).send({
          success: false,
          message: "Utente non trovato",
        });
      }

      return reply.status(200).send({
        success: true,
        data: userProfile,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        message: "Errore durante il recupero del profilo utente",
      });
    }
  }

  // Aggiorna i dati di un utente
  async updateUser(
    request: FastifyRequest<{ Params: { id: number }; Body: UpdateUserInput }>,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const { id } = request.params;
      const updateData = request.body;

      // Verifica l'autenticazione
      try {
        await request.jwtVerify();
      } catch (error) {
        return reply.status(401).send({
          success: false,
          message: "Non autorizzato",
        });
      }

      // Verifica che l'utente stia aggiornando il proprio profilo
      const jwtPayload = request.user as any;
      if (jwtPayload.id !== id) {
        return reply.status(403).send({
          success: false,
          message: "Non sei autorizzato ad aggiornare questo profilo",
        });
      }

      // Verifica se l'utente esiste
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        return reply.status(404).send({
          success: false,
          message: "Utente non trovato",
        });
      }

      // Verifica se il nuovo username o email sono già in uso
      if (
        updateData.username &&
        updateData.username !== existingUser.username
      ) {
        const existingUserByUsername = await UserModel.findByUsername(
          updateData.username
        );
        if (existingUserByUsername) {
          return reply.status(400).send({
            success: false,
            message: "Nome utente già in uso",
          });
        }
      }

      if (updateData.email && updateData.email !== existingUser.email) {
        const existingUserByEmail = await UserModel.findByEmail(
          updateData.email
        );
        if (existingUserByEmail) {
          return reply.status(400).send({
            success: false,
            message: "Email già in uso",
          });
        }
      }

      // Aggiorna l'utente
      const updatedUser = await UserModel.update(id, updateData);
      if (!updatedUser) {
        return reply.status(500).send({
          success: false,
          message: "Errore durante l'aggiornamento dell'utente",
        });
      }

      // Rimuovi il campo password_hash dalla risposta
      const { password_hash, ...userResponse } = updatedUser;

      return reply.status(200).send({
        success: true,
        message: "Utente aggiornato con successo",
        data: userResponse,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        message: "Errore durante l'aggiornamento dell'utente",
      });
    }
  }

  // Elimina un utente
  async deleteUser(
    request: FastifyRequest<{ Params: { id: number } }>,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const { id } = request.params;

      // Verifica l'autenticazione
      try {
        await request.jwtVerify();
      } catch (error) {
        return reply.status(401).send({
          success: false,
          message: "Non autorizzato",
        });
      }

      // Verifica che l'utente stia eliminando il proprio profilo
      const jwtPayload = request.user as any;
      if (jwtPayload.id !== id) {
        return reply.status(403).send({
          success: false,
          message: "Non sei autorizzato ad eliminare questo profilo",
        });
      }

      // Verifica se l'utente esiste
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        return reply.status(404).send({
          success: false,
          message: "Utente non trovato",
        });
      }

      // Elimina l'utente
      const deleted = await UserModel.delete(id);
      if (!deleted) {
        return reply.status(500).send({
          success: false,
          message: "Errore durante l'eliminazione dell'utente",
        });
      }

      return reply.status(200).send({
        success: true,
        message: "Utente eliminato con successo",
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        message: "Errore durante l'eliminazione dell'utente",
      });
    }
  }

  // Ottieni le statistiche di un utente
  async getStats(
    request: FastifyRequest<{ Params: { id: number } }>,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const { id } = request.params;

      // Verifica se l'utente esiste
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        return reply.status(404).send({
          success: false,
          message: "Utente non trovato",
        });
      }

      // Ottieni le statistiche
      const stats = await UserModel.getStats(id);
      if (!stats) {
        return reply.status(404).send({
          success: false,
          message: "Statistiche non trovate",
        });
      }

      return reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        message: "Errore durante il recupero delle statistiche",
      });
    }
  }

  // Aggiorna le statistiche di un utente
  async updateStats(
    request: FastifyRequest<{ Params: { id: number }; Body: UpdateStatsInput }>,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const { id } = request.params;
      const statsData = request.body;

      // Verifica l'autenticazione
      try {
        await request.jwtVerify();
      } catch (error) {
        return reply.status(401).send({
          success: false,
          message: "Non autorizzato",
        });
      }

      // Verifica se l'utente esiste
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        return reply.status(404).send({
          success: false,
          message: "Utente non trovato",
        });
      }

      // Aggiorna le statistiche
      const updatedStats = await UserModel.updateStats(id, statsData);
      if (!updatedStats) {
        return reply.status(500).send({
          success: false,
          message: "Errore durante l'aggiornamento delle statistiche",
        });
      }

      return reply.status(200).send({
        success: true,
        message: "Statistiche aggiornate con successo",
        data: updatedStats,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        message: "Errore durante l'aggiornamento delle statistiche",
      });
    }
  }

  // Cerca utenti
  async searchUsers(
    request: FastifyRequest<{ Querystring: SearchUsersInput }>,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const { q, page, limit } = request.query;

      // Implementazione semplificata della ricerca
      // In un'applicazione reale, useresti una query SQL più complessa con LIKE
      const db = require("../database/connection").default;

      // Calcola l'offset per la paginazione
      const offset = (page - 1) * limit;

      // Conta il numero totale di risultati
      const countStmt = db.prepare(`
        SELECT COUNT(*) as total FROM users 
        WHERE username LIKE ? OR display_name LIKE ?
      `);
      const countResult = countStmt.get(`%${q}%`, `%${q}%`) as {
        total: number;
      };
      const total = countResult.total;

      // Calcola il numero di pagine
      const pages = Math.ceil(total / limit);

      // Ottieni gli utenti per la pagina corrente
      const usersStmt = db.prepare(`
        SELECT id, username, display_name, avatar_url FROM users 
        WHERE username LIKE ? OR display_name LIKE ?
        ORDER BY username
        LIMIT ? OFFSET ?
      `);
      const users = usersStmt.all(`%${q}%`, `%${q}%`, limit, offset);

      return reply.status(200).send({
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            pages,
          },
        },
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        message: "Errore durante la ricerca degli utenti",
      });
    }
  }

  // Invia una richiesta di amicizia
  async sendFriendRequest(
    request: FastifyRequest<{ Body: FriendRequestInput }>,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const { addressee_id } = request.body;

      // Verifica l'autenticazione
      try {
        await request.jwtVerify();
      } catch (error) {
        return reply.status(401).send({
          success: false,
          message: "Non autorizzato",
        });
      }

      // Ottieni l'ID dell'utente autenticato
      const jwtPayload = request.user as any;
      const requester_id = jwtPayload.id;

      // Verifica che l'utente non stia inviando una richiesta a se stesso
      if (requester_id === addressee_id) {
        return reply.status(400).send({
          success: false,
          message: "Non puoi inviare una richiesta di amicizia a te stesso",
        });
      }

      // Verifica se l'utente destinatario esiste
      const addressee = await UserModel.findById(addressee_id);
      if (!addressee) {
        return reply.status(404).send({
          success: false,
          message: "Utente non trovato",
        });
      }

      // Invia la richiesta di amicizia
      const friendRequest = await UserModel.sendFriendRequest(
        requester_id,
        addressee_id
      );

      return reply.status(201).send({
        success: true,
        message: "Richiesta di amicizia inviata con successo",
        data: friendRequest,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        message: "Errore durante l'invio della richiesta di amicizia",
      });
    }
  }

  // Rispondi a una richiesta di amicizia
  async respondFriendRequest(
    request: FastifyRequest<{
      Params: { id: number };
      Body: FriendResponseInput;
    }>,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const { id } = request.params;
      const { action } = request.body;

      // Verifica l'autenticazione
      try {
        await request.jwtVerify();
      } catch (error) {
        return reply.status(401).send({
          success: false,
          message: "Non autorizzato",
        });
      }

      // Ottieni l'ID dell'utente autenticato
      const jwtPayload = request.user as any;
      const userId = jwtPayload.id;

      // Ottieni la richiesta di amicizia
      const friendRequest = await UserModel.getFriendship(id);
      if (!friendRequest) {
        return reply.status(404).send({
          success: false,
          message: "Richiesta di amicizia non trovata",
        });
      }

      // Verifica che l'utente sia il destinatario della richiesta
      if (friendRequest.addressee_id !== userId) {
        return reply.status(403).send({
          success: false,
          message:
            "Non sei autorizzato a rispondere a questa richiesta di amicizia",
        });
      }

      // Rispondi alla richiesta di amicizia
      let updatedFriendRequest;
      if (action === "accept") {
        updatedFriendRequest = await UserModel.acceptFriendRequest(id);
      } else {
        updatedFriendRequest = await UserModel.rejectFriendRequest(id);
      }

      return reply.status(200).send({
        success: true,
        message: `Richiesta di amicizia ${
          action === "accept" ? "accettata" : "rifiutata"
        } con successo`,
        data: updatedFriendRequest,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        message: "Errore durante la risposta alla richiesta di amicizia",
      });
    }
  }

  // Ottieni gli amici di un utente
  async getFriends(
    request: FastifyRequest<{
      Params: { id: number };
      Querystring: PaginationInput;
    }>,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const { id } = request.params;
      const { page, limit } = request.query;

      // Verifica se l'utente esiste
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        return reply.status(404).send({
          success: false,
          message: "Utente non trovato",
        });
      }

      // Ottieni gli amici
      const friends = await UserModel.getFriends(id);

      // Implementazione semplificata della paginazione
      const total = friends.length;
      const pages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const paginatedFriends = friends.slice(offset, offset + limit);

      return reply.status(200).send({
        success: true,
        data: {
          friends: paginatedFriends,
          pagination: {
            page,
            limit,
            total,
            pages,
          },
        },
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        message: "Errore durante il recupero degli amici",
      });
    }
  }

  // Ottieni le richieste di amicizia in sospeso
  async getPendingFriendRequests(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      // Verifica l'autenticazione
      try {
        await request.jwtVerify();
      } catch (error) {
        return reply.status(401).send({
          success: false,
          message: "Non autorizzato",
        });
      }

      // Ottieni l'ID dell'utente autenticato
      const jwtPayload = request.user as any;
      const userId = jwtPayload.id;

      // Ottieni le richieste di amicizia in sospeso
      const pendingRequests = await UserModel.getPendingFriendRequests(userId);

      return reply.status(200).send({
        success: true,
        data: pendingRequests,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        message:
          "Errore durante il recupero delle richieste di amicizia in sospeso",
      });
    }
  }
}

export default UserController;
