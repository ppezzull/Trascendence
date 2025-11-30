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
  private searchResults: any[] = []
  private _chatThreads: any[] = []
  private searchDebounceTimer: number | null = null
  private threadParticipants: Map<number, any> = new Map() // Cache for participant info
  
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
      this.currentUserId = parseInt(authState.user.id.toString())
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
            <h3 class="text-cyber-green font-bold mb-3">Le tue chat</h3>
            <div id="chat-threads-list" class="space-y-2">
              <!-- Chat threads will be rendered here -->
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
    const searchInput = document.getElementById('user-search-input') as HTMLInputElement
    
    if (sendButton && messageInput) {
      sendButton.addEventListener('click', () => this.sendMessage())
      
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          sendButton.click()
        }
      })
    }
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = (e.target as HTMLInputElement).value.trim()
        this.handleUserSearch(query)
      })
    }
  }

  private async loadUsers() {
    try {
      // Load chat threads instead of users
      await this.loadChatThreads()
      // renderUsers is now called inside loadChatThreads
    } catch (error) {
      console.error('Error loading chat threads:', error)
    }
  }

  private async loadMessages(threadId?: number) {
    try {
      if (threadId) {
        const response = await this.apiService.getChatMessages(threadId.toString())

        if (response && Array.isArray(response)) {
          this.messages = response.map((msg: any) => ({
            id: msg.id.toString(),
            senderId: msg.sender_id.toString(),
            senderName: msg.sender_name || 'Unknown', // Dovremmo ottenere questo dato dal backend
            content: msg.content,
            timestamp: new Date(msg.created_at),
            threadId: msg.thread_id,
            isSystem: msg.is_system === 1
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
    console.log('renderUsers called, _chatThreads length:', this._chatThreads.length)
    console.log('_chatThreads content:', this._chatThreads)
    const chatThreadsList = document.getElementById('chat-threads-list')
    if (!chatThreadsList) return
    
    console.log('Rendering chat threads:', this._chatThreads)
    console.log('Thread participants:', this.threadParticipants)
    
    if (this._chatThreads.length === 0) {
      chatThreadsList.innerHTML = '<div class="text-cyber-green/50 text-sm text-center py-4">Nessuna chat trovata</div>'
      return
    }
    
    chatThreadsList.innerHTML = this._chatThreads.map(thread => {
      // Find other participant (not current user)
      const otherParticipantId = thread.members.find((id: number) => id !== this.currentUserId)
      const lastMessage = thread.lastMessage
      const lastMessagePreview = lastMessage ? 
        (lastMessage.content.length > 15 ? lastMessage.content.substring(0, 15) + '...' : lastMessage.content) : 
        'Nessun messaggio'
      
      // Get participant info from cache
      const participantInfo = this.threadParticipants.get(otherParticipantId)
      const displayName = participantInfo ? 
        (participantInfo.display_name || participantInfo.username) : 
        `Utente ${otherParticipantId}`
      
      console.log('Thread:', thread, 'Other participant:', otherParticipantId, 'Display name:', displayName)
      
      return `
        <div class="cyber-card p-2 cursor-pointer hover:border-cyber-cyan" data-thread-id="${thread.id}">
          <div class="flex justify-between items-center">
            <div class="flex-1">
              <div class="text-cyber-green text-sm font-medium">${displayName}</div>
              <div class="text-cyber-green/50 text-xs mt-1">${lastMessagePreview}</div>
            </div>
            <div class="text-cyber-green/30 text-xs">
              ${lastMessage ? this.formatTime(new Date(lastMessage.created_at)) : ''}
            </div>
          </div>
        </div>
      `
    }).join('')
    
    // Add click event to open chat thread
    chatThreadsList.querySelectorAll('[data-thread-id]').forEach(threadElement => {
      threadElement.addEventListener('click', () => {
        const threadId = threadElement.getAttribute('data-thread-id')
        if (threadId) this.openChatThread(parseInt(threadId))
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
          <div class="text-xs text-cyber-green/70 mt-1 flex justify-between items-center">
            <span>${this.formatTime(message.timestamp)}</span>
            ${!message.isSystem && message.senderId === this.currentUserId?.toString() ? 
              `<button class="ml-2 text-cyber-magenta hover:text-cyber-red text-xs" onclick="chatBox.deleteMessage('${message.id}')">Elimina</button>` : 
              ''
            }
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

      // Check if response is successful (either has success: true or is a valid message object)
      if (response && (response.success || response)) {
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
      const response = await this.apiService.createDirectMessageThread(userId)

      if (response.success && response.data) {
        this.currentThreadId = response.data.id
        this.updateThreadInfo(user.username)
        this.enableMessageInput()
        await this.loadMessages(this.currentThreadId || undefined)
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
      const response = await this.apiService.sendGameInvitation(userId, "default")

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
        response = await this.apiService.unblockUser(targetUserId.toString())
      } else {
        // Block user
        response = await this.apiService.blockUser(targetUserId.toString())
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

  private handleUserSearch(query: string) {
    // Clear existing debounce timer
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer)
    }
    
    // If query is empty, hide search results
    if (!query) {
      this.searchResults = []
      this.renderSearchResults()
      return
    }
    
    // Set new debounce timer
    this.searchDebounceTimer = window.setTimeout(() => {
      this.searchUsers(query)
    }, 300)
  }
  
  private async searchUsers(query: string) {
    try {
      const response = await this.apiService.searchUsers(query)
      if (response.success && response.data) {
        // The API returns { data: { users: [...], pagination: {...} } }
        this.searchResults = (response.data as any).users || []
      } else {
        this.searchResults = []
      }
      this.renderSearchResults()
    } catch (error) {
      console.error('Error searching users:', error)
      this.searchResults = []
      this.renderSearchResults()
    }
  }
  
  private renderSearchResults() {
    const searchResultsElement = document.getElementById('search-results')
    if (!searchResultsElement) return
    
    if (this.searchResults.length === 0) {
      searchResultsElement.classList.add('hidden')
      return
    }
    
    searchResultsElement.classList.remove('hidden')
    searchResultsElement.innerHTML = this.searchResults.map(user => `
      <div class="cyber-card p-2 cursor-pointer hover:border-cyber-cyan" data-search-user-id="${user.id}">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <div class="w-2 h-2 rounded-full bg-cyber-green"></div>
            <span class="text-cyber-green text-sm">${user.display_name || user.username}</span>
          </div>
          <button class="text-cyber-cyan hover:text-cyber-green text-xs" onclick="chatBox.startChatWithUser(${user.id}, '${user.username}')">Chat</button>
        </div>
      </div>
    `).join('')
  }

  private async loadChatThreads() {
    try {
      const response = await this.apiService.getChatThreads()
      console.log('Chat threads response:', response)
      if (response) {
        this._chatThreads = response
        console.log('Chat threads data set to _chatThreads:', this._chatThreads)
        console.log('_chatThreads length after setting:', this._chatThreads.length)
        
        // Add a log to check if _chatThreads is modified later
        setTimeout(() => {
          console.log('_chatThreads length after 100ms:', this._chatThreads.length)
        }, 100)
        
        // For each thread, get other participant's info
        for (const thread of this._chatThreads) {
          const otherParticipantId = thread.members.find((id: number) => id !== this.currentUserId)
          console.log('Other participant ID:', otherParticipantId)
          if (otherParticipantId && !this.threadParticipants.has(otherParticipantId)) {
            try {
              // Get user info for other participant
              const userResponse = await this.apiService.getUserById(otherParticipantId.toString())
              console.log('User response for participant', otherParticipantId, ':', userResponse)
              if (userResponse.success && userResponse.data) {
                this.threadParticipants.set(otherParticipantId, userResponse.data)
              }
            } catch (error) {
              console.error(`Error loading user ${otherParticipantId}:`, error)
            }
          }
        }
        
        console.log('About to call renderUsers, _chatThreads length:', this._chatThreads.length)
        // Render users after all participant info is loaded
        this.renderUsers()
      } else {
        this._chatThreads = []
        this.renderUsers()
      }
    } catch (error) {
      console.error('Error loading chat threads:', error)
      this._chatThreads = []
      this.renderUsers()
    }
  }

  public async startChatWithUser(userId: number, username: string) {
    try {
      // Create or get existing DM thread
      const response = await this.apiService.createDirectMessageThread(userId.toString())

      if (response.success && response.data) {
        this.currentThreadId = response.data.id
        this.updateThreadInfo(username)
        this.enableMessageInput()
        await this.loadMessages(this.currentThreadId || undefined)
        this.showNotification(`Chat aperta con ${username}`, 'success')
        
        // Clear search results
        this.searchResults = []
        this.renderSearchResults()
        
        // Clear search input
        const searchInput = document.getElementById('user-search-input') as HTMLInputElement
        if (searchInput) {
          searchInput.value = ''
        }
        
        // Reload chat threads to include the new one
        await this.loadChatThreads()
        this._chatThreads = [...this._chatThreads] // Force reactivity
        this.renderUsers()
      } else {
        this.showNotification('Impossibile aprire la chat', 'error')
      }
    } catch (error) {
      console.error('Error opening chat with user:', error)
      this.showNotification('Errore nell\'apertura della chat', 'error')
    }
  }

  private async openChatThread(threadId: number) {
    try {
      this.currentThreadId = threadId
      
      // Find the thread and get the other participant's name
      const thread = this._chatThreads.find(t => t.id === threadId)
      if (thread) {
        const otherParticipantId = thread.members.find((id: number) => id !== this.currentUserId)
        if (otherParticipantId) {
          const participantInfo = this.threadParticipants.get(otherParticipantId)
          const displayName = participantInfo ? 
            (participantInfo.display_name || participantInfo.username) : 
            `Utente ${otherParticipantId}`
          this.updateThreadInfo(displayName)
        } else {
          this.updateThreadInfo(`Chat ${threadId}`)
        }
      } else {
        this.updateThreadInfo(`Chat ${threadId}`)
      }
      
      this.enableMessageInput()
      await this.loadMessages(this.currentThreadId)
    } catch (error) {
      console.error('Error opening chat thread:', error)
      this.showNotification('Errore nell\'apertura della chat', 'error')
    }
  }

  public async deleteMessage(messageId: string) {
    try {
      const response = await this.apiService.deleteMessage(messageId)
      
      if (response && (response.success || response.message)) {
        // Rimuovi il messaggio dall'array locale
        this.messages = this.messages.filter(msg => msg.id !== messageId)
        this.renderMessages()
        this.showNotification('Messaggio eliminato', 'success')
      } else {
        this.showNotification('Impossibile eliminare il messaggio', 'error')
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      this.showNotification('Errore nell\'eliminazione del messaggio', 'error')
    }
  }
}

// Make the chatBox instance globally available for button onclick handlers
declare global {
  interface Window {
    chatBox: ChatBox
  }
}
