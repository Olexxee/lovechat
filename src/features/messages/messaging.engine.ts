import type { QueryClient } from "@tanstack/react-query";
import {
  API_BASE_URL,
  markMessageAsRead,
  sendMessage as sendMessageRequest,
  type Message,
} from "../../services/api";
import { messageKeys } from "./messages.keys";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline";

export type DeliveryStatus = "sending" | "sent" | "failed";

export type MessagingMessage = Message & {
  local_id?: string;
  delivery_status?: DeliveryStatus;
};

export type MessagingState = {
  connectionStatus: ConnectionStatus;
  isTyping: boolean;
  partnerOnline: boolean;
  error: string | null;
};

type Listener = (state: MessagingState) => void;

type ConversationConnection = {
  socket: WebSocket | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  reconnectAttempts: number;
  manuallyClosed: boolean;
};

type SendPayload = {
  conversationId: number;
  content: string;
  attachmentIds: number[];
  clientMessageId: string;
  localId: string;
};

type PendingSend = SendPayload & {
  timer: ReturnType<typeof setTimeout> | null;
  restAttempted: boolean;
  resolve: (message: Message) => void;
  reject: (error: Error) => void;
};

type ServerEvent = {
  type?: string;
  message?: Message;
  message_id?: number;
  reader_id?: number;
  read_at?: string | null;
  conversation_id?: number;
  user_id?: number;
  online?: boolean;
  is_typing?: boolean;
  error?: string;
  reason?: string;
};

const FATAL_CLOSE_CODES = new Set([1008, 4403, 4404]);
const SEND_ACK_TIMEOUT_MS = 8_000;

const INITIAL_STATE: MessagingState = {
  connectionStatus: "connecting",
  isTyping: false,
  partnerOnline: false,
  error: null,
};

let localMessageSequence = 0;

function createClientMessageId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function createLocalId(): string {
  localMessageSequence += 1;

  return `local-${Date.now()}-${localMessageSequence}`;
}

function sortMessages(messages: MessagingMessage[]): MessagingMessage[] {
  return [...messages].sort((a, b) => {
    const timeDifference =
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

    return timeDifference || a.id - b.id;
  });
}

function mergeMessage(
  current: Message[] | undefined,
  incoming: MessagingMessage,
): MessagingMessage[] {
  const messages = (current ?? []) as MessagingMessage[];

  const index = messages.findIndex(
    (message) =>
      message.id === incoming.id ||
      Boolean(
        incoming.client_message_id &&
        message.client_message_id === incoming.client_message_id,
      ) ||
      Boolean(incoming.local_id && message.local_id === incoming.local_id),
  );

  if (index === -1) {
    return sortMessages([...messages, incoming]);
  }

  const updated = [...messages];

  updated[index] = {
    ...updated[index],
    ...incoming,
    delivery_status: "sent",
  };

  return sortMessages(updated);
}

class MessagingEngine {
  private queryClient: QueryClient | null = null;

  private connections = new Map<number, ConversationConnection>();
  private listeners = new Map<number, Set<Listener>>();
  private states = new Map<number, MessagingState>();
  private userIds = new Map<number, number>();

  private pendingSends = new Map<string, PendingSend>();
  private failedSends = new Map<string, SendPayload>();

