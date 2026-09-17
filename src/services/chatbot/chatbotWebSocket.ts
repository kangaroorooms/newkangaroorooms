/**
 * Chatbot WebSocket Service
 *
 * Connects the React chatbot to the Homilivo_MCP FastAPI
 * WebSocket backend.
 *
 * Contract:
 *   ws://localhost:8000/ws/chat?token=<token>
 *
 * Request:
 *   {
 *     message: string,
 *     session_id: string | null,
 *     mode: "fast" | "qwen" | "gemma" | "groq"
 *   }
 *
 * Events:
 *   typing
 *   token
 *   done
 *   error
 *   ping
 */

export type WebSocketStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export type ChatbotMode =
  | "fast"
  | "qwen"
  | "gemma"
  | "groq";

export interface ChatbotWebSocketCallbacks {
  onMessage?: (data: unknown) => void;

  onStatusChange?: (
    status: WebSocketStatus
  ) => void;

  onError?: (error: Event) => void;

  /**
   * Called when a token event is received.
   * Useful later for live typing/streaming UI.
   */
  onToken?: (text: string) => void;

  /**
   * Called when the final authoritative response arrives.
   */
  onDone?: (data: ChatbotDoneResponse) => void;

  /**
   * Called when backend sends a turn-level error.
   */
  onServerError?: (detail: string) => void;
}

export interface ChatbotDoneResponse {
  success: boolean;
  session_id: string;
  request_id: string;
  mode: string;
  message: string;
  room_count: number;
  rooms: Room[];
  selected_room: Room | null;
  pending_clarification: boolean;
  sources: string[];
  search_performed: boolean;

  [key: string]: unknown;
}

export interface Room {
  id: string;
  title: string;
  city: string;
  location: string;
  price_per_month: number;
  room_type: string;
  ideal_for: string[];
  amenities: string[];
}

export interface ChatbotRequest {
  message: string;
  session_id: string | null;
  mode: ChatbotMode;
}

type WebSocketEvent =
  | {
      event: "typing";
    }
  | {
      event: "token";
      text: string;
    }
  | {
      event: "done";
      success: boolean;
      session_id: string;
      request_id: string;
      mode: string;
      message: string;
      room_count: number;
      rooms: Room[];
      selected_room: Room | null;
      pending_clarification: boolean;
      sources: string[];
      search_performed: boolean;
      [key: string]: unknown;
    }
  | {
      event: "error";
      detail: string;
    }
  | {
      event: "ping";
    };

class ChatbotWebSocketService {
  private socket: WebSocket | null = null;

  private callbacks: ChatbotWebSocketCallbacks = {};

  private isConnecting = false;

  /**
   * Stores the conversation session.
   *
   * Backend sends this in the "done" event.
   * We resend it on the next message.
   */
  private sessionId: string | null = null;

  /**
   * Current chatbot mode.
   *
   * Default is "fast" according to Faizal's contract.
   */
  private mode: ChatbotMode = "fast";

  /**
   * Get WebSocket URL.
   *
   * Vite environment variables:
   *
   * VITE_CHATBOT_WS_URL=ws://localhost:8000/ws/chat
   *
   * VITE_CHATBOT_TOKEN=demo-smoke-token
   */
  private getWebSocketUrl(): string {
    const baseUrl =
      import.meta.env.VITE_CHATBOT_WS_URL;

    const token =
      import.meta.env.VITE_CHATBOT_TOKEN;

    if (!baseUrl) {
      throw new Error(
        "VITE_CHATBOT_WS_URL is not configured."
      );
    }

    if (!token) {
      throw new Error(
        "VITE_CHATBOT_TOKEN is not configured."
      );
    }

    const separator = baseUrl.includes("?")
      ? "&"
      : "?";

    return `${baseUrl}${separator}token=${encodeURIComponent(
      token
    )}`;
  }

  /**
   * Register callbacks used by React components.
   */
  setCallbacks(
    callbacks: ChatbotWebSocketCallbacks
  ): void {
    this.callbacks = callbacks;
  }

  /**
   * Set chatbot mode.
   *
   * Default: "fast"
   */
  setMode(mode: ChatbotMode): void {
    this.mode = mode;
  }

  /**
   * Get current chatbot mode.
   */
  getMode(): ChatbotMode {
    return this.mode;
  }

  /**
   * Get current conversation session ID.
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Clear current conversation session.
   */
  clearSession(): void {
    this.sessionId = null;
  }

