import { Platform } from "react-native";

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? "https://love-chat-backend-xi5u.onrender.com/api"
).replace(/\/$/, "");


//

export type User = {
  id: number;
  name: string;
  email: string;
  avatar_url?: string | null;
};

export type RelationshipType = "ROMANTIC" | "FRIEND" | "FAMILY" | "OTHER";

export type RelationshipPartner = {
  id: number;
  name: string;
  avatar_url: string | null;
};

export type UserSearchResult = {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
};

export interface SendMessagePayload {
  content: string;
  attachment_ids?: number[];
  client_message_id?: string;
  reply_to_message_id?: number | null;
}

export type Relationship = {
  id: number;
  user_one_id: number;
  user_two_id: number;
  relationship_type: RelationshipType;
  status: "PENDING" | "ACTIVE" | "PAUSED" | "DECLINED" | "ENDED" | string;
  requested_by_id: number;
  created_at: string;
  responded_at?: string | null;
  conversation_id: number | null;
  partner: RelationshipPartner;
};

export type MessageAttachment = {
  id: number;
  media_asset_id: number;
  secure_url: string;
  format: string | null;
  width: number | null;
  height: number | null;
};

export interface MessageReplyPreview {
  sender_name: string;
  attachments: any;
  id: number;
  sender_id: number;
  content: string;
  deleted_at: string | null;
  has_attachments: boolean;
}

export interface Message {
  id: number;
  event_id?: number | null;
  conversation_id: number;
  sender_id: number;
  client_message_id: string | null;
  content: string;
  created_at: string;
  read_at: string | null;
  deleted_at: string | null;
  reply_to_message_id: number | null;
  reply_to: MessageReplyPreview | null;
  attachments: MessageAttachment[];
}

export type MediaAsset = {
  id: number;
  public_id: string;
  secure_url: string;
  format: string | null;
  width: number | null;
  height: number | null;
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

type CreateRelationshipPayload = {
  identifier: string;
  relationship_type: RelationshipType;
};

const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = await response.json();

    if (typeof data.detail === "string") {
      return data.detail;
    }

    if (typeof data.message === "string") {
      return data.message;
    }

    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item: { msg?: string }) => item.msg ?? "")
        .filter(Boolean)
        .join(", ");
    }
  } catch {
    // The server may return a non-JSON error response.
  }

  return `Request failed with status ${response.status}.`;
};

const request = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<T>;
};

/**
 * Upload a picked image using multipart/form-data.
 * Do not manually set Content-Type; fetch supplies the multipart boundary.
 */
const uploadImageFile = async (
  path: string,
  uri: string,
  filename: string,
  mimeType: string,
): Promise<MediaAsset> => {
  const formData = new FormData();

  if (Platform.OS === "web") {
    const blobResponse = await fetch(uri);

    if (!blobResponse.ok) {
      throw new Error("Could not read the selected image.");
    }

    const blob = await blobResponse.blob();
    formData.append("file", blob, filename);
  } else {
    formData.append("file", {
      uri,
      name: filename,
      type: mimeType,
    } as any);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as MediaAsset;
};

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

export const registerUser = (payload: RegisterPayload): Promise<User> =>
  request<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const loginUser = (payload: LoginPayload): Promise<User> =>
  request<User>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getCurrentUser = (): Promise<User> => request<User>("/auth/me");

export const logoutUser = async (): Promise<void> => {
  await request<unknown>("/auth/logout", {
    method: "POST",
  });
};

/* -------------------------------------------------------------------------- */
/* Relationships                                                              */
/* -------------------------------------------------------------------------- */

export const getRelationships = (): Promise<Relationship[]> =>
  request<Relationship[]>("/relationships");

export const createRelationship = (
  payload: CreateRelationshipPayload,
): Promise<Relationship> =>
  request<Relationship>("/relationships", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const searchUsers = (query: string): Promise<UserSearchResult[]> =>
  request<UserSearchResult[]>(
    `/relationships/search-users?${new URLSearchParams({ q: query }).toString()}`,
  );

export const acceptRelationship = (relationshipId: number): Promise<Relationship> =>
  request<Relationship>(`/relationships/${relationshipId}/accept`, {
    method: "POST",
  });

export const declineRelationship = (relationshipId: number): Promise<Relationship> =>
  request<Relationship>(`/relationships/${relationshipId}/decline`, {
    method: "POST",
  });

/* -------------------------------------------------------------------------- */
/* Messages                                                                   */
/* -------------------------------------------------------------------------- */

export const getMessages = (
  conversationId: number,
  beforeId?: number,
  limit = 50,
): Promise<Message[]> => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (beforeId != null && beforeId > 0) params.set("before_id", String(beforeId));

  return request<Message[]>(
    `/conversations/${conversationId}/messages?${params.toString()}`,
  );
};

export type DeliveryEvent = {
  id: number;
  conversation_id: number;
  actor_id: number;
  message_id: number | null;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export const getDeliveryEvents = (
  conversationId: number,
  afterId: number,
  limit = 100,
): Promise<DeliveryEvent[]> =>
  request<DeliveryEvent[]>(
    `/conversations/${conversationId}/events?${new URLSearchParams({
      after_id: String(afterId),
      limit: String(limit),
    }).toString()}`,
  );

export const markMessageAsRead = (messageId: number): Promise<Message> =>
  request<Message>(`/messages/${messageId}/read`, {
    method: "PATCH",
  });

export async function sendMessage(
  conversationId: number,
  content: string,
  attachmentIds: number[] = [],
  clientMessageId?: string,
  replyToMessageId?: number | null,
): Promise<Message> {
  const payload: SendMessagePayload = {
    content,
    attachment_ids: attachmentIds,
    ...(clientMessageId ? { client_message_id: clientMessageId } : {}),
    ...(replyToMessageId !== undefined
      ? { reply_to_message_id: replyToMessageId }
      : {}),
  };

  return request<Message>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export const deleteMessage = (messageId: number): Promise<Message> =>
  request<Message>(`/messages/${messageId}`, {
    method: "DELETE",
  });

/* -------------------------------------------------------------------------- */
/* Media                                                                      */
/* -------------------------------------------------------------------------- */

export const uploadAvatar = (
  uri: string,
  filename: string,
  mimeType: string,
): Promise<MediaAsset> =>
  uploadImageFile("/media/avatar", uri, filename, mimeType);

export const uploadChatAttachment = (
  conversationId: number,
  uri: string,
  filename: string,
  mimeType: string,
): Promise<MediaAsset> =>
  uploadImageFile(
    `/media/conversations/${conversationId}/attachments`,
    uri,
    filename,
    mimeType,
  );
