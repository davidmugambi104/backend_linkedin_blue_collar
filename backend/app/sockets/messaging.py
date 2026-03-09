# ----- FILE: backend/app/sockets/messaging.py -----
"""
Advanced Universal Messaging Handler
Allows ALL users (Admin, Employer, Worker) to message each other
- Cross-role messaging enabled
- Admin accessible to all users
- Real-time WebSocket delivery
- Redis Pub/Sub for scalability
"""
from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_socketio import emit, join_room, leave_room, rooms
from datetime import datetime
import json
import uuid
from ..extensions import socketio, db, redis_client
from ..models import User, Message

# Active connections - maps user_id to session_id
active_connections = {}
user_presence = {}


def generate_conversation_id(user1_id, user2_id):
    """Generate a consistent conversation ID for any two users."""
    # Sort IDs to ensure same conversation regardless of who initiates
    return f"{min(user1_id, user2_id)}-{max(user1_id, user2_id)}"


def get_user_display_info(user):
    """Get display info for a user."""
    if not user:
        return {"id": None, "name": "Unknown", "role": "unknown"}
    
    name = getattr(user, 'full_name', None) or getattr(user, 'username', 'Unknown')
    role = getattr(user, 'role', 'user').lower()
    
    return {
        "id": user.id,
        "name": name,
        "role": role,
        "email": getattr(user, 'email', '')
    }


# ==================== CONNECTION HANDLERS ====================

@socketio.on("connect")
@jwt_required(optional=True)
def handle_connect():
    """Handle client connection."""
    emit("connected", {
        "message": "Connected to WorkForge Messenger",
        "timestamp": datetime.utcnow().isoformat()
    })
    print(f"Client connected: {request.sid}")


@socketio.on("disconnect")
def handle_disconnect():
    """Handle client disconnection."""
    user_id = None
    for uid, sid in active_connections.items():
        if sid == request.sid:
            user_id = uid
            break
    
    if user_id:
        # Update presence
        user_presence[user_id] = {
            "status": "offline",
            "last_seen": datetime.utcnow().isoformat()
        }
        
        # Store in Redis
        if redis_client:
            redis_client.set(f"presence:{user_id}", json.dumps({
                "status": "offline",
                "last_seen": datetime.utcnow().isoformat()
            }), ex=3600)
        
        # Broadcast offline status
        emit("user_offline", {"user_id": user_id}, broadcast=True)
        del active_connections[user_id]
    
    print(f"Client disconnected: {request.sid}")


