import { axiosClient } from '@lib/axios';
import { ENDPOINTS } from '@config/endpoints';
import { 
  Conversation, 
  Message, 
  MessageCreateRequest,
  UnreadCount,
  ChatUser,
  MessageAttachment,
  MessageReaction
} from '@types';

class MessageService {
  private normalizeDate(value?: string | null): string {
    if (!value) {
      return '';
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
  }

  private normalizeMessage(message: Message): Message {
    return {
      ...message,
      created_at: this.normalizeDate(message.created_at),
      updated_at: this.normalizeDate(message.updated_at),
      reactions: message.reactions?.map((reaction) => ({
        ...reaction,
        created_at: this.normalizeDate(reaction.created_at),
      })),
    };
  }

  private normalizeConversation(conversation: Conversation): Conversation {
    const hasStructuredLastMessage =
      conversation.last_message && typeof conversation.last_message === 'object';

    return {
      ...conversation,
      last_message: hasStructuredLastMessage
        ? this.normalizeMessage(conversation.last_message)
        : undefined,
      last_message_time: this.normalizeDate(conversation.last_message_time),
    };
  }

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    const conversations = await axiosClient.get<Conversation[]>(ENDPOINTS.MESSAGES.CONVERSATIONS);
    return conversations.map((conversation) => this.normalizeConversation(conversation));
  }

  async getConversation(otherUserId: number): Promise<Message[]> {
    const messages = await axiosClient.get<Message[]>(ENDPOINTS.MESSAGES.CONVERSATION(otherUserId));
    return messages.map((message) => this.normalizeMessage(message));
  }

  // Messages
  async sendMessage(data: MessageCreateRequest): Promise<Message> {
    const formData = new FormData();
    formData.append('receiver_id', data.receiver_id.toString());
    formData.append('content', data.content);
    
    if (data.attachments) {
      data.attachments.forEach((file: File) => {
        formData.append('attachments', file);
      });
    }

    const sentMessage = await axiosClient.post<Message>(ENDPOINTS.MESSAGES.SEND, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return this.normalizeMessage(sentMessage);
  }

  async markAsRead(otherUserId: number): Promise<void> {
    await axiosClient.put(ENDPOINTS.MESSAGES.MARK_READ(otherUserId));
  }

  async getUnreadCount(): Promise<UnreadCount> {
    return axiosClient.get<UnreadCount>(ENDPOINTS.MESSAGES.UNREAD_COUNT, {
      timeout: 8000,
    });
  }

  async getMessageableUsers(): Promise<ChatUser[]> {
    return axiosClient.get<ChatUser[]>(ENDPOINTS.MESSAGES.USERS, {
      timeout: 8000,
    });
  }

  // Attachments
  async uploadAttachment(messageId: number, file: File): Promise<MessageAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    
    return axiosClient.post<MessageAttachment>(
      `/messages/${messageId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  async deleteMessage(messageId: number): Promise<void> {
    return axiosClient.delete(`/messages/${messageId}`);
  }

  // Reactions
  async addReaction(messageId: number, emoji: string): Promise<MessageReaction> {
    return axiosClient.post<MessageReaction>(`/messages/${messageId}/reactions`, { emoji });
  }

  async removeReaction(messageId: number, reactionId: number): Promise<void> {
    return axiosClient.delete(`/messages/${messageId}/reactions/${reactionId}`);
  }
}

export const messageService = new MessageService();