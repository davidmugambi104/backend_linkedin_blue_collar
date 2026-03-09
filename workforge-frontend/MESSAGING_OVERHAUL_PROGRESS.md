# SYSTEM INSTRUCTION: MESSAGING PLATFORM OVERHAUL - EXECUTE UNTIL COMPLETE

You are an expert full-stack developer. You MUST complete ALL tasks below in order. Do NOT stop until ALL items are marked [DONE]. If you encounter an error, fix it and continue. Track progress in a visible checklist.

## PROJECT CONTEXT
Current messaging platform has 11 critical issues:
1. Slow performance
2. Not working properly (dual socket conflict)
3. Broken error handling
4. Feels like testing tool
5. Lacks WhatsApp-like features
6. Underutilized backend
7. No job profile integration
8. Missing AI assistant
9. Not smooth UX
10. Lacks modern features
11. Too slow

## EXECUTION MODE: SEQUENTIAL - DO NOT SKIP STEPS

## LIVE EXECUTION CHECKLIST (AGENT UPDATED)

- [DONE] Task 1.1: Fix Socket Conflict
- [DONE] Task 1.2: Fix Zustand Selector Performance
- [DONE] Task 1.3: Add Optimistic Updates
- [DONE] Task 1.4: Add Error Recovery
- [DONE] Task 2.1: Implement Message Virtualization
- [DONE] Task 2.2: Add Database Indexes
- [DONE] Task 2.3: Replace Polling with WebSockets
- [DONE] Task 3.1: Add WhatsApp-like Features
- [DONE] Task 3.2: Add Job Profile Integration
- [DONE] Task 4.1: Create CSV-trained Chatbot
- [DONE] Task 5.1: Dockerize with Redis
- [DONE] Task 5.2: Add CDN for Attachments

