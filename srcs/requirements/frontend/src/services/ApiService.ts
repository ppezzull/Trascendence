// API response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  token?: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  message?: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  data?: {
    token?: string;
    user?: {
      id: string;
      username: string;
      email: string;
    };
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  stats?: {
    pong: {
      wins: number;
      losses: number;
      ratio: number;
    };
    breakout: {
      levels: number;
      highscore: number;
      powerups: number;
    };
  };
}

export interface GameSettings {
  ballSpeed: "slow" | "normal" | "fast";
  powerUps: boolean;
  theme: "classic" | "cyber" | "neon";
}

export interface Match {
  id: number;
  game_id: number;
  status: "pending" | "in_progress" | "finished" | "cancelled";
  winner_id: number | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  settings: any;
}

export interface MatchDetails {
  id: number;
  game_id: number;
  status: "pending" | "in_progress" | "finished" | "cancelled";
  winner_id: number | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  settings: any;
  players: Array<{
    match_id: number;
    user_id: number;
    score: number;
    position: number;
    is_ready: number;
    joined_at: string;
  }>;
  tournament_players: any[];
}

export class ApiService {
  private baseUrl: string;
  private userBaseUrl: string;
  private chatBaseUrl: string;
  private gameBaseUrl: string;
  private authToken: string | null = null;

  constructor() {
    // Base URLs for different microservices
    this.baseUrl =
      (import.meta as any).env?.VITE_API_URL || "http://localhost:3001";
    this.userBaseUrl =
      (import.meta as any).env?.VITE_USER_API_URL || "http://localhost:3001";
    this.chatBaseUrl =
      (import.meta as any).env?.VITE_CHAT_API_URL || "http://localhost:3002";
    this.gameBaseUrl =
      (import.meta as any).env?.VITE_GAME_API_URL || "http://localhost:3003";

    // Get auth token from localStorage
    this.authToken = localStorage.getItem("authToken");
  }

  // Set auth token for API calls
  setAuthToken(token: string): void {
    this.authToken = token;
    localStorage.setItem("authToken", token);
  }

  // Clear auth token
  clearAuthToken(): void {
    this.authToken = null;
    localStorage.removeItem("authToken");
  }

  // Save avatar to localStorage
  saveAvatarToLocalStorage(avatarData: string): void {
    localStorage.setItem("userAvatar", avatarData);
  }

  // Get avatar from localStorage
  getAvatarFromLocalStorage(): string | null {
    return localStorage.getItem("userAvatar");
  }

  // Remove avatar from localStorage
  removeAvatarFromLocalStorage(): void {
    localStorage.removeItem("userAvatar");
  }

