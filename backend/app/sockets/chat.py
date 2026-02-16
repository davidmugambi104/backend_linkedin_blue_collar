# ----- FILE: backend/app/sockets/chat.py -----
from flask import request
from flask_jwt_extended import jwt_required
from flask_socketio import emit, join_room, leave_room
from ..extensions import socketio, db
from ..models import User, Message

# Store active users (in production, use Redis or database)
active_users = {}


def generate_conversation_id(user1_id, user2_id):
    """Generate a consistent conversation ID for two users."""
    return f"{min(user1_id, user2_id)}-{max(user1_id, user2_id)}"


@socketio.on("connect")
@jwt_required(optional=True)  # We'll handle authentication manually in the event
def handle_connect():
    """Handle client connection."""
    # Note: Socket.IO doesn't automatically pass JWT, so we'll use query parameters or events
    # For now, we'll require the client to send an 'authenticate' event after connecting
    emit("connected", {"message": "Connected to chat server"})


@socketio.on("authenticate")
def handle_authentication(data):
    """Authenticate a user for Socket.IO connection."""
    token = data.get("token")
    if not token:
        emit("authentication_failed", {"error": "No token provided"})
        return

    # In a real implementation, we would validate the JWT token here
    # For simplicity, we'll assume the client sends the user_id after validation
    user_id = data.get("user_id")
    if not user_id:
        emit("authentication_failed", {"error": "Invalid token"})
        return

    # Store the user as active
    active_users[user_id] = request.sid
    join_room(user_id)  # Join a room named after the user_id for direct messages

    emit("authenticated", {"message": "Authenticated successfully"})

    # Notify the user of any unread messages
    unread_count = Message.query.filter_by(receiver_id=user_id, is_read=False).count()
    if unread_count > 0:
        emit("unread_count", {"count": unread_count})


@socketio.on("disconnect")
def handle_disconnect():
    """Handle client disconnect."""
    # Remove the user from active users
    user_id = None
    for uid, sid in active_users.items():
        if sid == request.sid:
            user_id = uid
            break

    if user_id:
        del active_users[user_id]


@socketio.on("join_conversation")
def handle_join_conversation(data):
    """Join a conversation room."""
    other_user_id = data.get("other_user_id")
    current_user_id = data.get("user_id")  # Assuming the client sends the user_id

    if not current_user_id or not other_user_id:
        emit("error", {"error": "Missing user IDs"})
        return

    conversation_id = generate_conversation_id(current_user_id, other_user_id)
    join_room(conversation_id)
    emit("joined_conversation", {"conversation_id": conversation_id})


@socketio.on("leave_conversation")
def handle_leave_conversation(data):
    """Leave a conversation room."""
    other_user_id = data.get("other_user_id")
    current_user_id = data.get("user_id")

    if not current_user_id or not other_user_id:
        emit("error", {"error": "Missing user IDs"})
        return

    conversation_id = generate_conversation_id(current_user_id, other_user_id)
    leave_room(conversation_id)
    emit("left_conversation", {"conversation_id": conversation_id})


@socketio.on("send_message")
def handle_send_message(data):
    """Handle sending a message."""
    sender_id = data.get("sender_id")
    receiver_id = data.get("receiver_id")
    content = data.get("content")

    if not sender_id or not receiver_id or not content:
        emit("error", {"error": "Missing required fields"})
        return

    # Check if both users exist
    sender = User.query.get(sender_id)
    receiver = User.query.get(receiver_id)

    if not sender or not receiver:
        emit("error", {"error": "Invalid user(s)"})
        return

    # Generate conversation ID
    conversation_id = generate_conversation_id(sender_id, receiver_id)

    # Create and save the message
    message = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        receiver_id=receiver_id,
        content=content,
    )

    db.session.add(message)
    db.session.commit()

    # Prepare the message data for emission
    message_data = {
        "id": message.id,
        "conversation_id": conversation_id,
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "content": content,
        "is_read": False,
        "created_at": message.created_at.isoformat() if message.created_at else None,
    }

    # Emit the message to the conversation room
    emit("receive_message", message_data, room=conversation_id)

    # Also emit to the receiver's personal room for notifications
    if receiver_id in active_users:
        emit(
            "new_message_notification",
            {
                "sender_id": sender_id,
                "sender_name": sender.username,
                "message": content[:50],  # First 50 characters for preview
            },
            room=receiver_id,
        )

    # Update unread count for the receiver
    unread_count = Message.query.filter_by(
        receiver_id=receiver_id, is_read=False
    ).count()
    emit("unread_count", {"count": unread_count}, room=receiver_id)


@socketio.on("mark_as_read")
def handle_mark_as_read(data):
    """Mark messages in a conversation as read."""
    current_user_id = data.get("user_id")
    other_user_id = data.get("other_user_id")

    if not current_user_id or not other_user_id:
        emit("error", {"error": "Missing user IDs"})
        return

    conversation_id = generate_conversation_id(current_user_id, other_user_id)

    # Mark all messages sent to the current user in this conversation as read
    Message.query.filter(
        Message.conversation_id == conversation_id,
        Message.receiver_id == current_user_id,
        Message.is_read == False,
    ).update({"is_read": True})

    db.session.commit()

    # Emit an event to update the read status in the conversation
    emit(
        "messages_read",
        {"conversation_id": conversation_id, "reader_id": current_user_id},
        room=conversation_id,
    )

    # Update unread count for the current user
    unread_count = Message.query.filter_by(
        receiver_id=current_user_id, is_read=False
    ).count()
    emit("unread_count", {"count": unread_count}, room=current_user_id)


def register_socket_events():
    """Register all socket events (already done by decorators)."""
    pass
