'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useState, useRef, useEffect } from 'react';
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
  Share,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

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

const BASE_URL = 'http://localhost:8000';

const suggestedQuestions = [
  "What's the weather like today?",
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
  }, [isSignedIn, token, connectionStatus]);

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

  const loadHistory = async () => {
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
                  I'm here to help you with anything you need. Ask me a question, start a conversation, or explore some suggestions below.
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
 
 // // Enhanced Chat UI with Modern Design and UX Improvements
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
//   Search
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
// }

// const BASE_URL = 'http://localhost:8000';

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
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const textareaRef = useRef<HTMLTextAreaElement>(null);

//   useEffect(() => {
//     const fetchToken = async () => {
//       const t = await getToken();
//       setToken(t);
//     };
//     fetchToken();
//     checkServerHealth();
//   }, [getToken]);

//   useEffect(() => {
//     if (isSignedIn && connectionStatus === 'connected') loadHistory();
//   }, [isSignedIn, connectionStatus]);

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

//   // const loadHistory = async () => {
//   //   setIsLoadingHistory(true);
//   //   try {
//   //     const response = await fetch(`${BASE_URL}/api/v1/qa/history?page=1&size=50`, {
//   //       headers: token ? { 'Authorization': `Bearer ${token}` } : {}
//   //     });
//   //     console.log("mytoken", token);
//   //     if (!response.ok) throw new Error();
//   //     const data: HistoryResponse = await response.json();
//   //     const historyMessages: Message[] = data.sessions.reverse().flatMap(session => ([
//   //       {
//   //         id: `user-${session.id}`,
//   //         content: session.question,
//   //         role: 'user',
//   //         timestamp: new Date(session.created_at)
//   //       },
//   //       {
//   //         id: `assistant-${session.id}`,
//   //         content: session.answer,
//   //         role: 'assistant',
//   //         timestamp: new Date(session.created_at),
//   //         isSuccessful: session.is_successful,
//   //         responseTime: session.response_time_ms
//   //       }
//   //     ]));
//   //     setMessages(historyMessages);
//   //     if (historyMessages.length > 0) setShowWelcome(false);
//   //   } catch (error) {
//   //     console.error('Error loading history:', error);
//   //   } finally {
//   //     setIsLoadingHistory(false);
//   //   }
//   // };

//   // Instead of just getToken(), try getting the session token specifically
// const loadHistory = async () => {
//   setIsLoadingHistory(true);
//   try {
//     // Get the session token instead of JWT
//     const sessionToken = await getToken();
    
//     const response = await fetch(`${BASE_URL}/api/v1/qa/history?page=1&size=50`, {
//       headers: sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}
//     });
//           console.log("mytoken_sessionToken", sessionToken);
//       if (!response.ok) throw new Error();
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
//           responseTime: session.response_time_ms
//         }
//       ]));
//       setMessages(historyMessages);
//       if (historyMessages.length > 0) setShowWelcome(false);
//   } catch (error) {
//     console.error('Error loading history:', error);
//   } finally {
//     setIsLoadingHistory(false);
//   }
// };

//   const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
//     e.preventDefault();
//     if (!input.trim() || isLoading || connectionStatus !== 'connected') return;

//     const userMessage: Message = {
//       id: `user-${Date.now()}`,
//       content: input.trim(),
//       role: 'user',
//       timestamp: new Date()
//     };

//     setMessages(prev => [...prev, userMessage]);
//     setShowWelcome(false);
//     const questionText = input.trim();
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
//         responseTime: data.response_time_ms || responseTime
//       };
//       setMessages(prev => [...prev, assistantMessage]);
//     } catch (error) {
//       console.error('Error:', error);
//       setMessages(prev => [...prev, {
//         id: `assistant-${Date.now()}`,
//         content: 'An error occurred. Check if the server is running and try again.',
//         role: 'assistant',
//         timestamp: new Date(),
//         isSuccessful: false
//       }]);
//       checkServerHealth();
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const getConnectionStatusDisplay = () => {
//     switch (connectionStatus) {
//       case 'connected': 
//         return { 
//           text: 'Connected', 
//           color: 'text-emerald-600', 
//           bgColor: 'bg-emerald-50',
//           icon: <CheckCircle className="w-4 h-4" />
//         };
//       case 'disconnected': 
//         return { 
//           text: 'Disconnected', 
//           color: 'text-red-600', 
//           bgColor: 'bg-red-50',
//           icon: <XCircle className="w-4 h-4" />
//         };
//       case 'checking': 
//         return { 
//           text: 'Checking...', 
//           color: 'text-amber-600', 
//           bgColor: 'bg-amber-50',
//           icon: <Loader2 className="w-4 h-4 animate-spin" />
//         };
//       default: 
//         return { 
//           text: 'Unknown', 
//           color: 'text-gray-600', 
//           bgColor: 'bg-gray-50',
//           icon: <XCircle className="w-4 h-4" />
//         };
//     }
//   };

//   const handleKeyDown = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e);
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
//           <div className="max-w-md text-center">
//             <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
//               <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
//                 <Bot className="w-10 h-10 text-white" />
//               </div>
//               <h2 className="text-3xl font-bold text-gray-900 mb-3">Welcome to Query_GPT</h2>
//               <p className="text-gray-600 mb-6 leading-relaxed">
//                 Your intelligent AI assistant is ready to help. Sign in to start meaningful conversations and get instant answers.
//               </p>
//               <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
//                 <div className="flex items-center">
//                   <Zap className="w-4 h-4 mr-1 text-yellow-500" />
//                   Fast Responses
//                 </div>
//                 <div className="flex items-center">
//                   <MessageCircle className="w-4 h-4 mr-1 text-blue-500" />
//                   Smart Conversations
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const statusDisplay = getConnectionStatusDisplay();

//   return (
//     <div className="flex flex-col h-screen bg-gray-50">
//       {/* Header */}
//       <header className="bg-white border-b border-gray-200 shadow-sm">
//         <div className="flex justify-between items-center p-4">
//           <div className="flex items-center space-x-4">
//             <div className="flex items-center space-x-3">
//               <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
//                 <Bot className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-xl font-bold text-gray-900">AI Assistant</h1>
//                 <p className="text-sm text-gray-500">
//                   {messages.filter(m => m.role === 'user').length} conversations
//                 </p>
//               </div>
//             </div>
//           </div>
          
//           <div className="flex items-center space-x-3">
//             {/* Connection Status */}
//             <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${statusDisplay.bgColor} transition-all duration-200`}>
//               {statusDisplay.icon}
//               <span className={`text-sm font-medium ${statusDisplay.color}`}>
//                 {statusDisplay.text}
//               </span>
//             </div>
            
//             {/* Action Buttons */}
//             <div className="flex items-center space-x-1">
//               <button
//                 onClick={checkServerHealth}
//                 className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
//                 title="Check Connection"
//               >
//                 <RefreshCw className={`w-5 h-5 ${connectionStatus === 'checking' ? 'animate-spin' : ''}`} />
//               </button>
//               <button
//                 onClick={loadHistory}
//                 disabled={isLoadingHistory}
//                 className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
//                 title="Load History"
//               >
//                 <History className={`w-5 h-5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
//               </button>
//               <button
//                 onClick={clearChat}
//                 className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
//                 title="New Chat"
//               >
//                 <Plus className="w-5 h-5" />
//               </button>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Main Chat Area */}
//       <main className="flex-1 overflow-y-auto">
//         <div className="max-w-4xl mx-auto p-4 space-y-6">
//           {/* Welcome Screen */}
//           {showWelcome && messages.length === 0 && !isLoadingHistory && (
//             <div className="text-center py-12">
//               <div className="mb-8">
//                 <h2 className="text-3xl font-bold text-gray-900 mb-3">
//                   Welcome back, {user?.firstName || 'User'}! 👋
//                 </h2>
//                 <p className="text-lg text-gray-600 mb-8">
//                   I am here to help you with anything you need. Ask me a question to get started.
//                 </p>
                
//                 {/* Quick Start Suggestions */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
//                   {[
//                     { icon: <Search className="w-5 h-5" />, text: "Ask me about anything", color: "from-blue-500 to-cyan-500" },
//                     { icon: <Zap className="w-5 h-5" />, text: "Get instant answers", color: "from-purple-500 to-pink-500" },
//                     { icon: <MessageCircle className="w-5 h-5" />, text: "Have a conversation", color: "from-green-500 to-emerald-500" },
//                     { icon: <Clock className="w-5 h-5" />, text: "View chat history", color: "from-orange-500 to-red-500" }
//                   ].map((item, index) => (
//                     <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
//                       <div className={`w-10 h-10 bg-gradient-to-r ${item.color} rounded-lg flex items-center justify-center text-white mb-3`}>
//                         {item.icon}
//                       </div>
//                       <p className="text-sm font-medium text-gray-700">{item.text}</p>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Loading History */}
//           {isLoadingHistory && (
//             <div className="flex items-center justify-center py-8">
//               <div className="flex items-center space-x-3 text-gray-500">
//                 <Loader2 className="w-5 h-5 animate-spin" />
//                 <span>Loading your conversation history...</span>
//               </div>
//             </div>
//           )}

//           {/* Messages */}
//           {messages.map((message, index) => (
//             <div
//               key={message.id}
//               className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
//               style={{ animationDelay: `${index * 0.1}s` }}
//             >
//               <div className={`flex items-start space-x-3 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
//                 {/* Avatar */}
//                 <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
//                   message.role === 'user' 
//                     ? 'bg-blue-500 text-white' 
//                     : message.isSuccessful === false 
//                       ? 'bg-red-500 text-white' 
//                       : 'bg-gray-200 text-gray-600'
//                 }`}>
//                   {message.role === 'user' ? (
//                     <User className="w-4 h-4" />
//                   ) : (
//                     <Bot className="w-4 h-4" />
//                   )}
//                 </div>

//                 {/* Message Content */}
//                 <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
//                   <div className={`inline-block p-4 rounded-2xl shadow-sm border transition-all duration-200 hover:shadow-md ${
//                     message.role === 'user'
//                       ? 'bg-blue-500 text-white rounded-br-sm'
//                       : message.isSuccessful === false
//                         ? 'bg-red-50 border-red-200 text-red-800 rounded-bl-sm'
//                         : 'bg-white border-gray-200 text-gray-800 rounded-bl-sm'
//                   }`}>
//                     <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    
//                     {/* Message Meta */}
//                     <div className={`flex items-center justify-between mt-2 pt-2 border-t ${
//                       message.role === 'user'
//                         ? 'border-blue-400'
//                         : message.isSuccessful === false
//                           ? 'border-red-200'
//                           : 'border-gray-200'
//                     }`}>
//                       <span className={`text-xs ${
//                         message.role === 'user'
//                           ? 'text-blue-100'
//                           : message.isSuccessful === false
//                             ? 'text-red-500'
//                             : 'text-gray-500'
//                       }`}>
//                         {formatTime(message.timestamp)}
//                       </span>
//                       {message.responseTime && (
//                         <span className={`text-xs flex items-center ${
//                           message.role === 'user'
//                             ? 'text-blue-100'
//                             : message.isSuccessful === false
//                               ? 'text-red-500'
//                               : 'text-gray-500'
//                         }`}>
//                           <Clock className="w-3 h-3 mr-1" />
//                           {message.responseTime}ms
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}

//           {/* Typing Indicator */}
//           {isLoading && (
//             <div className="flex justify-start animate-fadeIn">
//               <div className="flex items-start space-x-3 max-w-3xl">
//                 <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
//                   <Bot className="w-4 h-4 text-gray-600" />
//                 </div>
//                 <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm p-4 shadow-sm">
//                   <div className="flex space-x-1">
//                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
//                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
//                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           <div ref={messagesEndRef} />
//         </div>
//       </main>

//       {/* Input Area */}
//       <footer className="bg-white border-t border-gray-200 p-4">
//         <div className="max-w-4xl mx-auto">
//           <form onSubmit={handleSubmit} className="flex items-end space-x-3">
//             <div className="flex-1 relative">
//               <textarea
//                 ref={textareaRef}
//                 value={input}
//                 onChange={e => setInput(e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 placeholder="Type your message..."
//                 className="w-full resize-none p-4 pr-12 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
//                 rows={1}
//                 maxLength={1000}
//                 disabled={connectionStatus !== 'connected'}
//               />
//               <div className="absolute bottom-2 right-2 text-xs text-gray-400">
//                 {input.length}/1000
//               </div>
//             </div>
//             <button
//               type="submit"
//               disabled={isLoading || !input.trim() || connectionStatus !== 'connected'}
//               className="p-4 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
//             >
//               {isLoading ? (
//                 <Loader2 className="w-5 h-5 animate-spin" />
//               ) : (
//                 <Send className="w-5 h-5" />
//               )}
//             </button>
//           </form>
//         </div>
//       </footer>

//       <style jsx>{`
//         @keyframes fadeIn {
//           from {
//             opacity: 0;
//             transform: translateY(10px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
//         .animate-fadeIn {
//           animation: fadeIn 0.3s ease-out forwards;
//         }
//       `}</style>
//     </div>
//   );
// }


// // // Final Refactored HomePage Chat UI
// // 'use client';

// // import { useAuth, useUser } from '@clerk/nextjs';
// // import { useState, useRef, useEffect } from 'react';
// // import { Send, Bot, User, Loader2, History, RefreshCw } from 'lucide-react';

// // interface Session {
// //   id: number;
// //   question: string;
// //   answer: string;
// //   llm_provider: string;
// //   response_time_ms: number;
// //   created_at: string;
// //   is_successful: boolean;
// // }

// // interface HistoryResponse {
// //   sessions: Session[];
// //   total: number;
// //   page: number;
// //   size: number;
// // }

// // interface Message {
// //   id: string;
// //   content: string;
// //   role: 'user' | 'assistant';
// //   timestamp: Date;
// //   isSuccessful?: boolean;
// //   responseTime?: number;
// // }

// // const BASE_URL = 'http://localhost:8000';

// // export default function HomePage() {
// //   const { isSignedIn, getToken } = useAuth();
// //   const { user } = useUser();

// //   const [token, setToken] = useState<string | null>(null);
// //   const [messages, setMessages] = useState<Message[]>([]);
// //   const [input, setInput] = useState('');
// //   const [isLoading, setIsLoading] = useState(false);
// //   const [isLoadingHistory, setIsLoadingHistory] = useState(false);
// //   const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
// //   const messagesEndRef = useRef<HTMLDivElement>(null);
// //   const textareaRef = useRef<HTMLTextAreaElement>(null);

// //   useEffect(() => {
// //     const fetchToken = async () => {
// //       const t = await getToken();
// //       setToken(t);
// //     };
// //     fetchToken();
// //     checkServerHealth();
// //   }, [getToken]);

// //   useEffect(() => {
// //     if (isSignedIn && connectionStatus === 'connected') loadHistory();
// //   }, [isSignedIn, connectionStatus]);

// //   useEffect(() => {
// //     scrollToBottom();
// //   }, [messages]);

// //   useEffect(() => {
// //     adjustTextareaHeight();
// //   }, [input]);

// //   const scrollToBottom = () => {
// //     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
// //   };

// //   const adjustTextareaHeight = () => {
// //     const textarea = textareaRef.current;
// //     if (textarea) {
// //       textarea.style.height = 'auto';
// //       textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
// //     }
// //   };

// //   const checkServerHealth = async () => {
// //     setConnectionStatus('checking');
// //     try {
// //       const response = await fetch(`${BASE_URL}/health`);
// //       setConnectionStatus(response.ok ? 'connected' : 'disconnected');
// //     } catch {
// //       setConnectionStatus('disconnected');
// //     }
// //   };

// //   const loadHistory = async () => {
// //     setIsLoadingHistory(true);
// //     try {
// //       const response = await fetch(`${BASE_URL}/api/v1/qa/history?page=1&size=50`);
// //       if (!response.ok) throw new Error();
// //       const data: HistoryResponse = await response.json();
// //       const historyMessages: Message[] = data.sessions.reverse().flatMap(session => ([
// //         {
// //           id: `user-${session.id}`,
// //           content: session.question,
// //           role: 'user',
// //           timestamp: new Date(session.created_at)
// //         },
// //         {
// //           id: `assistant-${session.id}`,
// //           content: session.answer,
// //           role: 'assistant',
// //           timestamp: new Date(session.created_at),
// //           isSuccessful: session.is_successful,
// //           responseTime: session.response_time_ms
// //         }
// //       ]));
// //       setMessages(historyMessages);
// //     } catch (error) {
// //       console.error('Error loading history:', error);
// //     } finally {
// //       setIsLoadingHistory(false);
// //     }
// //   };

// //   const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
// //     e.preventDefault();
// //     if (!input.trim() || isLoading || connectionStatus !== 'connected') return;

// //     const userMessage: Message = {
// //       id: `user-${Date.now()}`,
// //       content: input.trim(),
// //       role: 'user',
// //       timestamp: new Date()
// //     };

// //     setMessages(prev => [...prev, userMessage]);
// //     const questionText = input.trim();
// //     setInput('');
// //     setIsLoading(true);

// //     try {
// //       const startTime = Date.now();
// //       const response = await fetch(`${BASE_URL}/api/v1/qa/ask`, {
// //         method: 'POST',
// //         headers: {
// //           'Content-Type': 'application/json',
// //           'Authorization': `Bearer ${token}`
// //         },
// //         body: JSON.stringify({ question: questionText, llm_provider: 'openai' }),
// //       });
// //       const responseTime = Date.now() - startTime;
// //       const data = await response.json();

// //       const assistantMessage: Message = {
// //         id: `assistant-${Date.now()}`,
// //         content: data.answer || 'No response received',
// //         role: 'assistant',
// //         timestamp: new Date(),
// //         isSuccessful: response.ok,
// //         responseTime: data.response_time_ms || responseTime
// //       };
// //       setMessages(prev => [...prev, assistantMessage]);
// //     } catch (error) {
// //       console.error('Error:', error);
// //       setMessages(prev => [...prev, {
// //         id: `assistant-${Date.now()}`,
// //         content: 'An error occurred. Check if the server is running and try again.',
// //         role: 'assistant',
// //         timestamp: new Date(),
// //         isSuccessful: false
// //       }]);
// //       checkServerHealth();
// //     } finally {
// //       setIsLoading(false);
// //     }
// //   };

// //   const getConnectionStatusDisplay = () => {
// //     switch (connectionStatus) {
// //       case 'connected': return { text: '● Connected', color: 'text-green-600' };
// //       case 'disconnected': return { text: '● Disconnected', color: 'text-red-600' };
// //       case 'checking': return { text: '● Checking...', color: 'text-yellow-600' };
// //       default: return { text: '● Unknown', color: 'text-gray-600' };
// //     }
// //   };

// //   const handleKeyDown = (e: React.KeyboardEvent) => {
// //     if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e);
// //   };

// //   if (!isSignedIn) {
// //     return (
// //       <div className="flex items-center justify-center h-full p-8">
// //         <div className="max-w-md text-center">
// //           <Bot className="w-16 h-16 text-blue-500 mx-auto mb-4" />
// //           <h2 className="text-2xl font-semibold mb-2">Welcome to Query_GPT</h2>
// //           <p className="text-gray-600 mb-4">Sign in to start chatting with your AI assistant.</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="flex flex-col h-[calc(100vh-100px)]">
// //       <header className="flex justify-between items-center p-4 border-b bg-white">
// //         <div className="flex space-x-4 items-center">
// //           <h1 className="text-lg font-semibold">AI Assistant</h1>
// //           <span className="text-sm text-gray-500">{messages.filter(m => m.role === 'user').length} prompts</span>
// //         </div>
// //         <div className="flex items-center gap-2">
// //           <button onClick={checkServerHealth} className="p-2 hover:bg-gray-100 rounded">
// //             <RefreshCw className={`w-4 h-4 ${connectionStatus === 'checking' ? 'animate-spin' : ''}`} />
// //           </button>
// //           <button onClick={loadHistory} className="p-2 hover:bg-gray-100 rounded" disabled={isLoadingHistory}>
// //             <History className={`w-4 h-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
// //           </button>
// //         </div>
// //       </header>

// //       <main className="flex-1 overflow-y-auto p-4 space-y-4">
// //         {messages.length === 0 && !isLoadingHistory && (
// //           <div className="text-center text-gray-600">
// //             <p>Welcome back, {user?.firstName || 'User'}! Ask me something to get started.</p>
// //             <p className={`mt-2 ${getConnectionStatusDisplay().color}`}>{getConnectionStatusDisplay().text}</p>
// //           </div>
// //         )}

// //         {messages.map(message => (
// //           <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
// //             <div className={`max-w-lg p-3 rounded-lg shadow-sm ${message.role === 'user' ? 'bg-blue-100 text-right' : message.isSuccessful === false ? 'bg-red-100' : 'bg-gray-100'}`}>
// //               <p className="text-sm whitespace-pre-wrap">{message.content}</p>
// //               <div className="text-xs text-gray-500 mt-1">
// //                 {message.responseTime ? `${message.responseTime}ms` : ''}
// //               </div>
// //             </div>
// //           </div>
// //         ))}

// //         <div ref={messagesEndRef} />
// //       </main>

// //       <footer className="border-t p-4 bg-white">
// //         <form onSubmit={handleSubmit} className="flex items-center gap-2">
// //           <textarea
// //             ref={textareaRef}
// //             value={input}
// //             onChange={e => setInput(e.target.value)}
// //             onKeyDown={handleKeyDown}
// //             placeholder="Type your question..."
// //             className="flex-1 resize-none p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
// //             rows={1}
// //             maxLength={1000}
// //           />
// //           <button type="submit" disabled={isLoading} className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
// //             {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
// //           </button>
// //         </form>
// //       </footer>
// //     </div>
// //   );
// // }



// // // // (app)/page.tsx
// // // 'use client';

// // // import { useAuth, useUser } from '@clerk/nextjs';
// // // import { useState, useRef, useEffect } from 'react';
// // // import { Send, Bot, User, Loader2, History, RefreshCw } from 'lucide-react';


// // // interface Session {
// // //   id: number;
// // //   question: string;
// // //   answer: string;
// // //   llm_provider: string;
// // //   response_time_ms: number;
// // //   created_at: string;
// // //   is_successful: boolean;
// // // }

// // // interface HistoryResponse {
// // //   sessions: Session[];
// // //   total: number;
// // //   page: number;
// // //   size: number;
// // // }

// // // interface Message {
// // //   id: string;
// // //   content: string;
// // //   role: 'user' | 'assistant';
// // //   timestamp: Date;
// // //   isSuccessful?: boolean;
// // //   responseTime?: number;
// // // }

// // // const BASE_URL = 'http://localhost:8000';

// // // export default function HomePage() {
// // //   const { isSignedIn } = useAuth();
// // //   const { getToken } = useAuth();
// // //   const [token, setToken] = useState<string | null>(null);

// // //   useEffect(() => {
// // //     const fetchToken = async () => {
// // //       const t = await getToken();
// // //       setToken(t);
// // //     };
// // //     fetchToken();
// // //   }, [getToken]);


// // //   const { user } = useUser();
// // //   const [messages, setMessages] = useState<Message[]>([]);
// // //   const [input, setInput] = useState('');
// // //   const [isLoading, setIsLoading] = useState(false);
// // //   const [isLoadingHistory, setIsLoadingHistory] = useState(false);
// // //   const [showHistory, setShowHistory] = useState(false);
// // //   const [history, setHistory] = useState<Session[]>([]);
// // //   const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
// // //   const messagesEndRef = useRef<HTMLDivElement>(null);
// // //   const textareaRef = useRef<HTMLTextAreaElement>(null);

// // //   const scrollToBottom = () => {
// // //     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
// // //   };

// // //   useEffect(() => {
// // //     scrollToBottom();
// // //   }, [messages]);

// // //   // Check server health on mount
// // //   useEffect(() => {
// // //     checkServerHealth();
// // //   }, []);

// // //   // Load chat history on component mount
// // //   useEffect(() => {
// // //     if (isSignedIn && connectionStatus === 'connected') {
// // //       loadHistory();
// // //     }
// // //   }, [isSignedIn, connectionStatus]);

// // //   const checkServerHealth = async () => {
// // //     setConnectionStatus('checking');
// // //     try {
// // //       const response = await fetch(`${BASE_URL}/health`, {
// // //         method: 'GET',
// // //         headers: {
// // //           'Content-Type': 'application/json',
// // //         },
// // //       });
// // //       if (response.ok) {
// // //         setConnectionStatus('connected');
// // //       } else {
// // //         setConnectionStatus('disconnected');
// // //       }
// // //     } catch (error) {
// // //       console.error('Health check failed:', error);
// // //       setConnectionStatus('disconnected');
// // //     }
// // //   };

// // //   const loadHistory = async () => {
// // //     setIsLoadingHistory(true);
// // //     try {
// // //       const response = await fetch(`${BASE_URL}/api/v1/qa/history?page=1&size=50`, {
// // //         method: 'GET',
// // //         headers: {
// // //           'Content-Type': 'application/json',
// // //         },
// // //       });
      
// // //       if (response.ok) {
// // //         const data: HistoryResponse = await response.json();
// // //         setHistory(data.sessions);
        
// // //         // Convert history to messages for display
// // //         const historyMessages: Message[] = [];
// // //         data.sessions.reverse().forEach((session) => {
// // //           // Add user question
// // //           historyMessages.push({
// // //             id: `user-${session.id}`,
// // //             content: session.question,
// // //             role: 'user',
// // //             timestamp: new Date(session.created_at)
// // //           });
          
// // //           // Add AI response
// // //           historyMessages.push({
// // //             id: `assistant-${session.id}`,
// // //             content: session.answer,
// // //             role: 'assistant',
// // //             timestamp: new Date(session.created_at),
// // //             isSuccessful: session.is_successful,
// // //             responseTime: session.response_time_ms
// // //           });
// // //         });
        
// // //         setMessages(historyMessages);
// // //       } else {
// // //         console.error('Failed to load history:', response.status, response.statusText);
// // //       }
// // //     } catch (error) {
// // //       console.error('Error loading history:', error);
// // //     } finally {
// // //       setIsLoadingHistory(false);
// // //     }
// // //   };

// // //   const handleSubmit = async (e: React.FormEvent) => {
// // //     e.preventDefault();
// // //     if (!input.trim() || isLoading || connectionStatus !== 'connected') return;

// // //     const userMessage: Message = {
// // //       id: `user-${Date.now()}`,
// // //       content: input.trim(),
// // //       role: 'user',
// // //       timestamp: new Date()
// // //     };

// // //     setMessages(prev => [...prev, userMessage]);
// // //     const questionText = input.trim();
// // //     setInput('');
// // //     setIsLoading(true);

// // //     try {
// // //       const startTime = Date.now();
// // //       const response = await fetch(`${BASE_URL}/api/v1/qa/ask`, {
// // //         method: 'POST',
// // //         headers: {
// // //           'Content-Type': 'application/json',
// // //               'Authorization': `Bearer ${token}` // 👈 send Clerk token

// // //         },
// // //         body: JSON.stringify({ 
// // //           question: questionText,
// // //           llm_provider: 'openai' // or make this configurable
// // //         }),
// // //       });

// // //       const responseTime = Date.now() - startTime;

// // //       if (!response.ok) {
// // //         throw new Error(`HTTP error! status: ${response.status}`);
// // //       }

// // //       const data = await response.json();
      
// // //       const assistantMessage: Message = {
// // //         id: `assistant-${Date.now()}`,
// // //         content: data.answer || data.response || 'No response received',
// // //         role: 'assistant',
// // //         timestamp: new Date(),
// // //         isSuccessful: response.ok,
// // //         responseTime: data.response_time_ms || responseTime
// // //       };

// // //       setMessages(prev => [...prev, assistantMessage]);
// // //     } catch (error) {
// // //       console.error('Error:', error);
// // //       const errorMessage: Message = {
// // //         id: `assistant-${Date.now()}`,
// // //         content: 'Sorry, I encountered an error while processing your request. Please check if the backend server is running and try again.',
// // //         role: 'assistant',
// // //         timestamp: new Date(),
// // //         isSuccessful: false
// // //       };
// // //       setMessages(prev => [...prev, errorMessage]);
      
// // //       // Check connection status after error
// // //       checkServerHealth();
// // //     } finally {
// // //       setIsLoading(false);
// // //     }

// // //         try {
// // //       const startTime = Date.now();
// // //       const response = await fetch(`${BASE_URL}/api/v1/qa/history?page=1&size=50`, {
// // //         method: 'GET',
// // //         headers: {
// // //           'Content-Type': 'application/json',
// // //               'Authorization': `Bearer ${token}` // 👈 send Clerk token
// // //         }
// // //       });

// // //       const responseTime = Date.now() - startTime;

// // //       if (!response.ok) {
// // //         throw new Error(`HTTP error! status: ${response.status}`);
// // //       }

// // //       const data = await response.json();
      
// // //       const assistantMessage: Message = {
// // //         id: `assistant-${Date.now()}`,
// // //         content: data.answer || data.response || 'No response received',
// // //         role: 'assistant',
// // //         timestamp: new Date(),
// // //         isSuccessful: response.ok,
// // //         responseTime: data.response_time_ms || responseTime
// // //       };

// // //       setMessages(prev => [...prev, assistantMessage]);
// // //     } catch (error) {
// // //       console.error('Error:', error);
// // //       const errorMessage: Message = {
// // //         id: `assistant-${Date.now()}`,
// // //         content: 'Sorry, I encountered an error while processing your request. Please check if the backend server is running and try again.',
// // //         role: 'assistant',
// // //         timestamp: new Date(),
// // //         isSuccessful: false
// // //       };
// // //       setMessages(prev => [...prev, errorMessage]);
      
// // //       // Check connection status after error
// // //       checkServerHealth();
// // //     } finally {
// // //       setIsLoading(false);
// // //     }
// // //   };

// // //   const handleKeyDown = (e: React.KeyboardEvent) => {
// // //     if (e.key === 'Enter' && !e.shiftKey) {
// // //       e.preventDefault();
// // //       handleSubmit(e);
// // //     }
// // //   };

// // //   const adjustTextareaHeight = () => {
// // //     const textarea = textareaRef.current;
// // //     if (textarea) {
// // //       textarea.style.height = 'auto';
// // //       textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
// // //     }
// // //   };

// // //   const clearChat = () => {
// // //     setMessages([]);
// // //   };

// // //   const refreshHistory = () => {
// // //     loadHistory();
// // //   };

// // //   useEffect(() => {
// // //     adjustTextareaHeight();
// // //   }, [input]);

// // //   const getConnectionStatusDisplay = () => {
// // //     switch (connectionStatus) {
// // //       case 'connected':
// // //         return { text: '● Connected to localhost:8000', color: 'text-green-600' };
// // //       case 'disconnected':
// // //         return { text: '● Disconnected from server', color: 'text-red-600' };
// // //       case 'checking':
// // //         return { text: '● Checking connection...', color: 'text-yellow-600' };
// // //       default:
// // //         return { text: '● Unknown status', color: 'text-gray-600' };
// // //     }
// // //   };

// // //   if (!isSignedIn) {
// // //     return (
// // //       <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
// // //         <div className="text-center py-8 px-6 bg-white rounded-lg shadow-sm border border-gray-200">
// // //           <Bot className="w-16 h-16 text-blue-500 mx-auto mb-4" />
// // //           <h2 className="text-2xl font-semibold text-gray-800 mb-4">
// // //             Welcome to Query_GPT
// // //           </h2>
// // //           <p className="text-gray-600 mb-6">
// // //             Sign in or create an account to start chatting with your AI assistant.
// // //           </p>
// // //           <div className="text-sm text-gray-500">
// // //             Get instant answers, create content, and analyze data with AI
// // //           </div>
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   return (
// // //     <div className="flex flex-col h-[calc(100vh-100px)]">
// // //       {/* Header with controls */}
// // //       <div className="border-b bg-white px-4 py-3 flex justify-between items-center">
// // //         <div className="flex items-center space-x-4">
// // //           <h1 className="text-lg font-semibold text-gray-900">
// // //             AI Assistant Chat
// // //           </h1>
// // //           {messages.length > 0 && (
// // //             <div className="text-sm text-gray-500">
// // //               {messages.filter(m => m.role === 'user').length} questions asked
// // //             </div>
// // //           )}
// // //         </div>
// // //         <div className="flex items-center space-x-2">
// // //           <button
// // //             onClick={checkServerHealth}
// // //             disabled={connectionStatus === 'checking'}
// // //             className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
// // //             title="Check server connection"
// // //           >
// // //             <RefreshCw className={`w-4 h-4 ${connectionStatus === 'checking' ? 'animate-spin' : ''}`} />
// // //           </button>
// // //           <button
// // //             onClick={refreshHistory}
// // //             disabled={isLoadingHistory || connectionStatus !== 'connected'}
// // //             className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
// // //             title="Refresh history"
// // //           >
// // //             <History className={`w-4 h-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
// // //           </button>
// // //           {messages.length > 0 && (
// // //             <button
// // //               onClick={clearChat}
// // //               className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
// // //             >
// // //               Clear Chat
// // //             </button>
// // //           )}
// // //         </div>
// // //       </div>

// // //       {/* Connection Status Banner */}
// // //       {connectionStatus === 'disconnected' && (
// // //         <div className="bg-red-50 border-b border-red-200 px-4 py-2">
// // //           <div className="flex items-center justify-between">
// // //             <div className="flex items-center space-x-2">
// // //               <div className="w-2 h-2 bg-red-500 rounded-full"></div>
// // //               <span className="text-sm text-red-700">
// // //                 Unable to connect to the backend server. Please ensure the server is running on localhost:8000.
// // //               </span>
// // //             </div>
// // //             <button
// // //               onClick={checkServerHealth}
// // //               className="text-sm text-red-700 hover:text-red-800 underline"
// // //             >
// // //               Retry
// // //             </button>
// // //           </div>
// // //         </div>
// // //       )}

// // //       {/* Welcome Message - Only shown when no messages */}
// // //       {messages.length === 0 && !isLoadingHistory && (
// // //         <div className="flex-1 flex items-center justify-center p-6">
// // //           <div className="text-center max-w-md">
// // //             <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
// // //               <Bot className="w-8 h-8 text-white" />
// // //             </div>
// // //             <h1 className="text-2xl font-bold text-gray-900 mb-2">
// // //               Welcome back, {user?.firstName || 'there'}! 👋
// // //             </h1>
// // //             <p className="text-gray-600 mb-6">
// // //               I'm your AI assistant powered by OpenAI. Ask me anything about travel documentation!
// // //             </p>
// // //             <div className="grid grid-cols-1 gap-3 text-sm">
// // //               <div className="bg-gray-50 p-3 rounded-lg">
// // //                 <span className="font-medium">💡 Try asking:</span>
// // //                 <p className="text-gray-600 mt-1">"What documents do I need to travel from Kenya to Ireland?"</p>
// // //               </div>
// // //               <div className="bg-blue-50 p-3 rounded-lg">
// // //                 <span className="font-medium">🌐 API Status:</span>
// // //                 <p className={`mt-1 ${getConnectionStatusDisplay().color}`}>
// // //                   {getConnectionStatusDisplay().text}
// // //                 </p>
// // //               </div>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       )}

// // //       {/* Loading history */}
// // //       {isLoadingHistory && messages.length === 0 && (
// // //         <div className="flex-1 flex items-center justify-center">
// // //           <div className="flex items-center space-x-2 text-gray-500">
// // //             <Loader2 className="w-5 h-5 animate-spin" />
// // //             <span>Loading chat history...</span>
// // //           </div>
// // //         </div>
// // //       )}

// // //       {/* Messages Container */}
// // //       {messages.length > 0 && (
// // //         <div className="flex-1 overflow-y-auto p-4 space-y-4">
// // //           {messages.map((message) => (
// // //             <div
// // //               key={message.id}
// // //               className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
// // //             >
// // //               <div className={`flex max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
// // //                 <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
// // //                   message.role === 'user' 
// // //                     ? 'bg-blue-500 ml-3' 
// // //                     : message.isSuccessful === false
// // //                     ? 'bg-red-200 mr-3'
// // //                     : 'bg-gray-200 mr-3'
// // //                 }`}>
// // //                   {message.role === 'user' ? (
// // //                     <User className="w-4 h-4 text-white" />
// // //                   ) : (
// // //                     <Bot className={`w-4 h-4 ${message.isSuccessful === false ? 'text-red-600' : 'text-gray-600'}`} />
// // //                   )}
// // //                 </div>
// // //                 <div className={`px-4 py-2 rounded-lg ${
// // //                   message.role === 'user'
// // //                     ? 'bg-blue-500 text-white'
// // //                     : message.isSuccessful === false
// // //                     ? 'bg-red-50 text-red-900 border border-red-200'
// // //                     : 'bg-gray-100 text-gray-900'
// // //                 }`}>
// // //                   <p className="whitespace-pre-wrap">{message.content}</p>
// // //                   <div className={`text-xs mt-1 flex items-center justify-between ${
// // //                     message.role === 'user' 
// // //                       ? 'text-blue-100' 
// // //                       : message.isSuccessful === false
// // //                       ? 'text-red-600'
// // //                       : 'text-gray-500'
// // //                   }`}>
// // //                     <span>
// // //                       {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
// // //                     </span>
// // //                     {message.responseTime && (
// // //                       <span className="ml-2">
// // //                         {message.responseTime}ms
// // //                       </span>
// // //                     )}
// // //                   </div>
// // //                 </div>
// // //               </div>
// // //             </div>
// // //           ))}
          
// // //           {/* Loading indicator */}
// // //           {isLoading && (
// // //             <div className="flex justify-start">
// // //               <div className="flex">
// // //                 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
// // //                   <Bot className="w-4 h-4 text-gray-600" />
// // //                 </div>
// // //                 <div className="bg-gray-100 px-4 py-2 rounded-lg">
// // //                   <div className="flex items-center space-x-2">
// // //                     <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
// // //                     <span className="text-gray-500">Processing your question...</span>
// // //                   </div>
// // //                 </div>
// // //               </div>
// // //             </div>
// // //           )}
          
// // //           <div ref={messagesEndRef} />
// // //         </div>
// // //       )}

// // //       {/* Input Form */}
// // //       <div className="border-t bg-white p-4">
// // //         <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
// // //           <div className="flex items-end space-x-3">
// // //             <div className="flex-1 relative">
// // //               <textarea
// // //                 ref={textareaRef}
// // //                 value={input}
// // //                 onChange={(e) => setInput(e.target.value)}
// // //                 onKeyDown={handleKeyDown}
// // //                 placeholder={connectionStatus === 'connected' ? "Ask me anything..." : "Server disconnected - check connection"}
// // //                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[48px] max-h-[120px] disabled:bg-gray-50"
// // //                 disabled={isLoading || connectionStatus !== 'connected'}
// // //                 rows={1}
// // //               />
// // //             </div>
// // //             <button
// // //               type="submit"
// // //               disabled={isLoading || !input.trim() || connectionStatus !== 'connected'}
// // //               className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
// // //             >
// // //               {isLoading ? (
// // //                 <Loader2 className="w-5 h-5 animate-spin" />
// // //               ) : (
// // //                 <Send className="w-5 h-5" />
// // //               )}
// // //             </button>
// // //           </div>
// // //           <div className="mt-2 text-xs text-gray-500 text-center flex items-center justify-center space-x-4">
// // //             <span>Press Enter to send, Shift + Enter for new line</span>
// // //             <span className={getConnectionStatusDisplay().color}>
// // //               {getConnectionStatusDisplay().text}
// // //             </span>
// // //           </div>
// // //         </form>
// // //       </div>
// // //     </div>
// // //   );
// // // }


// // // // // (app)/page.tsx
// // // // 'use client';

// // // // import { useAuth, useUser } from '@clerk/nextjs';
// // // // import { useState, useRef, useEffect } from 'react';
// // // // import { Send, Bot, User, Loader2 } from 'lucide-react';

// // // // interface Message {
// // // //   id: string;
// // // //   content: string;
// // // //   role: 'user' | 'assistant';
// // // //   timestamp: Date;
// // // // }

// // // // export default function HomePage() {
// // // //   const { isSignedIn } = useAuth();
// // // //   const { user } = useUser();
// // // //   const [messages, setMessages] = useState<Message[]>([]);
// // // //   const [input, setInput] = useState('');
// // // //   const [isLoading, setIsLoading] = useState(false);
// // // //   const messagesEndRef = useRef<HTMLDivElement>(null);
// // // //   const textareaRef = useRef<HTMLTextAreaElement>(null);

// // // //   const scrollToBottom = () => {
// // // //     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
// // // //   };

// // // //   useEffect(() => {
// // // //     scrollToBottom();
// // // //   }, [messages]);

// // // //   const handleSubmit = async (e: React.FormEvent) => {
// // // //     e.preventDefault();
// // // //     if (!input.trim() || isLoading) return;

// // // //     const userMessage: Message = {
// // // //       id: Date.now().toString(),
// // // //       content: input.trim(),
// // // //       role: 'user',
// // // //       timestamp: new Date()
// // // //     };

// // // //     setMessages(prev => [...prev, userMessage]);
// // // //     setInput('');
// // // //     setIsLoading(true);

// // // //     try {
// // // //       // TODO: Replace with your actual API endpoint
// // // //       const response = await fetch('/api/chat', {
// // // //         method: 'POST',
// // // //         headers: {
// // // //           'Content-Type': 'application/json',
// // // //         },
// // // //         body: JSON.stringify({ message: input.trim() }),
// // // //       });

// // // //       if (!response.ok) {
// // // //         throw new Error('Failed to get response');
// // // //       }

// // // //       const data = await response.json();
      
// // // //       const assistantMessage: Message = {
// // // //         id: (Date.now() + 1).toString(),
// // // //         content: data.response,
// // // //         role: 'assistant',
// // // //         timestamp: new Date()
// // // //       };

// // // //       setMessages(prev => [...prev, assistantMessage]);
// // // //     } catch (error) {
// // // //       console.error('Error:', error);
// // // //       const errorMessage: Message = {
// // // //         id: (Date.now() + 1).toString(),
// // // //         content: 'Sorry, I encountered an error while processing your request. Please try again.',
// // // //         role: 'assistant',
// // // //         timestamp: new Date()
// // // //       };
// // // //       setMessages(prev => [...prev, errorMessage]);
// // // //     } finally {
// // // //       setIsLoading(false);
// // // //     }
// // // //   };

// // // //   const handleKeyDown = (e: React.KeyboardEvent) => {
// // // //     if (e.key === 'Enter' && !e.shiftKey) {
// // // //       e.preventDefault();
// // // //       handleSubmit(e);
// // // //     }
// // // //   };

// // // //   const adjustTextareaHeight = () => {
// // // //     const textarea = textareaRef.current;
// // // //     if (textarea) {
// // // //       textarea.style.height = 'auto';
// // // //       textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
// // // //     }
// // // //   };

// // // //   useEffect(() => {
// // // //     adjustTextareaHeight();
// // // //   }, [input]);

// // // //   if (!isSignedIn) {
// // // //     return (
// // // //       <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
// // // //         <div className="text-center py-8 px-6 bg-white rounded-lg shadow-sm border border-gray-200">
// // // //           <Bot className="w-16 h-16 text-blue-500 mx-auto mb-4" />
// // // //           <h2 className="text-2xl font-semibold text-gray-800 mb-4">
// // // //             Welcome to Query_GPT
// // // //           </h2>
// // // //           <p className="text-gray-600 mb-6">
// // // //             Sign in or create an account to start chatting with your AI assistant.
// // // //           </p>
// // // //           <div className="text-sm text-gray-500">
// // // //             Get instant answers, create content, and analyze data with AI
// // // //           </div>
// // // //         </div>
// // // //       </div>
// // // //     );
// // // //   }

// // // //   return (
// // // //     <div className="flex flex-col h-[calc(100vh-100px)]">
// // // //       {/* Welcome Message - Only shown when no messages */}
// // // //       {messages.length === 0 && (
// // // //         <div className="flex-1 flex items-center justify-center p-6">
// // // //           <div className="text-center max-w-md">
// // // //             <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
// // // //               <Bot className="w-8 h-8 text-white" />
// // // //             </div>
// // // //             <h1 className="text-2xl font-bold text-gray-900 mb-2">
// // // //               Welcome back, {user?.firstName || 'there'}! 👋
// // // //             </h1>
// // // //             <p className="text-gray-600 mb-6">
// // // //               I'm your AI assistant. Ask me anything - from travel requirements to general questions!
// // // //             </p>
// // // //             <div className="grid grid-cols-1 gap-3 text-sm">
// // // //               <div className="bg-gray-50 p-3 rounded-lg">
// // // //                 <span className="font-medium">💡 Try asking:</span>
// // // //                 <p className="text-gray-600 mt-1">"What documents do I need to travel from Kenya to Ireland?"</p>
// // // //               </div>
// // // //             </div>
// // // //           </div>
// // // //         </div>
// // // //       )}

// // // //       {/* Messages Container */}
// // // //       {messages.length > 0 && (
// // // //         <div className="flex-1 overflow-y-auto p-4 space-y-4">
// // // //           {messages.map((message) => (
// // // //             <div
// // // //               key={message.id}
// // // //               className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
// // // //             >
// // // //               <div className={`flex max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
// // // //                 <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
// // // //                   message.role === 'user' 
// // // //                     ? 'bg-blue-500 ml-3' 
// // // //                     : 'bg-gray-200 mr-3'
// // // //                 }`}>
// // // //                   {message.role === 'user' ? (
// // // //                     <User className="w-4 h-4 text-white" />
// // // //                   ) : (
// // // //                     <Bot className="w-4 h-4 text-gray-600" />
// // // //                   )}
// // // //                 </div>
// // // //                 <div className={`px-4 py-2 rounded-lg ${
// // // //                   message.role === 'user'
// // // //                     ? 'bg-blue-500 text-white'
// // // //                     : 'bg-gray-100 text-gray-900'
// // // //                 }`}>
// // // //                   <p className="whitespace-pre-wrap">{message.content}</p>
// // // //                   <div className={`text-xs mt-1 ${
// // // //                     message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
// // // //                   }`}>
// // // //                     {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
// // // //                   </div>
// // // //                 </div>
// // // //               </div>
// // // //             </div>
// // // //           ))}
          
// // // //           {/* Loading indicator */}
// // // //           {isLoading && (
// // // //             <div className="flex justify-start">
// // // //               <div className="flex">
// // // //                 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
// // // //                   <Bot className="w-4 h-4 text-gray-600" />
// // // //                 </div>
// // // //                 <div className="bg-gray-100 px-4 py-2 rounded-lg">
// // // //                   <div className="flex items-center space-x-2">
// // // //                     <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
// // // //                     <span className="text-gray-500">Thinking...</span>
// // // //                   </div>
// // // //                 </div>
// // // //               </div>
// // // //             </div>
// // // //           )}
          
// // // //           <div ref={messagesEndRef} />
// // // //         </div>
// // // //       )}

// // // //       {/* Input Form */}
// // // //       <div className="border-t bg-white p-4">
// // // //         <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
// // // //           <div className="flex items-end space-x-3">
// // // //             <div className="flex-1 relative">
// // // //               <textarea
// // // //                 ref={textareaRef}
// // // //                 value={input}
// // // //                 onChange={(e) => setInput(e.target.value)}
// // // //                 onKeyDown={handleKeyDown}
// // // //                 placeholder="Ask me anything..."
// // // //                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[48px] max-h-[120px]"
// // // //                 disabled={isLoading}
// // // //                 rows={1}
// // // //               />
// // // //             </div>
// // // //             <button
// // // //               type="submit"
// // // //               disabled={isLoading || !input.trim()}
// // // //               className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
// // // //             >
// // // //               {isLoading ? (
// // // //                 <Loader2 className="w-5 h-5 animate-spin" />
// // // //               ) : (
// // // //                 <Send className="w-5 h-5" />
// // // //               )}
// // // //             </button>
// // // //           </div>
// // // //           <div className="mt-2 text-xs text-gray-500 text-center">
// // // //             Press Enter to send, Shift + Enter for new line
// // // //           </div>
// // // //         </form>
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // }



// // // // // // (app)/page.tsx
// // // // // 'use client';

// // // // // import { useAuth, useUser } from '@clerk/nextjs';

// // // // // export default function HomePage() {
// // // // //   const { isSignedIn } = useAuth();
// // // // //   const { user } = useUser();

// // // // //   if (!isSignedIn) {
// // // // //     // This content will be shown within the AuthLayout
// // // // //     return (
// // // // //       <div className="text-center py-8">
// // // // //         <h2 className="text-2xl font-semibold text-gray-800 mb-4">
// // // // //           Get Started with Query_GPT
// // // // //         </h2>
// // // // //         <p className="text-gray-600">
// // // // //           Sign in or create an account to access your AI assistant.
// // // // //         </p>
// // // // //       </div>
// // // // //     );
// // // // //   }

// // // // //   // This content will be shown within the sidebar layout
// // // // //   return (
// // // // //     <div className="space-y-6">
// // // // //       <div className="border-b pb-4">
// // // // //         <h1 className="text-3xl font-bold text-gray-900">
// // // // //           Welcome back, {user?.firstName || 'there'}! 👋
// // // // //         </h1>
// // // // //         <p className="text-gray-600 mt-2">
// // // // //           Ready to explore AI-powered insights and solutions?
// // // // //         </p>
// // // // //       </div>

// // // // //       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
// // // // //         <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
// // // // //           <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
// // // // //             <span className="text-2xl">💬</span>
// // // // //           </div>
// // // // //           <h3 className="text-lg font-semibold text-gray-900 mb-2">Ask Anything</h3>
// // // // //           <p className="text-gray-600 text-sm">
// // // // //             Get instant answers to your questions with AI-powered responses.
// // // // //           </p>
// // // // //         </div>

// // // // //         <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
// // // // //           <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
// // // // //             <span className="text-2xl">🎨</span>
// // // // //           </div>
// // // // //           <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Content</h3>
// // // // //           <p className="text-gray-600 text-sm">
// // // // //             Generate creative content, stories, and solutions tailored to your needs.
// // // // //           </p>
// // // // //         </div>

// // // // //         <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
// // // // //           <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
// // // // //             <span className="text-2xl">📊</span>
// // // // //           </div>
// // // // //           <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyze Data</h3>
// // // // //           <p className="text-gray-600 text-sm">
// // // // //             Get deep insights and analysis from your data and documents.
// // // // //           </p>
// // // // //         </div>
// // // // //       </div>

// // // // //       <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
// // // // //         <h2 className="text-xl font-semibold text-gray-900 mb-2">
// // // // //           Quick Start Tips
// // // // //         </h2>
// // // // //         <ul className="space-y-2 text-gray-700">
// // // // //           <li className="flex items-center space-x-2">
// // // // //             <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
// // // // //             <span>Use the sidebar to navigate between different AI tools</span>
// // // // //           </li>
// // // // //           <li className="flex items-center space-x-2">
// // // // //             <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
// // // // //             <span>Start a conversation by typing your question or request</span>
// // // // //           </li>
// // // // //           <li className="flex items-center space-x-2">
// // // // //             <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
// // // // //             <span>Explore different features to maximize your productivity</span>
// // // // //           </li>
// // // // //         </ul>
// // // // //       </div>
// // // // //     </div>
// // // // //   );
// // // // // }


// // // // // // import { Button } from "@/components/ui/button";
// // // // // // import { SignedIn, SignedOut, SignUpButton, SignInButton } from "@clerk/nextjs";
// // // // // // import { 
// // // // // //   ArrowRight, 
// // // // // //   MessageCircle, 
// // // // // //   Sparkles, 
// // // // // //   Zap, 
// // // // // //   Shield, 
// // // // // //   Globe, 
// // // // // //   Brain, 
// // // // // //   Users, 
// // // // // //   UserPlus, 
// // // // // //   Star,
// // // // // //   ChevronRight,
// // // // // //   Play,
// // // // // //   Check,
// // // // // //   TrendingUp,
// // // // // //   Code,
// // // // // //   Lightbulb,
// // // // // //   Heart,
// // // // // //   Award,
// // // // // //   LogIn
// // // // // // } from "lucide-react";

// // // // // // export default function Home() {
// // // // // //   return (
// // // // // //     <>
// // // // // //       <SignedOut>
// // // // // //         <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
// // // // // //           {/* Animated background elements */}
// // // // // //           <div className="absolute inset-0 overflow-hidden">
// // // // // //             <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
// // // // // //             <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
// // // // // //             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
// // // // // //           </div>

// // // // // //           {/* Hero Section */}
// // // // // //           <main className="container mx-auto px-4 py-20 relative z-10">
// // // // // //             <div className="max-w-7xl mx-auto">
              
// // // // // //               {/* Hero Content */}
// // // // // //               <div className="text-center mb-20">
// // // // // //                 {/* Badge */}
// // // // // //                 <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/30 rounded-full mb-8 hover:border-purple-400/50 transition-all duration-300 group">
// // // // // //                   <Sparkles className="w-5 h-5 text-purple-400 mr-3 group-hover:rotate-12 transition-transform duration-300" />
// // // // // //                   <span className="text-purple-300 text-sm font-medium mr-3">Powered by Advanced AI</span>
// // // // // //                   <div className="flex items-center space-x-1">
// // // // // //                     {[1,2,3,4,5].map((star) => (
// // // // // //                       <Star key={star} className="w-3 h-3 text-yellow-400 fill-current" />
// // // // // //                     ))}
// // // // // //                   </div>
// // // // // //                 </div>
                
// // // // // //                 {/* Main Heading */}
// // // // // //                 <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white mb-8 leading-tight">
// // // // // //                   Meet Your
// // // // // //                   <br />
// // // // // //                   <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent relative">
// // // // // //                     AI Assistant
// // // // // //                     <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-xl opacity-70 group-hover:opacity-100 transition duration-1000"></div>
// // // // // //                   </span>
// // // // // //                   <span className="text-5xl md:text-6xl animate-bounce">✨</span>
// // // // // //                 </h1>
                
// // // // // //                 <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
// // // // // //                   Unlock the power of AI with Query_GPT. Get instant answers, creative solutions, 
// // // // // //                   and intelligent insights for everything from travel planning to complex coding challenges.
// // // // // //                 </p>

// // // // // //                 {/* CTA Buttons */}
// // // // // //                 <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
// // // // // //                   <SignUpButton mode="modal">
// // // // // //                     <Button 
// // // // // //                       size="lg"
// // // // // //                       className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-10 py-6 text-xl font-semibold rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 group"
// // // // // //                     >
// // // // // //                       <UserPlus className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
// // // // // //                       Start Free Today
// // // // // //                       <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
// // // // // //                     </Button>
// // // // // //                   </SignUpButton>
                  
// // // // // //                   <SignInButton mode="modal">
// // // // // //                     <Button
// // // // // //                       variant="outline" 
// // // // // //                       size="lg"
// // // // // //                       className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-10 py-6 text-xl font-semibold rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:-translate-y-1 group"
// // // // // //                     >
// // // // // //                       <LogIn className="w-5 h-5 mr-3" />
// // // // // //                       Sign In
// // // // // //                     </Button>
// // // // // //                   </SignInButton>
// // // // // //                 </div>

// // // // // //                 {/* Interactive Demo Preview */}
// // // // // //                 <div className="bg-black/20 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 max-w-5xl mx-auto shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 group">
// // // // // //                   <div className="flex items-center justify-between mb-8">
// // // // // //                     <div className="flex items-center space-x-3">
// // // // // //                       <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
// // // // // //                       <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse delay-100"></div>
// // // // // //                       <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse delay-200"></div>
// // // // // //                     </div>
// // // // // //                     <div className="flex items-center space-x-3">
// // // // // //                       <div className="text-gray-400 text-sm font-medium">Query_GPT Live Demo</div>
// // // // // //                       <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
// // // // // //                     </div>
// // // // // //                   </div>
                  
// // // // // //                   <div className="space-y-6 text-left">
// // // // // //                     <div className="flex justify-end animate-fade-in">
// // // // // //                       <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl px-6 py-4 max-w-md shadow-lg">
// // // // // //                         <p className="text-sm font-medium">How do I optimize my React app for better performance?</p>
// // // // // //                       </div>
// // // // // //                     </div>
                    
// // // // // //                     <div className="flex justify-start animate-fade-in delay-500">
// // // // // //                       <div className="bg-white/10 backdrop-blur-sm text-white rounded-2xl px-6 py-6 max-w-3xl border border-white/20 shadow-lg">
// // // // // //                         <div className="flex items-start space-x-4">
// // // // // //                           <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
// // // // // //                             <Brain className="w-4 h-4 text-white" />
// // // // // //                           </div>
// // // // // //                           <div className="space-y-3">
// // // // // //                             <p className="text-sm font-semibold text-purple-300">Here are the top React optimization strategies:</p>
// // // // // //                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
// // // // // //                               <div className="flex items-center space-x-2">
// // // // // //                                 <Check className="w-4 h-4 text-green-400" />
// // // // // //                                 <span>Use React.memo for components</span>
// // // // // //                               </div>
// // // // // //                               <div className="flex items-center space-x-2">
// // // // // //                                 <Check className="w-4 h-4 text-green-400" />
// // // // // //                                 <span>Implement code splitting</span>
// // // // // //                               </div>
// // // // // //                               <div className="flex items-center space-x-2">
// // // // // //                                 <Check className="w-4 h-4 text-green-400" />
// // // // // //                                 <span>Optimize bundle size</span>
// // // // // //                               </div>
// // // // // //                               <div className="flex items-center space-x-2">
// // // // // //                                 <Check className="w-4 h-4 text-green-400" />
// // // // // //                                 <span>Use virtual scrolling</span>
// // // // // //                               </div>
// // // // // //                             </div>
// // // // // //                           </div>
// // // // // //                         </div>
// // // // // //                       </div>
// // // // // //                     </div>
// // // // // //                   </div>
// // // // // //                 </div>
// // // // // //               </div>

// // // // // //               {/* Features Grid */}
// // // // // //               <div className="grid md:grid-cols-3 gap-8 mb-20">
// // // // // //                 {[
// // // // // //                   {
// // // // // //                     icon: Zap,
// // // // // //                     title: "Lightning Fast",
// // // // // //                     desc: "Get instant responses powered by cutting-edge AI technology",
// // // // // //                     gradient: "from-yellow-500 to-orange-500",
// // // // // //                     delay: "delay-0"
// // // // // //                   },
// // // // // //                   {
// // // // // //                     icon: Brain,
// // // // // //                     title: "Super Intelligent",
// // // // // //                     desc: "Advanced reasoning and context understanding for accurate results",
// // // // // //                     gradient: "from-purple-500 to-pink-500",
// // // // // //                     delay: "delay-100"
// // // // // //                   },
// // // // // //                   {
// // // // // //                     icon: Shield,
// // // // // //                     title: "Secure & Private",
// // // // // //                     desc: "Enterprise-grade security with end-to-end encryption",
// // // // // //                     gradient: "from-green-500 to-emerald-500",
// // // // // //                     delay: "delay-200"
// // // // // //                   }
// // // // // //                 ].map((feature, idx) => (
// // // // // //                   <div key={idx} className={`bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 text-center hover:bg-white/10 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group ${feature.delay}`}>
// // // // // //                     <div className={`w-20 h-20 bg-gradient-to-r ${feature.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:rotate-6 transition-transform duration-300`}>
// // // // // //                       <feature.icon className="w-10 h-10 text-white" />
// // // // // //                     </div>
// // // // // //                     <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
// // // // // //                     <p className="text-gray-300 leading-relaxed">{feature.desc}</p>
// // // // // //                   </div>
// // // // // //                 ))}
// // // // // //               </div>

// // // // // //               {/* Use Cases Section */}
// // // // // //               <div className="text-center mb-20">
// // // // // //                 <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
// // // // // //                   Perfect For <span className="text-purple-400">Every Need</span>
// // // // // //                 </h2>
// // // // // //                 <p className="text-gray-300 text-xl mb-16 max-w-3xl mx-auto leading-relaxed">
// // // // // //                   From creative writing to complex problem-solving, Query_GPT adapts to your unique requirements
// // // // // //                 </p>

// // // // // //                 <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
// // // // // //                   {[
// // // // // //                     { icon: Globe, title: "Travel Planning", desc: "Visa requirements, destinations, itineraries", color: "text-blue-400" },
// // // // // //                     { icon: Code, title: "Coding Help", desc: "Debug code, learn frameworks, optimize performance", color: "text-green-400" },
// // // // // //                     { icon: Lightbulb, title: "Creative Writing", desc: "Stories, blogs, marketing copy, brainstorming", color: "text-yellow-400" },
// // // // // //                     { icon: TrendingUp, title: "Business Insights", desc: "Market analysis, strategy, data interpretation", color: "text-purple-400" }
// // // // // //                   ].map((item, idx) => (
// // // // // //                     <div key={idx} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105 group">
// // // // // //                       <item.icon className={`w-12 h-12 ${item.color} mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`} />
// // // // // //                       <h4 className="text-white font-bold text-lg mb-3">{item.title}</h4>
// // // // // //                       <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
// // // // // //                     </div>
// // // // // //                   ))}
// // // // // //                 </div>
// // // // // //               </div>

// // // // // //               {/* Social Proof Stats */}
// // // // // //               <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-lg border border-white/20 rounded-3xl p-12 mb-20 shadow-2xl">
// // // // // //                 <div className="grid md:grid-cols-4 gap-8 text-center">
// // // // // //                   {[
// // // // // //                     { number: "2M+", label: "Queries Answered", icon: MessageCircle },
// // // // // //                     { number: "99.9%", label: "Uptime", icon: Zap },
// // // // // //                     { number: "150K+", label: "Happy Users", icon: Users },
// // // // // //                     { number: "4.9/5", label: "User Rating", icon: Star }
// // // // // //                   ].map((stat, idx) => (
// // // // // //                     <div key={idx} className="group">
// // // // // //                       <stat.icon className="w-8 h-8 text-purple-400 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
// // // // // //                       <div className="text-4xl md:text-5xl font-bold text-white mb-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
// // // // // //                         {stat.number}
// // // // // //                       </div>
// // // // // //                       <div className="text-gray-300 font-medium">{stat.label}</div>
// // // // // //                     </div>
// // // // // //                   ))}
// // // // // //                 </div>
// // // // // //               </div>

// // // // // //               {/* Testimonials */}
// // // // // //               <div className="text-center mb-20">
// // // // // //                 <h2 className="text-4xl font-bold text-white mb-16">Loved by <span className="text-pink-400">Thousands</span></h2>
                
// // // // // //                 <div className="grid md:grid-cols-3 gap-8">
// // // // // //                   {[
// // // // // //                     {
// // // // // //                       name: "Sarah Chen",
// // // // // //                       role: "Travel Blogger",
// // // // // //                       content: "Query_GPT helped me plan my entire European trip. The visa requirements and cultural insights were spot-on!",
// // // // // //                       avatar: "SC"
// // // // // //                     },
// // // // // //                     {
// // // // // //                       name: "Marcus Johnson",
// // // // // //                       role: "Software Developer",
// // // // // //                       content: "Best coding assistant I've ever used. It explains complex concepts clearly and helps debug issues quickly.",
// // // // // //                       avatar: "MJ"
// // // // // //                     },
// // // // // //                     {
// // // // // //                       name: "Emma Wilson",
// // // // // //                       role: "Content Creator",
// // // // // //                       content: "My creative writing has improved dramatically. Query_GPT is like having a writing mentor available 24/7.",
// // // // // //                       avatar: "EW"
// // // // // //                     }
// // // // // //                   ].map((testimonial, idx) => (
// // // // // //                     <div key={idx} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
// // // // // //                       <div className="flex items-center mb-6">
// // // // // //                         <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
// // // // // //                           {testimonial.avatar}
// // // // // //                         </div>
// // // // // //                         <div className="text-left">
// // // // // //                           <div className="text-white font-semibold">{testimonial.name}</div>
// // // // // //                           <div className="text-gray-400 text-sm">{testimonial.role}</div>
// // // // // //                         </div>
// // // // // //                       </div>
// // // // // //                       <p className="text-gray-300 italic leading-relaxed">{testimonial.content}</p>
// // // // // //                       <div className="flex justify-center mt-4 space-x-1">
// // // // // //                         {[1,2,3,4,5].map((star) => (
// // // // // //                           <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
// // // // // //                         ))}
// // // // // //                       </div>
// // // // // //                     </div>
// // // // // //                   ))}
// // // // // //                 </div>
// // // // // //               </div>

// // // // // //               {/* Final CTA */}
// // // // // //               <div className="text-center bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-lg border border-purple-500/30 rounded-3xl p-16 shadow-2xl">
// // // // // //                 <Award className="w-16 h-16 text-purple-400 mx-auto mb-8" />
// // // // // //                 <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
// // // // // //                   Ready to <span className="text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">Transform</span> Your Workflow?
// // // // // //                 </h2>
// // // // // //                 <p className="text-gray-300 text-xl mb-12 max-w-3xl mx-auto leading-relaxed">
// // // // // //                   Join thousands of professionals who trust Query_GPT for their daily AI assistance needs. 
// // // // // //                   Start your free journey today.
// // // // // //                 </p>
// // // // // //                 <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
// // // // // //                   <SignUpButton mode="modal">
// // // // // //                     <Button 
// // // // // //                       size="lg" 
// // // // // //                       className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-6 text-xl font-semibold rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 group"
// // // // // //                     >
// // // // // //                       <Heart className="mr-3 w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
// // // // // //                       Start Your Journey
// // // // // //                       <Sparkles className="ml-3 w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
// // // // // //                     </Button>
// // // // // //                   </SignUpButton>
                  
// // // // // //                   <Button
// // // // // //                     variant="outline"
// // // // // //                     size="lg" 
// // // // // //                     className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-12 py-6 text-xl font-semibold rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:-translate-y-1"
// // // // // //                   >
// // // // // //                     <Play className="mr-3 w-6 h-6" />
// // // // // //                     Watch Demo
// // // // // //                   </Button>
// // // // // //                 </div>
// // // // // //               </div>
// // // // // //             </div>
// // // // // //           </main>

// // // // // //           {/* Enhanced Footer */}
// // // // // //           <footer className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-lg">
// // // // // //             <div className="container mx-auto px-4 py-12">
// // // // // //               <div className="flex flex-col md:flex-row justify-between items-center">
// // // // // //                 <div className="flex items-center space-x-3 mb-6 md:mb-0">
// // // // // //                   <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
// // // // // //                     <MessageCircle className="w-5 h-5 text-white" />
// // // // // //                   </div>
// // // // // //                   <span className="text-white font-bold text-xl">
// // // // // //                     Query<span className="text-purple-400">_GPT</span>
// // // // // //                   </span>
// // // // // //                 </div>
// // // // // //                 <div className="text-gray-400 text-center md:text-right">
// // // // // //                   <p className="mb-2">© 2024 Query_GPT. Powered by Advanced AI Technology.</p>
// // // // // //                   <p className="text-sm">Made with ❤️ for the future of AI assistance</p>
// // // // // //                 </div>
// // // // // //               </div>
// // // // // //             </div>
// // // // // //           </footer>
// // // // // //         </div>
// // // // // //       </SignedOut>

// // // // // //       <SignedIn>
// // // // // //         <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
// // // // // //           <div className="text-center">
// // // // // //             <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-8">
// // // // // //               <MessageCircle className="w-10 h-10 text-white" />
// // // // // //             </div>
// // // // // //             <h1 className="text-4xl font-bold text-white mb-4">
// // // // // //               Welcome to Query<span className="text-purple-400">_GPT</span>
// // // // // //             </h1>
// // // // // //             <p className="text-gray-300 text-xl mb-8">
// // // // // //               Your AI assistant is ready to help you with anything you need.
// // // // // //             </p>
// // // // // //             <Button 
// // // // // //               size="lg"
// // // // // //               className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
// // // // // //             >
// // // // // //               <ArrowRight className="w-5 h-5 mr-2" />
// // // // // //               Go to Dashboard
// // // // // //             </Button>
// // // // // //           </div>
// // // // // //         </div>
// // // // // //       </SignedIn>
// // // // // //     </>
// // // // // //   );
// // // // // // }


// // // // // // // import { Button } from "@/components/ui/button";
// // // // // // // import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";
// // // // // // // import { ArrowRight, MessageCircle, Sparkles, Zap, Shield, Globe, Brain, Users, UserPlus } from "lucide-react";

// // // // // // // export default function Home() {
// // // // // // //   return (
// // // // // // //     <>
// // // // // // //         <SignedOut>
// // // // // // //           <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
// // // // // // //       {/* Hero Section */}
// // // // // // //       <main className="container mx-auto px-4 py-16">
// // // // // // //         <div className="max-w-6xl mx-auto">
// // // // // // //           {/* Hero Content */}
// // // // // // //           <div className="text-center mb-16">
// // // // // // //             <div className="inline-flex items-center justify-center p-2 bg-purple-500/10 backdrop-blur-sm border border-purple-500/20 rounded-full mb-8">
// // // // // // //               <Sparkles className="w-5 h-5 text-purple-400 mr-2" />
// // // // // // //               <span className="text-purple-300 text-sm font-medium">Powered by Advanced AI</span>
// // // // // // //             </div>
            
// // // // // // //             <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
// // // // // // //               Query
// // // // // // //               <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
// // // // // // //                 _GPT
// // // // // // //               </span>
// // // // // // //               <span className="text-4xl">💯</span>
// // // // // // //             </h1>
            
// // // // // // //             <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
// // // // // // //               Your intelligent AI companion for instant answers, creative solutions, and deep insights. 
// // // // // // //               Ask anything, get everything.
// // // // // // //             </p>

// // // // // // //             {/* CTA Buttons */}
// // // // // // //             <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
// // // // // // //               {/* <Button 
// // // // // // //                 size="lg" 
// // // // // // //                 className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
// // // // // // //               >
// // // // // // //                 Get Started
// // // // // // //                 <ArrowRight className="ml-2 w-5 h-5" />
// // // // // // //               </Button> */}
// // // // // // //               <SignUpButton mode="modal">
// // // // // // //                       <Button 
// // // // // // //                         className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white
// // // // // // //                         px-8 py-4 text-lg font-semibold rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
// // // // // // //                       >
// // // // // // //                         <UserPlus className="w-4 h-4 mr-2" />
// // // // // // //                         Get Started
// // // // // // //                         <ArrowRight className="ml-2 w-5 h-5" />
// // // // // // //                       </Button>
// // // // // // //                     </SignUpButton>
              
// // // // // // //               <Button
// // // // // // //                 variant="outline" 
// // // // // // //                 size="lg"
// // // // // // //                 className="border-2 border-purple-500/50 text-white hover:bg-purple-500/10 px-8 py-4 text-lg font-semibold rounded-full backdrop-blur-sm transition-all duration-300"
// // // // // // //               >
// // // // // // //                 Watch Demo
// // // // // // //               </Button>
// // // // // // //             </div>

// // // // // // //             {/* Feature Preview */}
// // // // // // //             <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 max-w-4xl mx-auto shadow-2xl">
// // // // // // //               <div className="flex items-center justify-between mb-6">
// // // // // // //                 <div className="flex items-center space-x-3">
// // // // // // //                   <div className="w-3 h-3 bg-red-500 rounded-full"></div>
// // // // // // //                   <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
// // // // // // //                   <div className="w-3 h-3 bg-green-500 rounded-full"></div>
// // // // // // //                 </div>
// // // // // // //                 <div className="text-gray-400 text-sm">Query_GPT Interface</div>
// // // // // // //               </div>
              
// // // // // // //               <div className="space-y-4 text-left">
// // // // // // //                 <div className="flex justify-end">
// // // // // // //                   <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl px-6 py-3 max-w-xs">
// // // // // // //                     <p className="text-sm">What documents do I need to travel from Kenya to Ireland?</p>
// // // // // // //                   </div>
// // // // // // //                 </div>
                
// // // // // // //                 <div className="flex justify-start">
// // // // // // //                   <div className="bg-white/10 backdrop-blur-sm text-white rounded-2xl px-6 py-4 max-w-2xl border border-white/20">
// // // // // // //                     <div className="flex items-start space-x-3">
// // // // // // //                       <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
// // // // // // //                         <Brain className="w-3 h-3 text-white" />
// // // // // // //                       </div>
// // // // // // //                       <div>
// // // // // // //                         <p className="text-sm mb-2"><strong>For travel from Kenya to Ireland, you will need:</strong></p>
// // // // // // //                         <ul className="text-sm space-y-1 text-gray-300">
// // // // // // //                           <li>✓ Valid Kenyan passport (6+ months validity)</li>
// // // // // // //                           <li>✓ Irish visa (Category C short-stay)</li>
// // // // // // //                           <li>✓ Proof of accommodation</li>
// // // // // // //                           <li>✓ Return flight tickets</li>
// // // // // // //                         </ul>
// // // // // // //                       </div>
// // // // // // //                     </div>
// // // // // // //                   </div>
// // // // // // //                 </div>
// // // // // // //               </div>
// // // // // // //             </div>
// // // // // // //           </div>

// // // // // // //           {/* Features Grid */}
// // // // // // //           <div className="grid md:grid-cols-3 gap-8 mb-16">
// // // // // // //             <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-all duration-300 transform hover:scale-105">
// // // // // // //               <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
// // // // // // //                 <Zap className="w-8 h-8 text-white" />
// // // // // // //               </div>
// // // // // // //               <h3 className="text-xl font-bold text-white mb-4">Lightning Fast</h3>
// // // // // // //               <p className="text-gray-300">Get instant responses to your queries with our optimized AI engine.</p>
// // // // // // //             </div>

// // // // // // //             <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-all duration-300 transform hover:scale-105">
// // // // // // //               <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
// // // // // // //                 <Brain className="w-8 h-8 text-white" />
// // // // // // //               </div>
// // // // // // //               <h3 className="text-xl font-bold text-white mb-4">Smart & Accurate</h3>
// // // // // // //               <p className="text-gray-300">Advanced AI that understands context and provides detailed, accurate answers.</p>
// // // // // // //             </div>

// // // // // // //             <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-all duration-300 transform hover:scale-105">
// // // // // // //               <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
// // // // // // //                 <Shield className="w-8 h-8 text-white" />
// // // // // // //               </div>
// // // // // // //               <h3 className="text-xl font-bold text-white mb-4">Secure & Private</h3>
// // // // // // //               <p className="text-gray-300">Your conversations are encrypted and private. We respect your data.</p>
// // // // // // //             </div>
// // // // // // //           </div>

// // // // // // //           {/* Use Cases */}
// // // // // // //           <div className="text-center mb-16">
// // // // // // //             <h2 className="text-4xl font-bold text-white mb-4">Perfect For Every Need</h2>
// // // // // // //             <p className="text-gray-300 text-lg mb-12 max-w-2xl mx-auto">
// // // // // // //               From travel planning to coding help, Query_GPT adapts to your unique requirements
// // // // // // //             </p>

// // // // // // //             <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
// // // // // // //               {[
// // // // // // //                 { icon: Globe, title: "Travel Planning", desc: "Visa requirements, documentation, travel tips" },
// // // // // // //                 { icon: MessageCircle, title: "Technical Help", desc: "Coding tutorials, debugging, best practices" },
// // // // // // //                 { icon: Users, title: "Business Insights", desc: "Market research, strategy, analysis" },
// // // // // // //                 { icon: Sparkles, title: "Creative Writing", desc: "Content creation, brainstorming, editing" }
// // // // // // //               ].map((item, idx) => (
// // // // // // //                 <div key={idx} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
// // // // // // //                   <item.icon className="w-8 h-8 text-purple-400 mx-auto mb-4" />
// // // // // // //                   <h4 className="text-white font-semibold mb-2">{item.title}</h4>
// // // // // // //                   <p className="text-gray-400 text-sm">{item.desc}</p>
// // // // // // //                 </div>
// // // // // // //               ))}
// // // // // // //             </div>
// // // // // // //           </div>

// // // // // // //           {/* Stats */}
// // // // // // //           <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-lg border border-white/10 rounded-3xl p-12 text-center mb-16">
// // // // // // //             <div className="grid md:grid-cols-3 gap-8">
// // // // // // //               <div>
// // // // // // //                 <div className="text-4xl font-bold text-white mb-2">1M+</div>
// // // // // // //                 <div className="text-gray-300">Queries Answered</div>
// // // // // // //               </div>
// // // // // // //               <div>
// // // // // // //                 <div className="text-4xl font-bold text-white mb-2">99.9%</div>
// // // // // // //                 <div className="text-gray-300">Uptime</div>
// // // // // // //               </div>
// // // // // // //               <div>
// // // // // // //                 <div className="text-4xl font-bold text-white mb-2">50K+</div>
// // // // // // //                 <div className="text-gray-300">Happy Users</div>
// // // // // // //               </div>
// // // // // // //             </div>
// // // // // // //           </div>

// // // // // // //           {/* Final CTA */}
// // // // // // //           <div className="text-center">
// // // // // // //             <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
// // // // // // //               Ready to Experience the Future?
// // // // // // //             </h2>
// // // // // // //             <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
// // // // // // //               Join thousands of users who trust Query_GPT for their daily AI assistance needs.
// // // // // // //             </p>
// // // // // // //             <Button 
// // // // // // //               size="lg" 
// // // // // // //               className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-6 text-xl font-semibold rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
// // // // // // //             >
// // // // // // //               Start Your Journey
// // // // // // //               <Sparkles className="ml-2 w-6 h-6" />
// // // // // // //             </Button>
// // // // // // //           </div>
// // // // // // //         </div>
// // // // // // //       </main>

// // // // // // //       {/* Footer */}
// // // // // // //       <footer className="border-t border-white/10 py-8">
// // // // // // //         <div className="container mx-auto px-4 text-center">
// // // // // // //           <p className="text-gray-400">© 2024 Query_GPT. Powered by Advanced AI Technology.</p>
// // // // // // //         </div>
// // // // // // //       </footer>
// // // // // // //     </div>
// // // // // // //     </SignedOut>
// // // // // // //      <SignedIn>
// // // // // // //       <h1> hello  world</h1>
// // // // // // //      </SignedIn>
// // // // // // //     </>

// // // // // // //   );
// // // // // // // }