import { useCallback, useEffect, useRef, useState } from 'react';
import { createNovaAIProvider } from '../services/ai/AIProvider';
import { RepositoryResponseService } from '../services/ai/RepositoryResponseService';
import { RecommendationResponseService } from '../services/ai/RecommendationResponseService';
import { ConversationStore } from '../services/ai/ConversationStore';
import { IntentClassifier } from '../services/ai/IntentClassifier';
import { ActionRouter } from '../services/actions/ActionRouter';
import { NovaUnderstandingEngine } from '../services/ai/NovaUnderstandingEngine';
import { AIRouter } from '../services/ai/AIRouter';
import type { ActionPlan } from '../services/ai/understanding/ActionPlanBuilder';
import type { NovaConversation, NovaConversationMessage } from '../types/career-data';
import type { NovaChatContext, NovaChatMessage } from '../services/ai/types';
import { AnalyticsService } from '../analytics/AnalyticsService';

export type NovaAssistantState = 'idle' | 'reading' | 'thinking' | 'streaming';
const ACTIVE_CONVERSATION_KEY = 'career_os_nova_active_conversation';

const toStoredMessage = (message: NovaChatMessage): NovaConversationMessage => ({
  id: message.id,
  role: message.role,
  content: message.text,
  timestamp: message.timestamp.toISOString(),
  provider: message.provider,
  model: message.model,
});

const toChatMessage = (message: NovaConversationMessage): NovaChatMessage => ({
  id: message.id,
  role: message.role,
  text: message.content,
  timestamp: new Date(message.timestamp),
  provider: message.provider,
  model: message.model,
});

function welcomeMessage(userName: string): NovaChatMessage {
  return {
    id: `welcome-${Date.now()}`,
    role: 'model',
    text: `Hello ${userName}! I am **Nova Assistant**.\n\nI can help you plan internships, projects, interview preparation, learning roadmaps, and your next career move. What would you like to work through?`,
    timestamp: new Date(),
  };
}

