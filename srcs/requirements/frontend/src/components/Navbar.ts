export class Navbar {
  private isMenuOpen = false

  render(container: HTMLElement) {
    container.innerHTML = `
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <a href="#/" class="text-cyber-green font-bold text-xl tracking-wider hover:text-cyber-cyan transition-colors">
              TRAScENDENCE
            </a>
          </div>
          
          <!-- Desktop Navigation -->
          <nav class="hidden md:block">
            <ul class="flex space-x-8">
              <li>
                <a href="#/" class="text-cyber-green hover:text-cyber-cyan transition-colors">Home</a>
              </li>
              <li>
                <a href="#/games" class="text-cyber-green hover:text-cyber-cyan transition-colors">Giochi</a>
              </li>
              <li>
                <a href="#/chat" class="text-cyber-green hover:text-cyber-cyan transition-colors">Chat</a>
              </li>
              <li>
                <a href="#/profile" class="text-cyber-green hover:text-cyber-cyan transition-colors">Profilo</a>
              </li>
              <li>
                <a href="#/settings" class="text-cyber-green hover:text-cyber-cyan transition-colors">Impostazioni</a>
              </li>
            </ul>
          </nav>
          
          <!-- User Actions -->
          <div class="hidden md:block">
            <div id="user-actions" class="flex items-center space-x-4">
              <!-- User is not logged in -->
              <div id="guest-actions" class="flex space-x-2">
                <a href="#/login" class="cyber-button text-sm">Accedi</a>
                <a href="#/register" class="cyber-button text-sm">Registrati</a>
              </div>
              
              <!-- User is logged in (hidden by default) -->
              <div id="user-menu" class="hidden">
                <div class="flex items-center space-x-4">
                  <span id="username-display" class="text-cyber-green">CyberPlayer</span>
                  <button id="logout-btn" class="cyber-button text-sm">Logout</button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Mobile menu button -->
          <div class="md:hidden">
            <button id="mobile-menu-button" class="text-cyber-green hover:text-cyber-cyan focus:outline-none">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Mobile Navigation -->
        <div id="mobile-menu" class="hidden md:hidden">
          <div class="px-2 pt-2 pb-3 space-y-1 border-t border-cyber-green">
            <a href="#/" class="block px-3 py-2 text-cyber-green hover:text-cyber-cyan">Home</a>
            <a href="#/games" class="block px-3 py-2 text-cyber-green hover:text-cyber-cyan">Giochi</a>
            <a href="#/chat" class="block px-3 py-2 text-cyber-green hover:text-cyber-cyan">Chat</a>
            <a href="#/profile" class="block px-3 py-2 text-cyber-green hover:text-cyber-cyan">Profilo</a>
            <a href="#/settings" class="block px-3 py-2 text-cyber-green hover:text-cyber-cyan">Impostazioni</a>
            
            <div class="pt-4 pb-3 border-t border-cyber-green">
              <!-- Mobile guest actions -->
              <div id="mobile-guest-actions" class="space-y-2">
                <a href="#/login" class="block px-3 py-2 text-cyber-green hover:text-cyber-cyan">Accedi</a>
                <a href="#/register" class="block px-3 py-2 text-cyber-green hover:text-cyber-cyan">Registrati</a>
              </div>
              
              <!-- Mobile user menu (hidden by default) -->
              <div id="mobile-user-menu" class="hidden space-y-2">
                <div class="px-3 py-2 text-cyber-green">
                  <span id="mobile-username-display">CyberPlayer</span>
                </div>
                <button id="mobile-logout-btn" class="block px-3 py-2 text-cyber-green hover:text-cyber-cyan text-left w-full">Logout</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    
    // Add event listeners
    this.addEventListeners()
    
    // Check if user is logged in
    this.updateUserUI()
  }

  private addEventListeners() {
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button')
    const mobileMenu = document.getElementById('mobile-menu')
    
    if (mobileMenuButton && mobileMenu) {
      mobileMenuButton.addEventListener('click', () => {
        this.isMenuOpen = !this.isMenuOpen
        
        if (this.isMenuOpen) {
          mobileMenu.classList.remove('hidden')
        } else {
          mobileMenu.classList.add('hidden')
        }
      })
    }
    
    // Logout buttons
    const logoutBtn = document.getElementById('logout-btn')
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn')
    
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout())
    }
    
    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', () => this.handleLogout())
    }
  }

  private updateUserUI() {
    // Check if user is logged in
    const authToken = localStorage.getItem('authToken')
    const username = localStorage.getItem('username') || 'CyberPlayer'
    
    const guestActions = document.getElementById('guest-actions')
    const userMenu = document.getElementById('user-menu')
    const mobileGuestActions = document.getElementById('mobile-guest-actions')
    const mobileUserMenu = document.getElementById('mobile-user-menu')
    
    const usernameDisplay = document.getElementById('username-display')
    const mobileUsernameDisplay = document.getElementById('mobile-username-display')
    
    if (authToken) {
      // User is logged in
      if (guestActions) guestActions.classList.add('hidden')
      if (userMenu) userMenu.classList.remove('hidden')
      if (mobileGuestActions) mobileGuestActions.classList.add('hidden')
      if (mobileUserMenu) mobileUserMenu.classList.remove('hidden')
      
      if (usernameDisplay) usernameDisplay.textContent = username
      if (mobileUsernameDisplay) mobileUsernameDisplay.textContent = username
    } else {
      // User is not logged in
      if (guestActions) guestActions.classList.remove('hidden')
      if (userMenu) userMenu.classList.add('hidden')
      if (mobileGuestActions) mobileGuestActions.classList.remove('hidden')
      if (mobileUserMenu) mobileUserMenu.classList.add('hidden')
    }
  }

  private handleLogout() {
    // Clear auth data
    localStorage.removeItem('authToken')
    localStorage.removeItem('username')
    
    // Update UI
    this.updateUserUI()
    
    // Redirect to home
    window.location.hash = '#/'
    
    // Show notification
    this.showNotification('Logout effettuato con successo', 'success')
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    // Create notification element
    const notification = document.createElement('div')
    notification.className = `fixed top-20 right-4 p-4 rounded-md z-50 max-w-sm ${
      type === 'success' ? 'bg-cyber-green text-cyber-black' :
      type === 'error' ? 'bg-cyber-magenta text-white' :
      'bg-cyber-cyan text-cyber-black'
    }`
    notification.textContent = message
    
    // Add to DOM
    document.body.appendChild(notification)
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 3000)
  }
}

