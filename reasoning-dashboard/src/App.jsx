import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { callGemini } from './utils/api';
import { THINKER_SYSTEM_PROMPT, CRITIC_SYSTEM_PROMPT, JUDGE_SYSTEM_PROMPT } from './prompts';
import { parseThinkerResponse, parseCriticResponse, parseJudgeResponse, generateQueryId } from './utils/parser';
import { ThinkerIcon, CriticIcon, JudgeIcon, ChevronIcon } from './components/Icons';
import './App.css';

function App() {
  const [inputValue, setInputValue] = useState('');
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(true);
  const [useChatHistory, setUseChatHistory] = useState(true);
  const [showInternalReasoning, setShowInternalReasoning] = useState(false);
  const [processingMessageId, setProcessingMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [chatsLoaded, setChatsLoaded] = useState(false);
  const [visibleOverride, setVisibleOverride] = useState(null);

  // Save chats via API
  const saveChatsToServer = async () => {
    try {
      console.log('Saving chats to server:', { conversations: conversations.length, messages: messages.length, currentConversationId });
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversations, messages, currentConversationId })
      });
      const data = await response.json();
      console.log('Save response:', data);
    } catch (err) {
      console.error('Failed to save chats to server:', err);
    }
  };

const loadChatsFromServer = async () => {
    try {
      console.log('Loading chats from server...');
      const res = await fetch('/api/load');
      const data = await res.json();
      
      const { conversations: serverConvs, messages: serverMsgs, currentConversationId: serverCurrId } = data;
      
      // 1. Set Conversations
      if (serverConvs) setConversations(serverConvs);
      
      // 2. Set Messages (Simple load, remove complex migration logic for now)
      if (serverMsgs) {
        setMessages(serverMsgs);
      }

      // 3. Set Current Conversation ID
      // Only set it if it exists in the conversation list, otherwise null (New Chat)
      if (serverCurrId && serverConvs.some(c => c.id === serverCurrId)) {
        setCurrentConversationId(serverCurrId);
      } else {
        setCurrentConversationId(null);
      }
      
      setChatsLoaded(true);
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Also scroll when switching conversations or when visible messages change
  // (moved below so `visibleMessages` is defined before use)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [inputValue]);

  // Build chat history context for models
  const buildChatContext = (currentPrompt) => {
    if (!useChatHistory) return currentPrompt;

    if (messages.length === 0) return currentPrompt;

    const history = messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => {
        if (msg.role === 'user') {
          return `User: ${msg.content}`;
        } else {
          return `Assistant: ${msg.structuredResponse?.judge?.final_answer || msg.content}`;
        }
      })
      .join('\n\n');

    return `${history}\n\nUser: ${currentPrompt}`;
  };

  // Load chats from server on app mount
  useEffect(() => {
    console.log('App mounted, loading chats...');
    loadChatsFromServer();
  }, []);

// Auto-save to server when data changes
  useEffect(() => {
    if (!chatsLoaded) return; 
    
    // PREVENT SAVING EMPTY DATA OVER EXISTING DATA
    // Only save if we actually have conversations/messages or if the intent was to clear them.
    // This is a safety guard.
    if (conversations.length === 0 && messages.length === 0) {
       console.log('Skipping auto-save of empty state');
       return; 
    }

    console.log('State changed, saving chats...');
    // Debounce this if possible, but for now direct call is fine
    saveChatsToServer();
  }, [conversations, messages, currentConversationId, chatsLoaded]);
  const toggleMessageReasoning = (messageId) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, showInternal: !m.showInternal } : m));
  };

  // Orchestrate the tri-model chain: Thinker → Critic → Judge
  const orchestrate = async (userQuery, messageId) => {
    const startTime = Date.now();
    const queryId = generateQueryId();
    const chatContext = buildChatContext(userQuery);
    
    const results = {
      thinkerRaw: '',
      criticRaw: '',
      judgeRaw: ''
    };

    // Step 1: Generate Thinker response
    updateMessageStatus(messageId, 'thinking');
    try {
      results.thinkerRaw = await callGemini(THINKER_SYSTEM_PROMPT, chatContext, 20000);
      console.log('--- THINKER RAW START ---');
      console.log(results.thinkerRaw);
      console.log('--- THINKER RAW END ---');
      updateMessageInternal(messageId, 'thinker', parseThinkerResponse(results.thinkerRaw));
    } catch (error) {
      const errorMsg = error.message;
      results.thinkerRaw = `Error: ${errorMsg}`;
      updateMessageInternal(messageId, 'thinker', { internal: true, reasoning_type: 'commonsense', raw: `Error: ${errorMsg}` });
      updateMessageStatus(messageId, 'error');
      return null;
    }

    // Step 2: Generate Critic response
    updateMessageStatus(messageId, 'critiquing');
    let criticParsed = { internal: true, raw: '' };
    try {
      const criticInput = `Question: ${userQuery}\n\nThinker's Response:\n${results.thinkerRaw}`;
      results.criticRaw = await callGemini(CRITIC_SYSTEM_PROMPT, criticInput, 20000);
      console.log('--- CRITIC RAW START ---');
      console.log(results.criticRaw);
      console.log('--- CRITIC RAW END ---');
      criticParsed = parseCriticResponse(results.criticRaw);
      updateMessageInternal(messageId, 'critic', criticParsed);
    } catch (error) {
      const errorMsg = error.message;
      results.criticRaw = `Error: ${errorMsg}`;
      criticParsed = { internal: true, raw: `Error: ${errorMsg}` };
      updateMessageInternal(messageId, 'critic', criticParsed);
    }

    // Step 3: Generate Judge response (final step)
    updateMessageStatus(messageId, 'judging');
    let judgeParsed = { final_answer: '', judge_reasoning: '' };
    try {
      const judgeInput = `Question: ${userQuery}\n\nThinker's Response:\n${results.thinkerRaw}\n\nCritic's Evaluation:\n${results.criticRaw}`;
      results.judgeRaw = await callGemini(JUDGE_SYSTEM_PROMPT, judgeInput, 20000);
      console.log('--- JUDGE RAW START ---');
      console.log(results.judgeRaw);
      console.log('--- JUDGE RAW END ---');
      judgeParsed = parseJudgeResponse(results.judgeRaw);
      updateMessageInternal(messageId, 'judge', judgeParsed);
    } catch (error) {
      const errorMsg = error.message;
      results.judgeRaw = `Error: ${errorMsg}`;
      judgeParsed = {
        final_answer: `Error: ${errorMsg}`,
        judge_reasoning: 'Judge failed to evaluate'
      };
      updateMessageInternal(messageId, 'judge', judgeParsed);
    }

    const latency = Date.now() - startTime;
    const thinkerParsed = parseThinkerResponse(results.thinkerRaw);

    // Build structured JSON response
    const structuredResponse = {
      id: queryId,
      prompt: userQuery,
      meta: {
        timestamp: new Date().toISOString(),
        latency_ms: latency
      },
      thinker: thinkerParsed,
      critic: criticParsed,
      judge: judgeParsed
    };

    updateMessageComplete(messageId, structuredResponse);
    return structuredResponse;
  };

  const updateMessageStatus = (messageId, status) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, status }
        : msg
    ));
  };

  const updateMessageInternal = (messageId, type, data) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const newInternal = { ...msg.internal, [type]: data };
        return { ...msg, internal: newInternal };
      }
      return msg;
    }));
  };

  const updateMessageComplete = (messageId, structuredResponse) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, status: 'complete', structuredResponse, content: structuredResponse.judge.final_answer }
        : msg
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    const messageId = generateQueryId();

    // Create or update conversation
    let convId = currentConversationId;
    if (!convId) {
      convId = generateQueryId();
      const newConv = {
        id: convId,
        title: userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : ''),
        timestamp: new Date().toLocaleString(),
        createdAt: new Date().toISOString()
      };
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversationId(convId);
    }

    // Create user message
    const userMsg = {
      id: messageId + '-user',
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
      conversationId: convId
    };

    // Create assistant message (placeholder)
    const assistantMsg = {
      id: messageId,
      role: 'assistant',
      content: '',
      status: 'thinking',
      internal: { thinker: null, critic: null, judge: null },
      showInternal: false,
      structuredResponse: null,
      timestamp: new Date().toISOString(),
      conversationId: convId
    };

    // Add messages
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInputValue('');

    // Start orchestration
    await orchestrate(userMessage, messageId);
  };

  const startNewConversation = () => {
    console.log('Starting new conversation');
    setCurrentConversationId(null);
    setShowInternalReasoning(false);
    // REMOVED: setVisibleOverride(null);
  };

  const loadConversation = (conversationId) => {
    console.log('Switching to conversation:', conversationId);
    setCurrentConversationId(conversationId);
    setShowInternalReasoning(false);
    // REMOVED: setVisibleOverride call
    // The render loop will pick this up automatically via getMessagesForConversation
  };
  const deleteConversation = (conversationId, e) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    setMessages(prev => prev.filter(msg => msg.conversationId !== conversationId));
    if (currentConversationId === conversationId) {
      startNewConversation();
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'thinking': return 'Thinking...';
      case 'critiquing': return 'Critiquing...';
      case 'judging': return 'Judging...';
      case 'complete': return 'Complete';
      case 'error': return 'Error';
      default: return 'Processing...';
    }
  };

  const isProcessing = messages.some(msg => msg.status && msg.status !== 'complete' && msg.status !== 'error');

  // Helper: get messages for a conversation by id. 
  // STRICT FILTERING: Only return messages that actually match the ID.
  const getMessagesForConversation = (convId) => {
    // 1. If no conversation is selected (New Chat), return empty.
    if (!convId) return [];
    
    // 2. Filter messages strictly by conversationId
    // Sort by timestamp to ensure order
    return messages
      .filter(m => m.conversationId === convId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  };

// SIMPLIFIED: Just ask for messages for the current ID
  const visibleMessages = getMessagesForConversation(currentConversationId);
 // Clear visible override when underlying messages change so view re-evaluates
  useEffect(() => {
    if (visibleOverride) setVisibleOverride(null);
  }, [messages]);
  // Scroll when switching conversations or when visible messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversationId, visibleMessages.length]);

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="main-title">Tri-Model Reasoning System</h1>
          <div className="header-actions">
            <div style={{display:'flex', gap: '0.5rem', alignItems: 'center'}}>
              <button className="menu-button" onClick={() => { loadChatsFromServer(); console.log('Manual reload triggered'); }}>
                Reload chats
              </button>
              <button className="menu-button" onClick={() => {
                console.log('DEBUG DUMP - conversations:', conversations.length, 'messages:', messages.length);
                console.log('Conversations sample:', conversations.slice(0,10));
                console.log('Messages sample:', messages.slice(0,20));
                const ids = Array.from(new Set(messages.map(m => m.conversationId).filter(Boolean)));
                console.log('Unique conversationIds in messages:', ids);
              }}>
                Dump state
              </button>
              <div className="user-section">
                <div className="user-avatar">S</div>
                <span className="user-name">Sapan</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="main-layout">
        <aside className={`sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`}>
          <div className="sidebar-header">
            {isSidebarOpen && (
              <button 
                className="new-chat-button"
                onClick={startNewConversation}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                New Chat
              </button>
            )}
            <button 
              className="collapse-button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const next = !isSidebarOpen;
                setIsSidebarOpen(next);
                if (!next) setIsChatHistoryOpen(false);
              }}
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isSidebarOpen ? (
                  <polyline points="9 18 15 12 9 6"></polyline>
                ) : (
                  <polyline points="15 18 9 12 15 6"></polyline>
                )}
              </svg>
            </button>
          </div>

          {isSidebarOpen && (
            <div className="chat-history">
              <div className="history-section">
                <button 
                  className="section-header"
                  onClick={() => setIsChatHistoryOpen(!isChatHistoryOpen)}
                >
                  <h3>Recent Chats</h3>
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    className={isChatHistoryOpen ? 'rotated' : ''}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {isChatHistoryOpen && (
                  <div className="history-list">
                    {conversations.length === 0 ? (
                      <div className="no-chats">No recent chats</div>
                    ) : (
                      conversations.map((conv) => (
                        <div 
                          key={conv.id} 
                          className={`history-item ${currentConversationId === conv.id ? 'active' : ''}`}
                          onClick={() => loadConversation(conv.id)}
                        >
                          <div className="chat-info">
                            <div className="chat-title-small">{conv.title}</div>
                            <div className="chat-timestamp">{conv.timestamp}</div>
                          </div>
                          <button
                            className="delete-chat-button"
                            onClick={(e) => deleteConversation(conv.id, e)}
                            title="Delete conversation"
                            type="button"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        <main className="main-content chat-container">
            <div className="messages-list">
            {visibleMessages.length === 0 ? (
              currentConversationId ? (
                <div className="empty-conversation">
                  <p className="empty-small">No messages in this conversation yet. Type below to continue.</p>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#94a3b8" fill="rgba(148,163,184,0.06)"/>
                    </svg>
                  </div>
                  <h2>Start a conversation</h2>
                  <p>Ask a question and watch the tri-model system reason through it.</p>
                </div>
              )
            ) : (
              visibleMessages.map((message) => (
                <div key={message.id} className={`message ${message.role}`}>
                  {message.role === 'user' ? (
                    <div className="message-content user-message">
                      <div className="message-avatar user">U</div>
                      <div className="message-text">{message.content}</div>
                    </div>
                  ) : (
                    <div className="message-content assistant-message">
                      <div className="message-avatar assistant">AI</div>
                      <div className="message-toggle">
                        <button
                          className="message-chevron"
                          onClick={() => toggleMessageReasoning(message.id)}
                          title={message.showInternal || showInternalReasoning ? 'Hide reasoning' : 'Show reasoning'}
                          type="button"
                        >
                          <ChevronIcon isOpen={!!(message.showInternal || showInternalReasoning)} />
                        </button>
                      </div>
                      <div className="message-body">
                        {/* per-message display logic: show internal reasoning before final answer when enabled */}
                        {(() => {
                          const displayInternal = showInternalReasoning || message.showInternal;
                          if (message.status === 'complete') {
                            return (
                              <>
                                {displayInternal && (
                                  <div className={`internal-reasoning inline-before reveal-reasoning`}>
                                    <InternalReasoningPanels 
                                      thinker={message.internal?.thinker}
                                      critic={message.internal?.critic}
                                      judge={message.internal?.judge || message.structuredResponse?.judge}
                                      showThinker={message.showThinker || showInternalReasoning}
                                      showCritic={message.showCritic || showInternalReasoning}
                                      showJudge={message.showJudge || showInternalReasoning}
                                    />
                                  </div>
                                )}
                                <div className="final-answer">
                                  <ReactMarkdown>{message.structuredResponse?.judge?.final_answer || message.content}</ReactMarkdown>
                                </div>
                              </>
                            );
                          }

                          // Loading steps: show vertical three-step progress
                          const step = message.status;
                          return (
                            <>
                              <div className="loading-inline">
                                <div className="loading-spinner small" aria-hidden="true"></div>
                                <div className="loading-text">
                                  {step === 'thinking' ? 'Thinking...' : step === 'critiquing' ? 'Critiquing...' : step === 'judging' ? 'Judging...' : getStatusText(step)}
                                </div>
                              </div>

                              {/* show any available internal parts during loading if toggled */}
                              {(message.internal && (showInternalReasoning || message.showInternal)) && (
                                <div className="internal-reasoning inline-before">
                                  <InternalReasoningPanels
                                    thinker={message.internal?.thinker}
                                    critic={message.internal?.critic}
                                    judge={message.internal?.judge}
                                  />
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>
      </div>

      <div className="input-section">
        <form onSubmit={handleSubmit} className="input-form">
          <div className="input-container">
            <div className="input-wrapper">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message here..."
                className="prompt-input"
                rows="1"
                disabled={isProcessing}
              />
              <button 
                type="submit" 
                className="send-button"
                disabled={isProcessing || !inputValue.trim()}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Internal Reasoning Panels Component
function InternalReasoningPanels({ thinker, critic, judge }) {
  return (
    <div className="internal-panels">
      {thinker && (
        <div className="internal-panel">
          <div className="internal-panel-header">
            <ThinkerIcon />
            <strong>Thinker</strong>
            {thinker.reasoning_type && (
              <span className="reasoning-badge-small">
                {thinker.reasoning_type}
              </span>
            )}
          </div>
          <div className="internal-content">
            <pre>{thinker.raw}</pre>
          </div>
        </div>
      )}
      {critic && (
        <div className="internal-panel">
          <div className="internal-panel-header">
            <CriticIcon />
            <strong>Critic</strong>
          </div>
          <div className="internal-content">
            <pre>{critic.raw}</pre>
          </div>
        </div>
      )}
      {judge && (
        <div className="internal-panel">
          <div className="internal-panel-header">
            <JudgeIcon />
            <strong>Judge's Evaluation</strong>
          </div>
          <div className="internal-content">
            <pre>{judge.judge_reasoning}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
