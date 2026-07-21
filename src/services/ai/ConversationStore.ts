import { dataService } from '../dataService';
import type { NovaConversation, NovaConversationMessage } from '../../types/career-data';

export class ConversationStore {
  getAll(): NovaConversation[] {
    return dataService.repository.getAll<NovaConversation>('conversation')
      .sort((left, right) => Number(Boolean(right.pinned)) - Number(Boolean(left.pinned)) || right.updatedAt.localeCompare(left.updatedAt));
  }

  get(id: string): NovaConversation | null {
    return dataService.repository.get<NovaConversation>('conversation', id);
  }

  create(firstMessage: NovaConversationMessage, welcomeMessage: NovaConversationMessage): NovaConversation {
    const timestamp = firstMessage.timestamp;
    return dataService.repository.create<NovaConversation>('conversation', {
      title: this.titleFrom(firstMessage.content),
      createdAt: timestamp,
      updatedAt: timestamp,
      model: 'gemini-3.5-flash',
      messages: [welcomeMessage, firstMessage],
    });
  }

  saveMessages(id: string, messages: NovaConversationMessage[]): NovaConversation | null {
    return dataService.repository.update<NovaConversation>('conversation', id, {
      messages,
      updatedAt: new Date().toISOString(),
    });
  }

  rename(id: string, title: string): NovaConversation | null {
    const value = title.trim();
    return value ? dataService.repository.update<NovaConversation>('conversation', id, { title: value, updatedAt: new Date().toISOString() }) : null;
  }

  delete(id: string): boolean {
    return dataService.repository.delete('conversation', id);
  }

  togglePinned(id: string): NovaConversation | null {
    const conversation = this.get(id);
    return conversation ? dataService.repository.update<NovaConversation>('conversation', id, { pinned: !conversation.pinned, updatedAt: new Date().toISOString() }) : null;
  }

  private titleFrom(message: string): string {
    const normalized = message.replace(/\s+/g, ' ').trim();
    if (/^(hi|hello|hey|thanks|thank you)$/i.test(normalized)) return 'New career conversation';
    return normalized.length <= 56 ? normalized : `${normalized.slice(0, 53).trimEnd()}…`;
  }
}
