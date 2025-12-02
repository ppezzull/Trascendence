import { authService } from "./AuthService";

export interface ChatMessage {
  id: string;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: Date;
  threadId: number;
  isSystem?: boolean;
}

export interface ChatUser {
  id: number;
  username: string;
  status: "online" | "offline" | "away";
  isBlocked?: boolean;
}

export interface Thread {
  id: number;
  type: "dm" | "group";
  name: string;
  participantIds: number[];
  lastMessage?: ChatMessage;
  createdAt: Date;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
}

export class ChatWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private messageListeners: Array<(message: ChatMessage) => void> = [];
  private presenceListeners: Array<(userId: number, status: string) => void> =
    [];
  private connectionListeners: Array<(connected: boolean) => void> = [];

  constructor() {
    this.setupMessageHandling();
  }

  private setupMessageHandling() {
    // Handle authentication state changes
    authService.subscribe((authState) => {
      if (authState.isAuthenticated && authState.token) {
        this.connect(authState.token);
      } else {
        this.disconnect();
      }
    });
  }

  async connect(token: string): Promise<void> {
    if (
      this.isConnecting ||
      (this.ws && this.ws.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    this.isConnecting = true;

    try {
      const wsUrl = `ws://localhost:3002/api/chat/ws?token=${token}`;
      console.log("ChatWebSocket: Connecting to:", wsUrl);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("ChatWebSocket: Connected successfully");
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyConnectionListeners(true);
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = (event) => {
        console.log("ChatWebSocket: Disconnected", event.code, event.reason);
        this.isConnecting = false;
        this.notifyConnectionListeners(false);
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error("ChatWebSocket: Error", error);
        this.isConnecting = false;
      };
    } catch (error) {
      console.error("ChatWebSocket: Connection failed", error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnecting = false;
  }

  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      console.log("ChatWebSocket: Received message:", message);

      switch (message.type) {
        case "connected":
          console.log("ChatWebSocket: Connection confirmed");
          break;

        case "message:new":
          if (message.payload.message) {
            const chatMessage = this.transformMessage(message.payload.message);
            this.notifyMessageListeners(chatMessage);
          }
          break;

        case "presence:update":
          if (message.payload.userId && message.payload.status) {
            this.notifyPresenceListeners(
              message.payload.userId,
              message.payload.status
            );
          }
          break;

        case "message:typing":
          // Handle typing indicators
          console.log("ChatWebSocket: User typing:", message.payload);
          break;

        case "pong":
          // Heartbeat response
          break;

        default:
          console.log("ChatWebSocket: Unknown message type:", message.type);
      }
    } catch (error) {
      console.error("ChatWebSocket: Error parsing message:", error);
    }
  }

  private transformMessage(apiMessage: any): ChatMessage {
    return {
      id: apiMessage.id.toString(),
      senderId: apiMessage.senderId,
      senderName: apiMessage.senderName || "Unknown",
      content: apiMessage.content,
      timestamp: new Date(apiMessage.timestamp),
      threadId: apiMessage.threadId,
      isSystem: apiMessage.isSystem || false,
    };
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay =
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(
        `ChatWebSocket: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
      );

      setTimeout(() => {
        const authState = authService.getState();
        if (authState.isAuthenticated && authState.token) {
          this.connect(authState.token);
        }
      }, delay);
    } else {
      console.error("ChatWebSocket: Max reconnection attempts reached");
    }
  }

  send(type: string, payload: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = { type, payload };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("ChatWebSocket: Cannot send message - not connected");
    }
  }

  // Message listeners
  onMessage(listener: (message: ChatMessage) => void): () => void {
    this.messageListeners.push(listener);
    return () => {
      const index = this.messageListeners.indexOf(listener);
      if (index > -1) {
        this.messageListeners.splice(index, 1);
      }
    };
  }

  private notifyMessageListeners(message: ChatMessage): void {
    this.messageListeners.forEach((listener) => listener(message));
  }

  // Presence listeners
  onPresence(listener: (userId: number, status: string) => void): () => void {
    this.presenceListeners.push(listener);
    return () => {
      const index = this.presenceListeners.indexOf(listener);
      if (index > -1) {
        this.presenceListeners.splice(index, 1);
      }
    };
  }

  private notifyPresenceListeners(userId: number, status: string): void {
    this.presenceListeners.forEach((listener) => listener(userId, status));
  }

  // Connection listeners
  onConnection(listener: (connected: boolean) => void): () => void {
    this.connectionListeners.push(listener);
    return () => {
      const index = this.connectionListeners.indexOf(listener);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach((listener) => listener(connected));
  }

  // Heartbeat
  startHeartbeat(): void {
    setInterval(() => {
      this.send("ping", {});
    }, 30000); // Send ping every 30 seconds
  }

  // Utility methods
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.ws) return "disconnected";

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return "connecting";
      case WebSocket.OPEN:
        return "connected";
      case WebSocket.CLOSING:
        return "closing";
      case WebSocket.CLOSED:
        return "closed";
      default:
        return "unknown";
    }
  }
}

// Export singleton instance
export const chatWebSocketService = new ChatWebSocketService();
