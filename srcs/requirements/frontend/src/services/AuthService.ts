import { ApiService, User, LoginResponse } from './ApiService'

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
}

export class AuthService {
  private apiService: ApiService
  private listeners: Array<(state: AuthState) => void> = []
  private state: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: false,
    error: null
  }

  constructor() {
    this.apiService = new ApiService()
    this.initializeAuth()
  }

  private initializeAuth() {
    console.log('AuthService: Initializing authentication...')

    const token = localStorage.getItem('authToken')
    const userStr = localStorage.getItem('user')

    console.log('AuthService: Token from localStorage:', token ? 'exists' : 'not found')
    console.log('AuthService: User from localStorage:', userStr ? 'exists' : 'not found')

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        console.log('AuthService: Parsed user:', user)

        this.updateState({
          isAuthenticated: true,
          user,
          token,
          isLoading: false,
          error: null
        })
        this.apiService.setAuthToken(token)
        console.log('AuthService: Authentication initialized successfully')
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error)
        this.logout()
      }
    } else {
      console.log('AuthService: No auth data found in localStorage')
    }
  }

  private updateState(newState: Partial<AuthState>) {
    this.state = { ...this.state, ...newState }
    this.notifyListeners()
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state))
  }

  public subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener)
    listener(this.state)

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  public getState(): AuthState {
    return { ...this.state }
  }

  public getAuthHeader(): string | null {
    return this.state.token ? `Bearer ${this.state.token}` : null
  }

  public async login(email: string, password: string): Promise<LoginResponse> {
    this.updateState({ isLoading: true, error: null })

    try {
      const response = await this.apiService.login(email, password)

      if (response.success && response.data && response.data.token && response.data.user) {
        // Save to localStorage for persistence
        localStorage.setItem('authToken', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))

        this.updateState({
          isAuthenticated: true,
          user: response.data.user,
          token: response.data.token,
          isLoading: false,
          error: null
        })

        return response
      } else {
        const errorMessage = response.message || 'Login failed'
        this.updateState({
          isAuthenticated: false,
          user: null,
          token: null,
          isLoading: false,
          error: errorMessage
        })

        return { success: false, message: errorMessage }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      this.updateState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: errorMessage
      })

      return { success: false, message: errorMessage }
    }
  }

  public async register(username: string, email: string, password: string, displayName: string): Promise<{ success: boolean; message?: string }> {
    this.updateState({ isLoading: true, error: null })

    try {
      const response = await this.apiService.register(username, email, password, displayName)

      if (response.success) {
        this.updateState({ isLoading: false })
        return { success: true, message: 'Registration successful' }
      } else {
        const errorMessage = response.message || 'Registration failed'
        this.updateState({
          isLoading: false,
          error: errorMessage
        })

        return { success: false, message: errorMessage }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      this.updateState({
        isLoading: false,
        error: errorMessage
      })

      return { success: false, message: errorMessage }
    }
  }

  public async logout(): Promise<void> {
    try {
      await this.apiService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    }

    this.updateState({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
      error: null
    })

    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  }

  public async refreshUser(): Promise<boolean> {
    if (!this.state.isAuthenticated || !this.state.user) {
      return false
    }

    try {
      const response = await this.apiService.getUserById(this.state.user.id)

      if (response.success && response.data) {
        this.updateState({ user: response.data })
        localStorage.setItem('user', JSON.stringify(response.data))
        return true
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }

    return false
  }

  public clearError(): void {
    this.updateState({ error: null })
  }

  // OAuth Google Login
  public async loginWithGoogle(): Promise<void> {
    // This would open the Google OAuth flow
    // For now, we'll just redirect to the Google OAuth endpoint
    window.location.href = `${this.apiService['userBaseUrl']}/api/auth/google`
  }

  public handleOAuthCallback(): void {
    // This would be called after OAuth redirect
    // Parse the token from URL and update state
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    const user = urlParams.get('user')

    if (token && user) {
      try {
        const userObj = JSON.parse(decodeURIComponent(user))
        this.updateState({
          isAuthenticated: true,
          user: userObj,
          token,
          isLoading: false,
          error: null
        })

        localStorage.setItem('authToken', token)
        localStorage.setItem('user', JSON.stringify(userObj))
        this.apiService.setAuthToken(token)

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch (error) {
        console.error('Failed to parse OAuth callback:', error)
        this.updateState({
          isAuthenticated: false,
          user: null,
          token: null,
          isLoading: false,
          error: 'OAuth login failed'
        })
      }
    }
  }
}

// Export singleton instance
export const authService = new AuthService()