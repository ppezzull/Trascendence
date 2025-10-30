import { z } from "zod";

// ==================== REQUEST SCHEMAS ====================

export const createDMThreadSchema = z.object({
  otherUserId: z.number().int().positive(),
});

export const sendMessageSchema = z.object({
  threadId: z.number().int().positive(),
  content: z.string().min(1).max(2000),
});

export const getMessagesSchema = z.object({
  threadId: z.number().int().positive(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  before: z.number().int().positive().optional(),
});

export const blockUserSchema = z.object({
  blockedUserId: z.number().int().positive(),
});

export const unblockUserSchema = z.object({
  blockedUserId: z.number().int().positive(),
});

export const createInvitationSchema = z.object({
  toUserId: z.number().int().positive(),
  gameType: z.string().optional().default("pong"),
});

export const invitationActionSchema = z.object({
  invitationId: z.number().int().positive(),
});

export const updatePresenceSchema = z.object({
  status: z.enum(["online", "offline", "away"]),
});

// ==================== RESPONSE SCHEMAS ====================

export const threadSchema = z.object({
  id: z.number(),
  is_group: z.number(),
  name: z.string().nullable().optional(),
  members: z.array(z.number()),
  created_at: z.string(),
  updated_at: z.string(),
});

export const messageSchema = z.object({
  id: z.number(),
  thread_id: z.number(),
  sender_id: z.number(),
  content: z.string(),
  is_system: z.number(),
  created_at: z.string(),
});

export const blockSchema = z.object({
  blocker_id: z.number(),
  blocked_id: z.number(),
  created_at: z.string(),
});

export const invitationSchema = z.object({
  id: z.number(),
  from_user_id: z.number(),
  to_user_id: z.number(),
  game_type: z.string(),
  status: z.enum(["pending", "accepted", "declined", "expired"]),
  match_id: z.number().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const presenceSchema = z.object({
  user_id: z.number(),
  status: z.enum(["online", "offline", "away"]),
  last_seen: z.string(),
});

// ==================== WEBSOCKET SCHEMAS ====================

export const wsAuthSchema = z.object({
  token: z.string(),
});

export const wsMessageSchema = z.object({
  type: z.enum(["message:send", "message:typing", "presence:update", "ping"]),
  payload: z.any(),
});

// ==================== TYPE EXPORTS ====================

export type CreateDMThreadRequest = z.infer<typeof createDMThreadSchema>;
export type SendMessageRequest = z.infer<typeof sendMessageSchema>;
export type GetMessagesRequest = z.infer<typeof getMessagesSchema>;
export type BlockUserRequest = z.infer<typeof blockUserSchema>;
export type UnblockUserRequest = z.infer<typeof unblockUserSchema>;
export type CreateInvitationRequest = z.infer<typeof createInvitationSchema>;
export type InvitationActionRequest = z.infer<typeof invitationActionSchema>;
export type UpdatePresenceRequest = z.infer<typeof updatePresenceSchema>;
export type WSAuthRequest = z.infer<typeof wsAuthSchema>;
export type WSMessageRequest = z.infer<typeof wsMessageSchema>;