### INITIALIZATION
First, examine the current codebase structure:
```bash
ls -la frontend/src/pages/messages/
ls -la frontend/src/hooks/
ls -la frontend/src/services/
ls -la backend/app/routes/
ls -la backend/app/sockets/
ls -la backend/app/models/
and all the rest

PHASE 1: CRITICAL FIXES (Must Complete First)
Task 1.1: Fix Socket Conflict [PRIORITY: CRITICAL]
The system has two socket handlers causing conflicts:

backend/app/sockets/messaging.py (primary)

backend/app/sockets/chat.py (duplicate)

Actions:

Check both files and compare functionality

Disable the duplicate by renaming:

bash
mv backend/app/sockets/chat.py backend/app/sockets/chat.py.disabled
Update imports in any files referencing chat.py

Test socket connection:

python
# Create test script: test_socket.py
from socketio import Client
sio = Client()
sio.connect('http://localhost:5000')
sio.emit('test_connection')
Verify only one handler responds

Update progress: Mark Task 1.1 [DONE]

Task 1.2: Fix Zustand Selector Performance [PRIORITY: CRITICAL]
Current selectors cause excessive re-renders.

Files to modify:

frontend/src/store/message.store.ts

frontend/src/hooks/useMessages.ts

Changes to make:

typescript
// In message.store.ts - Add selective subscription
interface MessageStore {
  // ... existing state
  useMessages: (conversationId: number) => Message[]
  useTypingUsers: (conversationId: number) => TypingUser[]
  useUnreadCount: (conversationId?: number) => number
}

// Implement with useCallback to prevent selector churn
export const useMessageStore = create<MessageStore>((set, get) => ({
  // ... existing code
  
  // Add these selectors
  useMessages: (conversationId) => 
    useStore(
      useCallback(
        (state) => state.messages.get(conversationId) || EMPTY_MESSAGES,
        [conversationId]
      )
    ),
    
  useTypingUsers: (conversationId) =>
    useStore(
      useCallback(
        (state) => state.typingUsers.get(conversationId) || EMPTY_TYPING,
        [conversationId]
      )
    )
}))

// In useMessages.ts - Refactor to use new selectors
export const useMessages = (conversationId: number) => {
  const messages = useMessageStore(state => state.useMessages(conversationId))
  const typingUsers = useMessageStore(state => state.useTypingUsers(conversationId))
  // ... rest of hook
}
Test with React DevTools to verify reduced re-renders.
Mark Task 1.2 [DONE]

Task 1.3: Add Optimistic Updates [PRIORITY: HIGH]
Implement instant UI feedback for messages.

Files:

frontend/src/hooks/useMessages.ts

frontend/src/services/message.service.ts

Implementation:

typescript
// In useMessages.ts
interface OptimisticMessage extends Message {
  _optimistic?: boolean
  _status: 'sending' | 'sent' | 'failed'
}

const sendMessage = async (content: string, attachments?: File[]) => {
  // Generate temporary ID
  const tempId = `temp-${Date.now()}-${Math.random().toString(36)}`
  
  // Create optimistic message
  const optimisticMessage: OptimisticMessage = {
    id: tempId,
    content,
    sender_id: currentUser.id,
    receiver_id: otherUserId,
    conversation_id: conversationId,
    created_at: new Date().toISOString(),
    _optimistic: true,
    _status: 'sending',
    attachments: attachments?.map(f => ({ 
      name: f.name, 
      size: f.size, 
      uploading: true 
    }))
  }
  
  // Add to store immediately
  addMessage(optimisticMessage)
  
  try {
    // Attempt real send
    const result = await messageService.sendMessage({
      receiver_id: otherUserId,
      content,
      attachments
    })
    
    // Replace optimistic with real message
    updateMessage(tempId, { 
      ...result, 
      _optimistic: false,
      _status: 'sent' 
    })
  } catch (error) {
    // Mark as failed
    updateMessage(tempId, { 
      _status: 'failed',
      error: error.message 
    })
    
    // Add retry button in UI
    showRetryToast(tempId)
  }
}
Mark Task 1.3 [DONE]

Task 1.4: Add Error Recovery [PRIORITY: HIGH]
Implement robust error handling and recovery.

Files:

frontend/src/pages/messages/Inbox/components/MessagesErrorBoundary.tsx

frontend/src/services/ws-message.service.ts

Enhance error boundary:

typescript
// In MessagesErrorBoundary.tsx
interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  recoveryAttempts: number
  lastErrorTime: Date | null
}

class MessagesErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    recoveryAttempts: 0,
    lastErrorTime: null
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service
    this.logErrorToService(error, errorInfo)
    
    this.setState({
      hasError: true,
      error,
      errorInfo,
      lastErrorTime: new Date()
    })
  }

  attemptRecovery = () => {
    const { recoveryAttempts } = this.state
    
    if (recoveryAttempts < 3) {
      // Clear cache
      localStorage.removeItem('workforge-messages')
      
      // Reset WebSocket connection
      wsMessageService.reconnect()
      
      this.setState(prev => ({
        hasError: false,
        recoveryAttempts: prev.recoveryAttempts + 1
      }))
    } else {
      // Show "Contact Support" after 3 failures
      this.showSupportDialog()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={this.attemptRecovery}>
            Try Again (Attempt {this.state.recoveryAttempts + 1}/3)
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details>
              <summary>Stack Trace</summary>
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </details>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
Add WebSocket reconnection logic:

typescript
// In ws-message.service.ts
class WebSocketService {
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout = 1000 // Start with 1s
  
  connect() {
    try {
      this.socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectTimeout
      })
      
      this.setupEventHandlers()
    } catch (error) {
      console.error('Connection failed:', error)
      this.scheduleReconnect()
    }
  }
  
  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(30000, this.reconnectTimeout * Math.pow(2, this.reconnectAttempts))
      setTimeout(() => {
        this.reconnectAttempts++
        this.connect()
      }, delay)
    }
  }
}
Mark Task 1.4 [DONE]

PHASE 2: PERFORMANCE OPTIMIZATION
Task 2.1: Implement Message Virtualization
Files:

frontend/src/pages/messages/Inbox/components/MessageList.tsx (create new)

frontend/src/pages/messages/Inbox/components/ChatWindow.tsx

Implementation:

bash
npm install react-virtuoso
typescript
// Create new file: MessageList.tsx
import { Virtuoso } from 'react-virtuoso'

interface MessageListProps {
  messages: Message[]
  loadMore: () => void
  hasMore: boolean
  onMessageVisible?: (index: number) => void
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  loadMore,
  hasMore,
  onMessageVisible
}) => {
  const listRef = useRef<HTMLDivElement>(null)
  
  return (
    <Virtuoso
      ref={listRef}
      data={messages}
      totalCount={messages.length}
      itemContent={(index, message) => (
        <MessageBubble 
          message={message}
          onVisible={() => onMessageVisible?.(index)}
        />
      )}
      endReached={loadMore}
      overscan={200}
      followOutput="smooth"
      components={{
        Footer: () => hasMore ? 
          <div className="loading-more">Loading more...</div> : 
          <div className="end-of-messages">End of conversation</div>
      }}
    />
  )
}
Mark Task 2.1 [DONE]

Task 2.2: Add Database Indexes
Files:

Create migration: backend/migrations/versions/add_message_indexes.py

python
"""Add message indexes

Revision ID: add_message_indexes
Revises: previous_revision
Create Date: 2026-03-08
"""

from alembic import op
import sqlalchemy as sa

def upgrade():
    # Index for conversation queries
    op.create_index(
        'ix_messages_conversation_created',
        'messages',
        ['conversation_id', 'created_at']
    )
    
    # Index for unread count queries
    op.create_index(
        'ix_messages_unread',
        'messages',
        ['receiver_id', 'is_read'],
        postgresql_where=sa.text('is_read = false')
    )
    
    # Index for search
    op.create_index(
        'ix_messages_content_trgm',
        'messages',
        ['content'],
        postgresql_ops={'content': 'gin_trgm_ops'},
        postgresql_using='gin'
    )
    
    # Enable pg_trgm extension for text search
    op.execute('CREATE EXTENSION IF NOT EXISTS pg_trgm')

def downgrade():
    op.drop_index('ix_messages_conversation_created')
    op.drop_index('ix_messages_unread')
    op.drop_index('ix_messages_content_trgm')
Mark Task 2.2 [DONE]

Task 2.3: Replace Polling with WebSockets
Files:

frontend/src/pages/messages/Inbox/Inbox.tsx

backend/app/sockets/messaging.py

Remove polling, add real-time unread updates:

python
# In backend/app/sockets/messaging.py
@socketio.on('message_read')
def handle_message_read(data):
    """Handle read receipts and broadcast unread count update"""
    conversation_id = data['conversation_id']
    user_id = current_user.id
    
    # Mark messages as read
    Message.query.filter_by(
        conversation_id=conversation_id,
        receiver_id=user_id,
        is_read=False
    ).update({'is_read': True})
    db.session.commit()
    
    # Get updated unread count for the sender
    unread_count = Message.query.filter_by(
        receiver_id=user_id,
        is_read=False
    ).count()
    
    # Broadcast to all user's sessions
    emit('unread_update', {
        'user_id': user_id,
        'total': unread_count,
        'conversation': conversation_id
    }, room=f'user_{user_id}')
typescript
// In Inbox.tsx - Remove polling, add socket listener
useEffect(() => {
  const unsubscribe = wsMessageService.onUnreadUpdate((data) => {
    if (data.user_id === currentUser.id) {
      updateUnreadCount(data.conversation, data.total)
      
      // Update page title
      document.title = data.total > 0 
        ? `(${data.total}) Workforge Messages`
        : 'Workforge Messages'
    }
  })
  
  return unsubscribe
}, [currentUser.id])
Mark Task 2.3 [DONE]

PHASE 3: USER EXPERIENCE ENHANCEMENTS
Task 3.1: Add WhatsApp-like Features
Files to create/modify:

frontend/src/pages/messages/Inbox/components/ReactionPicker.tsx

frontend/src/pages/messages/Inbox/components/VoiceMessage.tsx

frontend/src/pages/messages/Inbox/components/MessageStatus.tsx

typescript
// ReactionPicker.tsx
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

export const ReactionPicker = ({ messageId, onReaction }) => {
  const [showPicker, setShowPicker] = useState(false)
  const recentReactions = ['👍', '❤️', '😂', '😮', '😢', '👎']
  
  return (
    <div className="reaction-container relative">
      <button 
        onClick={() => setShowPicker(!showPicker)}
        className="p-1 hover:bg-gray-100 rounded-full"
      >
        😊
      </button>
      
      {showPicker && (
        <div className="absolute bottom-full mb-2">
          <Picker 
            data={data}
            onEmojiSelect={(emoji) => {
              onReaction(messageId, emoji.native)
              setShowPicker(false)
            }}
            theme="light"
            previewPosition="none"
            skinTonePosition="none"
          />
        </div>
      )}
      
      <div className="flex gap-1 mt-1">
        {recentReactions.map(emoji => (
          <button
            key={emoji}
            onClick={() => onReaction(messageId, emoji)}
            className="hover:bg-gray-100 px-1 rounded"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

// VoiceMessage.tsx
import WaveSurfer from 'wavesurfer.js'

export const VoiceMessage = ({ audioUrl, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const waveformRef = useRef(null)
  const wavesurfer = useRef(null)
  
  useEffect(() => {
    if (waveformRef.current && audioUrl) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#4F46E5',
        progressColor: '#818CF8',
        cursorColor: 'transparent',
        barWidth: 2,
        barRadius: 3,
        height: 30
      })
      
      wavesurfer.current.load(audioUrl)
      
      wavesurfer.current.on('play', () => setIsPlaying(true))
      wavesurfer.current.on('pause', () => setIsPlaying(false))
      wavesurfer.current.on('audioprocess', () => {
        setCurrentTime(wavesurfer.current.getCurrentTime())
      })
    }
    
    return () => wavesurfer.current?.destroy()
  }, [audioUrl])
  
  return (
    <div className="voice-message flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
      <button
        onClick={() => wavesurfer.current?.playPause()}
        className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center"
      >
        {isPlaying ? '⏸️' : '▶️'}
      </button>
      
      <div ref={waveformRef} className="flex-1" />
      
      <span className="text-xs text-gray-500">
        {formatTime(currentTime)}/{formatTime(duration)}
      </span>
    </div>
  )
}
Mark Task 3.1 [DONE]

Task 3.2: Add Job Profile Integration
Files:

frontend/src/pages/messages/Inbox/components/UserProfileChip.tsx

backend/app/routes/jobs.py (update)

typescript
// UserProfileChip.tsx
import { Link } from 'react-router-dom'
import { Tooltip } from 'react-tooltip'

export const UserProfileChip = ({ user }) => {
  const getProfileUrl = () => {
    switch(user.role) {
      case 'worker':
        return `/workers/${user.id}`
      case 'employer':
        return `/companies/${user.profile?.company_id}`
      case 'admin':
        return `/admin/users/${user.id}`
      default:
        return `/profile/${user.id}`
    }
  }
  
  const getJobMatchStatus = () => {
    // Check if they're discussing a specific job
    if (user.jobContext) {
      return {
        job: user.jobContext.title,
        match: calculateMatchPercentage(user, user.jobContext)
      }
    }
    return null
  }
  
  const jobMatch = getJobMatchStatus()
  
  return (
    <div className="user-chip group relative">
      <Link 
        to={getProfileUrl()}
        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img 
          src={user.avatar || '/default-avatar.png'} 
          className="w-8 h-8 rounded-full"
          alt={user.name}
        />
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{user.name}</span>
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
              {user.role}
            </span>
          </div>
          
          {jobMatch && (
            <div className="text-xs text-gray-600">
              Discussing: {jobMatch.job}
              <span className={`ml-2 px-1.5 py-0.5 rounded ${
                jobMatch.match > 70 ? 'bg-green-100 text-green-700' :
                jobMatch.match > 40 ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {jobMatch.match}% match
              </span>
            </div>
          )}
        </div>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
      </Link>
      
      <Tooltip id="user-profile" place="top">
        Click to view full profile
      </Tooltip>
    </div>
  )
}
Mark Task 3.2 [DONE]