  // Generic request method
  private async request<T>(
    baseUrl: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${baseUrl}${endpoint}`;

    // Set default headers
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    // Add auth token if available
    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    console.log("endpoint", endpoint);
    console.log("dajeroma", headers["Authorization"]);

    // Merge with any additional headers from options
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg =
          errorData.message ||
          errorData.error ||
          `HTTP error! status: ${response.status}`;
        throw new Error(errMsg);
      }

      return await response.json();
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  }

  // Service-specific request methods
  private async userRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(this.userBaseUrl, endpoint, options);
  }

  private async chatRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(this.chatBaseUrl, endpoint, options);
  }

  private async gameRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(this.gameBaseUrl, endpoint, options);
  }

  // Auth service methods
  async login(email: string, password: string): Promise<LoginResponse> {
    console.log("Login request:", email, password);
    try {
      const response = await this.userRequest<LoginResponse>(
        "/api/users/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        }
      );

      console.log("Login response:", response);

      if (response.success && response.token) {
        this.setAuthToken(response.token);
        if ((response as any).user) {
          localStorage.setItem("user", JSON.stringify((response as any).user));
        }
      }

      return response;
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "Login failed" };
    }
  }

  async register(
    username: string,
    email: string,
    password: string,
    displayName: string
  ): Promise<ApiResponse> {
    console.log("Register request:", username, email, password, displayName);
    try {
      const response = await this.userRequest<ApiResponse>(
        "/api/users/register",
        {
          method: "POST",
          body: JSON.stringify({
            username,
            email,
            password,
            display_name: displayName,
          }),
        }
      );

      return response;
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, message: "Registration failed" };
    }
  }

  async logout(): Promise<ApiResponse> {
    try {
      const response = await this.userRequest<ApiResponse>(
        "/api/users/logout",
        {
          method: "POST",
        }
      );

      this.clearAuthToken();
      localStorage.removeItem("user");

      return response;
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, message: "Logout failed" };
    }
  }

  // User service methods
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      return await this.userRequest<User>("/api/users/me");
    } catch (error) {
      console.error("Get current user error:", error);
      return { success: false, message: "Failed to get user data" };
    }
  }

  async getUserById(userId: string): Promise<ApiResponse<User>> {
    try {
      const url = `${this.userBaseUrl}/api/users/${userId}`;
      console.log(`Getting user by ID ${userId} from URL: ${url}`);
      return await this.userRequest<User>(`/api/users/${userId}`);
    } catch (error) {
      console.error("Get user error:", error);
      return { success: false, message: "Failed to get user data" };
    }
  }

  async searchUsers(query: string): Promise<any> {
    try {
      return await this.userRequest<User[]>(
        `/api/users/search?q=${encodeURIComponent(query)}`
      );
    } catch (error) {
      console.error("Search users error:", error);
      return { success: false, message: "Failed to search users" };
    }
  }

  async updateAccount(username?: string, email?: string): Promise<ApiResponse> {
    try {
      const data: any = {};
      if (username) data.username = username;
      if (email) data.email = email;

      return await this.userRequest<ApiResponse>("/api/users/me", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Update account error:", error);
      return { success: false, message: "Failed to update account" };
    }
  }

  async updateProfile(
    userId: string,
    username?: string,
    email?: string,
    displayName?: string,
    avatarUrl?: string
  ): Promise<ApiResponse> {
    try {
      const data: any = {};
      if (username) data.username = username;
      if (email) data.email = email;
      if (displayName) data.display_name = displayName;
      if (avatarUrl) data.avatar_url = avatarUrl;

      return await this.userRequest<ApiResponse>(`/api/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Update profile error:", error);
      return { success: false, message: "Failed to update profile" };
    }
  }

  async updateAvatar(avatarData: string): Promise<ApiResponse> {
    try {
      return await this.userRequest<ApiResponse>("/api/users/me/avatar", {
        method: "PUT",
        body: JSON.stringify({ avatar: avatarData }),
      });
    } catch (error) {
      console.error("Update avatar error:", error);
      return { success: false, message: "Failed to update avatar" };
    }
  }

  async getUserStats(userId?: string): Promise<ApiResponse> {
    try {
      const endpoint = userId
        ? `/api/users/${userId}/stats`
        : "/api/users/me/stats";
      return await this.userRequest<ApiResponse>(endpoint);
    } catch (error) {
      console.error("Get user stats error:", error);
      return { success: false, message: "Failed to get user stats" };
    }
  }

  // Friends management
  async sendFriendRequest(addresseeId: number): Promise<ApiResponse> {
    try {
      return await this.userRequest<ApiResponse>("/api/users/friends/request", {
        method: "POST",
        body: JSON.stringify({ addressee_id: addresseeId }),
      });
    } catch (error) {
      console.error("Send friend request error:", error);
      return { success: false, message: "Failed to send friend request" };
    }
  }

  async getFriends(userId?: string): Promise<ApiResponse> {
    try {
      let endpoint;

      if (userId) {
        // Get friends for a specific user
        endpoint = `/api/users/${userId}/friends`;
      } else {
        // Get friends for the current user
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          endpoint = `/api/users/${user.id}/friends`;
        } else {
          return { success: false, message: "User not authenticated" };
        }
      }

      return await this.userRequest<ApiResponse>(endpoint);
    } catch (error) {
      console.error("Get friends error:", error);
      return { success: false, message: "Failed to get friends" };
    }
  }

  async getPendingFriendRequests(): Promise<ApiResponse> {
    try {
      return await this.userRequest<ApiResponse>("/api/users/friends/pending");
    } catch (error) {
      console.error("Get pending friend requests error:", error);
      return {
        success: false,
        message: "Failed to get pending friend requests",
      };
    }
  }

  async respondToFriendRequest(
    requestId: number,
    action: "accept" | "reject"
  ): Promise<ApiResponse> {
    try {
      return await this.userRequest<ApiResponse>(
        `/api/users/friends/${requestId}/respond`,
        {
          method: "POST",
          body: JSON.stringify({ action }),
        }
      );
    } catch (error) {
      console.error("Respond to friend request error:", error);
      return { success: false, message: "Failed to respond to friend request" };
    }
  }

  async removeFriend(userId: string): Promise<ApiResponse> {
    try {
      // Get current user ID
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        return { success: false, message: "User not authenticated" };
      }

      const user = JSON.parse(userStr);

      return await this.userRequest<ApiResponse>(
        `/api/users/${user.id}/friends`,
        {
          method: "DELETE",
          body: JSON.stringify({ friend_id: parseInt(userId) }),
        }
      );
    } catch (error) {
      console.error("Remove friend error:", error);
      return { success: false, message: "Failed to remove friend" };
    }
  }

  // Game service methods
  async getGames(): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>("/api/game/games");
    } catch (error) {
      console.error("Get games error:", error);
      return { success: false, message: "Failed to get games" };
    }
  }

  async getGameSettings(gameId: string): Promise<ApiResponse<GameSettings>> {
    try {
      return await this.gameRequest<GameSettings>(
        `/api/game/games/${gameId}/settings`
      );
    } catch (error) {
      console.error("Get game settings error:", error);
      return { success: false, message: "Failed to get game settings" };
    }
  }

  async updateGameSettings(
    gameId: string,
    settings: GameSettings
  ): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(
        `/api/game/games/${gameId}/settings`,
        {
          method: "PUT",
          body: JSON.stringify(settings),
        }
      );
    } catch (error) {
      console.error("Update game settings error:", error);
      return { success: false, message: "Failed to update game settings" };
    }
  }

  // Matches
  async createMatch(gameId: string): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>("/api/game/matches", {
        method: "POST",
        body: JSON.stringify({ gameId }),
      });
    } catch (error) {
      console.error("Create match error:", error);
      return { success: false, message: "Failed to create match" };
    }
  }

  async createMatchWithPlayers(
    gameId: string,
    playerIds: number[]
  ): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>("/api/game/matches", {
        method: "POST",
        body: JSON.stringify({
          game_id: parseInt(gameId),
          player_ids: playerIds,
          settings: {},
        }),
      });
    } catch (error) {
      console.error("Create match with players error:", error);
      return { success: false, message: "Failed to create match with players" };
    }
  }

  async getMatches(): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>("/api/game/matches");
    } catch (error) {
      console.error("Get matches error:", error);
      return { success: false, message: "Failed to get matches" };
    }
  }

  async getMatch(matchId: string): Promise<any> {
    try {
      return await this.gameRequest<ApiResponse>(
        `/api/game/matches/${matchId}`
      );
    } catch (error) {
      console.error("Get match error:", error);
      return { success: false, message: "Failed to get match" };
    }
  }

  async getUserMatches(userId: string): Promise<any> {
    try {
      return await this.gameRequest<ApiResponse>(
        `/api/game/users/${userId}/matches`
      );
    } catch (error) {
      console.error("Get user matches error:", error);
      return { success: false, message: "Failed to get user matches" };
    }
  }

  async readyMatch(
    matchId: string,
    userId: number,
    ready: boolean = true
  ): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(
        `/api/game/matches/${matchId}/ready`,
        {
          method: "POST",
          body: JSON.stringify({ user_id: userId, ready }),
        }
      );
    } catch (error) {
      console.error("Ready match error:", error);
      return { success: false, message: "Failed to set match ready" };
    }
  }

  async updateMatchScore(matchId: string, score: any): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(
        `/api/game/matches/${matchId}/score`,
        {
          method: "POST",
          body: JSON.stringify(score),
        }
      );
    } catch (error) {
      console.error("Update match score error:", error);
      return { success: false, message: "Failed to update match score" };
    }
  }

  async finishMatch(matchId: string, result: any): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(
        `/api/game/matches/${matchId}/finish`,
        {
          method: "POST",
          body: JSON.stringify(result),
        }
      );
    } catch (error) {
      console.error("Finish match error:", error);
      return { success: false, message: "Failed to finish match" };
    }
  }

  async cancelMatch(matchId: string): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(
        `/api/game/matches/${matchId}/cancel`,
        {
          method: "POST",
          body: JSON.stringify({}),
        }
      );
    } catch (error) {
      console.error("Cancel match error:", error);
      return { success: false, message: "Failed to cancel match" };
    }
  }

  async updateMatchStatus(
    matchId: string,
    status: string
  ): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(
        `/api/game/matches/${matchId}/status`,
        {
          method: "PUT",
          body: JSON.stringify({ status }),
        }
      );
    } catch (error) {
      console.error("Update match status error:", error);
      return { success: false, message: "Failed to update match status" };
    }
  }

  async updatePlayerScore(
    matchId: string,
    scoreData: { user_id: number; score: number }
  ): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(
        `/api/game/matches/${matchId}/score`,
        {
          method: "POST",
          body: JSON.stringify(scoreData),
        }
      );
    } catch (error) {
      console.error("Update player score error:", error);
      return { success: false, message: "Failed to update player score" };
    }
  }

  async finishMatchWithWinner(
    matchId: string,
    matchData: {
      winner_id: number | null;
      final_scores: { player1: number; player2: number };
    }
  ): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(
        `/api/game/matches/${matchId}/finish`,
        {
          method: "POST",
          body: JSON.stringify(matchData),
        }
      );
    } catch (error) {
      console.error("Finish match error:", error);
      return { success: false, message: "Failed to finish match" };
    }
  }

  // Matchmaking
  async findMatch(
    gameId: string,
    eloRange: number = 200
  ): Promise<ApiResponse> {
    return await this.gameRequest<ApiResponse>("/api/game/matchmaking/find", {
      method: "POST",
      body: JSON.stringify({ game_id: parseInt(gameId), elo_range: eloRange }),
    });
  }

  async joinMatchmaking(gameId: string): Promise<any> {
    return await this.gameRequest<ApiResponse>("/api/game/matchmaking/join", {
      method: "POST",
      body: JSON.stringify({ game_id: parseInt(gameId) }),
    });
  }

  async leaveMatchmaking(gameId?: string): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(
        "/api/game/matchmaking/leave",
        {
          method: "POST",
          body: JSON.stringify(gameId ? { game_id: parseInt(gameId) } : {}), // body JSON richiesto
        }
      );
    } catch (error) {
      console.error("Leave matchmaking error:", error);
      return { success: false, message: "Failed to leave matchmaking" };
    }
  }

  async getMatchmakingQueue(gameId: string): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(
        `/api/game/matchmaking/queue/${gameId}`
      );
    } catch (error) {
      console.error("Get matchmaking queue error:", error);
      return { success: false, message: "Failed to get matchmaking queue" };
    }
  }

  // Tournaments
  async getTournaments(): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>("/api/game/tournaments");
    } catch (error) {
      console.error("Get tournaments error:", error);
      return { success: false, message: "Failed to get tournaments" };
    }
  }

  async createTournament(tournament: any): Promise<any> {
    try {
      return await this.gameRequest<any>("/api/game/tournaments", {
        method: "POST",
        body: JSON.stringify(tournament),
      });
    } catch (error) {
      console.error("Create tournament error:", error);
      return { success: false, message: "Failed to create tournament" };
    }
  }

  async getTournament(tournamentId: string): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(
        `/api/game/tournaments/${tournamentId}`
      );
    } catch (error) {
      console.error("Get tournament error:", error);
      return { success: false, message: "Failed to get tournament" };
    }
  }

  async registerForTournament(
    tournamentId: string,
    alias?: any
  ): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(
        `/api/game/tournaments/${tournamentId}/register`,
        {
          method: "POST",
          body: alias,
        }
      );
    } catch (error) {
      console.error("Register for tournament error:", error);
      return { success: false, message: "Failed to register for tournament" };
    }
  }

  async startTournament(tournamentId: string): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(
        `/api/game/tournaments/${tournamentId}/start`,
        {
          method: "POST",
          body: JSON.stringify({}), // Includi un corpo JSON vuoto per evitare l'errore
        }
      );
    } catch (error) {
      console.error("Start tournament error:", error);
      return { success: false, message: "Failed to start tournament" };
    }
  }

  async getTournamentBracket(tournamentId: string): Promise<any> {
    try {
      return await this.gameRequest<ApiResponse>(
        `/api/game/tournaments/${tournamentId}/bracket`
      );
    } catch (error) {
      console.error("Get tournament bracket error:", error);
      return { success: false, message: "Failed to get tournament bracket" };
    }
  }

  async getNextTournamentMatches(tournamentId: string): Promise<any> {
    try {
      return await this.gameRequest<any>(
        `/api/game/tournaments/${tournamentId}/next-matches`
      );
    } catch (error) {
      console.error("Get next tournament matches error:", error);
      return {
        success: false,
        message: "Failed to get next tournament matches",
      };
    }
  }

  async completeTournamentMatch(
    tournamentId: string,
    matchId: string,
    result: any
  ): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(
        `/api/game/tournaments/${tournamentId}/matches/${matchId}/complete`,
        {
          method: "POST",
          body: JSON.stringify(result),
        }
      );
    } catch (error) {
      console.error("Complete tournament match error:", error);
      return { success: false, message: "Failed to complete tournament match" };
    }
  }

  async getTournamentRegistrations(tournamentId: string): Promise<any> {
    try {
      return await this.gameRequest<ApiResponse>(
        `/api/game/tournaments/${tournamentId}/registrations`
      );
    } catch (error) {
      console.error("Get tournament registrations error:", error);
      return {
        success: false,
        message: "Failed to get tournament registrations",
      };
    }
  }

  async getUserMatchHistory(userId?: string): Promise<any> {
    try {
      const endpoint = userId
        ? `/api/game/users/${userId}/matches`
        : "/api/game/users/me/matches";
      return await this.gameRequest<ApiResponse>(endpoint);
    } catch (error) {
      console.error("Get match history error:", error);
      return { success: false, message: "Failed to get match history" };
    }
  }

  async getMatchDetails(matchId: string): Promise<any> {
    try {
      return await this.gameRequest<ApiResponse>(
        `/api/game/matches/${matchId}`
      );
    } catch (error) {
      console.error("Get match details error:", error);
      return { success: false, message: "Failed to get match details" };
    }
  }

  async getLeaderboard(gameId: string): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(
        `/api/game/leaderboard/${gameId}`
      );
    } catch (error) {
      console.error("Get leaderboard error:", error);
      return { success: false, message: "Failed to get leaderboard" };
    }
  }

  // Chat service methods
  async getChatThreads(): Promise<any> {
    try {
      return await this.chatRequest<any>("/api/chat/threads");
    } catch (error) {
      console.error("Get chat threads error:", error);
      return null;
    }
  }

  async createDirectMessageThread(userId: number): Promise<ApiResponse> {
    try {
      return await this.chatRequest<ApiResponse>("/api/chat/threads/dm", {
        method: "POST",
        body: JSON.stringify({ otherUserId: userId }),
      });
    } catch (error) {
      console.error("Create DM thread error:", error);
      return { success: false, message: "Failed to create DM thread" };
    }
  }

  async getChatMessages(
    threadId: string,
    limit: number = 50,
    before?: string
  ): Promise<any> {
    try {
      const url = before
        ? `/api/chat/messages?threadId=${threadId}&limit=${limit}&before=${before}`
        : `/api/chat/messages?threadId=${threadId}&limit=${limit}`;
      return await this.chatRequest<any>(url);
    } catch (error) {
      console.error("Get chat messages error:", error);
      return null;
    }
  }

  async sendMessage(threadId: string, content: string): Promise<ApiResponse> {
    try {
      return await this.chatRequest<ApiResponse>("/api/chat/messages", {
        method: "POST",
        body: JSON.stringify({ threadId: parseInt(threadId), content }),
      });
    } catch (error) {
      console.error("Send message error:", error);
      return { success: false, message: "Failed to send message" };
    }
  }

  async deleteMessage(messageId: string): Promise<ApiResponse> {
    try {
      return await this.chatRequest<ApiResponse>(
        `/api/chat/messages/${messageId}`,
        {
          method: "DELETE",
        }
      );
    } catch (error) {
      console.error("Delete message error:", error);
      return { success: false, message: "Failed to delete message" };
    }
  }

  // Block management
  async blockUser(targetUserId: string): Promise<ApiResponse> {
    try {
      return await this.chatRequest<ApiResponse>("/api/chat/blocks", {
        method: "POST",
        body: JSON.stringify({ blockedUserId: parseInt(targetUserId) }),
      });
    } catch (error) {
      console.error("Block user error:", error);
      return { success: false, message: "Failed to block user" };
    }
  }

  async unblockUser(targetUserId: string): Promise<ApiResponse> {
    try {
      return await this.chatRequest<ApiResponse>(`/api/chat/blocks`, {
        method: "DELETE",
        body: JSON.stringify({
          blockedUserId: parseInt(targetUserId),
        }),
      });
    } catch (error) {
      console.error("Unblock user error:", error);
      return { success: false, message: "Failed to unblock user" };
    }
  }

  // Game invitations
  async sendGameInvitation(
    toUserId: string,
    gameId: string
  ): Promise<ApiResponse> {
    try {
      return await this.chatRequest<ApiResponse>("/api/chat/invitations", {
        method: "POST",
        body: JSON.stringify({ toUserId, gameId }),
      });
    } catch (error) {
      console.error("Send game invitation error:", error);
      return { success: false, message: "Failed to send game invitation" };
    }
  }

  async getSentInvitations(): Promise<ApiResponse> {
    try {
      return await this.chatRequest<ApiResponse>("/api/chat/invitations/sent");
    } catch (error) {
      console.error("Get sent invitations error:", error);
      return { success: false, message: "Failed to get sent invitations" };
    }
  }

  async getReceivedInvitations(): Promise<ApiResponse> {
    try {
      return await this.chatRequest<ApiResponse>(
        "/api/chat/invitations/received"
      );
    } catch (error) {
      console.error("Get received invitations error:", error);
      return { success: false, message: "Failed to get received invitations" };
    }
  }

  async acceptInvitation(invitationId: string): Promise<ApiResponse> {
    try {
      return await this.chatRequest<ApiResponse>(
        `/api/chat/invitations/${invitationId}/accept`,
        {
          method: "POST",
        }
      );
    } catch (error) {
      console.error("Accept invitation error:", error);
      return { success: false, message: "Failed to accept invitation" };
    }
  }

  async declineInvitation(invitationId: string): Promise<ApiResponse> {
    try {
      return await this.chatRequest<ApiResponse>(
        `/api/chat/invitations/${invitationId}/decline`,
        {
          method: "POST",
        }
      );
    } catch (error) {
      console.error("Decline invitation error:", error);
      return { success: false, message: "Failed to decline invitation" };
    }
  }

  // WebSocket connection
  connectWebSocket(): WebSocket {
    const token = this.authToken;
    if (!token) {
      throw new Error("No authentication token available");
    }

    const wsUrl = `${this.chatBaseUrl.replace(
      "http",
      "ws"
    )}/api/chat/ws?token=${token}`;
    return new WebSocket(wsUrl);
  }

  // Chat statistics
  async getChatStats(): Promise<ApiResponse> {
    try {
      return await this.chatRequest<ApiResponse>("/api/chat/stats");
    } catch (error) {
      console.error("Get chat stats error:", error);
      return { success: false, message: "Failed to get chat stats" };
    }
  }
}
