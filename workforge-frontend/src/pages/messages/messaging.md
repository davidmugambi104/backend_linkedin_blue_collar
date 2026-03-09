# Workforge Messaging Platform (Full Implementation Guide)

This document explains the **actual messaging platform currently implemented** in this repository (frontend + backend), including each component, state flow, APIs, and socket events.

---

## 1) Functional Scope

Current platform capabilities:

- Universal direct messaging: **admin, employer, worker can message each other**.
- Inbox conversation list with:
    - unread counts,
    - last message preview,
    - role/profile display,
    - search.
- New chat initiation via recipient picker (`Start chat with...`).
- Conversation view with:
    - message timeline,
    - typing indicator,
    - send message (text + attachments payload support),
    - reaction and delete actions.
- Unread polling + page title badge updates.
- Error boundary around messages UI with dev diagnostics.

---

## 2) High-Level Architecture

### Frontend layers

1. **Route/View Layer**
     - Messages page entry: `InboxPage`.
2. **Component Layer**
     - Conversation list, conversation item, chat window, message bubble/input, empty/error states.
3. **Hook Layer**
     - `useConversations`, `useMessages`, `useWebSocket`.
4. **State Layer**
     - Zustand `messageStore` (persisted).
5. **Service Layer**
     - REST: `message.service.ts`.
     - Realtime: `ws-message.service.ts`.

### Backend layers

1. **REST routes** (`/api/messages/*`) in Flask blueprint.
2. **Schemas** (Marshmallow validation).
3. **Model** (`Message`) persisted via SQLAlchemy.
4. **Socket.IO handlers** for realtime events.

---

## 3) Frontend: Routing and Entry

### Route registration

- In app router, `/messages` is mounted as a shared authenticated route.
- Lazy module `messages.routes.tsx` also exists with `MessagesInbox` lazy import pattern.

### Entry component: `InboxPage`

File: `src/pages/messages/Inbox/Inbox.tsx`

Responsibilities:

- Detect layout mode with `useMediaQuery('(min-width: 1024px)')`.
- Read messaging state from `useConversations()`.
- Poll unread count every 30s (skips hidden tabs, prevents overlap, limits timeout noise).
- Resolve current active conversation by selected other user ID.
- Toggle mobile `showChat` state.
- Provide `handleNewMessage()` to reset active conversation and return to recipient picker.
- Wrap UI in `MessagesErrorBoundary`.

Desktop behavior:

- Left pane: `ConversationList`.
- Right pane: either `ChatWindow` (active conversation) or `EmptyState`.

Mobile behavior:

- Shows list first.
- Opens `ChatWindow` after conversation selection.
- Back button returns to list.

---

## 4) Frontend: All Inbox Components (Full)

### 4.1 `ConversationList`

File: `src/pages/messages/Inbox/components/ConversationList.tsx`

What it does:

- Uses `useConversations()` for conversation data and selection.
- Uses React Query + `messageService.getMessageableUsers()` to fetch all users available for new chat.
- Provides a **recipient dropdown + Chat button** to start a new conversation.
- Provides text search over existing conversations.
- Renders loading skeletons while conversations load.
- Renders `ConversationItem` rows for filtered conversations.

Selection model:

- Uses **other user ID** as active key (`selectConversation(otherUserId, otherUserId)`) to support existing + new chats consistently.

### 4.2 `ConversationItem`

File: `src/pages/messages/Inbox/components/ConversationItem.tsx`

What it does:

- Displays avatar, user/company name, role label, message preview, relative timestamp, unread badge.
- Resolves role-aware display:
    - worker => `profile.full_name`
    - employer => `profile.company_name`
- Includes null-safe fallbacks for missing `other_user` data.
- Guards date parsing to avoid `Invalid time value` crash.

### 4.3 `ChatWindow`

File: `src/pages/messages/Inbox/components/ChatWindow.tsx`

What it does:

- Uses `useMessages(conversationId, otherUserId)`.
- Renders header with online/offline indicator.
- Supports mobile back button.
- Supports `New Message` action (clears active conversation via parent callback).
- Auto-scrolls to bottom on new messages or typing updates.
- Renders message timeline using `MessageBubble`.
- Renders typing indicator + input composer.

### 4.4 `MessageBubble`

File: `src/pages/messages/Inbox/components/MessageBubble.tsx`

What it does:

- Renders sender/receiver bubble styles.
- Shows sender avatar and name for non-own messages.
- Shows timestamp and read/sent status for own messages.
- Supports attachments display links.
- Supports reactions (add/remove).
- Supports delete action via dropdown.

Notes:

- Uses `useMessages` inside each bubble to access reaction/delete actions.

### 4.5 `MessageInput`

File: `src/pages/messages/Inbox/components/MessageInput.tsx`

What it does:

- Controlled text area with auto-resize.
- Enter-to-send (Shift+Enter for newline).
- Attachment selection and preview chips.
- Calls `onTyping(true/false)` with timeout-based typing-stop.
- Calls `onSendMessage(content, attachments)` and resets local UI state after send.

