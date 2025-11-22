// API response interfaces
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  token?: string
}

export interface LoginResponse {
  success: boolean
  token?: string
  message?: string
  user?: {
    id: string
    username: string
    email: string
  }
}

export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  stats?: {
    pong: {
      wins: number
      losses: number
      ratio: number
    }
    breakout: {
      levels: number
      highscore: number
      powerups: number
    }
  }
}

export interface GameSettings {
  ballSpeed: 'slow' | 'normal' | 'fast'
  powerUps: boolean
  theme: 'classic' | 'cyber' | 'neon'
}

export class ApiService {
  private baseUrl: string
  private userBaseUrl: string
  private chatBaseUrl: string
  private gameBaseUrl: string
  private authToken: string | null = null

  constructor() {
    // Base URLs for different microservices
    this.baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001'
    this.userBaseUrl = (import.meta as any).env?.VITE_USER_API_URL || 'http://localhost:3001'
    this.chatBaseUrl = (import.meta as any).env?.VITE_CHAT_API_URL || 'http://localhost:3002'
    this.gameBaseUrl = (import.meta as any).env?.VITE_GAME_API_URL || 'http://localhost:3003'

    // Get auth token from localStorage
    this.authToken = localStorage.getItem('authToken')
  }

  // Set auth token for API calls
  setAuthToken(token: string): void {
    this.authToken = token
    localStorage.setItem('authToken', token)
  }

  // Clear auth token
  clearAuthToken(): void {
    this.authToken = null
    localStorage.removeItem('authToken')
  }

  // Generic request method
  private async request<T>(
    baseUrl: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${baseUrl}${endpoint}`

    // Set default headers
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }

    // Add auth token if available
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`
    }

    // Merge with any additional headers from options
    if (options.headers) {
      Object.assign(headers, options.headers)
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errMsg = errorData.message || errorData.error || `HTTP error! status: ${response.status}`
        throw new Error(errMsg)
      }

