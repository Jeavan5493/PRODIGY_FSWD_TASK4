export interface User {
  id: string;
  username: string;
  avatarUrl: string;
  status: "online" | "offline";
  joinedAt: string;
  isMuted?: boolean;
  isDeafened?: boolean;
  isSpeaking?: boolean;
  currentVoiceChannelId?: string | null;
}

export interface ServerGroup {
  id: string;
  name: string;
  iconUrl: string;
  description: string;
  createdAt: string;
}

export interface Channel {
  id: string;
  serverId: string; // "home" for direct chat or direct messages
  name: string;
  type: "text" | "voice";
  description: string;
  createdAt: string;
}

export interface Message {
  id: string;
  roomId: string; // maps to Channel.id or direct chat id
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type: "text" | "image" | "file" | "system";
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  timestamp: string;
}

export interface DirectChat {
  id: string;
  withUser: User;
  unreadCount: number;
}

export type UITheme = "discord-midnight" | "cyberpunk-neon" | "minimalist-light" | "forest-sage";

export type SocketMessage =
  | {
      type: "init";
      payload: {
        users: User[];
        servers: ServerGroup[];
        channels: Channel[];
        messages: Message[];
      };
    }
  | { type: "message"; payload: Message }
  | { type: "user_status"; payload: { userId: string; status: "online" | "offline" } }
  | { type: "user_typing"; payload: { roomId: string; userId: string; username: string; isTyping: boolean } }
  | { type: "server_created"; payload: ServerGroup }
  | { type: "channel_created"; payload: Channel }
  | { type: "voice_state_update"; payload: { userId: string; channelId: string | null; isMuted: boolean; isDeafened: boolean } }
  | { type: "voice_speaking_update"; payload: { userId: string; isSpeaking: boolean } };
