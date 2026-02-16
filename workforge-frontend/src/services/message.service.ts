import { axiosClient } from '@lib/axios';
import { ENDPOINTS } from '@config/endpoints';
import { 
  Conversation, 
  Message, 
  MessageCreateRequest,
  UnreadCount,
  MessageAttachment,
  MessageReaction
} from '@types';

class MessageService {
  // Conversations
  async getConversations(): Promise<Conversation[]> {
    return axiosClient.get<Conversation[]>(ENDPOINTS.MESSAGES.CONVERSATIONS);
  }

  async getConversation(otherUserId: number): Promise<Message[]> {
    return axiosClient.get<Message[]>(ENDPOINTS.MESSAGES.CONVERSATION(otherUserId));
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

    return axiosClient.post<Message>(ENDPOINTS.MESSAGES.SEND, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async markAsRead(otherUserId: number): Promise<void> {
    await axiosClient.put(ENDPOINTS.MESSAGES.MARK_READ(otherUserId));
  }

  async getUnreadCount(): Promise<UnreadCount> {
    return axiosClient.get<UnreadCount>(ENDPOINTS.MESSAGES.UNREAD_COUNT);
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