      return await response.json()
    } catch (error) {
      console.error('API request error:', error)
      throw error
    }
  }

  // Service-specific request methods
  private async userRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(this.userBaseUrl, endpoint, options)
  }

  private async chatRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(this.chatBaseUrl, endpoint, options)
  }

  private async gameRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(this.gameBaseUrl, endpoint, options)
  }

  // Auth service methods
  async login(email: string, password: string): Promise<LoginResponse> {
    console.log('Login request:', email, password)
    try {
      const response = await this.userRequest<LoginResponse>('/api/users/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      console.log('Login response:', response)

      if (response.success && response.token) {
        this.setAuthToken(response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
      }

      return response
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: 'Login failed' }
    }
  }

  async register(username: string, email: string, password: string, displayName: string): Promise<ApiResponse> {
    console.log('Register request:', username, email, password, displayName)
    try {
      const response = await this.userRequest<ApiResponse>('/api/users/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password, display_name: displayName }),
      })

      return response
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, message: 'Registration failed' }
    }
  }

  async logout(): Promise<ApiResponse> {
    try {
      const response = await this.userRequest<ApiResponse>('/api/users/logout', {
        method: 'POST',
      })

      this.clearAuthToken()
      localStorage.removeItem('user')

      return response
    } catch (error) {
      console.error('Logout error:', error)
      return { success: false, message: 'Logout failed' }
    }
  }

  // User service methods
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      return await this.userRequest<User>('/api/users/me')
    } catch (error) {
      console.error('Get current user error:', error)
      return { success: false, message: 'Failed to get user data' }
    }
  }

  async getUserById(userId: string): Promise<ApiResponse<User>> {
    try {
      return await this.userRequest<User>(`/api/users/${userId}`)
    } catch (error) {
      console.error('Get user error:', error)
      return { success: false, message: 'Failed to get user data' }
    }
  }

  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    try {
      return await this.userRequest<User[]>(`/api/users/search?q=${encodeURIComponent(query)}`)
    } catch (error) {
      console.error('Search users error:', error)
      return { success: false, message: 'Failed to search users' }
    }
  }

  async updateAccount(username?: string, email?: string): Promise<ApiResponse> {
    try {
      const data: any = {}
      if (username) data.username = username
      if (email) data.email = email

      return await this.userRequest<ApiResponse>('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error('Update account error:', error)
      return { success: false, message: 'Failed to update account' }
    }
  }

  async getUserStats(userId?: string): Promise<ApiResponse> {
    try {
      const endpoint = userId ? `/api/users/${userId}/stats` : '/api/users/me/stats'
      return await this.userRequest<ApiResponse>(endpoint)
    } catch (error) {
      console.error('Get user stats error:', error)
      return { success: false, message: 'Failed to get user stats' }
    }
  }

  // Friends management
  async sendFriendRequest(userId: string): Promise<ApiResponse> {
    try {
      return await this.userRequest<ApiResponse>('/api/users/friends/request', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      })
    } catch (error) {
      console.error('Send friend request error:', error)
      return { success: false, message: 'Failed to send friend request' }
    }
  }

  async getPendingFriendRequests(): Promise<ApiResponse> {
    try {
      return await this.userRequest<ApiResponse>('/api/users/friends/pending')
    } catch (error) {
      console.error('Get pending friend requests error:', error)
      return { success: false, message: 'Failed to get pending friend requests' }
    }
  }

  async respondToFriendRequest(userId: string, accept: boolean): Promise<ApiResponse> {
    try {
      return await this.userRequest<ApiResponse>(`/api/users/friends/${userId}/respond`, {
        method: 'PUT',
        body: JSON.stringify({ accept }),
      })
    } catch (error) {
      console.error('Respond to friend request error:', error)
      return { success: false, message: 'Failed to respond to friend request' }
    }
  }

  async removeFriend(userId: string): Promise<ApiResponse> {
    try {
      return await this.userRequest<ApiResponse>(`/api/users/${userId}/friends`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Remove friend error:', error)
      return { success: false, message: 'Failed to remove friend' }
    }
  }

  // Game service methods
  async getGames(): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>('/api/games')
    } catch (error) {
      console.error('Get games error:', error)
      return { success: false, message: 'Failed to get games' }
    }
  }

  async getGameSettings(gameId: string): Promise<ApiResponse<GameSettings>> {
    try {
      return await this.gameRequest<GameSettings>(`/api/games/${gameId}/settings`)
    } catch (error) {
      console.error('Get game settings error:', error)
      return { success: false, message: 'Failed to get game settings' }
    }
  }

  async updateGameSettings(gameId: string, settings: GameSettings): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(`/api/games/${gameId}/settings`, {
        method: 'PUT',
        body: JSON.stringify(settings),
      })
    } catch (error) {
      console.error('Update game settings error:', error)
      return { success: false, message: 'Failed to update game settings' }
    }
  }

  // Matches
  async createMatch(gameId: string): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>('/api/matches', {
        method: 'POST',
        body: JSON.stringify({ gameId }),
      })
    } catch (error) {
      console.error('Create match error:', error)
      return { success: false, message: 'Failed to create match' }
    }
  }

  async getMatches(): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>('/api/matches')
    } catch (error) {
      console.error('Get matches error:', error)
      return { success: false, message: 'Failed to get matches' }
    }
  }

  async getMatch(matchId: string): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(`/api/matches/${matchId}`)
    } catch (error) {
      console.error('Get match error:', error)
      return { success: false, message: 'Failed to get match' }
    }
  }

  async readyMatch(matchId: string, userId: number, ready: boolean = true): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(`/api/matches/${matchId}/ready`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, ready })
      })
    } catch (error) {
      console.error('Ready match error:', error)
      return { success: false, message: 'Failed to set match ready' }
    }
  }

  async updateMatchScore(matchId: string, score: any): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(`/api/matches/${matchId}/score`, {
        method: 'POST',
        body: JSON.stringify(score),
      })
    } catch (error) {
      console.error('Update match score error:', error)
      return { success: false, message: 'Failed to update match score' }
    }
  }

  async finishMatch(matchId: string, result: any): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(`/api/matches/${matchId}/finish`, {
        method: 'POST',
        body: JSON.stringify(result),
      })
    } catch (error) {
      console.error('Finish match error:', error)
      return { success: false, message: 'Failed to finish match' }
    }
  }

  // Matchmaking
  async findMatch(gameId: string, eloRange: number = 200): Promise<ApiResponse> {
    return await this.gameRequest<ApiResponse>('/api/matchmaking/find', {
      method: 'POST',
      body: JSON.stringify({ game_id: parseInt(gameId), elo_range: eloRange }),
    })
  }

  async joinMatchmaking(gameId: string): Promise<ApiResponse> {
    return await this.gameRequest<ApiResponse>('/api/matchmaking/join', {
      method: 'POST',
      body: JSON.stringify({ game_id: parseInt(gameId) }),
    })
  }

  async leaveMatchmaking(gameId?: string): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>('/api/matchmaking/leave', {
        method: 'POST',
        body: JSON.stringify(gameId ? { game_id: parseInt(gameId) } : {}) // body JSON richiesto
      })
    } catch (error) {
      console.error('Leave matchmaking error:', error)
      return { success: false, message: 'Failed to leave matchmaking' }
    }
  }

  async getMatchmakingQueue(gameId: string): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(`/api/matchmaking/queue/${gameId}`)
    } catch (error) {
      console.error('Get matchmaking queue error:', error)
      return { success: false, message: 'Failed to get matchmaking queue' }
    }
  }

  // Tournaments
  async getTournaments(): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>('/api/tournaments')
    } catch (error) {
      console.error('Get tournaments error:', error)
      return { success: false, message: 'Failed to get tournaments' }
    }
  }

  async createTournament(tournament: any): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>('/api/tournaments', {
        method: 'POST',
        body: JSON.stringify(tournament),
      })
    } catch (error) {
      console.error('Create tournament error:', error)
      return { success: false, message: 'Failed to create tournament' }
    }
  }

  async getTournament(tournamentId: string): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(`/api/tournaments/${tournamentId}`)
    } catch (error) {
      console.error('Get tournament error:', error)
      return { success: false, message: 'Failed to get tournament' }
    }
  }

  async registerForTournament(tournamentId: string, alias?: string): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(`/api/tournaments/${tournamentId}/register`, {
        method: 'POST',
        body: JSON.stringify({ alias }),
      })
    } catch (error) {
      console.error('Register for tournament error:', error)
      return { success: false, message: 'Failed to register for tournament' }
    }
  }

  async startTournament(tournamentId: string): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(`/api/tournaments/${tournamentId}/start`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Start tournament error:', error)
      return { success: false, message: 'Failed to start tournament' }
    }
  }

  async getTournamentBracket(tournamentId: string): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(`/api/tournaments/${tournamentId}/bracket`)
    } catch (error) {
      console.error('Get tournament bracket error:', error)
      return { success: false, message: 'Failed to get tournament bracket' }
    }
  }

  async completeTournamentMatch(tournamentId: string, matchId: string, result: any): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(`/api/tournaments/${tournamentId}/matches/${matchId}/complete`, {
        method: 'POST',
        body: JSON.stringify(result),
      })
    } catch (error) {
      console.error('Complete tournament match error:', error)
      return { success: false, message: 'Failed to complete tournament match' }
    }
  }

  async getUserMatchHistory(userId?: string): Promise<ApiResponse> {
    try {
      const endpoint = userId ? `/api/users/${userId}/matches` : '/api/users/me/matches'
      return await this.gameRequest<ApiResponse>(endpoint)
    } catch (error) {
      console.error('Get match history error:', error)
      return { success: false, message: 'Failed to get match history' }
    }
  }

  async getLeaderboard(gameId: string): Promise<ApiResponse> {
    try {
      return await this.gameRequest<ApiResponse>(`/api/leaderboard/${gameId}`)
    } catch (error) {
      console.error('Get leaderboard error:', error)
      return { success: false, message: 'Failed to get leaderboard' }
    }
  }

  // Chat service methods
  async getChatThreads(): Promise<ApiResponse> {
    try {
      return await this.chatRequest<ApiResponse>('/api/chat/threads')
    } catch (error) {
      console.error('Get chat threads error:', error)
      return { success: false, message: 'Failed to get chat threads' }
    }
  }

  async createDirectMessageThread(userId: string): Promise<ApiResponse> {
    try {
      return await this.chatRequest<ApiResponse>('/api/chat/threads/dm', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      })
    } catch (error) {
      console.error('Create DM thread error:', error)
      return { success: false, message: 'Failed to create DM thread' }
    }
  }

  async getChatMessages(threadId: string, before?: string): Promise<ApiResponse> {
    try {
      const url = before ? `/api/chat/messages?threadId=${threadId}&before=${before}` : `/api/chat/messages?threadId=${threadId}`
      return await this.chatRequest<ApiResponse>(url)
    } catch (error) {
      console.error('Get chat messages error:', error)
      return { success: false, message: 'Failed to get chat messages' }
    }
  }

  async sendMessage(content: string, threadId?: string): Promise<ApiResponse> {
    try {
      return await this.chatRequest<ApiResponse>('/api/chat/messages', {
        method: 'POST',
        body: JSON.stringify({ content, threadId }),
      })
    } catch (error) {
      console.error('Send message error:', error)
      return { success: false, message: 'Failed to send message' }
    }
  }

  // Block management
  async blockUser(targetUserId: string): Promise<ApiResponse> {
    try {
      return await this.chatRequest<ApiResponse>('/api/chat/blocks', {
        method: 'POST',
        body: JSON.stringify({ targetUserId }),
      })
    } catch (error) {
      console.error('Block user error:', error)
      return { success: false, message: 'Failed to block user' }
    }
  }

  async unblockUser(targetUserId: string): Promise<ApiResponse> {
    try {
      return await this.chatRequest<ApiResponse>(`/api/chat/blocks/${targetUserId}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Unblock user error:', error)
      return { success: false, message: 'Failed to unblock user' }
    }
  }

  // Game invitations
  async sendGameInvitation(toUserId: string, gameId: string): Promise<ApiResponse> {
    try {
      return await this.chatRequest<ApiResponse>('/api/chat/invitations', {
        method: 'POST',
        body: JSON.stringify({ toUserId, gameId }),
      })
    } catch (error) {
      console.error('Send game invitation error:', error)
      return { success: false, message: 'Failed to send game invitation' }
    }
  }

  async getSentInvitations(): Promise<ApiResponse> {
    try {
      return await this.chatRequest<ApiResponse>('/api/chat/invitations/sent')
    } catch (error) {
      console.error('Get sent invitations error:', error)
      return { success: false, message: 'Failed to get sent invitations' }
    }
  }

  async getReceivedInvitations(): Promise<ApiResponse> {
    try {
      return await this.chatRequest<ApiResponse>('/api/chat/invitations/received')
    } catch (error) {
      console.error('Get received invitations error:', error)
      return { success: false, message: 'Failed to get received invitations' }
    }
  }

  async acceptInvitation(invitationId: string): Promise<ApiResponse> {
    try {
      return await this.chatRequest<ApiResponse>(`/api/chat/invitations/${invitationId}/accept`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Accept invitation error:', error)
      return { success: false, message: 'Failed to accept invitation' }
    }
  }

  async declineInvitation(invitationId: string): Promise<ApiResponse> {
    try {
      return await this.chatRequest<ApiResponse>(`/api/chat/invitations/${invitationId}/decline`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Decline invitation error:', error)
      return { success: false, message: 'Failed to decline invitation' }
    }
  }

  // WebSocket connection
  connectWebSocket(): WebSocket {
    const token = this.authToken
    if (!token) {
      throw new Error('No authentication token available')
    }

    const wsUrl = `${this.chatBaseUrl.replace('http', 'ws')}/api/chat/ws?token=${token}`
    return new WebSocket(wsUrl)
  }

  // Chat statistics
  async getChatStats(): Promise<ApiResponse> {
    try {
      return await this.chatRequest<ApiResponse>('/api/chat/stats')
    } catch (error) {
      console.error('Get chat stats error:', error)
      return { success: false, message: 'Failed to get chat stats' }
    }
  }
}