PHASE 4: AI ASSISTANT IMPLEMENTATION
Task 4.1: Create CSV-trained Chatbot
Files to create:

backend/app/services/ai_assistant.py

backend/app/routes/ai_assistant.py

backend/training/faq_data.csv

frontend/src/components/AIAssistant.tsx

python
# ai_assistant.py
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
import pickle
from pathlib import Path
import hashlib

class AIAssistant:
    def __init__(self, csv_path='training/faq_data.csv'):
        self.csv_path = csv_path
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.load_or_train()
    
    def load_or_train(self):
        """Load existing model or train new one"""
        cache_file = Path(f'training/cache/{hashlib.md5(open(self.csv_path).read().encode()).hexdigest()}.pkl')
        
        if cache_file.exists():
            with open(cache_file, 'rb') as f:
                self.df, self.index, self.embeddings = pickle.load(f)
        else:
            self.train()
            cache_file.parent.mkdir(exist_ok=True)
            with open(cache_file, 'wb') as f:
                pickle.dump((self.df, self.index, self.embeddings), f)
    
    def train(self):
        """Train on CSV data"""
        self.df = pd.read_csv(self.csv_path)
        
        # Clean data
        self.df['question'] = self.df['question'].str.lower().str.strip()
        self.df['answer'] = self.df['answer'].str.strip()
        self.df['category'] = self.df.get('category', 'general')
        
        # Create embeddings
        questions = self.df['question'].tolist()
        self.embeddings = self.model.encode(questions)
        
        # Build FAISS index
        self.index = faiss.IndexFlatL2(self.embeddings.shape[1])
        self.index.add(self.embeddings.astype('float32'))
    
    def get_answer(self, query, threshold=0.7):
        """Get answer for query"""
        query_embedding = self.model.encode([query.lower().strip()])
        distances, indices = self.index.search(query_embedding.astype('float32'), k=3)
        
        results = []
        for i, idx in enumerate(indices[0]):
            similarity = 1 / (1 + distances[0][i])  # Convert distance to similarity
            if similarity > threshold:
                results.append({
                    'question': self.df.iloc[idx]['question'],
                    'answer': self.df.iloc[idx]['answer'],
                    'category': self.df.iloc[idx]['category'],
                    'similarity': float(similarity),
                    'context': self.get_context(idx)
                })
        
        return results
    
    def get_context(self, idx):
        """Get related questions for context"""
        related = []
        for i in range(max(0, idx-2), min(len(self.df), idx+3)):
            if i != idx:
                related.append({
                    'question': self.df.iloc[i]['question'],
                    'answer_preview': self.df.iloc[i]['answer'][:100] + '...'
                })
        return related

