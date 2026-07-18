import { useCallback, useEffect, useRef, useState } from 'react';
import { GeminiService } from '../services/ai/GeminiService';
import { ActionRouter } from '../services/actions/ActionRouter';
import type { NovaChatContext, NovaChatMessage } from '../services/ai/types';

export type NovaAssistantState = 'idle' | 'reading' | 'thinking' | 'streaming';

export function useNovaChat(context: NovaChatContext, onActionExecuted?: () => void) {
  const [messages, setMessages] = useState<NovaChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [assistantState, setAssistantState] = useState<NovaAssistantState>('idle');
  const isRequestInFlight = useRef(false);
  const service = useRef(new GeminiService());
  const actionRouter = useRef(new ActionRouter());
  const pendingAction = useRef<string | null>(null);

  useEffect(() => {
    setMessages([{
      id: 'init-msg',
      role: 'model',
      text: `Hello ${context.userName}! I am **Nova Assistant**.\n\nI can help you plan internships, projects, interview preparation, learning roadmaps, and your next career move. What would you like to work through?`,
      timestamp: new Date(),
    }]);
  }, [context.userName]);

  const sendMessage = useCallback(async (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isRequestInFlight.current) return;

    isRequestInFlight.current = true;
    const userMessage: NovaChatMessage = { id: `user-${Date.now()}`, role: 'user', text: trimmedMessage, timestamp: new Date() };
    const history = messages;
    setMessages([...history, userMessage]);
    setInputText('');
    setAssistantState('reading');

    try {
      if (pendingAction.current && /^(cancel|no|never mind)$/i.test(trimmedMessage)) {
        pendingAction.current = null;
        setMessages((current) => [...current, { id: `model-action-${Date.now()}`, role: 'model', text: 'Action cancelled. Your data was not changed.', timestamp: new Date() }]);
        return;
      }
      const isConfirmation = /^(confirm|yes|yes please)$/i.test(trimmedMessage);
      const actionResult = pendingAction.current && isConfirmation
        ? actionRouter.current.route(pendingAction.current, true)
        : actionRouter.current.route(trimmedMessage);

      if (actionResult.status !== 'not-handled') {
        if (actionResult.status === 'confirmation-required') pendingAction.current = trimmedMessage;
        else if (isConfirmation || actionResult.status === 'executed' || actionResult.status === 'failed') pendingAction.current = null;
        if (actionResult.status === 'executed') onActionExecuted?.();
        setMessages((current) => [...current, {
          id: `model-action-${Date.now()}`,
          role: 'model',
          text: actionResult.message,
          timestamp: new Date(),
        }]);
        return;
      }

      setAssistantState('thinking');
      const responseId = `model-${Date.now()}`;
      setMessages((current) => [...current, { id: responseId, role: 'model', text: '', timestamp: new Date(), isStreaming: true }]);
      setAssistantState('streaming');

      let responseText = '';
      for await (const chunk of service.current.streamChat({ message: trimmedMessage, history, context })) {
        responseText += chunk;
        setMessages((current) => current.map((entry) => entry.id === responseId ? { ...entry, text: responseText } : entry));
      }

      setMessages((current) => current.map((entry) => entry.id === responseId ? { ...entry, isStreaming: false } : entry));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nova could not complete that request. Please try again.';
      setMessages((current) => current.map((entry) => entry.isStreaming ? { ...entry, text: errorMessage, isStreaming: false } : entry));
    } finally {
      isRequestInFlight.current = false;
      setAssistantState('idle');
    }
  }, [context, messages, onActionExecuted]);

  return { messages, inputText, setInputText, assistantState, sendMessage };
}
