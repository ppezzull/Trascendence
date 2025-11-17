export interface Route {
  path: string
  callback: () => void
}

export class Router {
  private routes: Map<string, () => void> = new Map()
  private notFoundCallback: () => void = () => {}
  private currentPath: string = ''
  private isInitialized: boolean = false

  constructor() {
    // Don't initialize immediately - wait for routes to be added
  }

  private init() {
    if (this.isInitialized) return

    // Handle initial route
    this.handleRoute()

    // Listen for popstate events (browser back/forward buttons)
    window.addEventListener('popstate', () => {
      this.handleRoute()
    })

    // Intercept all anchor clicks to use History API
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')

      if (anchor && anchor.href) {
        const url = new URL(anchor.href)
        // Only handle internal links
        if (url.origin === window.location.origin) {
          e.preventDefault()
          this.navigate(url.pathname)
        }
      }
    })

    this.isInitialized = true
  }

  public addRoute(path: string, callback: () => void): void {
    this.routes.set(path, callback)
  }

  public setNotFoundCallback(callback: () => void): void {
    this.notFoundCallback = callback
  }

  public start(): void {
    // Initialize router now that all routes have been added
    this.init()
    console.log('Router started')
  }

  private handleRoute(): void {
    // Get current pathname
    const path = window.location.pathname
    
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
    // Use History API to navigate
    window.history.pushState({}, '', path)
    this.handleRoute()
  }

  public getCurrentPath(): string {
    return this.currentPath
  }
}