# routes/ai_assistant.py
from flask import Blueprint, request, jsonify, current_app
from ..services.ai_assistant import AIAssistant

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')
assistant = AIAssistant()

@ai_bp.route('/ask', methods=['POST'])
def ask_assistant():
    """Ask the AI assistant a question"""
    data = request.get_json()
    query = data.get('query', '').strip()
    
    if not query:
        return jsonify({'error': 'Query is required'}), 400
    
    try:
        answers = assistant.get_answer(query)
        
        # Log the query for analytics
        current_app.logger.info(f"AI Query: {query} - Found {len(answers)} matches")
        
        return jsonify({
            'query': query,
            'answers': answers,
            'suggested_actions': suggest_actions(query)
        })
    except Exception as e:
        current_app.logger.error(f"AI Assistant error: {str(e)}")
        return jsonify({'error': 'Failed to process query'}), 500

@ai_bp.route('/suggest', methods=['POST'])
def suggest_response():
    """Suggest response based on conversation context"""
    data = request.get_json()
    conversation_history = data.get('history', [])
    
    # Use last few messages to suggest response
    recent = conversation_history[-3:]
    context = ' '.join([msg['content'] for msg in recent])
    
    suggestions = assistant.get_answer(context, threshold=0.5)
    return jsonify({'suggestions': [s['answer'] for s in suggestions[:3]]})
