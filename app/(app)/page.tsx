'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  History, 
  RefreshCw, 
  MessageCircle,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Sparkles,
  Star,
  Copy,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
// Note: Removed unused 'Share' import

interface Session {
  id: number;
  question: string;
  answer: string;
  llm_provider: string;
  response_time_ms: number;
  created_at: string;
  is_successful: boolean;
}

interface HistoryResponse {
  sessions: Session[];
  total: number;
  page: number;
  size: number;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isSuccessful?: boolean;
  responseTime?: number;
  rating?: 'like' | 'dislike' | null;
}

const BASE_URL = 'https://fastapi-backend-ten.vercel.app';

const suggestedQuestions = [
  "What&apos;s the weather like today?",
  "Explain quantum computing simply",
  "Write a creative story",
  "Help me plan a workout routine",
  "What are the latest tech trends?",
  "Explain machine learning basics"
];

export default function HomePage() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [showWelcome, setShowWelcome] = useState(true);
  const [stats, setStats] = useState({ totalChats: 0, successRate: 0, avgResponseTime: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Wrap loadHistory in useCallback to fix the useEffect dependency warning
  const loadHistory = useCallback(async () => {
    if (!token) return;
    
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`${BASE_URL}/api/v1/qa/history?page=1&size=50`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          console.error('Authentication failed');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data: HistoryResponse = await response.json();
      const historyMessages: Message[] = data.sessions.reverse().flatMap(session => ([
        {
          id: `user-${session.id}`,
          content: session.question,
          role: 'user',
          timestamp: new Date(session.created_at)
        },
        {
          id: `assistant-${session.id}`,
          content: session.answer,
          role: 'assistant',
          timestamp: new Date(session.created_at),
          isSuccessful: session.is_successful,
          responseTime: session.response_time_ms,
          rating: null
        }
      ]));
      
      setMessages(historyMessages);
      if (historyMessages.length > 0) setShowWelcome(false);
      
      // Calculate stats
      const totalChats = data.sessions.length;
      const successfulChats = data.sessions.filter(s => s.is_successful).length;
      const avgResponseTime = data.sessions.reduce((acc, s) => acc + s.response_time_ms, 0) / totalChats;
      
      setStats({
        totalChats,
        successRate: totalChats > 0 ? Math.round((successfulChats / totalChats) * 100) : 0,
        avgResponseTime: Math.round(avgResponseTime)
      });
      
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [token]); // Add token as dependency

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const t = await getToken();
        setToken(t);
      } catch (error) {
        console.error('Error fetching token:', error);
      }
    };
    
    if (isSignedIn) {
      fetchToken();
      checkServerHealth();
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (isSignedIn && token && connectionStatus === 'connected') {
      loadHistory();
    }
  }, [isSignedIn, token, connectionStatus, loadHistory]); // Fixed: Added loadHistory to dependencies

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  const checkServerHealth = async () => {
    setConnectionStatus('checking');
    try {
      const response = await fetch(`${BASE_URL}/health`);
      setConnectionStatus(response.ok ? 'connected' : 'disconnected');
    } catch {
      setConnectionStatus('disconnected');
    }
  };

  const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent, customQuestion?: string) => {
    e.preventDefault();
    const questionText = customQuestion || input.trim();
    if (!questionText || isLoading || connectionStatus !== 'connected' || !token) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: questionText,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setShowWelcome(false);
    setInput('');
    setIsLoading(true);

    try {
      const startTime = Date.now();
      const response = await fetch(`${BASE_URL}/api/v1/qa/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question: questionText, llm_provider: 'openai' }),
      });
      
      const responseTime = Date.now() - startTime;
      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: data.answer || 'No response received',
        role: 'assistant',
        timestamp: new Date(),
        isSuccessful: response.ok,
        responseTime: data.response_time_ms || responseTime,
        rating: null
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        content: 'An error occurred. Please check your connection and try again.',
        role: 'assistant',
        timestamp: new Date(),
        isSuccessful: false,
        rating: null
      }]);
      checkServerHealth();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRating = (messageId: string, rating: 'like' | 'dislike') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, rating: msg.rating === rating ? null : rating }
        : msg
    ));
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connected': 
        return { 
          text: 'Connected', 
          color: 'text-emerald-600', 
          bgColor: 'bg-emerald-50 border-emerald-200',
          icon: <CheckCircle className="w-4 h-4" />
        };
      case 'disconnected': 
        return { 
          text: 'Offline', 
          color: 'text-red-600', 
          bgColor: 'bg-red-50 border-red-200',
          icon: <XCircle className="w-4 h-4" />
        };
      case 'checking': 
        return { 
          text: 'Connecting...', 
          color: 'text-amber-600', 
          bgColor: 'bg-amber-50 border-amber-200',
          icon: <Loader2 className="w-4 h-4 animate-spin" />
        };
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setShowWelcome(true);
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex items-center justify-center h-screen p-8">
          <div className="max-w-lg text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-2xl border border-white/20">
              <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                <Bot className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                Query_GPT
              </h1>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Your intelligent AI companion for meaningful conversations, instant answers, and creative collaboration.
              </p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {[
                  { icon: <Zap className="w-5 h-5 text-yellow-500" />, text: 'Lightning Fast' },
                  { icon: <MessageCircle className="w-5 h-5 text-blue-500" />, text: 'Smart Chat' },
                  { icon: <Sparkles className="w-5 h-5 text-purple-500" />, text: 'AI Powered' }
                ].map((feature, i) => (
                  <div key={i} className="flex flex-col items-center p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                    {feature.icon}
                    <span className="mt-2 text-gray-700 font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusDisplay = getConnectionStatusDisplay();

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="flex justify-between items-center p-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Assistant
                </h1>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <span>{messages.filter(m => m.role === 'user').length} conversations</span>
                  {stats.totalChats > 0 && (
                    <>
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>{stats.successRate}% success</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Enhanced Status Display */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border transition-all duration-200 ${statusDisplay.bgColor}`}>
              {statusDisplay.icon}
              <span className={`text-sm font-medium ${statusDisplay.color}`}>
                {statusDisplay.text}
              </span>
            </div>
            
            {/* Enhanced Action Buttons */}
            <div className="flex items-center space-x-2">
              {[
                { 
                  icon: RefreshCw, 
                  onClick: checkServerHealth, 
                  loading: connectionStatus === 'checking',
                  title: 'Check Connection',
                  color: 'text-blue-600 hover:bg-blue-50'
                },
                { 
                  icon: History, 
                  onClick: loadHistory, 
                  loading: isLoadingHistory,
                  title: 'Refresh History',
                  color: 'text-green-600 hover:bg-green-50'
                },
                { 
                  icon: Plus, 
                  onClick: clearChat,
                  title: 'New Chat',
                  color: 'text-purple-600 hover:bg-purple-50'
                }
              ].map(({ icon: Icon, onClick, loading, title, color }, i) => (
                <button
                  key={i}
                  onClick={onClick}
                  disabled={loading}
                  className={`p-3 ${color} rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md`}
                  title={title}
                >
                  <Icon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Main Chat Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-8">
          {/* Enhanced Welcome Screen */}
          {showWelcome && messages.length === 0 && !isLoadingHistory && (
            <div className="text-center py-16">
              <div className="mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Welcome back, {user?.firstName || 'User'}! 👋
                </h2>
                <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                  {"I'm here to help you with anything you need. Ask me a question, start a conversation, or explore some suggestions below."}
                </p>
                
                {/* Stats Cards */}
                {stats.totalChats > 0 && (
                  <div className="grid grid-cols-3 gap-6 max-w-md mx-auto mb-12">
                    {[
                      { label: 'Total Chats', value: stats.totalChats, icon: MessageCircle, color: 'from-blue-500 to-cyan-500' },
                      { label: 'Success Rate', value: `${stats.successRate}%`, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
                      { label: 'Avg Response', value: `${stats.avgResponseTime}ms`, icon: Clock, color: 'from-purple-500 to-pink-500' }
                    ].map(({ label, value, icon: Icon, color }, i) => (
                      <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-xl flex items-center justify-center text-white mb-4 mx-auto`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{value}</div>
                        <div className="text-sm text-gray-500">{label}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Enhanced Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12">
                  {[
                    { icon: Search, text: "Ask me anything", subtitle: "Get instant answers", color: "from-blue-500 to-cyan-500" },
                    { icon: Zap, text: "Quick responses", subtitle: "Lightning fast AI", color: "from-purple-500 to-pink-500" },
                    { icon: MessageCircle, text: "Natural conversation", subtitle: "Chat like a human", color: "from-green-500 to-emerald-500" },
                    { icon: Sparkles, text: "Creative tasks", subtitle: "Writing & brainstorming", color: "from-orange-500 to-red-500" },
                    { icon: Clock, text: "24/7 availability", subtitle: "Always here to help", color: "from-indigo-500 to-purple-500" },
                    { icon: Star, text: "Personalized", subtitle: "Learns your preferences", color: "from-yellow-500 to-orange-500" }
                  ].map((item, index) => (
                    <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className={`w-14 h-14 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg`}>
                        <item.icon className="w-7 h-7" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.text}</h3>
                      <p className="text-sm text-gray-600">{item.subtitle}</p>
                    </div>
                  ))}
                </div>

                {/* Suggested Questions */}
                <div className="max-w-3xl mx-auto">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Try asking me:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {suggestedQuestions.map((question, i) => (
                      <button
                        key={i}
                        onClick={(e) => handleSubmit(e, question)}
                        className="p-4 text-left bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                      >
                        <span className="text-sm text-gray-700">{question}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading History */}
          {isLoadingHistory && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3 text-gray-500 bg-white rounded-2xl p-6 shadow-lg">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-lg">Loading your conversation history...</span>
              </div>
            </div>
          )}

          {/* Enhanced Messages */}
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`flex items-start space-x-4 max-w-4xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* Enhanced Avatar */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-tr from-blue-500 to-purple-600 text-white' 
                    : message.isSuccessful === false 
                      ? 'bg-gradient-to-tr from-red-500 to-pink-500 text-white' 
                      : 'bg-gradient-to-tr from-green-500 to-emerald-500 text-white'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>

                {/* Enhanced Message Content */}
                <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block p-6 rounded-3xl shadow-lg border transition-all duration-200 hover:shadow-xl ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-lg'
                      : message.isSuccessful === false
                        ? 'bg-red-50 border-red-200 text-red-800 rounded-bl-lg'
                        : 'bg-white border-gray-200 text-gray-800 rounded-bl-lg'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Enhanced Message Meta */}
                    <div className={`flex items-center justify-between mt-4 pt-4 border-t ${
                      message.role === 'user'
                        ? 'border-blue-400/30'
                        : message.isSuccessful === false
                          ? 'border-red-200'
                          : 'border-gray-200'
                    }`}>
                      <span className={`text-xs flex items-center gap-1 ${
                        message.role === 'user'
                          ? 'text-blue-100'
                          : message.isSuccessful === false
                            ? 'text-red-500'
                            : 'text-gray-500'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {formatTime(message.timestamp)}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {message.responseTime && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            message.role === 'user'
                              ? 'bg-blue-400/20 text-blue-100'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {message.responseTime}ms
                          </span>
                        )}
                        
                        {/* Action Buttons for Assistant Messages */}
                        {message.role === 'assistant' && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => copyMessage(message.content)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                              title="Copy"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleRating(message.id, 'like')}
                              className={`p-1 rounded transition-colors ${
                                message.rating === 'like' 
                                  ? 'text-green-600 bg-green-100' 
                                  : 'text-gray-400 hover:text-green-600'
                              }`}
                              title="Like"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleRating(message.id, 'dislike')}
                              className={`p-1 rounded transition-colors ${
                                message.rating === 'dislike' 
                                  ? 'text-red-600 bg-red-100' 
                                  : 'text-gray-400 hover:text-red-600'
                              }`}
                              title="Dislike"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Enhanced Typing Indicator */}
          {isLoading && (
            <div className="flex justify-start animate-fadeIn">
              <div className="flex items-start space-x-4 max-w-4xl">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-tr from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-3xl rounded-bl-lg p-6 shadow-lg">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Enhanced Input Area */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200/50 p-6">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSubmit} className="flex items-end space-x-4">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here..."
                className="w-full resize-none p-4 pr-16 rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white shadow-lg transition-all duration-200"
                rows={1}
                maxLength={2000}
                disabled={connectionStatus !== 'connected' || !token}
              />
              <div className="absolute bottom-3 right-4 text-xs text-gray-400">
                {input.length}/2000
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim() || connectionStatus !== 'connected' || !token}
              className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Send className="w-6 h-6" />
              )}
            </button>
          </form>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}



// 'use client';

// import { useAuth, useUser } from '@clerk/nextjs';
// import { useState, useRef, useEffect } from 'react';
// import { 
//   Send, 
//   Bot, 
//   User, 
//   Loader2, 
//   History, 
//   RefreshCw, 
//   MessageCircle,
//   Zap,
//   Clock,
//   CheckCircle,
//   XCircle,
//   Plus,
//   Search,
//   Sparkles,
//   Star,
//   Copy,
//   ThumbsUp,
//   ThumbsDown
// } from 'lucide-react';

// interface Session {
//   id: number;
//   question: string;
//   answer: string;
//   llm_provider: string;
//   response_time_ms: number;
//   created_at: string;
//   is_successful: boolean;
// }

// interface HistoryResponse {
//   sessions: Session[];
//   total: number;
//   page: number;
//   size: number;
// }

// interface Message {
//   id: string;
//   content: string;
//   role: 'user' | 'assistant';
//   timestamp: Date;
//   isSuccessful?: boolean;
//   responseTime?: number;
//   rating?: 'like' | 'dislike' | null;
// }

// const BASE_URL = 'http://localhost:8000';

// const suggestedQuestions = [
//   "What's the weather like today?",
//   "Explain quantum computing simply",
//   "Write a creative story",
//   "Help me plan a workout routine",
//   "What are the latest tech trends?",
//   "Explain machine learning basics"
// ];

// export default function HomePage() {
//   const { isSignedIn, getToken } = useAuth();
//   const { user } = useUser();

//   const [token, setToken] = useState<string | null>(null);
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [input, setInput] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [isLoadingHistory, setIsLoadingHistory] = useState(false);
//   const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
//   const [showWelcome, setShowWelcome] = useState(true);
//   const [stats, setStats] = useState({ totalChats: 0, successRate: 0, avgResponseTime: 0 });
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const textareaRef = useRef<HTMLTextAreaElement>(null);

//   useEffect(() => {
//     const fetchToken = async () => {
//       try {
//         const t = await getToken();
//         setToken(t);
//       } catch (error) {
//         console.error('Error fetching token:', error);
//       }
//     };
    
//     if (isSignedIn) {
//       fetchToken();
//       checkServerHealth();
//     }
//   }, [getToken, isSignedIn]);

//   useEffect(() => {
//     if (isSignedIn && token && connectionStatus === 'connected') {
//       loadHistory();
//     }
//   }, [isSignedIn, token, connectionStatus]);

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   useEffect(() => {
//     adjustTextareaHeight();
//   }, [input]);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   const adjustTextareaHeight = () => {
//     const textarea = textareaRef.current;
//     if (textarea) {
//       textarea.style.height = 'auto';
//       textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
//     }
//   };

//   const checkServerHealth = async () => {
//     setConnectionStatus('checking');
//     try {
//       const response = await fetch(`${BASE_URL}/health`);
//       setConnectionStatus(response.ok ? 'connected' : 'disconnected');
//     } catch {
//       setConnectionStatus('disconnected');
//     }
//   };

//   const loadHistory = async () => {
//     if (!token) return;
    
//     setIsLoadingHistory(true);
//     try {
//       const response = await fetch(`${BASE_URL}/api/v1/qa/history?page=1&size=50`, {
//         headers: { 
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });
      
//       if (!response.ok) {
//         if (response.status === 403) {
//           console.error('Authentication failed');
//           return;
//         }
//         throw new Error(`HTTP ${response.status}`);
//       }
      
//       const data: HistoryResponse = await response.json();
//       const historyMessages: Message[] = data.sessions.reverse().flatMap(session => ([
//         {
//           id: `user-${session.id}`,
//           content: session.question,
//           role: 'user',
//           timestamp: new Date(session.created_at)
//         },
//         {
//           id: `assistant-${session.id}`,
//           content: session.answer,
//           role: 'assistant',
//           timestamp: new Date(session.created_at),
//           isSuccessful: session.is_successful,
//           responseTime: session.response_time_ms,
//           rating: null
//         }
//       ]));
      
//       setMessages(historyMessages);
//       if (historyMessages.length > 0) setShowWelcome(false);
      
//       // Calculate stats
//       const totalChats = data.sessions.length;
//       const successfulChats = data.sessions.filter(s => s.is_successful).length;
//       const avgResponseTime = data.sessions.reduce((acc, s) => acc + s.response_time_ms, 0) / totalChats;
      
//       setStats({
//         totalChats,
//         successRate: totalChats > 0 ? Math.round((successfulChats / totalChats) * 100) : 0,
//         avgResponseTime: Math.round(avgResponseTime)
//       });
      
//     } catch (error) {
//       console.error('Error loading history:', error);
//     } finally {
//       setIsLoadingHistory(false);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent, customQuestion?: string) => {
//     e.preventDefault();
//     const questionText = customQuestion || input.trim();
//     if (!questionText || isLoading || connectionStatus !== 'connected' || !token) return;

//     const userMessage: Message = {
//       id: `user-${Date.now()}`,
//       content: questionText,
//       role: 'user',
//       timestamp: new Date()
//     };

//     setMessages(prev => [...prev, userMessage]);
//     setShowWelcome(false);
//     setInput('');
//     setIsLoading(true);

//     try {
//       const startTime = Date.now();
//       const response = await fetch(`${BASE_URL}/api/v1/qa/ask`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify({ question: questionText, llm_provider: 'openai' }),
//       });
      
//       const responseTime = Date.now() - startTime;
//       const data = await response.json();

//       const assistantMessage: Message = {
//         id: `assistant-${Date.now()}`,
//         content: data.answer || 'No response received',
//         role: 'assistant',
//         timestamp: new Date(),
//         isSuccessful: response.ok,
//         responseTime: data.response_time_ms || responseTime,
//         rating: null
//       };
      
//       setMessages(prev => [...prev, assistantMessage]);
//     } catch (error) {
//       console.error('Error:', error);
//       setMessages(prev => [...prev, {
//         id: `assistant-${Date.now()}`,
//         content: 'An error occurred. Please check your connection and try again.',
//         role: 'assistant',
//         timestamp: new Date(),
//         isSuccessful: false,
//         rating: null
//       }]);
//       checkServerHealth();
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleRating = (messageId: string, rating: 'like' | 'dislike') => {
//     setMessages(prev => prev.map(msg => 
//       msg.id === messageId 
//         ? { ...msg, rating: msg.rating === rating ? null : rating }
//         : msg
//     ));
//   };

//   const copyMessage = async (content: string) => {
//     try {
//       await navigator.clipboard.writeText(content);
//       // You could add a toast notification here
//     } catch (error) {
//       console.error('Failed to copy:', error);
//     }
//   };

//   const getConnectionStatusDisplay = () => {
//     switch (connectionStatus) {
//       case 'connected': 
//         return { 
//           text: 'Connected', 
//           color: 'text-emerald-600', 
//           bgColor: 'bg-emerald-50 border-emerald-200',
//           icon: <CheckCircle className="w-4 h-4" />
//         };
//       case 'disconnected': 
//         return { 
//           text: 'Offline', 
//           color: 'text-red-600', 
//           bgColor: 'bg-red-50 border-red-200',
//           icon: <XCircle className="w-4 h-4" />
//         };
//       case 'checking': 
//         return { 
//           text: 'Connecting...', 
//           color: 'text-amber-600', 
//           bgColor: 'bg-amber-50 border-amber-200',
//           icon: <Loader2 className="w-4 h-4 animate-spin" />
//         };
//     }
//   };

//   const handleKeyDown = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSubmit(e);
//     }
//   };

//   const clearChat = () => {
//     setMessages([]);
//     setShowWelcome(true);
//   };

//   const formatTime = (timestamp: Date) => {
//     return timestamp.toLocaleTimeString('en-US', {
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   if (!isSignedIn) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
//         <div className="flex items-center justify-center h-screen p-8">
//           <div className="max-w-lg text-center">
//             <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-2xl border border-white/20">
//               <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
//                 <Bot className="w-12 h-12 text-white" />
//               </div>
//               <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
//                 Query_GPT
//               </h1>
//               <p className="text-gray-600 mb-8 text-lg leading-relaxed">
//                 Your intelligent AI companion for meaningful conversations, instant answers, and creative collaboration.
//               </p>
//               <div className="grid grid-cols-3 gap-4 text-sm">
//                 {[
//                   { icon: <Zap className="w-5 h-5 text-yellow-500" />, text: 'Lightning Fast' },
//                   { icon: <MessageCircle className="w-5 h-5 text-blue-500" />, text: 'Smart Chat' },
//                   { icon: <Sparkles className="w-5 h-5 text-purple-500" />, text: 'AI Powered' }
//                 ].map((feature, i) => (
//                   <div key={i} className="flex flex-col items-center p-4 bg-gray-50/50 rounded-xl border border-gray-100">
//                     {feature.icon}
//                     <span className="mt-2 text-gray-700 font-medium">{feature.text}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const statusDisplay = getConnectionStatusDisplay();

//   return (
//     <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
//       {/* Enhanced Header */}
//       <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
//         <div className="flex justify-between items-center p-6">
//           <div className="flex items-center space-x-4">
//             <div className="flex items-center space-x-4">
//               <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
//                 <Bot className="w-7 h-7 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//                   AI Assistant
//                 </h1>
//                 <p className="text-sm text-gray-500 flex items-center gap-2">
//                   <span>{messages.filter(m => m.role === 'user').length} conversations</span>
//                   {stats.totalChats > 0 && (
//                     <>
//                       <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
//                       <span>{stats.successRate}% success</span>
//                     </>
//                   )}
//                 </p>
//               </div>
//             </div>
//           </div>
          
//           <div className="flex items-center space-x-4">
//             {/* Enhanced Status Display */}
//             <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border transition-all duration-200 ${statusDisplay.bgColor}`}>
//               {statusDisplay.icon}
//               <span className={`text-sm font-medium ${statusDisplay.color}`}>
//                 {statusDisplay.text}
//               </span>
//             </div>
            
//             {/* Enhanced Action Buttons */}
//             <div className="flex items-center space-x-2">
//               {[
//                 { 
//                   icon: RefreshCw, 
//                   onClick: checkServerHealth, 
//                   loading: connectionStatus === 'checking',
//                   title: 'Check Connection',
//                   color: 'text-blue-600 hover:bg-blue-50'
//                 },
//                 { 
//                   icon: History, 
//                   onClick: loadHistory, 
//                   loading: isLoadingHistory,
//                   title: 'Refresh History',
//                   color: 'text-green-600 hover:bg-green-50'
//                 },
//                 { 
//                   icon: Plus, 
//                   onClick: clearChat,
//                   title: 'New Chat',
//                   color: 'text-purple-600 hover:bg-purple-50'
//                 }
//               ].map(({ icon: Icon, onClick, loading, title, color }, i) => (
//                 <button
//                   key={i}
//                   onClick={onClick}
//                   disabled={loading}
//                   className={`p-3 ${color} rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md`}
//                   title={title}
//                 >
//                   <Icon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Enhanced Main Chat Area */}
//       <main className="flex-1 overflow-y-auto">
//         <div className="max-w-5xl mx-auto p-6 space-y-8">
//           {/* Enhanced Welcome Screen */}
//           {showWelcome && messages.length === 0 && !isLoadingHistory && (
//             <div className="text-center py-16">
//               <div className="mb-12">
//                 <h2 className="text-4xl font-bold text-gray-900 mb-4">
//                   Welcome back, {user?.firstName || 'User'}! 👋
//                 </h2>
//                 <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
//                   I'm here to help you with anything you need. Ask me a question, start a conversation, or explore some suggestions below.
//                 </p>
                
//                 {/* Stats Cards */}
//                 {stats.totalChats > 0 && (
//                   <div className="grid grid-cols-3 gap-6 max-w-md mx-auto mb-12">
//                     {[
//                       { label: 'Total Chats', value: stats.totalChats, icon: MessageCircle, color: 'from-blue-500 to-cyan-500' },
//                       { label: 'Success Rate', value: `${stats.successRate}%`, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
//                       { label: 'Avg Response', value: `${stats.avgResponseTime}ms`, icon: Clock, color: 'from-purple-500 to-pink-500' }
//                     ].map(({ label, value, icon: Icon, color }, i) => (
//                       <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
//                         <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-xl flex items-center justify-center text-white mb-4 mx-auto`}>
//                           <Icon className="w-6 h-6" />
//                         </div>
//                         <div className="text-2xl font-bold text-gray-900">{value}</div>
//                         <div className="text-sm text-gray-500">{label}</div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
                
//                 {/* Enhanced Quick Actions */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12">
//                   {[
//                     { icon: Search, text: "Ask me anything", subtitle: "Get instant answers", color: "from-blue-500 to-cyan-500" },
//                     { icon: Zap, text: "Quick responses", subtitle: "Lightning fast AI", color: "from-purple-500 to-pink-500" },
//                     { icon: MessageCircle, text: "Natural conversation", subtitle: "Chat like a human", color: "from-green-500 to-emerald-500" },
//                     { icon: Sparkles, text: "Creative tasks", subtitle: "Writing & brainstorming", color: "from-orange-500 to-red-500" },
//                     { icon: Clock, text: "24/7 availability", subtitle: "Always here to help", color: "from-indigo-500 to-purple-500" },
//                     { icon: Star, text: "Personalized", subtitle: "Learns your preferences", color: "from-yellow-500 to-orange-500" }
//                   ].map((item, index) => (
//                     <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
//                       <div className={`w-14 h-14 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg`}>
//                         <item.icon className="w-7 h-7" />
//                       </div>
//                       <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.text}</h3>
//                       <p className="text-sm text-gray-600">{item.subtitle}</p>
//                     </div>
//                   ))}
//                 </div>

//                 {/* Suggested Questions */}
//                 <div className="max-w-3xl mx-auto">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-6">Try asking me:</h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                     {suggestedQuestions.map((question, i) => (
//                       <button
//                         key={i}
//                         onClick={(e) => handleSubmit(e, question)}
//                         className="p-4 text-left bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
//                       >
//                         <span className="text-sm text-gray-700">{question}</span>
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Loading History */}
//           {isLoadingHistory && (
//             <div className="flex items-center justify-center py-12">
//               <div className="flex items-center space-x-3 text-gray-500 bg-white rounded-2xl p-6 shadow-lg">
//                 <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
//                 <span className="text-lg">Loading your conversation history...</span>
//               </div>
//             </div>
//           )}

//           {/* Enhanced Messages */}
//           {messages.map((message, index) => (
//             <div
//               key={message.id}
//               className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
//               style={{ animationDelay: `${index * 0.1}s` }}
//             >
//               <div className={`flex items-start space-x-4 max-w-4xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
//                 {/* Enhanced Avatar */}
//                 <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
//                   message.role === 'user' 
//                     ? 'bg-gradient-to-tr from-blue-500 to-purple-600 text-white' 
//                     : message.isSuccessful === false 
//                       ? 'bg-gradient-to-tr from-red-500 to-pink-500 text-white' 
//                       : 'bg-gradient-to-tr from-green-500 to-emerald-500 text-white'
//                 }`}>
//                   {message.role === 'user' ? (
//                     <User className="w-5 h-5" />
//                   ) : (
//                     <Bot className="w-5 h-5" />
//                   )}
//                 </div>

//                 {/* Enhanced Message Content */}
//                 <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
//                   <div className={`inline-block p-6 rounded-3xl shadow-lg border transition-all duration-200 hover:shadow-xl ${
//                     message.role === 'user'
//                       ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-lg'
//                       : message.isSuccessful === false
//                         ? 'bg-red-50 border-red-200 text-red-800 rounded-bl-lg'
//                         : 'bg-white border-gray-200 text-gray-800 rounded-bl-lg'
//                   }`}>
//                     <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    
//                     {/* Enhanced Message Meta */}
//                     <div className={`flex items-center justify-between mt-4 pt-4 border-t ${
//                       message.role === 'user'
//                         ? 'border-blue-400/30'
//                         : message.isSuccessful === false
//                           ? 'border-red-200'
//                           : 'border-gray-200'
//                     }`}>
//                       <span className={`text-xs flex items-center gap-1 ${
//                         message.role === 'user'
//                           ? 'text-blue-100'
//                           : message.isSuccessful === false
//                             ? 'text-red-500'
//                             : 'text-gray-500'
//                       }`}>
//                         <Clock className="w-3 h-3" />
//                         {formatTime(message.timestamp)}
//                       </span>
                      
//                       <div className="flex items-center gap-2">
//                         {message.responseTime && (
//                           <span className={`text-xs px-2 py-1 rounded-full ${
//                             message.role === 'user'
//                               ? 'bg-blue-400/20 text-blue-100'
//                               : 'bg-gray-100 text-gray-600'
//                           }`}>
//                             {message.responseTime}ms
//                           </span>
//                         )}
                        
//                         {/* Action Buttons for Assistant Messages */}
//                         {message.role === 'assistant' && (
//                           <div className="flex items-center gap-1">
//                             <button
//                               onClick={() => copyMessage(message.content)}
//                               className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
//                               title="Copy"
//                             >
//                               <Copy className="w-3 h-3" />
//                             </button>
//                             <button
//                               onClick={() => handleRating(message.id, 'like')}
//                               className={`p-1 rounded transition-colors ${
//                                 message.rating === 'like' 
//                                   ? 'text-green-600 bg-green-100' 
//                                   : 'text-gray-400 hover:text-green-600'
//                               }`}
//                               title="Like"
//                             >
//                               <ThumbsUp className="w-3 h-3" />
//                             </button>
//                             <button
//                               onClick={() => handleRating(message.id, 'dislike')}
//                               className={`p-1 rounded transition-colors ${
//                                 message.rating === 'dislike' 
//                                   ? 'text-red-600 bg-red-100' 
//                                   : 'text-gray-400 hover:text-red-600'
//                               }`}
//                               title="Dislike"
//                             >
//                               <ThumbsDown className="w-3 h-3" />
//                             </button>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}

//           {/* Enhanced Typing Indicator */}
//           {isLoading && (
//             <div className="flex justify-start animate-fadeIn">
//               <div className="flex items-start space-x-4 max-w-4xl">
//                 <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-tr from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
//                   <Bot className="w-5 h-5 text-white" />
//                 </div>
//                 <div className="bg-white border border-gray-200 rounded-3xl rounded-bl-lg p-6 shadow-lg">
//                   <div className="flex space-x-2">
//                     <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
//                     <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
//                     <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           <div ref={messagesEndRef} />
//         </div>
//       </main>

//       {/* Enhanced Input Area */}
//       <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200/50 p-6">
//         <div className="max-w-5xl mx-auto">
//           <form onSubmit={handleSubmit} className="flex items-end space-x-4">
//             <div className="flex-1 relative">
//               <textarea
//                 ref={textareaRef}
//                 value={input}
//                 onChange={e => setInput(e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 placeholder="Type your message here..."
//                 className="w-full resize-none p-4 pr-16 rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white shadow-lg transition-all duration-200"
//                 rows={1}
//                 maxLength={2000}
//                 disabled={connectionStatus !== 'connected' || !token}
//               />
//               <div className="absolute bottom-3 right-4 text-xs text-gray-400">
//                 {input.length}/2000
//               </div>
//             </div>
//             <button
//               type="submit"
//               disabled={isLoading || !input.trim() || connectionStatus !== 'connected' || !token}
//               className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
//             >
//               {isLoading ? (
//                 <Loader2 className="w-6 h-6 animate-spin" />
//               ) : (
//                 <Send className="w-6 h-6" />
//               )}
//             </button>
//           </form>
//         </div>
//       </footer>

//       <style jsx>{`
//         @keyframes fadeIn {
//           from {
//             opacity: 0;
//             transform: translateY(20px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
//         .animate-fadeIn {
//           animation: fadeIn 0.5s ease-out forwards;
//         }
//       `}</style>
//     </div>
//   );
// }
 