  /**
   * Connect to Faizal's FastAPI WebSocket server.
   */
  connect(): void {
    if (
      this.socket?.readyState ===
      WebSocket.OPEN
    ) {
      console.log(
        "Chatbot WebSocket is already connected."
      );
      return;
    }

    if (this.isConnecting) {
      console.log(
        "Chatbot WebSocket connection is already in progress."
      );
      return;
    }

    this.isConnecting = true;

    let url: string;

    try {
      url = this.getWebSocketUrl();
    } catch (error) {
      this.isConnecting = false;

      console.error(
        "WebSocket configuration error:",
        error
      );

      this.callbacks.onStatusChange?.("error");

      return;
    }

    /**
     * Do not log the full URL because it contains
     * the authentication token.
     */
    console.log(
      "Connecting to chatbot WebSocket..."
    );

    this.callbacks.onStatusChange?.(
      "connecting"
    );

    try {
      this.socket = new WebSocket(url);
    } catch (error) {
      this.isConnecting = false;

      console.error(
        "Failed to create WebSocket connection:",
        error
      );

      this.callbacks.onStatusChange?.("error");

      return;
    }

    /**
     * Connection successfully established.
     */
    this.socket.onopen = () => {
      console.log(
        "✅ Chatbot WebSocket connected."
      );

      this.isConnecting = false;

      this.callbacks.onStatusChange?.(
        "connected"
      );
    };

    /**
     * Message received from FastAPI.
     */
    this.socket.onmessage = (
      event: MessageEvent
    ) => {
      console.log(
        "📩 WebSocket event received:",
        event.data
      );

      let data: WebSocketEvent;

      try {
        data = JSON.parse(event.data);
      } catch (error) {
        console.warn(
          "Received non-JSON WebSocket message:",
          event.data
        );

        return;
      }

      this.handleServerEvent(data);
    };

    /**
     * WebSocket error.
     */
    this.socket.onerror = (
      error: Event
    ) => {
      console.error(
        "❌ Chatbot WebSocket error:",
        error
      );

      this.callbacks.onStatusChange?.(
        "error"
      );

      this.callbacks.onError?.(error);
    };

    /**
     * WebSocket closed.
     */
    this.socket.onclose = (
      event: CloseEvent
    ) => {
      console.log(
        "🔌 Chatbot WebSocket disconnected.",
        {
          code: event.code,
          reason: event.reason,
        }
      );

      this.isConnecting = false;

      this.socket = null;

      this.callbacks.onStatusChange?.(
        "disconnected"
      );

      /**
       * 4401 = Missing token
       * 4429 = Rate limit exceeded
       */
      if (event.code === 4401) {
        console.error(
          "WebSocket closed: missing token."
        );
      }

      if (event.code === 4429) {
        console.error(
          "WebSocket closed: rate limit exceeded."
        );
      }
    };
  }

  /**
   * Handle events defined by Faizal's contract.
   */
  private handleServerEvent(
    data: WebSocketEvent
  ): void {
    switch (data.event) {
      /**
       * Backend is processing the request.
       */
      case "typing": {
        console.log(
          "🤖 Assistant is typing..."
        );

        this.callbacks.onMessage?.(data);

        break;
      }

      /**
       * Streaming token.
       *
       * IMPORTANT:
       * Do not treat this as the final answer.
       */
      case "token": {
        console.log(
          "📝 Token:",
          data.text
        );

        this.callbacks.onToken?.(
          data.text
        );

        this.callbacks.onMessage?.(data);

        break;
      }

      /**
       * Final authoritative response.
       *
       * The contract explicitly says:
       *
       * done.message is authoritative.
       */
      case "done": {
        console.log(
          "✅ Chatbot response completed."
        );

        /**
         * Save session ID for the next turn.
         */
        this.sessionId =
          data.session_id;

        /**
         * If the request failed, ignore any
         * previously streamed preview.
         */
        if (!data.success) {
          console.warn(
            "Chatbot request failed:",
            data.message
          );
        }

        this.callbacks.onDone?.(data);

        this.callbacks.onMessage?.(
          data
        );

        break;
      }

      /**
       * Turn-level error.
       *
       * Connection remains open.
       */
      case "error": {
        console.error(
          "⚠️ Chatbot server error:",
          data.detail
        );

        this.callbacks.onServerError?.(
          data.detail
        );

        this.callbacks.onMessage?.(
          data
        );

        break;
      }

      /**
       * Heartbeat.
       *
       * No UI action required.
       */
      case "ping": {
        console.log(
          "💓 Chatbot WebSocket heartbeat."
        );

        break;
      }

      default: {
        console.warn(
          "Unknown WebSocket event:",
          data
        );
      }
    }
  }

  /**
   * Send a message to Faizal's chatbot agent.
   *
   * Request schema:
   *
   * {
   *   message: string,
   *   session_id: string | null,
   *   mode: "fast"
   * }
   */
  sendMessage(
    message: string
  ): boolean {
    const trimmedMessage =
      message.trim();

    if (!trimmedMessage) {
      return false;
    }

    /**
     * Backend contract:
     * message must be between 1 and 500 chars.
     */
    if (trimmedMessage.length > 500) {
      console.error(
        "Chatbot message cannot exceed 500 characters."
      );

      return false;
    }

    if (!this.socket) {
      console.error(
        "Cannot send message: WebSocket is not initialized."
      );

      return false;
    }

    if (
      this.socket.readyState !==
      WebSocket.OPEN
    ) {
      console.error(
        "Cannot send message: WebSocket is not connected."
      );

      return false;
    }

    const payload: ChatbotRequest = {
      message: trimmedMessage,

      /**
       * null for first message.
       *
       * After "done", this.sessionId contains
       * the backend-provided session ID.
       */
      session_id: this.sessionId,

      /**
       * Default mode = fast.
       */
      mode: this.mode,
    };

    console.log(
      "📤 Sending chatbot message:",
      {
        ...payload,
        /**
         * Don't expose sensitive information
         * in logs.
         */
      }
    );

    try {
      this.socket.send(
        JSON.stringify(payload)
      );

      return true;
    } catch (error) {
      console.error(
        "Failed to send WebSocket message:",
        error
      );

      return false;
    }
  }

  /**
   * Close WebSocket connection.
   */
  disconnect(): void {
    if (!this.socket) {
      return;
    }

    console.log(
      "Closing chatbot WebSocket..."
    );

    this.socket.close();

    this.socket = null;

    this.isConnecting = false;
  }

  /**
   * Check whether WebSocket is connected.
   */
  isConnected(): boolean {
    return (
      this.socket?.readyState ===
      WebSocket.OPEN
    );
  }

  /**
   * Get current WebSocket state.
   */
  getReadyState(): number | null {
    return (
      this.socket?.readyState ?? null
    );
  }
}

/**
 * Export one shared instance.
 */
export const chatbotWebSocket =
  new ChatbotWebSocketService();