typescript
// AIAssistant.tsx
import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Sparkles, Send, X, MessageSquare } from 'lucide-react'

interface AIAssistantProps {
  conversationContext?: string
  onSuggestionSelect?: (suggestion: string) => void
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  conversationContext,
  onSuggestionSelect
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant'
    content: string
    suggestions?: string[]
  }>>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const askMutation = useMutation({
    mutationFn: async (question: string) => {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: question,
          context: conversationContext 
        })
      })
      return res.json()
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answers[0]?.answer || "I couldn't find an answer to that. Could you rephrase?",
        suggestions: data.suggested_actions
      }])
    }
  })
  
  const suggestMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          history: messages 
        })
      })
      return res.json()
    }
  })
  
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Welcome message
      setMessages([{
        role: 'assistant',
        content: "👋 Hi! I'm your Workforge assistant. I can help with:\n" +
          "• Finding jobs\n" +
          "• Creating profiles\n" +
          "• Messaging tips\n" +
          "• Platform features\n\n" +
          "What would you like to know?"
      }])
    }
  }, [isOpen])
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    
    setMessages(prev => [...prev, { role: 'user', content: query }])
    askMutation.mutate(query)
    setQuery('')
  }
  
  const handleSuggestionClick = (suggestion: string) => {
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion)
    } else {
      setQuery(suggestion)
    }
  }
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
      >
        <Sparkles size={24} />
      </button>
    )
  }
  
  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="text-indigo-600" size={20} />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X size={18} />
        </button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {msg.suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="block w-full text-left text-sm p-2 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
        
        {askMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!query.trim() || askMutation.isPending}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  )
}
Create training data:

