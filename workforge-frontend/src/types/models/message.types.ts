export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  reactions?: Array<{
    id: number;
    message_id: number;
    user_id: number;
    emoji: string;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface MessageCreateRequest {
  receiver_id: number;
  content: string;
  attachments?: File[];
}

export interface Conversation {
  id: number;
  conversation_id: string;
  other_user: {
    id: number;
    username: string;
    email: string;
    role: string;
    profile: {
      id: number;
      full_name?: string;
      company_name?: string;
      profile_picture?: string;
      logo?: string;
      role: string;
      is_online?: boolean;
    } | null;
  };
  last_message?: Message;
  last_message_time?: string;
  unread_count: number;
}

export interface UnreadCount {
  unread_count: number;
}