import { authService, AuthState } from '../services/AuthService'

export interface AuthGuardOptions {
  requireAuth?: boolean
  redirectPath?: string
  onAuthChange?: (isAuthenticated: boolean) => void
}

export class AuthGuard {
  private options: AuthGuardOptions
  private unsubscribe?: () => void

  constructor(options: AuthGuardOptions = {}) {
    this.options = {
      requireAuth: true,
      redirectPath: '/login',
      ...options
    }
  }

  public protect(element: HTMLElement): void {
    // Get current auth state
    const currentState = authService.getState()
    const isAuthenticated = currentState.isAuthenticated

    // Check if auth is required
    if (this.options.requireAuth && !isAuthenticated) {
      this.redirectToLogin()
      return
    }

    // Subscribe to auth changes
    this.unsubscribe = authService.subscribe((state: AuthState) => {
      if (this.options.requireAuth && !state.isAuthenticated) {
        this.redirectToLogin()
      } else if (!this.options.requireAuth && state.isAuthenticated) {
        // If we don't require auth but user is logged in, redirect to profile
        window.location.hash = '#/profile'
      }

      // Call custom callback if provided
      if (this.options.onAuthChange) {
        this.options.onAuthChange(state.isAuthenticated)
      }
    })
  }

  private redirectToLogin(): void {
    // Store the current path to redirect back after login
    const currentPath = window.location.hash || '#/'
    if (currentPath !== '#/login' && currentPath !== '#/register') {
      sessionStorage.setItem('redirectAfterLogin', currentPath)
    }

    window.location.hash = this.options.redirectPath!
  }

  public destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = undefined
    }
  }
}

// Utility functions
export function createAuthGuard(element: HTMLElement, options: AuthGuardOptions = {}): AuthGuard {
  const guard = new AuthGuard(options)
  guard.protect(element)
  return guard
}

export function requireAuth(element: HTMLElement): AuthGuard {
  return createAuthGuard(element, { requireAuth: true, redirectPath: '#/login' })
}

export function requireGuest(element: HTMLElement): AuthGuard {
  return createAuthGuard(element, { requireAuth: false, redirectPath: '#/profile' })
}