csv
# training/faq_data.csv
question,answer,category
how do i create a profile,Click on "Profile" in the top right corner and fill out your information. For workers, add your skills and experience. For employers, add your company details.,profile
how to apply for jobs,Go to the Jobs section, find a job you like, and click "Apply". You can also message the employer directly from the job posting.,jobs
whats the difference between worker and employer accounts,Workers can browse and apply for jobs. Employers can post jobs and manage applications.,account
how to start a conversation,Go to Messages and click "Start new chat". Search for the user you want to message and click on their name.,messaging
can i attach files to messages,Yes! Click the paperclip icon in the message input to attach files. Supported formats: PDF, DOC, DOCX, JPG, PNG up to 10MB.,messaging
how to see who viewed my profile,Go to your profile and click on the "Views" tab. You'll see a list of users who viewed your profile.,profile
what is the AI assistant for,The AI assistant helps answer questions about using the platform, suggests jobs, and can help draft messages.,ai
how to report inappropriate messages,Click the three dots next to the message and select "Report". Our team will review it within 24 hours.,safety
can i message anyone,Yes! All users (workers, employers, admins) can message each other freely. It's designed to help networking and job opportunities.,messaging
how to delete a message,Click the three dots on your message and select "Delete". You can only delete your own messages.,messaging
Mark Task 4.1 [DONE]

