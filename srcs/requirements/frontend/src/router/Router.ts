export interface Route {
  path: string
  callback: () => void
}

export class Router {
  private routes: Map<string, () => void> = new Map()
  private notFoundCallback: () => void = () => {}
  private currentPath: string = ''

  constructor() {
    // Initialize router
    this.init()
  }

  private init() {
    // Handle initial route
    this.handleRoute()
    
    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      this.handleRoute()
    })
  }

  public addRoute(path: string, callback: () => void): void {
    this.routes.set(path, callback)
  }

  public setNotFoundCallback(callback: () => void): void {
    this.notFoundCallback = callback
  }

  public start(): void {
    // Router is already initialized in constructor
    console.log('Router started')
  }

  private handleRoute(): void {
    // Get current hash path
    const hash = window.location.hash
    const path = hash.replace('#', '') || '/'
    
    // Only handle if path has changed
    if (path === this.currentPath) return
    this.currentPath = path
    
    // Find matching route
    const routeCallback = this.routes.get(path)
    
    if (routeCallback) {
      routeCallback()
    } else {
      // Check for dynamic routes (e.g., /profile/:id)
      const matchedRoute = this.findDynamicRoute(path)
      
      if (matchedRoute) {
        matchedRoute.callback()
      } else {
        // Route not found
        this.notFoundCallback()
      }
    }
  }

  private findDynamicRoute(path: string): { path: string, callback: () => void } | null {
    // Simple dynamic route matching
    // This could be enhanced with more sophisticated pattern matching
    
    for (const [routePath, callback] of this.routes.entries()) {
      // Check if route has dynamic segments (e.g., /profile/:id)
      if (routePath.includes(':')) {
        const routeSegments = routePath.split('/')
        const pathSegments = path.split('/')
        
        if (routeSegments.length === pathSegments.length) {
          let isMatch = true
          
          for (let i = 0; i < routeSegments.length; i++) {
            // Skip dynamic segments
            if (!routeSegments[i].startsWith(':') && routeSegments[i] !== pathSegments[i]) {
              isMatch = false
              break
            }
          }
          
          if (isMatch) {
            return { path: routePath, callback }
          }
        }
      }
    }
    
    return null
  }

  public navigate(path: string): void {
    window.location.hash = `#${path}`
  }

  public getCurrentPath(): string {
    return this.currentPath
  }
}

