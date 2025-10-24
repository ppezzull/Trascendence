import { z } from "zod";

// Schema per la creazione di un utente
export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "Il nome utente deve avere almeno 3 caratteri")
    .max(30, "Il nome utente non può superare i 30 caratteri")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Il nome utente può contenere solo lettere, numeri e underscore"
    ),
  email: z.string().email("Email non valida"),
  password: z
    .string()
    .min(8, "La password deve avere almeno 8 caratteri")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "La password deve contenere almeno una lettera maiuscola, una minuscola e un numero"
    ),
  display_name: z
    .string()
    .min(1, "Il nome visualizzato non può essere vuoto")
    .max(50, "Il nome visualizzato non può superare i 50 caratteri")
    .optional(),
});

// Schema per l'aggiornamento di un utente
export const updateUserSchema = z.object({
  username: z
    .string()
    .min(3, "Il nome utente deve avere almeno 3 caratteri")
    .max(30, "Il nome utente non può superare i 30 caratteri")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Il nome utente può contenere solo lettere, numeri e underscore"
    )
    .optional(),
  email: z.string().email("Email non valida").optional(),
  display_name: z
    .string()
    .min(1, "Il nome visualizzato non può essere vuoto")
    .max(50, "Il nome visualizzato non può superare i 50 caratteri")
    .optional(),
  avatar_url: z.string().url("URL non valido").optional(),
});

// Schema per il login
export const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(1, "La password è obbligatoria"),
});

// Schema per l'ID utente
export const userIdSchema = z.object({
  id: z.coerce
    .number()
    .int("ID deve essere un numero intero")
    .positive("ID deve essere un numero positivo"),
});

// Schema per l'aggiornamento delle statistiche
export const updateStatsSchema = z.object({
  wins: z.coerce
    .number()
    .int("Il numero di vittorie deve essere un numero intero")
    .min(0, "Il numero di vittorie non può essere negativo")
    .optional(),
  losses: z.coerce
    .number()
    .int("Il numero di sconfitte deve essere un numero intero")
    .min(0, "Il numero di sconfitte non può essere negativo")
    .optional(),
  tournaments_played: z.coerce
    .number()
    .int("Il numero di tornei giocati deve essere un numero intero")
    .min(0, "Il numero di tornei giocati non può essere negativo")
    .optional(),
  tournaments_won: z.coerce
    .number()
    .int("Il numero di tornei vinti deve essere un numero intero")
    .min(0, "Il numero di tornei vinti non può essere negativo")
    .optional(),
});

// Schema per la richiesta di amicizia
export const friendRequestSchema = z.object({
  addressee_id: z.coerce
    .number()
    .int("ID deve essere un numero intero")
    .positive("ID deve essere un numero positivo"),
});

// Schema per la risposta a una richiesta di amicizia
export const friendResponseSchema = z.object({
  action: z.enum(["accept", "reject"], {
    errorMap: () => ({ message: 'L\'azione deve essere "accept" o "reject"' }),
  }),
});

// Schema per i parametri di query
export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int("La pagina deve essere un numero intero")
    .positive("La pagina deve essere un numero positivo")
    .default(1),
  limit: z.coerce
    .number()
    .int("Il limite deve essere un numero intero")
    .positive("Il limite deve essere un numero positivo")
    .max(100, "Il limite non può superare 100")
    .default(20),
});

// Schema per la ricerca di utenti
export const searchUsersSchema = z
  .object({
    q: z
      .string()
      .min(1, "Il termine di ricerca non può essere vuoto")
      .max(50, "Il termine di ricerca non può superare i 50 caratteri"),
  })
  .merge(paginationSchema);

// Esporta i tipi derivati dagli schemi
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UserIdInput = z.infer<typeof userIdSchema>;
export type UpdateStatsInput = z.infer<typeof updateStatsSchema>;
export type FriendRequestInput = z.infer<typeof friendRequestSchema>;
export type FriendResponseInput = z.infer<typeof friendResponseSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchUsersInput = z.infer<typeof searchUsersSchema>;
