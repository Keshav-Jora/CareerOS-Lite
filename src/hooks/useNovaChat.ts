import { useCallback, useEffect, useRef, useState } from 'react';
import { GeminiService } from '../services/ai/GeminiService';
import { RepositoryResponseService } from '../services/ai/RepositoryResponseService';
import { ActionRouter } from '../services/actions/ActionRouter';
import { NovaUnderstandingEngine } from '../services/ai/NovaUnderstandingEngine';
import type { ActionPlan } from '../services/ai/understanding/ActionPlanBuilder';
import type { NovaChatContext, NovaChatMessage } from '../services/ai/types';

export type NovaAssistantState = 'idle' | 'reading' | 'thinking' | 'streaming';

export function useNovaChat(context: NovaChatContext, onActionExecuted?: () => void) {
  const [messages, setMessages] = useState<NovaChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [assistantState, setAssistantState] = useState<NovaAssistantState>('idle');
  const isRequestInFlight = useRef(false);
  const service = useRef(new GeminiService());
  const actionRouter = useRef(new ActionRouter());
  const understandingEngine = useRef(new NovaUnderstandingEngine());
  const repositoryResponses = useRef(new RepositoryResponseService());
  const pendingAction = useRef<{ plan: ActionPlan; expiresAt: number } | null>(null);

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

    let responseId: string | undefined;
    try {
      const confirmation = confirmationResponse(trimmedMessage);
      if (pendingAction.current && confirmation) {
        const pending = pendingAction.current;
        pendingAction.current = null;
        if (pending.expiresAt < Date.now()) {
          setMessages((current) => [...current, { id: `model-action-${Date.now()}`, role: 'model', text: 'That pending action expired. Please ask again and I’ll confirm it before making changes.', timestamp: new Date() }]);
          return;
        }
        const actionResult = confirmation === 'cancelled'
          ? { success: false, message: 'Cancelled. No changes were made.' }
          : actionRouter.current.routePlan({ ...pending.plan, requiresConfirmation: false });
        if (actionResult.success) onActionExecuted?.();
        setMessages((current) => [...current, {
          id: `model-action-${Date.now()}`,
          role: 'model',
          text: actionResult.message,
          timestamp: new Date(),
        }]);
        return;
      }
      const repositoryResponse = repositoryResponses.current.respond(trimmedMessage);
      if (repositoryResponse) {
        setMessages((current) => [...current, {
          id: `model-local-${Date.now()}`,
          role: 'model',
          text: repositoryResponse,
          timestamp: new Date(),
        }]);
        return;
      }
      const plan = understandingEngine.current.understand(trimmedMessage);
      const isMutation = ['create', 'update', 'delete', 'archive', 'restore', 'complete'].includes(plan.operation);
      if (isMutation) {
        const actionResult = actionRouter.current.routePlan(plan);
        if (actionResult.reason === 'confirmation-required' && plan.validation.valid) {
          const target = actionResult.data && typeof actionResult.data === 'object' && 'id' in actionResult.data && typeof actionResult.data.id === 'string'
            ? { id: actionResult.data.id }
            : {};
          pendingAction.current = { plan: { ...plan, payload: { ...plan.payload, ...target } }, expiresAt: Date.now() + 5 * 60_000 };
        }
        if (actionResult.success) onActionExecuted?.();
        const responseText = actionResult.reason === 'confirmation-required'
          ? `Are you sure you want to delete ${typeof plan.payload.title === 'string' ? plan.payload.title : 'this item'}? Reply yes to continue or cancel to stop.`
          : actionResult.success ? actionResult.message : actionResult.issues?.map((issue) => `- ${issue.message}`).join('\n') ?? actionResult.message;
        setMessages((current) => [...current, {
          id: `model-action-${Date.now()}`,
          role: 'model',
          text: responseText,
          timestamp: new Date(),
        }]);
        return;
      }

      setAssistantState('thinking');
      responseId = `model-${Date.now()}`;
      setMessages((current) => [...current, { id: responseId, role: 'model', text: '', timestamp: new Date(), isStreaming: true }]);
      setAssistantState('streaming');

      let responseText = '';
      for await (const chunk of service.current.streamChat({ message: trimmedMessage, history, context })) {
        responseText += chunk;
        setMessages((current) => current.map((entry) => entry.id === responseId ? { ...entry, text: responseText } : entry));
      }

      setMessages((current) => current.map((entry) => entry.id === responseId ? { ...entry, isStreaming: false } : entry));
    } catch (error) {
      console.error('Nova Gemini request failed.', error);
      const fallback = repositoryResponses.current.fallback();
      if (responseId) setMessages((current) => current.map((entry) => entry.id === responseId ? { ...entry, text: fallback, isStreaming: false } : entry));
      else setMessages((current) => [...current, { id: `model-fallback-${Date.now()}`, role: 'model', text: fallback, timestamp: new Date() }]);
    } finally {
      isRequestInFlight.current = false;
      setAssistantState('idle');
    }
  }, [context, messages, onActionExecuted]);

  return { messages, inputText, setInputText, assistantState, sendMessage };
}

function confirmationResponse(message: string): 'confirmed' | 'cancelled' | null {
  const value = message.trim().toLowerCase();
  if (/^(yes|yeah|y|confirm|yes delete it|delete it|do it|go ahead|continue)$/i.test(value)) return 'confirmed';
  if (/^(cancel|no|stop|never mind)$/i.test(value)) return 'cancelled';
  return null;
}