### 4.6 `TypingIndicator`

File: `src/pages/messages/Inbox/components/TypingIndicator.tsx`

- Simple animated three-dot typing UI.

### 4.7 `EmptyState`

File: `src/pages/messages/Inbox/components/EmptyState.tsx`

- Generic empty-panel used for:
    - no conversations,
    - no selected conversation.

### 4.8 `MessagesErrorBoundary`

File: `src/pages/messages/Inbox/components/MessagesErrorBoundary.tsx`

What it does:

- Catches runtime rendering errors in messages subtree.
- Shows safe fallback UI + `Try Again`.
- In development only, shows:
    - error name/message,
    - component stack.

---

## 5) Frontend Hooks (Behavior and Data Flow)

### 5.1 `useConversations`

File: `src/hooks/useConversations.ts`

Responsibilities:

- Fetch conversations (`React Query`, key `['conversations']`).
- Push fetched conversations into Zustand store via `setConversations`.
- Fetch full message history for a selected conversation (`getConversation(otherUserId)`).
- Mark conversation as read via REST + reset unread count in store.
- Expose:
    - `conversations`
    - `activeConversationId`
    - `selectConversation`
    - `clearActiveConversation`
    - `refreshConversations`

### 5.2 `useMessages`

File: `src/hooks/useMessages.ts`

Responsibilities:

- Build per-conversation message context.
- Read messages and typing users from Zustand maps.
- Subscribe to websocket helpers via `useWebSocket`.
- Mark unread messages as read when active conversation has unread items.
- Send message:
    - realtime path if connected and no attachments,
    - REST fallback path otherwise.
- Expose message mutation actions:
    - `deleteMessage`, `addReaction`, `removeReaction`.

Stability fix implemented:

- Uses shared constants `EMPTY_MESSAGES` / `EMPTY_TYPING_USERS` to avoid selector snapshot churn.

### 5.3 `useWebSocket`

File: `src/hooks/useWebSocket.ts`

Responsibilities:

- Connect/disconnect socket based on auth token + user.
- Track connection status from `wsMessageService.connectionStatus$`.
- Join/leave conversation rooms.
- Subscribe to message and typing streams from socket service.
- Expose socket actions:
    - `sendMessage`
    - `sendTyping`
    - `sendReadReceipt`
    - `markAsRead`

---

## 6) Frontend State Store (Zustand)

File: `src/store/message.store.ts`

Store shape:

- `conversations: Map<number, Conversation>`
- `messages: Map<number, Message[]>`
- `typingUsers: Map<number, TypingIndicator[]>`
- `onlineUsers: Set<number>`
- `activeConversationId: string | null`
- `unreadCounts: Map<number, number>`
- `isLoading`, `error`

Core actions:

- conversation lifecycle: `setConversations`, `updateConversation`
- messages lifecycle: `addMessage`, `addMessages`, `updateMessage`, `deleteMessage`
- read status: `markMessageAsRead`, `markAllAsRead`, `resetUnreadCount`
- typing/presence: `setTyping`, `setUserOnline`
- selection: `setActiveConversation`

Persistence:

- Persists selected store segments under key `workforge-messages`.

---

## 7) Frontend Service Layer

### 7.1 REST service

File: `src/services/message.service.ts`

Methods:

- `getConversations()`
- `getConversation(otherUserId)`
- `sendMessage({receiver_id, content, attachments})`
- `markAsRead(otherUserId)`
- `getUnreadCount()` (8s timeout)
- `getMessageableUsers()` (8s timeout)
- attachments/reactions helpers.

Normalization layer:

- `normalizeDate` converts invalid/null date to `''`.
- `normalizeMessage` and `normalizeConversation` sanitize incoming payloads.
- Prevents UI crashes from malformed timestamps or legacy shapes.

### 7.2 WebSocket service

File: `src/services/ws-message.service.ts`

Core behavior:

- Uses Socket.IO client.
- Exposes reactive streams via RxJS Subjects (`messages$`, `typing$`, `readReceipts$`, `presence$`, `connectionStatus$`).
- Supports event emitters for message, typing, read receipts, join/leave room.
- Uses heartbeat ping.
- Queues outgoing messages when disconnected.

Stability improvements:

- Prevents duplicate connect attempts when socket instance already exists.
- Uses transports `['websocket', 'polling']` for fallback.

---

## 8) Frontend API Endpoint Contract

From `src/config/endpoints.ts`:

- `GET /messages/conversations`
- `GET /messages/conversations/:userId`
- `PUT /messages/conversations/:userId/mark-read`
- `GET /messages/users`
- `POST /messages/send`
- `GET /messages/unread/count`

---

## 9) Backend REST API (Messaging Blueprint)

File: `backend/app/routes/messages.py`

### `GET /api/messages/conversations`

- Returns all conversations for current user.
- Builds `other_user` profile (worker/employer role-aware).
- Returns structured `last_message` object + ISO `last_message_time`.
- Returns `unread_count` per conversation.

