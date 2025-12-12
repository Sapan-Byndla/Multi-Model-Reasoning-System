import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: 'Multi-model analysis', timestamp: '2 min ago' },
    { id: 2, title: 'Reasoning comparison', timestamp: '1 hour ago' },
    { id: 3, title: 'Complex problem solving', timestamp: 'Yesterday' },
    { id: 4, title: 'Model evaluation', timestamp: '2 days ago' }
  ]);
  const [currentChat, setCurrentChat] = useState('New Conversation');
  const [modelOutputs, setModelOutputs] = useState({
    thinker: '',
    critique: '',
    judge: ''
  });

  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [inputValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    // Simulate model outputs
    setModelOutputs({
      thinker: `Thinking process for: "${inputValue}"\n\nAnalyzing the problem from multiple angles...\n\n1. Breaking down the core components\n2. Identifying key relationships\n3. Exploring potential solutions\n\nInitial hypothesis: The problem requires a systematic approach...`,
      critique: `Critical analysis of: "${inputValue}"\n\nStrengths:\n- Clear problem definition\n- Multiple solution paths available\n\nWeaknesses:\n- Potential bias in initial assumptions\n- Need for more data validation\n\nRecommendations:\n- Gather additional context\n- Test multiple scenarios`,
      judge: `Final judgment for: "${inputValue}"\n\nEvaluation Criteria:\n✓ Logical consistency: High\n✓ Feasibility: Moderate\n✓ Impact potential: High\n\nDecision: Proceed with implementation\nConfidence level: 85%\n\nNext steps: Begin execution phase`
    });

    // Add to chat history if new conversation
    if (currentChat === 'New Conversation') {
      const newChat = {
        id: Date.now(),
        title: inputValue.slice(0, 30) + (inputValue.length > 30 ? '...' : ''),
        timestamp: 'Just now'
      };
      setChatHistory([newChat, ...chatHistory]);
      setCurrentChat(newChat.title);
    }

    setInputValue('');
  };

  const suggestions = [
    "Analyze the ethical implications of AI decision-making",
    "Compare different approaches to problem-solving",
    "Evaluate the pros and cons of renewable energy",
    "Design a strategy for sustainable business growth"
  ];

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1 className="main-title">
            <span className="brain-icon">🧠</span>
            Multi-Model Reasoning System
          </h1>
          <div className="user-section">
            <div className="user-avatar">S</div>
            <span className="user-name">Sapan</span>
          </div>
        </div>
        <div className="chat-title">{currentChat}</div>
      </header>

      <div className="main-layout">
        {/* Left Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <button className="menu-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <button className="new-chat-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New Chat
            </button>
          </div>

          <div className="chat-history">
            <div className="history-section">
              <h3>Recent Chats</h3>
              <div className="history-list">
                {chatHistory.map((chat) => (
                  <div 
                    key={chat.id} 
                    className={`history-item ${currentChat === chat.title ? 'active' : ''}`}
                    onClick={() => setCurrentChat(chat.title)}
                  >
                    <div className="chat-info">
                      <div className="chat-title-small">{chat.title}</div>
                      <div className="chat-timestamp">{chat.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <div className="models-grid">
            {/* Thinker Panel */}
            <div className="model-panel">
              <div className="panel-header">
                <div className="panel-icon thinker">💭</div>
                <h3>Thinker</h3>
              </div>
              <div className="panel-content">
                {modelOutputs.thinker ? (
                  <div className="output-text">{modelOutputs.thinker}</div>
                ) : (
                  <div className="placeholder">
                    <div className="placeholder-icon">💭</div>
                    <p>Thinking process will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Critique Panel */}
            <div className="model-panel">
              <div className="panel-header">
                <div className="panel-icon critique">🔍</div>
                <h3>Critique</h3>
              </div>
              <div className="panel-content">
                {modelOutputs.critique ? (
                  <div className="output-text">{modelOutputs.critique}</div>
                ) : (
                  <div className="placeholder">
                    <div className="placeholder-icon">🔍</div>
                    <p>Critical analysis will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Judge Panel */}
            <div className="model-panel">
              <div className="panel-header">
                <div className="panel-icon judge">⚖️</div>
                <h3>Judge</h3>
              </div>
              <div className="panel-content">
                {modelOutputs.judge ? (
                  <div className="output-text">{modelOutputs.judge}</div>
                ) : (
                  <div className="placeholder">
                    <div className="placeholder-icon">⚖️</div>
                    <p>Final judgment will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Input Section */}
      <div className="input-section">
        <form onSubmit={handleSubmit} className="input-form">
          <div className="input-container">
            <div className="suggestions">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="suggestion-chip"
                  onClick={() => setInputValue(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <div className="input-wrapper">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a complex prompt here..."
                className="prompt-input"
                rows="1"
              />
              <button type="submit" className="send-button">
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

export default App;