export function useNovaChat(context: NovaChatContext, onActionExecuted?: () => void) {
  const store = useRef(new ConversationStore());
  const initialConversation = useRef<NovaConversation | null>(store.current.get(localStorage.getItem(ACTIVE_CONVERSATION_KEY) ?? ''));
  const [messages, setMessages] = useState<NovaChatMessage[]>(() => initialConversation.current?.messages.map(toChatMessage) ?? [welcomeMessage(context.userName)]);
  const [conversations, setConversations] = useState<NovaConversation[]>(() => store.current.getAll());
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => initialConversation.current?.id ?? null);
  const activeConversationRef = useRef<string | null>(initialConversation.current?.id ?? null);
  const [inputText, setInputText] = useState('');
  const [assistantState, setAssistantState] = useState<NovaAssistantState>('idle');
  const isRequestInFlight = useRef(false);
  const service = useRef(createNovaAIProvider());
  const actionRouter = useRef(new ActionRouter());
  const understandingEngine = useRef(new NovaUnderstandingEngine());
  const intentClassifier = useRef(new IntentClassifier());
  const aiRouter = useRef(new AIRouter());
  const repositoryResponses = useRef(new RepositoryResponseService());
  const recommendationResponses = useRef(new RecommendationResponseService());
  const pendingAction = useRef<{ plan: ActionPlan; expiresAt: number } | null>(null);

  const refreshConversations = useCallback(() => setConversations(store.current.getAll()), []);
  const persistMessages = useCallback((conversationId: string, nextMessages: NovaChatMessage[]) => {
    store.current.saveMessages(conversationId, nextMessages.map(toStoredMessage));
    refreshConversations();
  }, [refreshConversations]);

  const newChat = useCallback(() => {
    activeConversationRef.current = null;
    localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
    setActiveConversationId(null);
    pendingAction.current = null;
    setMessages([welcomeMessage(context.userName)]);
    setInputText('');
  }, [context.userName]);

  const selectConversation = useCallback((conversationId: string) => {
    const conversation = store.current.get(conversationId);
    if (!conversation) return;
    activeConversationRef.current = conversation.id;
    localStorage.setItem(ACTIVE_CONVERSATION_KEY, conversation.id);
    setActiveConversationId(conversation.id);
    pendingAction.current = null;
    setMessages(conversation.messages.map(toChatMessage));
  }, []);

  const renameConversation = useCallback((conversationId: string, title: string) => {
    store.current.rename(conversationId, title);
    refreshConversations();
  }, [refreshConversations]);

  const deleteConversation = useCallback((conversationId: string) => {
    const wasActive = activeConversationRef.current === conversationId;
    store.current.delete(conversationId);
    refreshConversations();
    if (wasActive) newChat();
  }, [newChat, refreshConversations]);

  const toggleConversationPin = useCallback((conversationId: string) => {
    store.current.togglePinned(conversationId);
    refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    const refresh = () => {
      refreshConversations();
      if (!activeConversationRef.current) {
        const activeId = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
        const conversation = activeId ? store.current.get(activeId) : null;
        if (conversation) {
          activeConversationRef.current = conversation.id;
          setActiveConversationId(conversation.id);
          setMessages(conversation.messages.map(toChatMessage));
        }
      }
    };
    window.addEventListener('career-os-data-changed', refresh);
    return () => window.removeEventListener('career-os-data-changed', refresh);
  }, [refreshConversations]);

  const appendModelMessage = useCallback((conversationId: string, message: NovaChatMessage) => {
    setMessages((current) => {
      const next = [...current, message];
      persistMessages(conversationId, next);
      return next;
    });
  }, [persistMessages]);

  const sendMessage = useCallback(async (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isRequestInFlight.current) return;

    isRequestInFlight.current = true;
    const userMessage: NovaChatMessage = { id: `user-${Date.now()}`, role: 'user', text: trimmedMessage, timestamp: new Date() };
    const history = messages;
    let conversationId = activeConversationRef.current;

    if (!conversationId) {
      const welcome = history[0]?.role === 'model' ? history[0] : welcomeMessage(context.userName);
      const conversation = store.current.create(toStoredMessage(userMessage), toStoredMessage(welcome));
      conversationId = conversation.id;
      activeConversationRef.current = conversation.id;
      localStorage.setItem(ACTIVE_CONVERSATION_KEY, conversation.id);
      setActiveConversationId(conversation.id);
      refreshConversations();
    } else {
      persistMessages(conversationId, [...history, userMessage]);
    }

    setMessages([...history, userMessage]);
    setInputText('');
    setAssistantState('reading');
    const requestStartedAt = performance.now();
    AnalyticsService.track({ event: 'chat_started', feature: 'nova_chat' });

    let responseId: string | undefined;
    try {
      const confirmation = confirmationResponse(trimmedMessage);
      if (pendingAction.current && confirmation) {
        const pending = pendingAction.current;
        pendingAction.current = null;
        const response = pending.expiresAt < Date.now()
          ? 'That pending action expired. Please ask again and I’ll confirm it before making changes.'
          : confirmation === 'cancelled'
            ? 'Cancelled. No changes were made.'
            : actionRouter.current.routePlan({ ...pending.plan, requiresConfirmation: false }).message;
        appendModelMessage(conversationId, { id: `model-action-${Date.now()}`, role: 'model', text: response, timestamp: new Date() });
        return;
      }

      const repositoryResponse = repositoryResponses.current.respond(trimmedMessage);
      if (repositoryResponse) {
        appendModelMessage(conversationId, { id: `model-local-${Date.now()}`, role: 'model', text: repositoryResponse, timestamp: new Date() });
        return;
      }
      const recommendationResponse = recommendationResponses.current.respond(trimmedMessage);
      if (recommendationResponse) {
        appendModelMessage(conversationId, { id: `model-recommendation-${Date.now()}`, role: 'model', text: recommendationResponse, timestamp: new Date() });
        return;
      }

      const classified = await intentClassifier.current.classify(trimmedMessage, service.current, context);
      service.current.setProviderOrder(aiRouter.current.route(classified.intent).providerOrder);
      const plan = classified.intent === 'UNKNOWN'
        ? understandingEngine.current.understand(trimmedMessage)
        : understandingEngine.current.understandClassified(trimmedMessage, classified);
      const isMutation = ['create', 'update', 'delete', 'archive', 'restore', 'complete'].includes(plan.operation);
      if (isMutation) {
        const actionResult = actionRouter.current.routePlan(plan);
        if (actionResult.reason === 'confirmation-required' && plan.validation.valid) {
          const target = actionResult.data && typeof actionResult.data === 'object' && 'id' in actionResult.data && typeof actionResult.data.id === 'string' ? { id: actionResult.data.id } : {};
          pendingAction.current = { plan: { ...plan, payload: { ...plan.payload, ...target } }, expiresAt: Date.now() + 5 * 60_000 };
        }
        if (actionResult.success) onActionExecuted?.();
        const responseText = actionResult.reason === 'confirmation-required'
          ? `Are you sure you want to delete ${typeof plan.payload.title === 'string' ? plan.payload.title : 'this item'}? Reply yes to continue or cancel to stop.`
          : actionResult.success ? actionResult.message : actionResult.issues?.map((issue) => `- ${issue.message}`).join('\n') ?? actionResult.message;
        appendModelMessage(conversationId, { id: `model-action-${Date.now()}`, role: 'model', text: responseText, timestamp: new Date() });
        return;
      }

      setAssistantState('thinking');
      responseId = `model-${Date.now()}`;
      setMessages((current) => [...current, { id: responseId!, role: 'model', text: '', timestamp: new Date(), isStreaming: true }]);
      setAssistantState('streaming');
      let responseText = '';
      let responseProvider: string | undefined;
      let responseModel: string | undefined;
      for await (const response of service.current.streamResponse({ message: trimmedMessage, history, context })) {
        responseText += response.text;
        responseProvider = response.provider;
        responseModel = response.model;
        setMessages((current) => current.map((entry) => entry.id === responseId
          ? { ...entry, text: responseText, provider: response.provider, model: response.model }
          : entry));
      }
      setMessages((current) => {
        const next = current.map((entry) => entry.id === responseId ? { ...entry, isStreaming: false } : entry);
        persistMessages(conversationId, next);
        return next;
      });
      const responseTime = Math.round(performance.now() - requestStartedAt);
      AnalyticsService.track({ event: 'chat_completed', feature: 'nova_chat', provider: responseProvider, model: responseModel, responseTime });
      if (responseProvider) AnalyticsService.track({ event: 'provider_used', feature: 'nova_chat', provider: responseProvider, model: responseModel, responseTime });
    } catch (error) {
      console.error('Nova Gemini request failed.', error);
      AnalyticsService.track({ event: 'ai_error', feature: 'nova_chat' });
      AnalyticsService.track({ event: 'provider_failed', feature: 'nova_chat' });
      AnalyticsService.track({ event: 'fallback_used', feature: 'nova_chat' });
      const fallback = repositoryResponses.current.fallback();
      if (responseId) {
        setMessages((current) => {
          const next = current.map((entry) => entry.id === responseId ? { ...entry, text: fallback, isStreaming: false } : entry);
          persistMessages(conversationId, next);
          return next;
        });
      } else {
        appendModelMessage(conversationId, { id: `model-fallback-${Date.now()}`, role: 'model', text: fallback, timestamp: new Date() });
      }
    } finally {
      isRequestInFlight.current = false;
      setAssistantState('idle');
    }
  }, [appendModelMessage, context, messages, onActionExecuted, persistMessages, refreshConversations]);

  return { messages, inputText, setInputText, assistantState, sendMessage, conversations, activeConversationId, newChat, selectConversation, renameConversation, deleteConversation, toggleConversationPin };
}

function confirmationResponse(message: string): 'confirmed' | 'cancelled' | null {
  const value = message.trim().toLowerCase();
  if (/^(yes|yeah|y|confirm|yes delete it|delete it|do it|go ahead|continue)$/i.test(value)) return 'confirmed';
  if (/^(cancel|no|stop|never mind)$/i.test(value)) return 'cancelled';
  return null;
}