### `GET /api/messages/conversations/<other_user_id>`

- Returns full message history for pair.
- Marks incoming unread messages as read.

### `POST /api/messages/send`

- Validates payload via `MessageCreateSchema`.
- Rejects self-message.
- Creates message with deterministic conversation ID.

### `PUT /api/messages/conversations/<other_user_id>/mark-read`

- Bulk updates unread messages for conversation.

### `GET /api/messages/unread/count`

- Returns global unread counter for current user.

### `GET /api/messages/users`

- Returns all active users except current user.
- Includes role/profile fields.
- Enables universal “start new chat” UI.

---

## 10) Backend Validation and Model

### Schema

File: `backend/app/schemas/message_schema.py`

- `receiver_id` required and validated against `User` existence.
- `content` required, length min 1 / max 5000.

### Model

File: `backend/app/models/message.py`

- Columns: `id`, `conversation_id`, `sender_id`, `receiver_id`, `content`, `is_read`, `created_at`.
- `conversation_id` format: `minUserId-maxUserId`.
- `to_dict()` returns API-ready payload.

---

## 11) Backend Socket Layer (Realtime)

Primary file: `backend/app/sockets/messaging.py`

Supports:

- connect/disconnect/authenticate
- send message realtime (`send_message` -> `receive_message` / `new_message`)
- join/leave conversation room
- typing events (`typing_start`, `typing_stop`)
- read events (`mark_read`, emits `messages_read`)
- presence events (`user_online`, `user_offline`, presence query)

Key note:

- There is also `backend/app/sockets/chat.py` with overlapping handlers. `messaging.py` is the advanced universal implementation. Keep one canonical handler active to avoid event drift.

---

## 12) Full Runtime Flow

### A) Opening inbox

1. `InboxPage` mounts.
2. `useConversations` fetches `/messages/conversations`.
3. Store conversations map is populated.
4. List renders conversation rows.
5. Unread polling updates page title.

### B) Starting a new chat

1. `ConversationList` loads `/messages/users`.
2. User selects recipient from dropdown.
3. `selectConversation(recipientId, recipientId)` sets active target.
4. `ChatWindow` opens and message history fetched by `otherUserId`.

### C) Sending message

1. `MessageInput` calls `useMessages.sendMessage`.
2. If socket connected and no attachments: send via websocket.
3. Else send via REST `/messages/send`.
4. Store updates message list + conversation preview.

### D) Read/unread updates

1. Active conversation effect marks unread messages read (socket + REST mark-read endpoint).
2. Store unread counters reset.
3. Unread count polling updates document title badge.

---

## 13) Reliability and Safety Features

- Null-safe user/profile handling in conversation rendering.
- Safe timestamp parsing to avoid date-fns crashes.
- Request overlap guard + hidden-tab skip for unread polling.
- WebSocket duplicate-connect guard and transport fallback.
- Message UI Error Boundary with retry and dev diagnostics.

---

## 14) Known Technical Notes

- Some Redis warnings can appear; app falls back for limiter storage.
- Socket.IO endpoint depends on backend process health and single-process port ownership.
- `MessageBubble` uses `useMessages` per bubble; functional but can be optimized later by lifting mutation callbacks.
- `messageStore.setActiveConversation` parses string IDs as numbers for `markAllAsRead`; current user-id keyed selection works with existing flow but should stay consistent across future refactors.

---

## 15) File Index (Messaging Platform)

Frontend core:

- `src/pages/messages/Inbox/Inbox.tsx`
- `src/pages/messages/Inbox/components/ConversationList.tsx`
- `src/pages/messages/Inbox/components/ConversationItem.tsx`
- `src/pages/messages/Inbox/components/ChatWindow.tsx`
- `src/pages/messages/Inbox/components/MessageBubble.tsx`
- `src/pages/messages/Inbox/components/MessageInput.tsx`
- `src/pages/messages/Inbox/components/TypingIndicator.tsx`
- `src/pages/messages/Inbox/components/EmptyState.tsx`
- `src/pages/messages/Inbox/components/MessagesErrorBoundary.tsx`
- `src/hooks/useConversations.ts`
- `src/hooks/useMessages.ts`
- `src/hooks/useWebSocket.ts`
- `src/store/message.store.ts`
- `src/services/message.service.ts`
- `src/services/ws-message.service.ts`
- `src/types/models/message.types.ts`
- `src/config/endpoints.ts`

Backend core:

- `backend/app/routes/messages.py`
- `backend/app/schemas/message_schema.py`
- `backend/app/models/message.py`
- `backend/app/sockets/messaging.py`
- `backend/app/sockets/chat.py`

---

## 16) Summary

Your messaging platform is now a **universal, role-agnostic direct messaging system** with:

- full REST + Socket.IO pathways,
- modern inbox/chat UX,
- conversation bootstrap to any active user,
- unread/read/typing/presence mechanics,
- and runtime hardening for common API/socket/render failures.