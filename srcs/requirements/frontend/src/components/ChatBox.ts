import { ApiService } from '../services/ApiService'
import { chatWebSocketService, ChatMessage, ChatUser } from '../services/ChatWebSocketService'
import { authService } from '../services/AuthService'

export interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: Date
  threadId: number
  isSystem?: boolean
}

export interface User {
  id: string
  username: string
  status: 'online' | 'offline' | 'away'
  isBlocked?: boolean
}

export class ChatBox {
  private apiService: ApiService
  private messages: Message[] = []
  private users: User[] = []
  private currentThreadId: number | null = null
  private messageContainer: HTMLElement | null = null
  private currentUserId: number | null = null
  private wsUnsubscribers: Array<() => void> = []

  constructor() {
    this.apiService = new ApiService()
    this.initializeWebSocket()
    this.loadCurrentUser()
  }

  private initializeWebSocket() {
    // Subscribe to WebSocket events
    this.wsUnsubscribers.push(
      chatWebSocketService.onMessage((message: ChatMessage) => {
        this.handleWebSocketMessage(message)
      })
    )

    this.wsUnsubscribers.push(
      chatWebSocketService.onPresence((userId: number, status: string) => {
        this.handlePresenceUpdate(userId, status)
      })
    )

    this.wsUnsubscribers.push(
      chatWebSocketService.onConnection((connected: boolean) => {
        this.handleConnectionChange(connected)
      })
    )
  }

  private loadCurrentUser() {
    const authState = authService.getState()
    if (authState.isAuthenticated && authState.user) {
      this.currentUserId = authState.user.id
    }
  }

  private handleWebSocketMessage(message: ChatMessage) {
    if (this.currentThreadId && message.threadId === this.currentThreadId) {
      const transformedMessage: Message = {
        id: message.id,
        senderId: message.senderId.toString(),
        senderName: message.senderName,
        content: message.content,
        timestamp: message.timestamp,
        threadId: message.threadId,
        isSystem: message.isSystem
      }

      this.messages.push(transformedMessage)
      this.renderMessages()
    }
  }

  private handlePresenceUpdate(userId: number, status: string) {
    const user = this.users.find(u => parseInt(u.id) === userId)
    if (user) {
      user.status = status as 'online' | 'offline' | 'away'
      this.renderUsers()
    }
  }

  private handleConnectionChange(connected: boolean) {
    const statusElement = document.getElementById('connection-status')
    if (statusElement) {
      statusElement.className = connected ?
        'text-cyber-green text-xs' :
        'text-cyber-magenta text-xs'
      statusElement.textContent = connected ? 'Connesso' : 'Disconnesso'
    }
  }

  render(container: HTMLElement) {
    container.innerHTML = `
      <div class="cyber-panel h-full flex flex-col">
        <!-- Chat Header -->
        <div class="border-b border-cyber-green pb-2 mb-4 flex justify-between items-center">
          <h2 class="cyber-title text-lg">CHAT CYBER</h2>
          <div id="connection-status" class="text-cyber-green text-xs">Connessione...</div>
        </div>

        <!-- Chat Content -->
        <div class="flex flex-1 overflow-hidden">
          <!-- Users Sidebar -->
          <div class="w-1/3 border-r border-cyber-green pr-4 overflow-y-auto">
            <h3 class="text-cyber-green font-bold mb-3">UTENTI ONLINE</h3>
            <div id="users-list" class="space-y-2">
              <!-- Users will be rendered here -->
            </div>
          </div>

          <!-- Messages Area -->
          <div class="flex-1 pl-4 flex flex-col">
            <!-- Thread Info -->
            <div id="thread-info" class="mb-2 text-cyber-cyan text-sm">
              <!-- Current thread info will be shown here -->
            </div>

            <!-- Messages Container -->
            <div id="messages-container" class="flex-1 overflow-y-auto mb-4 space-y-2">
              <!-- Messages will be rendered here -->
            </div>

            <!-- Message Input -->
            <div class="flex space-x-2">
              <input
                type="text"
                id="message-input"
                class="cyber-input flex-1"
                placeholder="Seleziona un utente per iniziare a chattare..."
                maxlength="500"
                disabled
              >
              <button id="send-button" class="cyber-button" disabled>Invia</button>
            </div>
          </div>
        </div>
      </div>
    `
    
    // Store reference to message container
    this.messageContainer = document.getElementById('messages-container')
    
    // Add event listeners
    this.addEventListeners()

    // Load initial data
    this.loadUsers()
    this.loadMessages() // Load welcome message
  }

