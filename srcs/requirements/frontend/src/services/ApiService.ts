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
  private authToken: string | null = null

  constructor() {
    // Base URL for API calls - adjust based on your backend configuration
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    
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
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    // Set default headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
    
    // Add auth token if available
    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })
      
      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('API request error:', error)
      throw error
    }
  }

  // Auth service methods
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await this.request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      
      if (response.success && response.token) {
        this.setAuthToken(response.token)
        localStorage.setItem('username', username)
      }
      
      return response
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: 'Login failed' }
    }
  }

  async register(username: string, email: string, password: string): Promise<ApiResponse> {
    try {
      const response = await this.request<ApiResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      })
      
      return response
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, message: 'Registration failed' }
    }
  }

  async logout(): Promise<ApiResponse> {
    try {
      const response = await this.request<ApiResponse>('/auth/logout', {
        method: 'POST',
      })
      
      this.clearAuthToken()
      localStorage.removeItem('username')
      
      return response
    } catch (error) {
      console.error('Logout error:', error)
      return { success: false, message: 'Logout failed' }
    }
  }

  // User service methods
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      return await this.request<User>('/users/me')
    } catch (error) {
      console.error('Get current user error:', error)
      return { success: false, message: 'Failed to get user data' }
    }
  }

  async updateAccount(username?: string, email?: string): Promise<ApiResponse> {
    try {
      const data: any = {}
      if (username) data.username = username
      if (email) data.email = email
      
      return await this.request<ApiResponse>('/users/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error('Update account error:', error)
      return { success: false, message: 'Failed to update account' }
    }
  }

  async getUserStats(): Promise<ApiResponse> {
    try {
      return await this.request<ApiResponse>('/users/me/stats')
    } catch (error) {
      console.error('Get user stats error:', error)
      return { success: false, message: 'Failed to get user stats' }
    }
  }

  // Game service methods
  async getGameSettings(): Promise<ApiResponse<GameSettings>> {
    try {
      return await this.request<GameSettings>('/games/settings')
    } catch (error) {
      console.error('Get game settings error:', error)
      return { success: false, message: 'Failed to get game settings' }
    }
  }

  async updateGameSettings(settings: GameSettings): Promise<ApiResponse> {
    try {
      return await this.request<ApiResponse>('/games/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      })
    } catch (error) {
      console.error('Update game settings error:', error)
      return { success: false, message: 'Failed to update game settings' }
    }
  }

  async createMatch(gameType: 'pong' | 'breakout'): Promise<ApiResponse> {
    try {
      return await this.request<ApiResponse>('/games/matches', {
        method: 'POST',
        body: JSON.stringify({ gameType }),
      })
    } catch (error) {
      console.error('Create match error:', error)
      return { success: false, message: 'Failed to create match' }
    }
  }

  async joinMatch(matchId: string): Promise<ApiResponse> {
    try {
      return await this.request<ApiResponse>(`/games/matches/${matchId}/join`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Join match error:', error)
      return { success: false, message: 'Failed to join match' }
    }
  }

  async getMatchHistory(): Promise<ApiResponse> {
    try {
      return await this.request<ApiResponse>('/games/matches/history')
    } catch (error) {
      console.error('Get match history error:', error)
      return { success: false, message: 'Failed to get match history' }
    }
  }

  // Chat service methods
  async getChatThreads(): Promise<ApiResponse> {
    try {
      return await this.request<ApiResponse>('/chat/threads')
    } catch (error) {
      console.error('Get chat threads error:', error)
      return { success: false, message: 'Failed to get chat threads' }
    }
  }

  async getChatMessages(threadId: string, before?: string): Promise<ApiResponse> {
    try {
      const url = before ? `/chat/threads/${threadId}/messages?before=${before}` : `/chat/threads/${threadId}/messages`
      return await this.request<ApiResponse>(url)
    } catch (error) {
      console.error('Get chat messages error:', error)
      return { success: false, message: 'Failed to get chat messages' }
    }
  }

  async sendMessage(threadId: string, content: string): Promise<ApiResponse> {
    try {
      return await this.request<ApiResponse>(`/chat/threads/${threadId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      })
    } catch (error) {
      console.error('Send message error:', error)
      return { success: false, message: 'Failed to send message' }
    }
  }

  async createThread(userId: string): Promise<ApiResponse> {
    try {
      return await this.request<ApiResponse>('/chat/threads', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      })
    } catch (error) {
      console.error('Create thread error:', error)
      return { success: false, message: 'Failed to create thread' }
    }
  }

  async blockUser(userId: string): Promise<ApiResponse> {
    try {
      return await this.request<ApiResponse>('/chat/blocks', {
        method: 'POST',
        body: JSON.stringify({ blockedId: userId }),
      })
    } catch (error) {
      console.error('Block user error:', error)
      return { success: false, message: 'Failed to block user' }
    }
  }

  async unblockUser(userId: string): Promise<ApiResponse> {
    try {
      return await this.request<ApiResponse>(`/chat/blocks/${userId}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Unblock user error:', error)
      return { success: false, message: 'Failed to unblock user' }
    }
  }

  async inviteToGame(userId: string, gameType: 'pong' | 'breakout'): Promise<ApiResponse> {
    try {
      return await this.request<ApiResponse>('/chat/invitations', {
        method: 'POST',
        body: JSON.stringify({ toUserId: userId, gameType }),
      })
    } catch (error) {
      console.error('Invite to game error:', error)
      return { success: false, message: 'Failed to invite to game' }
    }
  }

  // Blockchain service methods
  async getTournamentScores(): Promise<ApiResponse> {
    try {
      return await this.request<ApiResponse>('/blockchain/tournaments/scores')
    } catch (error) {
      console.error('Get tournament scores error:', error)
      return { success: false, message: 'Failed to get tournament scores' }
    }
  }

  async saveTournamentScore(tournamentId: string, score: number): Promise<ApiResponse> {
    try {
      return await this.request<ApiResponse>('/blockchain/tournaments/scores', {
        method: 'POST',
        body: JSON.stringify({ tournamentId, score }),
      })
    } catch (error) {
      console.error('Save tournament score error:', error)
      return { success: false, message: 'Failed to save tournament score' }
    }
  }
}