  configure(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  getState(conversationId: number): MessagingState {
    return this.states.get(conversationId) ?? INITIAL_STATE;
  }

  subscribe(
    conversationId: number,
    userId: number,
    listener: Listener,
  ): () => void {
    let conversationListeners = this.listeners.get(conversationId);

    if (!conversationListeners) {
      conversationListeners = new Set();
      this.listeners.set(conversationId, conversationListeners);
    }

    conversationListeners.add(listener);
    this.userIds.set(conversationId, userId);

    listener(this.getState(conversationId));

    if (!this.connections.has(conversationId)) {
      this.connect(conversationId);
    }

    return () => {
      const currentListeners = this.listeners.get(conversationId);

      currentListeners?.delete(listener);

      if (currentListeners?.size === 0) {
        this.listeners.delete(conversationId);
        this.disconnect(conversationId);
        this.userIds.delete(conversationId);
      }
    };
  }

  private updateState(
    conversationId: number,
    updates: Partial<MessagingState>,
  ) {
    const nextState = {
      ...this.getState(conversationId),
      ...updates,
    };

    this.states.set(conversationId, nextState);

    this.listeners.get(conversationId)?.forEach((listener) => {
      listener(nextState);
    });
  }

  private getWebSocketUrl(conversationId: number): string {
    const websocketBase = API_BASE_URL.replace(/^http/, "ws");

    return `${websocketBase}/ws/chat?conversation_id=${conversationId}`;
  }

  private connect(conversationId: number) {
    if (!this.listeners.has(conversationId)) return;

    const existing = this.connections.get(conversationId);

    if (
      existing?.socket &&
      (existing.socket.readyState === WebSocket.OPEN ||
        existing.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const connection: ConversationConnection = existing ?? {
      socket: null,
      reconnectTimer: null,
      reconnectAttempts: 0,
      manuallyClosed: false,
    };

    connection.manuallyClosed = false;
    this.connections.set(conversationId, connection);

    this.updateState(conversationId, {
      connectionStatus:
        connection.reconnectAttempts === 0 ? "connecting" : "reconnecting",
      error: null,
    });

    let socket: WebSocket;

    try {
      socket = new WebSocket(this.getWebSocketUrl(conversationId));
    } catch {
      this.scheduleReconnect(conversationId, connection);
      return;
    }

    connection.socket = socket;

    socket.onopen = () => {
      if (connection.socket !== socket) return;

      connection.reconnectAttempts = 0;

      this.updateState(conversationId, {
        connectionStatus: "connected",
        error: null,
      });

      // Recover messages that may have arrived while disconnected.
      void this.queryClient?.invalidateQueries({
        queryKey: messageKeys.conversation(conversationId),
      });

      // Retry any sends that previously failed while this screen is active.
      for (const payload of this.failedSends.values()) {
        if (payload.conversationId === conversationId) {
          void this.retryMessage(conversationId, payload.clientMessageId);
        }
      }
    };

    socket.onmessage = (event) => {
      if (connection.socket !== socket) return;

      this.handleEvent(conversationId, event.data);
    };

    socket.onerror = () => {
      if (connection.socket !== socket) return;

      this.updateState(conversationId, {
        connectionStatus: "reconnecting",
      });
    };

    socket.onclose = (event) => {
      if (connection.socket !== socket) return;

      connection.socket = null;

      if (connection.manuallyClosed) return;

      if (FATAL_CLOSE_CODES.has(event.code)) {
        connection.manuallyClosed = true;

        this.updateState(conversationId, {
          connectionStatus: "offline",
          error: event.reason || "You cannot access this conversation.",
        });

        return;
      }

      this.scheduleReconnect(conversationId, connection);
    };
  }

  private scheduleReconnect(
    conversationId: number,
    connection: ConversationConnection,
  ) {
    if (connection.manuallyClosed || !this.listeners.has(conversationId)) {
      return;
    }

    this.updateState(conversationId, {
      connectionStatus: "reconnecting",
    });

    const delay = Math.min(1_000 * 2 ** connection.reconnectAttempts, 15_000);

    connection.reconnectAttempts += 1;

    if (connection.reconnectTimer) {
      clearTimeout(connection.reconnectTimer);
    }

    connection.reconnectTimer = setTimeout(() => {
      connection.reconnectTimer = null;
      this.connect(conversationId);
    }, delay);
  }

  private handleEvent(conversationId: number, rawData: unknown) {
    if (typeof rawData !== "string") return;

    let payload: ServerEvent;

    try {
      payload = JSON.parse(rawData) as ServerEvent;
    } catch {
      return;
    }

    const currentUserId = this.userIds.get(conversationId);

    if (payload.type === "connected") {
      this.updateState(conversationId, {
        connectionStatus: "connected",
        error: null,
      });

      return;
    }

    if (payload.type === "presence") {
      if (currentUserId == null || Number(payload.user_id) !== currentUserId) {
        this.updateState(conversationId, {
          partnerOnline: Boolean(payload.online),
        });
      }

      return;
    }

    if (
      payload.type === "typing" ||
      payload.type === "typing_start" ||
      payload.type === "typing_stop"
    ) {
      const isTyping =
        payload.type === "typing_start"
          ? true
          : payload.type === "typing_stop"
            ? false
            : Boolean(payload.is_typing);

      if (currentUserId == null || Number(payload.user_id) !== currentUserId) {
        this.updateState(conversationId, { isTyping });
      }

      return;
    }

    if (payload.type === "message" && payload.message) {
      const incoming = payload.message;

      if (incoming.conversation_id !== conversationId) return;

      this.acceptCanonicalMessage(conversationId, incoming);

      if (
        currentUserId != null &&
        incoming.sender_id !== currentUserId &&
        !incoming.read_at
      ) {
        this.markAsRead(conversationId, incoming.id);
      }

      return;
    }

    if (payload.type === "message_read") {
      const messageId = Number(payload.message_id);
      const readAt = payload.read_at ?? new Date().toISOString();

      if (!Number.isInteger(messageId) || messageId <= 0) return;

      this.queryClient?.setQueryData<MessagingMessage[]>(
        messageKeys.conversation(conversationId),
        (current) =>
          current?.map((message) =>
            message.id === messageId
              ? { ...message, read_at: readAt }
              : message,
          ),
      );

      return;
    }

    if (payload.type === "error") {
      this.updateState(conversationId, {
        error:
          typeof payload.error === "string"
            ? payload.error
            : "A messaging error occurred.",
      });
    }
  }

  private acceptCanonicalMessage(conversationId: number, message: Message) {
    const canonical: MessagingMessage = {
      ...message,
      delivery_status: "sent",
    };

    this.queryClient?.setQueryData<MessagingMessage[]>(
      messageKeys.conversation(conversationId),
      (current) => mergeMessage(current, canonical),
    );

    if (message.client_message_id) {
      const pending = this.pendingSends.get(message.client_message_id);

      if (pending) {
        this.clearPendingTimer(pending);
        this.pendingSends.delete(message.client_message_id);
        this.failedSends.delete(message.client_message_id);
        pending.resolve(message);
      }
    }
  }

  async sendMessage(
    conversationId: number,
    content: string,
    attachmentIds: number[] = [],
  ): Promise<Message> {
    const trimmedContent = content.trim();

    if (!trimmedContent && attachmentIds.length === 0) {
      throw new Error("A message must contain text or an attachment.");
    }

    const payload: SendPayload = {
      conversationId,
      content: trimmedContent,
      attachmentIds,
      clientMessageId: createClientMessageId(),
      localId: createLocalId(),
    };

    const optimisticMessage: MessagingMessage = {
      id: -++localMessageSequence,
      conversation_id: conversationId,
      sender_id: this.userIds.get(conversationId) ?? 0,
      client_message_id: payload.clientMessageId,
      content: payload.content,
      created_at: new Date().toISOString(),
      read_at: null,
      deleted_at: null,
      attachments: [],
      local_id: payload.localId,
      delivery_status: "sending",
    };

    this.queryClient?.setQueryData<MessagingMessage[]>(
      messageKeys.conversation(conversationId),
      (current) => mergeMessage(current, optimisticMessage),
    );

    return this.transmitMessage(payload);
  }

  async retryMessage(
    conversationId: number,
    clientMessageId: string,
  ): Promise<Message> {
    const payload = this.failedSends.get(clientMessageId);

    if (!payload || payload.conversationId !== conversationId) {
      throw new Error("This failed message is no longer available to retry.");
    }

    this.queryClient?.setQueryData<MessagingMessage[]>(
      messageKeys.conversation(conversationId),
      (current) =>
        (current ?? []).map((message) =>
          message.client_message_id === clientMessageId
            ? { ...message, delivery_status: "sending" }
            : message,
        ),
    );

    return this.transmitMessage(payload);
  }

  private transmitMessage(payload: SendPayload): Promise<Message> {
    const existingPending = this.pendingSends.get(payload.clientMessageId);

    if (existingPending) {
      return new Promise((resolve, reject) => {
        const originalResolve = existingPending.resolve;
        const originalReject = existingPending.reject;

        existingPending.resolve = (message) => {
          originalResolve(message);
          resolve(message);
        };

        existingPending.reject = (error) => {
          originalReject(error);
          reject(error);
        };
      });
    }

    return new Promise<Message>((resolve, reject) => {
      const pending: PendingSend = {
        ...payload,
        timer: null,
        restAttempted: false,
        resolve,
        reject,
      };

      this.pendingSends.set(payload.clientMessageId, pending);

      const socket = this.connections.get(payload.conversationId)?.socket;

      if (socket?.readyState === WebSocket.OPEN) {
        try {
          socket.send(
            JSON.stringify({
              type: "message",
              content: payload.content,
              attachment_ids: payload.attachmentIds,
              client_message_id: payload.clientMessageId,
            }),
          );

          pending.timer = setTimeout(() => {
            void this.sendViaRest(pending);
          }, SEND_ACK_TIMEOUT_MS);

          return;
        } catch {
          // REST fallback below uses the same idempotency key.
        }
      }

      void this.sendViaRest(pending);
    });
  }

  private async sendViaRest(pending: PendingSend) {
    if (pending.restAttempted) return;

    pending.restAttempted = true;
    this.clearPendingTimer(pending);

    try {
      const message = await sendMessageRequest(
        pending.conversationId,
        pending.content,
        pending.attachmentIds,
        pending.clientMessageId,
      );

      this.acceptCanonicalMessage(pending.conversationId, message);
    } catch (error) {
      // The socket may have delivered the canonical message while REST failed.
      if (!this.pendingSends.has(pending.clientMessageId)) return;

      this.clearPendingTimer(pending);
      this.pendingSends.delete(pending.clientMessageId);
      this.failedSends.set(pending.clientMessageId, {
        conversationId: pending.conversationId,
        content: pending.content,
        attachmentIds: pending.attachmentIds,
        clientMessageId: pending.clientMessageId,
        localId: pending.localId,
      });

      this.queryClient?.setQueryData<MessagingMessage[]>(
        messageKeys.conversation(pending.conversationId),
        (current) =>
          (current ?? []).map((message) =>
            message.client_message_id === pending.clientMessageId
              ? { ...message, delivery_status: "failed" }
              : message,
          ),
      );

      const message =
        error instanceof Error
          ? error
          : new Error("Message could not be sent. Please retry.");

      this.updateState(pending.conversationId, {
        error: message.message,
      });

      pending.reject(message);
    }
  }

  private clearPendingTimer(pending: PendingSend) {
    if (pending.timer) {
      clearTimeout(pending.timer);
      pending.timer = null;
    }
  }

  sendTyping(conversationId: number, typing: boolean) {
    this.sendEvent(conversationId, {
      type: typing ? "typing_start" : "typing_stop",
    });
  }

  markAsRead(conversationId: number, messageId: number): boolean {
    const sent = this.sendEvent(conversationId, {
      type: "read",
      message_id: messageId,
    });

    if (!sent) {
      void markMessageAsRead(messageId)
        .then((message) => {
          this.queryClient?.setQueryData<MessagingMessage[]>(
            messageKeys.conversation(conversationId),
            (current) => mergeMessage(current, message),
          );
        })
        .catch(() => {
          // Read receipts can be retried when the next message sync occurs.
        });
    }

    return sent;
  }

  private sendEvent(
    conversationId: number,
    payload: Record<string, unknown>,
  ): boolean {
    const socket = this.connections.get(conversationId)?.socket;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      socket.send(JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }

  disconnect(conversationId: number) {
    const connection = this.connections.get(conversationId);

    if (!connection) return;

    connection.manuallyClosed = true;

    if (connection.reconnectTimer) {
      clearTimeout(connection.reconnectTimer);
    }

    const socket = connection.socket;
    connection.socket = null;

    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      socket.close();
    }

    this.connections.delete(conversationId);

    this.updateState(conversationId, {
      connectionStatus: "offline",
      isTyping: false,
    });
  }
}

export const messagingEngine = new MessagingEngine();