  private addEventListeners() {
    const sendButton = document.getElementById('send-button')
    const messageInput = document.getElementById('message-input') as HTMLInputElement
    
    if (sendButton && messageInput) {
      sendButton.addEventListener('click', () => this.sendMessage())
      
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          sendButton.click()
        }
      })
    }
  }

  private async loadUsers() {
    try {
      // For now, we'll use a mix of mock data and online presence
      // In a real implementation, this would fetch users from API and filter by online status
      this.users = [
        { id: '1', username: 'CyberPlayer', status: 'online' },
        { id: '2', username: 'NeonRider', status: 'online' },
        { id: '3', username: 'PixelWarrior', status: 'away' },
        { id: '4', username: 'DigitalNinja', status: 'offline' }
      ]

      this.renderUsers()
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  private async loadMessages(threadId?: number) {
    try {
      if (threadId) {
        const response = await this.apiService.getChatMessages(threadId.toString())

        if (response.success && response.data) {
          this.messages = response.data.map((msg: any) => ({
            id: msg.id.toString(),
            senderId: msg.senderId.toString(),
            senderName: msg.senderName,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            threadId: msg.threadId,
            isSystem: msg.isSystem || false
          }))
        } else {
          // Show welcome message for new thread
          this.messages = [{
            id: 'welcome',
            senderId: 'system',
            senderName: 'System',
            content: 'Chat iniziata! Invia un messaggio per iniziare la conversazione.',
            timestamp: new Date(),
            threadId: threadId,
            isSystem: true
          }]
        }
      } else {
        this.messages = [{
          id: 'welcome',
          senderId: 'system',
          senderName: 'System',
          content: 'Benvenuto nella chat cyberpunk! Seleziona un utente per iniziare a chattare.',
          timestamp: new Date(),
          threadId: 0,
          isSystem: true
        }]
      }

      this.renderMessages()
    } catch (error) {
      console.error('Error loading messages:', error)
      // Show error message
      this.messages = [{
        id: 'error',
        senderId: 'system',
        senderName: 'System',
        content: 'Errore nel caricamento dei messaggi. Riprova più tardi.',
        timestamp: new Date(),
        threadId: this.currentThreadId || 0,
        isSystem: true
      }]
      this.renderMessages()
    }
  }

  private renderUsers() {
    const usersList = document.getElementById('users-list')
    if (!usersList) return
    
    usersList.innerHTML = this.users.map(user => `
      <div class="cyber-card p-2 cursor-pointer hover:border-cyber-cyan" data-user-id="${user.id}">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <div class="w-2 h-2 rounded-full ${
              user.status === 'online' ? 'bg-cyber-green' :
              user.status === 'away' ? 'bg-cyber-yellow' :
              'bg-cyber-dark'
            }"></div>
            <span class="text-cyber-green text-sm">${user.username}</span>
          </div>
          <div class="flex space-x-1">
            <button class="text-cyber-cyan hover:text-cyber-green text-xs" onclick="chatBox.inviteToGame('${user.id}')">Invita</button>
            <button class="text-cyber-magenta hover:text-cyber-red text-xs" onclick="chatBox.toggleBlockUser('${user.id}')">${user.isBlocked ? 'Sblocca' : 'Blocca'}</button>
          </div>
        </div>
      </div>
    `).join('')
    
    // Add click event to open chat with user
    usersList.querySelectorAll('[data-user-id]').forEach(userElement => {
      userElement.addEventListener('click', (e) => {
        // Don't open chat if clicking on buttons
        if ((e.target as HTMLElement).tagName === 'BUTTON') return
        
        const userId = userElement.getAttribute('data-user-id')
        if (userId) this.openChatWithUser(userId)
      })
    })
  }

  private renderMessages() {
    if (!this.messageContainer) return

    this.messageContainer.innerHTML = this.messages.map(message => `
      <div class="flex ${
        message.isSystem ? 'justify-center' :
        message.senderId === this.currentUserId?.toString() ? 'justify-end' : 'justify-start'
      }">
        <div class="${
          message.isSystem ? 'bg-cyber-dark/50 text-cyber-cyan text-xs italic px-2 py-1 rounded' :
          message.senderId === this.currentUserId?.toString() ? 'cyber-panel max-w-xs' :
          'cyber-card max-w-xs'
        }">
          ${!message.isSystem ? `
            <div class="text-xs text-cyber-cyan mb-1">${message.senderName}</div>
          ` : ''}
          <div class="terminal-text">${message.content}</div>
          <div class="text-xs text-cyber-green/70 mt-1">
            ${this.formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    `).join('')

    // Scroll to bottom
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight
  }

  private async sendMessage() {
    const messageInput = document.getElementById('message-input') as HTMLInputElement
    if (!messageInput || !this.currentThreadId) return

    const content = messageInput.value.trim()
    if (!content) return

    try {
      // Send message via API
      const response = await this.apiService.sendMessage(this.currentThreadId.toString(), content)

      if (response.success) {
        // Clear input after successful send
        messageInput.value = ''
      } else {
        this.showNotification('Errore nell\'invio del messaggio', 'error')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      this.showNotification('Errore nell\'invio del messaggio', 'error')
    }
  }

  private async openChatWithUser(userId: string) {
    const user = this.users.find(u => u.id === userId)
    if (!user) return

    try {
      // Create or get existing DM thread
      const response = await this.apiService.createDMThread(parseInt(userId))

      if (response.success && response.data) {
        this.currentThreadId = response.data.id
        this.updateThreadInfo(user.username)
        this.enableMessageInput()
        await this.loadMessages(this.currentThreadId)
        this.showNotification(`Chat aperta con ${user.username}`, 'success')
      } else {
        this.showNotification('Impossibile aprire la chat', 'error')
      }
    } catch (error) {
      console.error('Error opening chat with user:', error)
      this.showNotification('Errore nell\'apertura della chat', 'error')
    }
  }

  private updateThreadInfo(username: string) {
    const threadInfo = document.getElementById('thread-info')
    if (threadInfo) {
      threadInfo.textContent = `Chat con ${username}`
    }
  }

  private enableMessageInput() {
    const messageInput = document.getElementById('message-input') as HTMLInputElement
    const sendButton = document.getElementById('send-button')

    if (messageInput && sendButton) {
      messageInput.disabled = false
      messageInput.placeholder = 'Digita un messaggio...'
      sendButton.removeAttribute('disabled')
    }
  }

  private disableMessageInput() {
    const messageInput = document.getElementById('message-input') as HTMLInputElement
    const sendButton = document.getElementById('send-button')

    if (messageInput && sendButton) {
      messageInput.disabled = true
      messageInput.placeholder = 'Seleziona un utente per iniziare a chattare...'
      sendButton.setAttribute('disabled', 'true')
    }
  }

  private async inviteToGame(userId: string) {
    const user = this.users.find(u => u.id === userId)
    if (!user) return

    try {
      // Send game invitation via API
      const response = await this.apiService.sendGameInvitation(parseInt(userId))

      if (response.success) {
        this.showNotification(`Invito di gioco inviato a ${user.username}`, 'success')

        // Add system message if we have an active thread
        if (this.currentThreadId) {
          const systemMessage: Message = {
            id: Date.now().toString(),
            senderId: 'system',
            senderName: 'System',
            content: `Hai invitato ${user.username} a una partita`,
            timestamp: new Date(),
            threadId: this.currentThreadId,
            isSystem: true
          }

          this.messages.push(systemMessage)
          this.renderMessages()
        }
      } else {
        this.showNotification('Impossibile inviare l\'invito di gioco', 'error')
      }
    } catch (error) {
      console.error('Error inviting to game:', error)
      this.showNotification('Errore nell\'invio dell\'invito', 'error')
    }
  }

  private async toggleBlockUser(userId: string) {
    const user = this.users.find(u => u.id === userId)
    if (!user) return

    try {
      const targetUserId = parseInt(userId)
      let response

      if (user.isBlocked) {
        // Unblock user
        response = await this.apiService.unblockUser(targetUserId)
      } else {
        // Block user
        response = await this.apiService.blockUser(targetUserId)
      }

      if (response.success) {
        user.isBlocked = !user.isBlocked
        this.renderUsers()
        this.showNotification(
          user.isBlocked ? `${user.username} bloccato` : `${user.username} sbloccato`,
          'success'
        )
      } else {
        this.showNotification('Operazione fallita', 'error')
      }
    } catch (error) {
      console.error('Error toggling block user:', error)
      this.showNotification('Errore nell\'operazione', 'error')
    }
  }

  public cleanup() {
    // Unsubscribe from WebSocket events
    this.wsUnsubscribers.forEach(unsubscribe => unsubscribe())
    this.wsUnsubscribers = []
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    })
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

// Make the chatBox instance globally available for button onclick handlers
declare global {
  interface Window {
    chatBox: ChatBox
  }
}
