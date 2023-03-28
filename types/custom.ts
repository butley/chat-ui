import { Message } from '@/types/index';

export interface UserEntity {
  id?: number;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  provider?: 'GOOGLE' | 'MICROSOFT' | 'NONE';
  status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
}

export interface ChatMessageEntity {
  id?: number;
  created?: string;
  userContent?: string;
  userDateTime?: string;
  user?: UserEntity;
  chatTransactionId?: number;
  conversationId: number;
  userUnread?: boolean;
  agentContent: string;
  agentDateTime?: string;
}

export interface PortalUser {
  clientId?: string;
  clientSecret?: string;
  clientName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  emailVerified?: boolean;
  idToken?: string;
  picture?: string;
  id?: number;
}

function convertChatMessagesToMessages(
  entities: ChatMessageEntity[],
): Message[] {
  return entities.flatMap((entity) => {
    const messages: Message[] = [];

    if (entity.userContent) {
      messages.push({
        role: 'user',
        content: entity.userContent,
        chatTransactionID: entity.chatTransactionId,
        timestamps: entity.userDateTime,
      });
    }

    if (entity.agentContent) {
      messages.push({
        role: 'assistant',
        content: entity.agentContent,
        chatTransactionID: entity.chatTransactionId,
        timestamps: entity.agentDateTime,
      });
    }

    return messages;
  });
}
