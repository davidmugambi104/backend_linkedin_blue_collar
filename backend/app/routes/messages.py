# ----- FILE: backend/app/routes/messages.py -----
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_
from ..extensions import db
from ..models import User, Message, Worker, Employer
from ..schemas import MessageCreateSchema
from ..utils.helpers import get_current_user_id

messages_bp = Blueprint("messages", __name__)


def generate_conversation_id(user1_id, user2_id):
    """Generate a consistent conversation ID for two users."""
    return f"{min(user1_id, user2_id)}-{max(user1_id, user2_id)}"


@messages_bp.route("/conversations", methods=["GET"])
@jwt_required()
def get_conversations():
    """Get all conversations for the current user."""
    current_user_id = get_current_user_id()

    messages = Message.query.filter(
        or_(
            Message.sender_id == current_user_id, Message.receiver_id == current_user_id
        )
    ).all()

    conversations = {}
    for msg in messages:
        conv_id = msg.conversation_id
        if (
            conv_id not in conversations
            or msg.created_at > conversations[conv_id]["_last_message_time_dt"]
        ):
            other_user_id = (
                msg.receiver_id if msg.sender_id == current_user_id else msg.sender_id
            )
            other_user = User.query.get(other_user_id)
            if not other_user:
                continue

            other_user_profile = None
            if other_user.role.value == "worker":
                worker = Worker.query.filter_by(user_id=other_user_id).first()
                if worker:
                    other_user_profile = {
                        "id": worker.id,
                        "full_name": worker.full_name,
                        "profile_picture": worker.profile_picture,
                        "role": "worker",
                    }
            elif other_user.role.value == "employer":
                employer = Employer.query.filter_by(user_id=other_user_id).first()
                if employer:
                    other_user_profile = {
                        "id": employer.id,
                        "company_name": employer.company_name,
                        "logo": employer.logo,
                        "role": "employer",
                    }

            conversations[conv_id] = {
                "id": other_user_id,
                "conversation_id": conv_id,
                "other_user": {
                    "id": other_user_id,
                    "username": other_user.username,
                    "email": other_user.email,
                    "role": other_user.role.value,
                    "profile": other_user_profile,
                },
                "last_message": msg.to_dict(),
                "last_message_time": msg.created_at.isoformat() if msg.created_at else None,
                "_last_message_time_dt": msg.created_at,
                "unread_count": Message.query.filter(
                    Message.conversation_id == conv_id,
                    Message.receiver_id == current_user_id,
                    Message.is_read == False,
                ).count(),
            }

    conversations_list = []
    for conversation in conversations.values():
        conversation.pop("_last_message_time_dt", None)
        conversations_list.append(conversation)

    conversations_list = sorted(
        conversations_list,
        key=lambda x: x["last_message_time"] or "",
        reverse=True,
    )
    return jsonify(conversations_list), 200


@messages_bp.route("/conversations/<int:other_user_id>", methods=["GET"])
@jwt_required()
def get_conversation(other_user_id):
    """Get conversation between current user and another user."""
    current_user_id = get_current_user_id()
    other_user = User.query.get_or_404(other_user_id)

    conversation_id = generate_conversation_id(current_user_id, other_user_id)
    messages = (
        Message.query.filter_by(conversation_id=conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    # Mark unread messages as read
    for msg in messages:
        if msg.receiver_id == current_user_id and not msg.is_read:
            msg.is_read = True
    db.session.commit()

    return jsonify([msg.to_dict() for msg in messages]), 200


@messages_bp.route("/send", methods=["POST"])
@jwt_required()
def send_message():
    """Send a message."""
    current_user_id = get_current_user_id()
    schema = MessageCreateSchema()
    data = schema.load(request.json)

    receiver_id = data["receiver_id"]
    content = data["content"]

    if current_user_id == receiver_id:
        return jsonify({"error": "Cannot send message to yourself"}), 400

    receiver = User.query.get_or_404(receiver_id)
    conversation_id = generate_conversation_id(current_user_id, receiver_id)

    message = Message(
        conversation_id=conversation_id,
        sender_id=current_user_id,
        receiver_id=receiver_id,
        content=content,
    )

    db.session.add(message)
    db.session.commit()
    return jsonify(message.to_dict()), 201


@messages_bp.route("/conversations/<int:other_user_id>/mark-read", methods=["PUT"])
@jwt_required()
def mark_conversation_read(other_user_id):
    """Mark all messages in a conversation as read."""
    current_user_id = get_current_user_id()
    conversation_id = generate_conversation_id(current_user_id, other_user_id)

    Message.query.filter(
        Message.conversation_id == conversation_id,
        Message.receiver_id == current_user_id,
        Message.is_read == False,
    ).update({"is_read": True})
    db.session.commit()

    return jsonify({"message": "Conversation marked as read"}), 200


@messages_bp.route("/unread/count", methods=["GET"])
@jwt_required()
def get_unread_count():
    """Get total number of unread messages for the current user."""
    current_user_id = get_current_user_id()
    count = Message.query.filter_by(receiver_id=current_user_id, is_read=False).count()
    return jsonify({"unread_count": count}), 200


@messages_bp.route("/users", methods=["GET"])
@jwt_required()
def get_messageable_users():
    """Get all active users that the current user can message."""
    current_user_id = get_current_user_id()

    users = (
        User.query.filter(User.id != current_user_id, User.is_active == True)
        .order_by(User.username.asc())
        .all()
    )

    result = []
    for user in users:
        profile = None
        if user.role.value == "worker":
            worker = Worker.query.filter_by(user_id=user.id).first()
            if worker:
                profile = {
                    "full_name": worker.full_name,
                    "profile_picture": worker.profile_picture,
                }
        elif user.role.value == "employer":
            employer = Employer.query.filter_by(user_id=user.id).first()
            if employer:
                profile = {
                    "company_name": employer.company_name,
                    "logo": employer.logo,
                }

        result.append(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role.value,
                "profile": profile,
            }
        )

    return jsonify(result), 200


# ----- END FILE -----
