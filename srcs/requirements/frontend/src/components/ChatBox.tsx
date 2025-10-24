import { ApiService } from '../services/ApiService'

export interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: Date
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
  private currentThreadId: string | null = null
  private messageContainer: HTMLElement | null = null

  constructor() {
    this.apiService = new ApiService()
  }

  render(container: HTMLElement) {
    container.innerHTML = `
      <div class="cyber-panel h-full flex flex-col">
        <!-- Chat Header -->
        <div class="border-b border-cyber-green pb-2 mb-4">
          <h2 class="cyber-title text-lg">CHAT CYBER</h2>
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
                placeholder="Digita un messaggio..."
                maxlength="500"
              >
              <button id="send-button" class="cyber-button">Invia</button>
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
    this.loadMessages()
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
      // In a real implementation, this would call the API service
      // For now, we'll use mock data
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

  private async loadMessages() {
    try {
      // In a real implementation, this would call the API service
      // For now, we'll use mock data
      this.messages = [
        {
          id: '1',
          senderId: 'system',
          senderName: 'System',
          content: 'Benvenuto nella chat cyberpunk!',
          timestamp: new Date(Date.now() - 3600000),
          isSystem: true
        },
        {
          id: '2',
          senderId: '2',
          senderName: 'NeonRider',
          content: 'Qualcuno vuole giocare a Pong?',
          timestamp: new Date(Date.now() - 1800000)
        },
        {
          id: '3',
          senderId: '3',
          senderName: 'PixelWarrior',
          content: 'Io sono pronto! Chi sfida?',
          timestamp: new Date(Date.now() - 900000)
        }
      ]
      
      this.renderMessages()
    } catch (error) {
      console.error('Error loading messages:', error)
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
        message.senderId === 'current-user' ? 'justify-end' : 'justify-start'
      }">
        <div class="${
          message.isSystem ? 'bg-cyber-dark/50 text-cyber-cyan text-xs italic px-2 py-1 rounded' :
          message.senderId === 'current-user' ? 'cyber-panel max-w-xs' : 
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
    if (!messageInput) return
    
    const content = messageInput.value.trim()
    if (!content) return
    
    try {
      // In a real implementation, this would call the API service
      // For now, we'll add the message locally
      const newMessage: Message = {
        id: Date.now().toString(),
        senderId: 'current-user',
        senderName: 'You',
        content,
        timestamp: new Date()
      }
      
      this.messages.push(newMessage)
      this.renderMessages()
      
      // Clear input
      messageInput.value = ''
      
      // Simulate response after a delay
      setTimeout(() => {
        const responses = [
          'Interessante!',
          'Sono d\'accordo.',
          'Vediamo chi vince!',
          'Buona partita!',
          'Cyberpunk style!'
        ]
        
        const randomUser = this.users[Math.floor(Math.random() * this.users.length)]
        
        if (randomUser && randomUser.status === 'online') {
          const randomResponse = responses[Math.floor(Math.random() * responses.length)]
          const responseMessage: Message = {
            id: (Date.now() + 1).toString(),
            senderId: randomUser.id,
            senderName: randomUser.username,
            content: randomResponse,
            timestamp: new Date()
          }
          
          this.messages.push(responseMessage)
          this.renderMessages()
        }
      }, 1000 + Math.random() * 2000)
      
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  private openChatWithUser(userId: string) {
    const user = this.users.find(u => u.id === userId)
    if (!user) return
    
    // In a real implementation, this would open a specific chat thread
    console.log(`Opening chat with ${user.username}`)
    
    // For now, we'll just show a notification
    this.showNotification(`Chat aperta con ${user.username}`, 'info')
  }

  private async inviteToGame(userId: string) {
    const user = this.users.find(u => u.id === userId)
    if (!user) return
    
    try {
      // In a real implementation, this would call the API service
      console.log(`Inviting ${user.username} to a game`)
      
      // Show notification
      this.showNotification(`Invito di gioco inviato a ${user.username}`, 'success')
      
      // Add system message
      const systemMessage: Message = {
        id: Date.now().toString(),
        senderId: 'system',
        senderName: 'System',
        content: `Hai invitato ${user.username} a una partita`,
        timestamp: new Date(),
        isSystem: true
      }
      
      this.messages.push(systemMessage)
      this.renderMessages()
      
    } catch (error) {
      console.error('Error inviting to game:', error)
    }
  }

  private async toggleBlockUser(userId: string) {
    const user = this.users.find(u => u.id === userId)
    if (!user) return
    
    try {
      // In a real implementation, this would call the API service
      user.isBlocked = !user.isBlocked
      
      // Update UI
      this.renderUsers()
      
      // Show notification
      this.showNotification(
        user.isBlocked ? `${user.username} bloccato` : `${user.username} sbloccato`,
        'info'
      )
      
    } catch (error) {
      console.error('Error toggling block user:', error)
    }
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