@socketio.on("authenticate")
def handle_authenticate(data):
    """Authenticate any user (Admin, Employer, Worker)."""
    user_id = data.get("user_id")
    
    if not user_id:
        emit("auth_error", {"error": "User ID required"})
        return
    
    user = User.query.get(user_id)
    if not user:
        emit("auth_error", {"error": "User not found"})
        return
    
    # Store connection
    active_connections[user_id] = request.sid
    
    # Join personal room
    join_room(f"user_{user_id}")
    
    # Update presence
    user_presence[user_id] = {
        "status": "online",
        "last_seen": datetime.utcnow().isoformat()
    }
    
    if redis_client:
        redis_client.set(f"presence:{user_id}", json.dumps({
            "status": "online",
            "last_seen": datetime.utcnow().isoformat()
        }), ex=3600)
    
    # Get user info
    user_info = get_user_display_info(user)
    
    # Send auth success with user info
    emit("authenticated", {
        "message": "Welcome to WorkForge Messenger",
        "user_id": user_id,
        "user_info": user_info,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # Broadcast online status
    emit("user_online", {"user_id": user_id, "role": user_info["role"]}, broadcast=True)
    
    # Send unread count
    unread_count = Message.query.filter_by(receiver_id=user_id, is_read=False).count()
    emit("unread_count", {"count": unread_count})
    
    print(f"User {user_id} ({user_info['role']}) authenticated")


# ==================== CROSS-ROLE MESSAGING ====================

@socketio.on("send_message")
def handle_send_message(data):
    """Send message to ANY user - no restrictions based on role."""
    sender_id = data.get("sender_id")
    receiver_id = data.get("receiver_id")
    content = data.get("content")
    
    if not sender_id or not receiver_id or not content:
        emit("message_error", {"error": "Missing sender_id, receiver_id, or content"})
        return
    
    # Validate both users exist
    sender = User.query.get(sender_id)
    receiver = User.query.get(receiver_id)
    
    if not sender or not receiver:
        emit("message_error", {"error": "Invalid user(s)"})
        return
    
    # Generate conversation ID
    conversation_id = generate_conversation_id(sender_id, receiver_id)
    
    # Create message
    message = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        receiver_id=receiver_id,
        content=content
    )
    
    db.session.add(message)
    db.session.commit()
    
    sender_info = get_user_display_info(sender)
    receiver_info = get_user_display_info(receiver)
    
    message_data = {
        "id": message.id,
        "conversation_id": conversation_id,
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "sender_info": sender_info,
        "receiver_info": receiver_info,
        "content": content,
        "is_read": False,
        "status": "sent",
        "created_at": message.created_at.isoformat() if message.created_at else None
    }
    
    # Emit to conversation room
    emit("receive_message", message_data, room=conversation_id)
    
    # Send delivery confirmation
    emit("message_delivered", {
        "message_id": message.id,
        "status": "delivered",
        "timestamp": datetime.utcnow().isoformat()
    }, room=request.sid)
    
    # If receiver is online, send real-time
    if receiver_id in active_connections:
        emit("new_message", message_data, room=f"user_{receiver_id}")
    
    # Update unread count
    unread_count = Message.query.filter_by(receiver_id=receiver_id, is_read=False).count()
    emit("unread_count", {"count": unread_count}, room=f"user_{receiver_id}")
    
    print(f"Message: {sender_info['name']} ({sender_info['role']}) -> {receiver_info['name']} ({receiver_info['role']})")


# ==================== CONVERSATIONS ====================

@socketio.on("get_conversations")
def handle_get_conversations(data):
    """Get all conversations for a user."""
    user_id = data.get("user_id")
    
    if not user_id:
        return
    
    # Get all unique conversations
    messages = Message.query.filter(
        (Message.sender_id == user_id) | (Message.receiver_id == user_id)
    ).order_by(Message.created_at.desc()).all()
    
    # Group by conversation
    conversations = {}
    for msg in messages:
        other_id = msg.receiver_id if msg.sender_id == user_id else msg.sender_id
        if other_id not in conversations:
            other_user = User.query.get(other_id)
            if other_user:
                other_info = get_user_display_info(other_user)
                last_message = msg
                unread = Message.query.filter(
                    Message.conversation_id == msg.conversation_id,
                    Message.receiver_id == user_id,
                    Message.is_read == False
                ).count()
                
                conversations[other_id] = {
                    "participant": other_info,
                    "last_message": last_message.to_dict(),
                    "unread_count": unread,
                    "conversation_id": msg.conversation_id
                }
    
    emit("conversations_list", {"conversations": list(conversations.values())})


@socketio.on("get_messages")
def handle_get_messages(data):
    """Get messages in a conversation."""
    conversation_id = data.get("conversation_id")
    user_id = data.get("user_id")
    limit = data.get("limit", 50)
    offset = data.get("offset", 0)
    
    if not conversation_id:
        return
    
    messages = Message.query.filter_by(
        conversation_id=conversation_id
    ).order_by(Message.created_at.desc()).limit(limit).offset(offset).all()
    
    # Mark as read if user is receiver
    if user_id:
        Message.query.filter(
            Message.conversation_id == conversation_id,
            Message.receiver_id == user_id,
            Message.is_read == False
        ).update({"is_read": True})
        db.session.commit()
    
    emit("messages_history", {
        "conversation_id": conversation_id,
        "messages": [msg.to_dict() for msg in reversed(messages)]
    })


# ==================== TYPING INDICATORS ====================

@socketio.on("typing_start")
def handle_typing_start(data):
    """Broadcast typing indicator."""
    conversation_id = data.get("conversation_id")
    user_id = data.get("user_id")
    user_name = data.get("user_name", "User")
    
    if conversation_id and user_id:
        emit("user_typing", {
            "conversation_id": conversation_id,
            "user_id": user_id,
            "user_name": user_name,
            "is_typing": True
        }, room=conversation_id)


@socketio.on("typing_stop")
def handle_typing_stop(data):
    """Broadcast stop typing."""
    conversation_id = data.get("conversation_id")
    user_id = data.get("user_id")
    
    if conversation_id and user_id:
        emit("user_typing", {
            "conversation_id": conversation_id,
            "user_id": user_id,
            "is_typing": False
        }, room=conversation_id)


# ==================== READ RECEIPTS ====================

@socketio.on("mark_read")
def handle_mark_read(data):
    """Mark messages as read."""
    conversation_id = data.get("conversation_id")
    user_id = data.get("user_id")
    sender_id = data.get("sender_id")  # Who sent the messages
    
    if not conversation_id or not user_id:
        return
    
    # Mark as read
    Message.query.filter(
        Message.conversation_id == conversation_id,
        Message.receiver_id == user_id,
        Message.is_read == False
    ).update({"is_read": True})
    db.session.commit()
    
    # Notify sender
    if sender_id and sender_id in active_connections:
        emit("messages_read", {
            "conversation_id": conversation_id,
            "reader_id": user_id,
            "read_at": datetime.utcnow().isoformat()
        }, room=f"user_{sender_id}")
    
    # Update unread count
    unread_count = Message.query.filter_by(receiver_id=user_id, is_read=False).count()
    emit("unread_count", {"count": unread_count}, room=f"user_{user_id}")
    emit(
        "unread_update",
        {
            "user_id": user_id,
            "total": unread_count,
            "conversation": conversation_id,
        },
        room=f"user_{user_id}",
    )


# ==================== PRESENCE ====================

@socketio.on("get_presence")
def handle_get_presence(data):
    """Get presence of users."""
    user_ids = data.get("user_ids", [])
    
    presence_data = {}
    for uid in user_ids:
        if redis_client:
            cached = redis_client.get(f"presence:{uid}")
            presence_data[uid] = json.loads(cached) if cached else {"status": "offline"}
        else:
            presence_data[uid] = user_presence.get(uid, {"status": "offline"})
    
    emit("presence_data", presence_data)


@socketio.on("get_all_online_users")
def handle_get_all_online():
    """Get all currently online users."""
    online_users = []
    for uid in active_connections.keys():
        user = User.query.get(uid)
        if user:
            online_users.append(get_user_display_info(user))
    
    emit("online_users", {"users": online_users})


# ==================== ROOM MANAGEMENT ====================

@socketio.on("join_conversation")
def handle_join_conversation(data):
    """Join a conversation room."""
    conversation_id = data.get("conversation_id")
    if conversation_id:
        join_room(conversation_id)
        emit("joined", {"conversation_id": conversation_id})


@socketio.on("leave_conversation")
def handle_leave_conversation(data):
    """Leave a conversation room."""
    conversation_id = data.get("conversation_id")
    if conversation_id:
        leave_room(conversation_id)
        emit("left", {"conversation_id": conversation_id})


# ==================== ADMIN FUNCTIONS ====================

@socketio.on("admin_broadcast")
def handle_admin_broadcast(data):
    """Admin broadcast to all users."""
    sender_id = data.get(" cansender_id")
    content = data.get("content")
    
    # Verify sender is admin
    sender = User.query.get(sender_id)
    if not sender or getattr(sender, 'role', '') != 'admin':
        emit("error", {"error": "Admin only"})
        return
    
    # Broadcast to all online users
    emit("admin_message", {
        "content": content,
        "from": "Admin",
        "timestamp": datetime.utcnow().isoformat()
    }, broadcast=True)


# ==================== HEARTBEAT ====================

@socketio.on("ping")
def handle_ping(data):
    """Heartbeat response."""
    emit("pong", {"timestamp": datetime.utcnow().isoformat()})


def register_messaging_events():
    """Register all events (done via decorators)."""
    pass