PHASE 5: PRODUCTION DEPLOYMENT
Task 5.1: Dockerize with Redis
Create Docker configuration:

yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: workforge
      POSTGRES_USER: workforge
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U workforge"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://workforge:${DB_PASSWORD}@postgres:5432/workforge
      REDIS_URL: redis://redis:6379/0
      SECRET_KEY: ${SECRET_KEY}
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app
    command: >
      sh -c "alembic upgrade head &&
             python -m gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:5000 app:app"

  frontend:
    build: 
      context: ./frontend
      args:
        VITE_API_URL: ${VITE_API_URL}
        VITE_WS_URL: ${VITE_WS_URL}
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "--bind", "0.0.0.0:5000", "app:app"]
dockerfile
# frontend/Dockerfile
FROM node:18 AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
Mark Task 5.1 [DONE]

Task 5.2: Add CDN for Attachments
javascript
// frontend/src/services/upload.service.ts
export class UploadService {
  private static instance: UploadService
  private uploadQueue: Map<string, Promise<string>> = new Map()
  
  static getInstance(): UploadService {
    if (!UploadService.instance) {
      UploadService.instance = new UploadService()
    }
    return UploadService.instance
  }
  
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<string> {
    const fileId = `${file.name}-${file.size}-${file.lastModified}`
    
    // Check if already uploading
    if (this.uploadQueue.has(fileId)) {
      return this.uploadQueue.get(fileId)!
    }
    
    const uploadPromise = this.performUpload(file, onProgress)
    this.uploadQueue.set(fileId, uploadPromise)
    
    try {
      const result = await uploadPromise
      return result
    } finally {
      this.uploadQueue.delete(fileId)
    }
  }
  
  private async performUpload(file: File, onProgress?: (progress: number) => void): Promise<string> {
    // Get signed URL
    const { url, fields } = await this.getSignedUploadUrl(file.name, file.type)
    
    // Create form data
    const formData = new FormData()
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value as string)
    })
    formData.append('file', file)
    
    // Upload with progress
    const xhr = new XMLHttpRequest()
    
    const uploadPromise = new Promise<string>((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress((e.loaded / e.total) * 100)
        }
      })
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 204) {
          // Success - construct CDN URL
          const cdnUrl = `${process.env.VITE_CDN_URL}/${fields.key}`
          resolve(cdnUrl)
        } else {
          reject(new Error('Upload failed'))
        }
      })
      
      xhr.addEventListener('error', () => reject(new Error('Upload failed')))
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))
    })
    
    xhr.open('POST', url)
    xhr.send(formData)
    
    return uploadPromise
  }
  
  private async getSignedUploadUrl(fileName: string, fileType: string) {
    const response = await fetch('/api/uploads/signed-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, fileType })
    })
    return response.json()
  }
}
Mark Task 5.2 [DONE]

FINAL VALIDATION
Run All Tests
bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
cd frontend
npm test -- --coverage

# E2E tests
npm run test:e2e

# Load testing
artillery run load-tests/messaging.yml
Performance Checklist
Messages load in < 200ms

WebSocket connects in < 500ms

No re-renders on unrelated state changes

Virtualized list handles 10k+ messages

AI assistant responds in < 1s

File uploads with CDN < 5s for 10MB

Redis properly caches sessions

Database queries optimized (< 50ms)

COMPLETION REQUIREMENTS
Mark the final task [DONE] only when:

All 11 original pain points are resolved

All tests pass

Performance metrics meet targets

AI assistant correctly answers from CSV

Real-time features work like WhatsApp

EXECUTION INSTRUCTIONS
Execute tasks in order

Show progress after each task

If a task fails, fix and retry

Do NOT proceed until current task is [DONE]

Update MESSAGING_OVERHAUL_PROGRESS.md with status

After each task, run tests

FINAL COMMAND
Begin execution now. Show progress after Task 1.1.