# WhatsApp-Style Chat Feature

## Overview
Converted the general chat room to a WhatsApp-style private messaging system where users can see all registered users and send private messages to specific users.

## Features Implemented

### Frontend (`frontend/pages/chat.tsx`)
1. **User List Sidebar**
   - Shows all registered users with avatars (first letter of username)
   - Search functionality to filter users
   - Display count of registered users
   - Click a user to start chatting with them

2. **WhatsApp-Style UI**
   - Two-pane layout (400px sidebar + flex chat area)
   - Dark theme matching WhatsApp colors (#111b21, #202c33, #00a884)
   - Message bubbles:
     - Your messages: Green (#005c4b) aligned right
     - Their messages: Dark gray (#202c33) aligned left
   - Timestamps on each message
   - Empty state when no user is selected

3. **Real-Time Messaging**
   - Messages sent only between selected users (private)
   - Socket.IO connection with JWT authentication
   - Auto-scroll to latest message
   - Connection status indicator

### Backend Changes

#### 1. Database Schema (`backend/prisma/schema.prisma`)
```prisma
model Message {
  id          Int      @id @default(autoincrement())
  content     String
  createdAt   DateTime @default(now())
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
  recipientId Int?     // NEW: Stores who the message is for
}
```

#### 2. API Endpoints

##### GET `/auth/users`
Returns all registered users (for the user list sidebar)
```json
{
  "users": [
    {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

##### GET `/messages/:userId?currentUserId=X`
Returns all messages between two users (conversation history)
```json
{
  "messages": [
    {
      "id": 1,
      "content": "Hello!",
      "userId": 1,
      "recipientId": 2,
      "createdAt": "2025-01-15T10:35:00.000Z",
      "user": {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

#### 3. Socket.IO Updates (`backend/src/index.ts`)

##### Event: `send_message`
Now accepts `recipientId` parameter:
```typescript
socket.emit('send_message', {
  content: "Hello!",
  recipientId: 2, // User ID to send message to
  token: "jwt_token_here"
});
```

**Behavior:**
- If `recipientId` is provided: Message is sent only to sender and recipient
- If `recipientId` is null/undefined: Message is broadcast to all (backward compatible)

##### Event: `receive_message`
Clients receive messages only if they are the sender or recipient:
```typescript
socket.on('receive_message', (message) => {
  // Message will only arrive if you're involved in the conversation
  console.log(message);
});
```

## Migration Applied
```bash
npx prisma migrate dev --name add_recipient_to_message
```

This created the migration file:
`backend/prisma/migrations/20251015131433_add_recipient_to_message/migration.sql`

## Testing the Feature

### 1. Register Multiple Users
- Open the app in different browsers or incognito windows
- Register at least 2 users (e.g., Alice and Bob)

### 2. Test Private Messaging
1. Login as Alice in Browser 1
2. Login as Bob in Browser 2
3. In Alice's chat, click on Bob's name in the sidebar
4. Send a message from Alice to Bob
5. Verify Bob receives the message in Browser 2
6. Send a reply from Bob
7. Verify Alice receives the reply

### 3. Verify Privacy
- Login as a third user (Charlie) in Browser 3
- Charlie should NOT see messages between Alice and Bob
- Charlie can only see messages in conversations where Charlie is involved

## How It Works

### Message Flow
1. User selects a recipient from the sidebar
2. User types a message and clicks send
3. Frontend sends Socket.IO event with `recipientId`
4. Backend creates message with `recipientId` in database
5. Backend emits message ONLY to:
   - All sockets of the sender
   - All sockets of the recipient
6. Recipients' clients receive and display the message

### Data Fetching
- On page load: Fetch all users from `/auth/users`
- On user selection: Fetch conversation history from `/messages/:userId`
- On new message: Update UI immediately + send via Socket.IO

## UI Colors (WhatsApp Theme)
- Background: `#0b141a`
- Sidebar: `#111b21`
- Chat header: `#202c33`
- Message bubbles (sent): `#005c4b` (green)
- Message bubbles (received): `#202c33` (dark gray)
- Accent color: `#00a884` (WhatsApp green)
- Text colors: Various shades of gray for hierarchy

## Known Limitations
1. No typing indicators yet
2. No read receipts
3. No message delivery status
4. No file/image sharing
5. No group chats (only 1-on-1)

## Future Enhancements
- [ ] Typing indicators ("Alice is typing...")
- [ ] Read receipts (blue checkmarks)
- [ ] Message delivery status (single/double gray check)
- [ ] File and image sharing
- [ ] Group chat support
- [ ] Last seen / online status
- [ ] Message reactions
- [ ] Reply to specific messages
- [ ] Delete messages
- [ ] Edit sent messages
