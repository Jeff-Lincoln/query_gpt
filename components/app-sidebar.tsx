// components/AppSidebar.tsx

import * as React from "react"
import { useState, useEffect } from "react"
import { useAuth, useUser } from '@clerk/nextjs'
import {
  MessageCircle,
  Plus,
  Search,
  Settings,
  User,
  LogOut,
  Clock,
  Trash2,
  MoreHorizontal,
  Bot,
  Zap,
  History,
  Star,
  Archive,
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  TrendingUp,
  Activity,
  Shield,
  Sparkles
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ChatSession {
  id: string
  title: string
  lastMessage: string
  timestamp: Date
  messageCount: number
  isSuccessful: boolean
  isPinned?: boolean
  llmProvider?: string
  responseTimeMs?: number
}

interface ApiChatSession {
  id: number
  question: string
  answer: string
  llm_provider: string
  response_time_ms: number
  created_at: string
  is_successful: boolean
}

interface ApiResponse {
  sessions: ApiChatSession[]
  total: number
  page: number
  size: number
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onNewChat?: () => void
  onSelectChat?: (chatId: string) => void
  currentChatId?: string
  apiBaseUrl?: string
}

export function AppSidebar({
  onNewChat,
  onSelectChat,
  currentChatId,
  apiBaseUrl = 'http://localhost:8000',
  ...props
}: AppSidebarProps) {
  const { user, isSignedIn } = useUser()
  const { signOut, getToken } = useAuth()

  const [token, setToken] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([])
  const [filter, setFilter] = useState<'all' | 'successful' | 'failed' | 'pinned'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalSessions, setTotalSessions] = useState(0)
  const [pageSize] = useState(20)
  const [stats, setStats] = useState({ totalChats: 0, successRate: 0, avgResponseTime: 0 })
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')

  // Fetch auth token
  useEffect(() => {
    const fetchToken = async () => {
      if (isSignedIn) {
        try {
          const t = await getToken()
          setToken(t)
        } catch (error) {
          console.error('Error fetching token:', error)
          setError('Authentication failed')
        }
      }
    }
    fetchToken()
  }, [getToken, isSignedIn])

  // Check server health
  const checkServerHealth = async () => {
    setConnectionStatus('checking')
    try {
      const response = await fetch(`${apiBaseUrl}/health`)
      setConnectionStatus(response.ok ? 'connected' : 'disconnected')
    } catch {
      setConnectionStatus('disconnected')
    }
  }

  useEffect(() => {
    if (isSignedIn && token) {
      checkServerHealth()
    }
  }, [isSignedIn, token, apiBaseUrl])

  const transformApiSession = (apiSession: ApiChatSession): ChatSession => ({
    id: apiSession.id.toString(),
    title: apiSession.question.length > 50
      ? apiSession.question.substring(0, 50) + '...'
      : apiSession.question,
    lastMessage: apiSession.question,
    timestamp: new Date(apiSession.created_at),
    messageCount: 1,
    isSuccessful: apiSession.is_successful,
    isPinned: false,
    llmProvider: apiSession.llm_provider,
    responseTimeMs: apiSession.response_time_ms
  })

  const fetchChatHistory = async (page = 1, size = pageSize, isRefresh = false) => {
    if (!token || !isSignedIn || connectionStatus !== 'connected') return

    try {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      const response = await fetch(`${apiBaseUrl}/api/v1/qa/history?page=${page}&size=${size}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Authentication failed')
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      const transformed = data.sessions.map(transformApiSession)

      setChatSessions(prev =>
        page === 1 ? transformed : [...prev, ...transformed]
      )
      setTotalSessions(data.total)
      setCurrentPage(page)

      // Calculate stats
      const totalChats = data.total
      const successfulChats = data.sessions.filter(s => s.is_successful).length
      const avgResponseTime = data.sessions.length > 0 
        ? data.sessions.reduce((acc, s) => acc + s.response_time_ms, 0) / data.sessions.length
        : 0

      setStats({
        totalChats,
        successRate: totalChats > 0 ? Math.round((successfulChats / data.sessions.length) * 100) : 0,
        avgResponseTime: Math.round(avgResponseTime)
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load history'
      setError(errorMessage)
      console.error('Error fetching chat history:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const refreshHistory = () => {
    checkServerHealth()
    fetchChatHistory(1, pageSize, true)
  }

  const loadMoreSessions = () => {
    if (!isLoading && !isRefreshing && chatSessions.length < totalSessions) {
      fetchChatHistory(currentPage + 1, pageSize)
    }
  }

  // Initial load
  useEffect(() => {
    if (isSignedIn && token && connectionStatus === 'connected') {
      fetchChatHistory()
    }
  }, [isSignedIn, token, connectionStatus])

  // Filter and search
  useEffect(() => {
    let filtered = chatSessions

    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    switch (filter) {
      case 'successful':
        filtered = filtered.filter(s => s.isSuccessful)
        break
      case 'failed':
        filtered = filtered.filter(s => !s.isSuccessful)
        break
      case 'pinned':
        filtered = filtered.filter(s => s.isPinned)
        break
    }

    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return b.timestamp.getTime() - a.timestamp.getTime()
    })

    setFilteredSessions(filtered)
  }, [searchTerm, filter, chatSessions])

  const formatTimestamp = (timestamp: Date) => {
    const diff = Date.now() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return timestamp.toLocaleDateString()
  }

  const formatResponseTime = (ms: number) => ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`

  const truncate = (text: string, len: number) =>
    text.length > len ? `${text.slice(0, len)}...` : text

  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connected': 
        return { 
          text: 'Connected', 
          color: 'text-emerald-600', 
          bgColor: 'bg-emerald-50',
          icon: <CheckCircle className="w-3 h-3" />
        };
      case 'disconnected': 
        return { 
          text: 'Offline', 
          color: 'text-red-600', 
          bgColor: 'bg-red-50',
          icon: <XCircle className="w-3 h-3" />
        };
      case 'checking': 
        return { 
          text: 'Connecting...', 
          color: 'text-amber-600', 
          bgColor: 'bg-amber-50',
          icon: <Loader2 className="w-3 h-3 animate-spin" />
        };
    }
  }

  const statusDisplay = getConnectionStatusDisplay()

  if (!isSignedIn) {
    return (
      <Sidebar className="border-r border-gray-200 bg-gradient-to-b from-gray-50 to-blue-50/30" {...props}>
        <SidebarContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Query_GPT</h3>
            <p className="text-sm text-gray-500">Please sign in to continue</p>
          </div>
        </SidebarContent>
      </Sidebar>
    )
  }

  return (
    <Sidebar className="border-r border-gray-200 bg-gradient-to-b from-white to-gray-50/50" {...props}>
      <SidebarHeader className="border-b border-gray-200/50 p-4 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
              Query_GPT
            </h2>
            <p className="text-sm text-gray-500 truncate">
              {user?.firstName || 'User'}
            </p>
          </div>
          <button
            onClick={refreshHistory}
            disabled={isRefreshing || connectionStatus !== 'connected'}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-all duration-200 transform hover:scale-105 active:scale-95"
            title="Refresh History"
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>

        {/* Connection Status */}
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 mb-4 ${statusDisplay.bgColor} border-gray-200`}>
          {statusDisplay.icon}
          <span className={`text-xs font-medium ${statusDisplay.color}`}>
            {statusDisplay.text}
          </span>
        </div>

        {/* Stats Cards */}
        {stats.totalChats > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Chats', value: stats.totalChats, icon: MessageCircle, color: 'from-blue-500 to-cyan-500' },
              { label: 'Success', value: `${stats.successRate}%`, icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
              { label: 'Speed', value: `${stats.avgResponseTime}ms`, icon: Zap, color: 'from-purple-500 to-pink-500' }
            ].map(({ label, value, icon: Icon, color }, i) => (
              <div key={i} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div className={`w-6 h-6 bg-gradient-to-r ${color} rounded-lg flex items-center justify-center text-white mb-2 mx-auto`}>
                  <Icon className="w-3 h-3" />
                </div>
                <div className="text-xs font-bold text-gray-900 text-center">{value}</div>
                <div className="text-xs text-gray-500 text-center">{label}</div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onNewChat}
          disabled={connectionStatus !== 'connected'}
          className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">New Chat</span>
        </button>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all duration-200"
          />
        </div>

        <div className="flex space-x-1 mt-3 bg-gray-100/80 rounded-lg p-1">
          {[
            { key: 'all', icon: MessageCircle, label: 'All' },
            { key: 'pinned', icon: Star, label: 'Pinned' },
            { key: 'successful', icon: CheckCircle, label: 'Success' },
            { key: 'failed', icon: XCircle, label: 'Failed' }
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`flex-1 flex flex-col items-center justify-center p-2 rounded-md text-xs font-medium transition-all duration-200 ${
                filter === key 
                  ? 'bg-white text-blue-600 shadow-sm transform scale-105' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              title={label}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-700">
            <History className="w-4 h-4" />
            Recent Conversations
          </h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {filteredSessions.length}/{totalSessions}
          </span>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-red-700 mb-2">
              <XCircle className="w-4 h-4" />
              <span className="font-medium">Connection Error</span>
            </div>
            <p className="text-xs text-red-600 mb-3">{error}</p>
            <button
              onClick={refreshHistory}
              className="text-xs text-red-700 underline hover:no-underline font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {isLoading && filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
            <p className="text-sm text-gray-500 font-medium">Loading conversations...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gradient-to-tr from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm text-gray-500 font-medium mb-2">
              {searchTerm ? 'No matching conversations' : 'No conversations yet'}
            </p>
            {!searchTerm && (
              <p className="text-xs text-gray-400">Start a new chat to begin</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSessions.map((session, index) => (
              <div
                key={session.id}
                className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-102 hover:shadow-md animate-fadeIn ${
                  currentChatId === session.id
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 shadow-sm'
                    : 'hover:bg-gray-50/80 border border-transparent hover:border-gray-200'
                }`}
                onClick={() => onSelectChat?.(session.id)}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {session.isPinned && (
                        <Star className="w-3 h-3 text-yellow-500 fill-current flex-shrink-0" />
                      )}
                      <h4 className="text-sm font-semibold text-gray-900 truncate flex-1">
                        {session.title}
                      </h4>
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          session.isSuccessful ? 'bg-emerald-400' : 'bg-red-400'
                        }`}
                        title={session.isSuccessful ? 'Successful' : 'Failed'}
                      />
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                      {truncate(session.lastMessage, 80)}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(session.timestamp)}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        {session.llmProvider && (
                          <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-xs font-medium">
                            {session.llmProvider}
                          </span>
                        )}
                        {session.responseTimeMs && (
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                            {formatResponseTime(session.responseTimeMs)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {chatSessions.length < totalSessions && (
              <button
                onClick={loadMoreSessions}
                disabled={isLoading}
                className="w-full text-center text-sm text-blue-600 py-4 hover:text-blue-700 hover:bg-blue-50/50 rounded-xl transition-all duration-200 font-medium disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading more...
                  </span>
                ) : (
                  `Load ${Math.min(pageSize, totalSessions - chatSessions.length)} more conversations`
                )}
              </button>
            )}
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200/50 p-4 bg-white/80 backdrop-blur-sm">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-3 w-full p-3 rounded-xl hover:bg-gray-100/80 transition-all duration-200 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
              <MoreHorizontal className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Activity
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => signOut()}
              className="flex items-center gap-2 text-red-600 focus:text-red-600"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </Sidebar>
  )
}



// import * as React from "react"
// import { useState, useEffect } from "react"
// import { useAuth, useUser } from '@clerk/nextjs'
// import {
//   MessageCircle,
//   Plus,
//   Search,
//   Settings,
//   User,
//   LogOut,
//   Clock,
//   Trash2,
//   MoreHorizontal,
//   Bot,
//   Zap,
//   History,
//   Star,
//   Archive,
//   Filter,
//   Calendar,
//   CheckCircle,
//   XCircle,
//   RefreshCw,
//   Loader2
// } from "lucide-react"

// import {
//   Sidebar,
//   SidebarContent,
//   SidebarGroup,
//   SidebarHeader,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
//   SidebarRail,
//   SidebarFooter,
// } from "@/components/ui/sidebar"

// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"

// interface ChatSession {
//   id: string
//   title: string
//   lastMessage: string
//   timestamp: Date
//   messageCount: number
//   isSuccessful: boolean
//   isPinned?: boolean
//   llmProvider?: string
//   responseTimeMs?: number
// }

// interface ApiChatSession {
//   id: number
//   question: string
//   answer: string
//   llm_provider: string
//   response_time_ms: number
//   created_at: string
//   is_successful: boolean
// }

// interface ApiResponse {
//   sessions: ApiChatSession[]
//   total: number
//   page: number
//   size: number
// }

// interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
//   onNewChat?: () => void
//   onSelectChat?: (chatId: string) => void
//   currentChatId?: string
//   apiBaseUrl?: string // Add API base URL prop
// }

// export function AppSidebar({ 
//   onNewChat, 
//   onSelectChat, 
//   currentChatId,
//   apiBaseUrl = 'http://localhost:8000', // Default API URL
//   ...props 
// }: AppSidebarProps) {
//   const { user, isSignedIn } = useUser()
//   const { signOut } = useAuth()
//   const [searchTerm, setSearchTerm] = useState('')
//   const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
//   const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([])
//   const [filter, setFilter] = useState<'all' | 'successful' | 'failed' | 'pinned'>('all')
//   const [isLoading, setIsLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [currentPage, setCurrentPage] = useState(1)
//   const [totalSessions, setTotalSessions] = useState(0)
//   const [pageSize] = useState(20) // Increased page size for better UX

//   // Function to transform API data to ChatSession format
//   const transformApiSession = (apiSession: ApiChatSession): ChatSession => {
//     return {
//       id: apiSession.id.toString(),
//       title: apiSession.question.length > 50 
//         ? apiSession.question.substring(0, 50) + '...' 
//         : apiSession.question,
//       lastMessage: apiSession.question,
//       timestamp: new Date(apiSession.created_at),
//       messageCount: 1, // API doesn't provide message count, so default to 1
//       isSuccessful: apiSession.is_successful,
//       isPinned: false, // API doesn't provide pinned status
//       llmProvider: apiSession.llm_provider,
//       responseTimeMs: apiSession.response_time_ms
//     }
//   }

//   // Fetch chat history from API
//   const fetchChatHistory = async (page: number = 1, size: number = pageSize) => {
//     try {
//       setIsLoading(true)
//       setError(null)
      
//       const response = await fetch(
//         `${apiBaseUrl}/api/v1/qa/history?page=${page}&size=${size}`,
//         {
//           method: 'GET',
//           headers: {
//             'accept': 'application/json',
//           },
//         }
//       )

//       if (!response.ok) {
//         throw new Error(`Failed to fetch chat history: ${response.status}`)
//       }

//       const data: ApiResponse = await response.json()
      
//       const transformedSessions = data.sessions.map(transformApiSession)
      
//       if (page === 1) {
//         setChatSessions(transformedSessions)
//       } else {
//         // Append new sessions for pagination
//         setChatSessions(prev => [...prev, ...transformedSessions])
//       }
      
//       setTotalSessions(data.total)
//       setCurrentPage(page)
      
//     } catch (err) {
//       console.error('Error fetching chat history:', err)
//       setError(err instanceof Error ? err.message : 'Failed to load chat history')
//       // Keep existing sessions on error
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // Load more sessions (pagination)
//   const loadMoreSessions = () => {
//     if (chatSessions.length < totalSessions && !isLoading) {
//       fetchChatHistory(currentPage + 1, pageSize)
//     }
//   }

//   // Refresh chat history
//   const refreshHistory = () => {
//     fetchChatHistory(1, pageSize)
//   }

//   // Initial load
//   useEffect(() => {
//     fetchChatHistory()
//   }, [apiBaseUrl])

//   // Filter and search logic
//   useEffect(() => {
//     let filtered = chatSessions

//     // Apply search filter
//     if (searchTerm) {
//       filtered = filtered.filter(session =>
//         session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         session.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//     }

//     // Apply status filter
//     switch (filter) {
//       case 'successful':
//         filtered = filtered.filter(session => session.isSuccessful)
//         break
//       case 'failed':
//         filtered = filtered.filter(session => !session.isSuccessful)
//         break
//       case 'pinned':
//         filtered = filtered.filter(session => session.isPinned)
//         break
//     }

//     // Sort by pinned first, then by timestamp
//     filtered.sort((a, b) => {
//       if (a.isPinned && !b.isPinned) return -1
//       if (!a.isPinned && b.isPinned) return 1
//       return b.timestamp.getTime() - a.timestamp.getTime()
//     })

//     setFilteredSessions(filtered)
//   }, [searchTerm, filter, chatSessions])

//   const formatTimestamp = (timestamp: Date) => {
//     const now = new Date()
//     const diff = now.getTime() - timestamp.getTime()
//     const minutes = Math.floor(diff / (1000 * 60))
//     const hours = Math.floor(diff / (1000 * 60 * 60))
//     const days = Math.floor(diff / (1000 * 60 * 60 * 24))

//     if (minutes < 60) return `${minutes}m ago`
//     if (hours < 24) return `${hours}h ago`
//     if (days < 7) return `${days}d ago`
//     return timestamp.toLocaleDateString()
//   }

//   const formatResponseTime = (timeMs: number) => {
//     if (timeMs < 1000) return `${timeMs}ms`
//     return `${(timeMs / 1000).toFixed(1)}s`
//   }

//   const truncateText = (text: string, maxLength: number) => {
//     return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
//   }

//   return (
//     <Sidebar className="border-r border-gray-200 bg-white" {...props}>
//       {/* Header */}
//       <SidebarHeader className="border-b border-gray-100 p-4">
//         <div className="flex items-center space-x-3 mb-4">
//           <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
//             <Bot className="w-6 h-6 text-white" />
//           </div>
//           <div className="flex-1">
//             <h2 className="text-lg font-bold text-gray-900">Query_GPT</h2>
//             <p className="text-sm text-gray-500">AI Assistant</p>
//           </div>
//           {/* Refresh Button */}
//           <button
//             onClick={refreshHistory}
//             disabled={isLoading}
//             className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
//             title="Refresh history"
//           >
//             {isLoading ? (
//               <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
//             ) : (
//               <RefreshCw className="w-4 h-4 text-gray-500" />
//             )}
//           </button>
//         </div>

//         {/* New Chat Button */}
//         <button
//           onClick={onNewChat}
//           className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
//         >
//           <Plus className="w-5 h-5" />
//           <span className="font-medium">New Chat</span>
//         </button>

//         {/* Search Bar */}
//         <div className="relative mt-4">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//           <input
//             type="text"
//             placeholder="Search conversations..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
//           />
//         </div>

//         {/* Filter Tabs */}
//         <div className="flex space-x-1 mt-3 bg-gray-100 rounded-lg p-1">
//           {[
//             { key: 'all', label: 'All', icon: MessageCircle },
//             { key: 'pinned', label: 'Pinned', icon: Star },
//             { key: 'successful', label: 'Success', icon: CheckCircle },
//             { key: 'failed', label: 'Failed', icon: XCircle }
//           ].map(({ key, label, icon: Icon }) => (
//             <button
//               key={key}
//               onClick={() => setFilter(key as any)}
//               className={`flex-1 flex items-center justify-center space-x-1 py-2 px-3 rounded-md text-xs font-medium transition-all duration-200 ${
//                 filter === key
//                   ? 'bg-white text-blue-600 shadow-sm'
//                   : 'text-gray-600 hover:text-gray-800'
//               }`}
//             >
//               <Icon className="w-3 h-3" />
//               <span className="hidden sm:inline">{label}</span>
//             </button>
//           ))}
//         </div>
//       </SidebarHeader>

//       <SidebarContent className="flex-1 overflow-y-auto">
//         <SidebarGroup>
//           <div className="px-4 py-2">
//             <div className="flex items-center justify-between mb-3">
//               <h3 className="text-sm font-semibold text-gray-700 flex items-center">
//                 <History className="w-4 h-4 mr-2" />
//                 Chat History
//               </h3>
//               <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
//                 {filteredSessions.length}{totalSessions > 0 && `/${totalSessions}`}
//               </span>
//             </div>

//             {/* Error State */}
//             {error && (
//               <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
//                 <p className="text-sm text-red-600">{error}</p>
//                 <button
//                   onClick={refreshHistory}
//                   className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
//                 >
//                   Try again
//                 </button>
//               </div>
//             )}

//             {/* Chat Sessions List */}
//             <div className="space-y-2">
//               {isLoading && filteredSessions.length === 0 ? (
//                 <div className="text-center py-8">
//                   <Loader2 className="w-8 h-8 text-gray-300 mx-auto mb-2 animate-spin" />
//                   <p className="text-sm text-gray-500">Loading conversations...</p>
//                 </div>
//               ) : filteredSessions.length === 0 ? (
//                 <div className="text-center py-8">
//                   <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
//                   <p className="text-sm text-gray-500">
//                     {searchTerm ? 'No matching conversations' : 'No conversations yet'}
//                   </p>
//                   <p className="text-xs text-gray-400 mt-1">
//                     {searchTerm ? 'Try a different search term' : 'Start a new chat to begin'}
//                   </p>
//                 </div>
//               ) : (
//                 <>
//                   {filteredSessions.map((session) => (
//                     <div
//                       key={session.id}
//                       className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
//                         currentChatId === session.id
//                           ? 'bg-blue-50 border-l-4 border-blue-500 shadow-sm'
//                           : 'hover:bg-gray-50 border-l-4 border-transparent'
//                       }`}
//                       onClick={() => onSelectChat?.(session.id)}
//                     >
//                       <div className="flex items-start justify-between">
//                         <div className="flex-1 min-w-0">
//                           <div className="flex items-center space-x-2 mb-1">
//                             {session.isPinned && (
//                               <Star className="w-3 h-3 text-yellow-500 fill-current flex-shrink-0" />
//                             )}
//                             <h4 className="text-sm font-medium text-gray-900 truncate">
//                               {session.title}
//                             </h4>
//                             <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
//                               session.isSuccessful ? 'bg-green-400' : 'bg-red-400'
//                             }`} />
//                           </div>
//                           <p className="text-xs text-gray-600 mb-2 line-clamp-2">
//                             {truncateText(session.lastMessage, 60)}
//                           </p>
//                           <div className="flex items-center justify-between text-xs text-gray-500">
//                             <div className="flex items-center space-x-2">
//                               <Clock className="w-3 h-3" />
//                               <span>{formatTimestamp(session.timestamp)}</span>
//                             </div>
//                             <div className="flex items-center space-x-2">
//                               {session.llmProvider && (
//                                 <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs">
//                                   {session.llmProvider}
//                                 </span>
//                               )}
//                               {session.responseTimeMs && session.responseTimeMs > 0 && (
//                                 <span className="bg-gray-100 px-2 py-1 rounded-full">
//                                   {formatResponseTime(session.responseTimeMs)}
//                                 </span>
//                               )}
//                             </div>
//                           </div>
//                         </div>

//                         {/* Action Menu */}
//                         <DropdownMenu>
//                           <DropdownMenuTrigger asChild>
//                             <button title="More Actions" className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity">
//                               <MoreHorizontal className="w-4 h-4 text-gray-500" />
//                             </button>
//                           </DropdownMenuTrigger>
//                           <DropdownMenuContent align="end" className="w-48">
//                             <DropdownMenuItem>
//                               <Star className="w-4 h-4 mr-2" />
//                               {session.isPinned ? 'Unpin' : 'Pin'} Chat
//                             </DropdownMenuItem>
//                             <DropdownMenuItem>
//                               <Archive className="w-4 h-4 mr-2" />
//                               Archive Chat
//                             </DropdownMenuItem>
//                             <DropdownMenuSeparator />
//                             <DropdownMenuItem className="text-red-600">
//                               <Trash2 className="w-4 h-4 mr-2" />
//                               Delete Chat
//                             </DropdownMenuItem>
//                           </DropdownMenuContent>
//                         </DropdownMenu>
//                       </div>
//                     </div>
//                   ))}
                  
//                   {/* Load More Button */}
//                   {chatSessions.length < totalSessions && (
//                     <div className="pt-4">
//                       <button
//                         onClick={loadMoreSessions}
//                         disabled={isLoading}
//                         className="w-full flex items-center justify-center space-x-2 py-2 px-4 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
//                       >
//                         {isLoading ? (
//                           <>
//                             <Loader2 className="w-4 h-4 animate-spin" />
//                             <span>Loading...</span>
//                           </>
//                         ) : (
//                           <>
//                             <Plus className="w-4 h-4" />
//                             <span>Load More ({totalSessions - chatSessions.length} remaining)</span>
//                           </>
//                         )}
//                       </button>
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>
//           </div>
//         </SidebarGroup>
//       </SidebarContent>

//       {/* Footer with User Profile */}
//       <SidebarFooter className="border-t border-gray-100 p-4">
//         {isSignedIn && user ? (
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
//                 <div className="relative">
//                   {user.imageUrl ? (
//                     <img
//                       src={user.imageUrl}
//                       alt={user.firstName || 'User'}
//                       className="w-10 h-10 rounded-full border-2 border-gray-200"
//                     />
//                   ) : (
//                     <div className="w-10 h-10 bg-gradient-to-tr from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
//                       <User className="w-5 h-5 text-white" />
//                     </div>
//                   )}
//                   <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
//                 </div>
//                 <div className="flex-1 text-left min-w-0">
//                   <p className="text-sm font-medium text-gray-900 truncate">
//                     {user.firstName} {user.lastName}
//                   </p>
//                   <p className="text-xs text-gray-500 truncate">
//                     {user.primaryEmailAddress?.emailAddress}
//                   </p>
//                 </div>
//                 <MoreHorizontal className="w-4 h-4 text-gray-400 flex-shrink-0" />
//               </button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-56">
//               <div className="px-3 py-2 border-b">
//                 <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
//                 <p className="text-xs text-gray-500">{user.primaryEmailAddress?.emailAddress}</p>
//               </div>
//               <DropdownMenuItem>
//                 <User className="w-4 h-4 mr-2" />
//                 Profile Settings
//               </DropdownMenuItem>
//               <DropdownMenuItem>
//                 <Settings className="w-4 h-4 mr-2" />
//                 Preferences
//               </DropdownMenuItem>
//               <DropdownMenuItem>
//                 <Zap className="w-4 h-4 mr-2" />
//                 Upgrade Plan
//               </DropdownMenuItem>
//               <DropdownMenuSeparator />
//               <DropdownMenuItem 
//                 onClick={() => signOut()}
//                 className="text-red-600"
//               >
//                 <LogOut className="w-4 h-4 mr-2" />
//                 Sign Out
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         ) : (
//           <div className="text-center">
//             <p className="text-sm text-gray-500 mb-2">Sign in to access your chats</p>
//             <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
//               Sign In
//             </button>
//           </div>
//         )}

//         {/* Quick Stats */}
//         <div className="mt-4 grid grid-cols-2 gap-3">
//           <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg">
//             <div className="flex items-center space-x-2">
//               <MessageCircle className="w-4 h-4 text-blue-600" />
//               <div>
//                 <p className="text-xs text-gray-600">Total Chats</p>
//                 <p className="text-sm font-semibold text-blue-600">{totalSessions}</p>
//               </div>
//             </div>
//           </div>
//           <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg">
//             <div className="flex items-center space-x-2">
//               <CheckCircle className="w-4 h-4 text-green-600" />
//               <div>
//                 <p className="text-xs text-gray-600">Success Rate</p>
//                 <p className="text-sm font-semibold text-green-600">
//                   {chatSessions.length > 0 
//                     ? Math.round((chatSessions.filter(s => s.isSuccessful).length / chatSessions.length) * 100)
//                     : 0}%
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </SidebarFooter>

//       <SidebarRail />
//     </Sidebar>
//   )
// }

// // Add custom CSS for line-clamp
// const styles = `
//   .line-clamp-2 {
//     display: -webkit-box;
//     -webkit-line-clamp: 2;
//     -webkit-box-orient: vertical;
//     overflow: hidden;
//   }
// `

// // Inject styles
// if (typeof document !== 'undefined') {
//   const styleSheet = document.createElement('style')
//   styleSheet.textContent = styles
//   document.head.appendChild(styleSheet)
// }


// // import * as React from "react"
// // import { GalleryVerticalEnd, Minus, Plus } from "lucide-react"

// // import { SearchForm } from "@/components/search-form"
// // import {
// //   Collapsible,
// //   CollapsibleContent,
// //   CollapsibleTrigger,
// // } from "@/components/ui/collapsible"
// // import {
// //   Sidebar,
// //   SidebarContent,
// //   SidebarGroup,
// //   SidebarHeader,
// //   SidebarMenu,
// //   SidebarMenuButton,
// //   SidebarMenuItem,
// //   SidebarMenuSub,
// //   SidebarMenuSubButton,
// //   SidebarMenuSubItem,
// //   SidebarRail,
// // } from "@/components/ui/sidebar"

// // // This is sample data.
// // const data = {
// //   navMain: [
// //     {
// //       title: "Getting Started",
// //       url: "#",
// //       items: [
// //         {
// //           title: "Installation",
// //           url: "#",
// //         },
// //         {
// //           title: "Project Structure",
// //           url: "#",
// //         },
// //       ],
// //     },
// //     {
// //       title: "Building Your Application",
// //       url: "#",
// //       items: [
// //         {
// //           title: "Routing",
// //           url: "#",
// //         },
// //         {
// //           title: "Data Fetching",
// //           url: "#",
// //           isActive: true,
// //         },
// //         {
// //           title: "Rendering",
// //           url: "#",
// //         },
// //         {
// //           title: "Caching",
// //           url: "#",
// //         },
// //         {
// //           title: "Styling",
// //           url: "#",
// //         },
// //         {
// //           title: "Optimizing",
// //           url: "#",
// //         },
// //         {
// //           title: "Configuring",
// //           url: "#",
// //         },
// //         {
// //           title: "Testing",
// //           url: "#",
// //         },
// //         {
// //           title: "Authentication",
// //           url: "#",
// //         },
// //         {
// //           title: "Deploying",
// //           url: "#",
// //         },
// //         {
// //           title: "Upgrading",
// //           url: "#",
// //         },
// //         {
// //           title: "Examples",
// //           url: "#",
// //         },
// //       ],
// //     },
// //     {
// //       title: "API Reference",
// //       url: "#",
// //       items: [
// //         {
// //           title: "Components",
// //           url: "#",
// //         },
// //         {
// //           title: "File Conventions",
// //           url: "#",
// //         },
// //         {
// //           title: "Functions",
// //           url: "#",
// //         },
// //         {
// //           title: "next.config.js Options",
// //           url: "#",
// //         },
// //         {
// //           title: "CLI",
// //           url: "#",
// //         },
// //         {
// //           title: "Edge Runtime",
// //           url: "#",
// //         },
// //       ],
// //     },
// //     {
// //       title: "Architecture",
// //       url: "#",
// //       items: [
// //         {
// //           title: "Accessibility",
// //           url: "#",
// //         },
// //         {
// //           title: "Fast Refresh",
// //           url: "#",
// //         },
// //         {
// //           title: "Next.js Compiler",
// //           url: "#",
// //         },
// //         {
// //           title: "Supported Browsers",
// //           url: "#",
// //         },
// //         {
// //           title: "Turbopack",
// //           url: "#",
// //         },
// //       ],
// //     },
// //     {
// //       title: "Community",
// //       url: "#",
// //       items: [
// //         {
// //           title: "Contribution Guide",
// //           url: "#",
// //         },
// //       ],
// //     },
// //   ],
// // }

// // export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
// //   return (
// //     <Sidebar {...props}>
// //       <SidebarHeader>
// //         <SidebarMenu>
// //           <SidebarMenuItem>
// //             <SidebarMenuButton size="lg" asChild>
// //               <a href="#">
// //                 <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
// //                   <GalleryVerticalEnd className="size-4" />
// //                 </div>
// //                 <div className="flex flex-col gap-0.5 leading-none">
// //                   <span className="font-medium">Documentation</span>
// //                   <span className="">v1.0.0</span>
// //                 </div>
// //               </a>
// //             </SidebarMenuButton>
// //           </SidebarMenuItem>
// //         </SidebarMenu>
// //         <SearchForm />
// //       </SidebarHeader>
// //       <SidebarContent>
// //         <SidebarGroup>
// //           <SidebarMenu>
// //             {data.navMain.map((item, index) => (
// //               <Collapsible
// //                 key={item.title}
// //                 defaultOpen={index === 1}
// //                 className="group/collapsible"
// //               >
// //                 <SidebarMenuItem>
// //                   <CollapsibleTrigger asChild>
// //                     <SidebarMenuButton>
// //                       {item.title}{" "}
// //                       <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
// //                       <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
// //                     </SidebarMenuButton>
// //                   </CollapsibleTrigger>
// //                   {item.items?.length ? (
// //                     <CollapsibleContent>
// //                       <SidebarMenuSub>
// //                         {item.items.map((item) => (
// //                           <SidebarMenuSubItem key={item.title}>
// //                             <SidebarMenuSubButton
// //                               asChild
// //                               isActive={item.isActive}
// //                             >
// //                               <a href={item.url}>{item.title}</a>
// //                             </SidebarMenuSubButton>
// //                           </SidebarMenuSubItem>
// //                         ))}
// //                       </SidebarMenuSub>
// //                     </CollapsibleContent>
// //                   ) : null}
// //                 </SidebarMenuItem>
// //               </Collapsible>
// //             ))}
// //           </SidebarMenu>
// //         </SidebarGroup>
// //       </SidebarContent>
// //       <SidebarRail />
// //     </Sidebar>
// //   )
// // }
