# ----- FILE: backend/app/sockets/notifications.py -----
from flask import request
from flask_socketio import emit, join_room, leave_room
from ..extensions import socketio, db
from ..models import User

# Store active users
active_users = {}


def generate_conversation_id(user1_id, user2_id):
    """Generate consistent conversation ID for two users."""
    return f"{min(user1_id, user2_id)}-{max(user1_id, user2_id)}"


# ============ CONNECTION HANDLERS ============

@socketio.on("connect")
def handle_connect():
    """Handle client connection."""
    emit("connected", {"message": "Connected to WorkForge"})


@socketio.on("authenticate")
def handle_authentication(data):
    """Authenticate user for Socket.IO."""
    token = data.get("token")
    user_id = data.get("user_id")
    
    if not user_id:
        emit("authentication_failed", {"error": "Invalid request"})
        return
    
    # Store user as active
    active_users[user_id] = request.sid
    join_room(f"user_{user_id}")
    
    emit("authenticated", {"message": "Authenticated", "user_id": user_id})


@socketio.on("disconnect")
def handle_disconnect():
    """Handle client disconnect."""
    user_id = None
    for uid, sid in active_users.items():
        if sid == request.sid:
            user_id = uid
            break
    
    if user_id:
        del active_users[user_id]
        emit("user_offline", {"user_id": user_id}, broadcast=True)


@socketio.on("subscribe")
def handle_subscribe(data):
    """Subscribe to specific events/channels."""
    channel = data.get("channel")
    user_id = data.get("user_id")
    
    if channel == "job_updates":
        join_room("job_updates")
    elif channel == "notifications":
        join_room(f"notifications_{user_id}")
    elif channel == "messages":
        join_room(f"messages_{user_id}")


# ============ JOB NOTIFICATIONS ============

def notify_job_update(job_id, update_type, data):
    """Broadcast job updates to relevant users."""
    socketio.emit("job_update", {
        "job_id": job_id,
        "type": update_type,
        "data": data
    }, room="job_updates")


def notify_new_application(job_id, application_data):
    """Notify employer of new application."""
    employer_id = application_data.get("employer_id")
    if employer_id and employer_id in active_users:
        socketio.emit("new_application", {
            "job_id": job_id,
            "application": application_data
        }, room=f"user_{employer_id}")


def notify_application_status(worker_id, job_id, status):
    """Notify worker of application status change."""
    if worker_id and worker_id in active_users:
        socketio.emit("application_status", {
            "job_id": job_id,
            "status": status
        }, room=f"user_{worker_id}")


def notify_job_match(worker_id, job_data):
    """Notify worker of matching job."""
    if worker_id and worker_id in active_users:
        socketio.emit("job_match", {
            "job": job_data
        }, room=f"user_{worker_id}")


# ============ MESSAGE NOTIFICATIONS ============

def notify_new_message(receiver_id, message_data):
    """Notify user of new message."""
    if receiver_id and receiver_id in active_users:
        socketio.emit("new_message", {
            "message": message_data
        }, room=f"user_{receiver_id}")


def notify_message_read(sender_id, conversation_id):
    """Notify sender that messages were read."""
    if sender_id and sender_id in active_users:
        socketio.emit("messages_read", {
            "conversation_id": conversation_id
        }, room=f"user_{sender_id}")


# ============ PAYMENT NOTIFICATIONS ============

def notify_payment_update(user_id, payment_data):
    """Notify user of payment status update."""
    if user_id and user_id in active_users:
        socketio.emit("payment_update", {
            "payment": payment_data
        }, room=f"user_{user_id}")


def notify_escrow_held(employer_id, job_id, amount):
    """Notify employer escrow is held."""
    if employer_id and employer_id in active_users:
        socketio.emit("escrow_held", {
            "job_id": job_id,
            "amount": amount
        }, room=f"user_{employer_id}")


def notify_escrow_released(worker_id, job_id, amount):
    """Notify worker escrow is released."""
    if worker_id and worker_id in active_users:
        socketio.emit("escrow_released", {
            "job_id": job_id,
            "amount": amount
        }, room=f"user_{worker_id}")


# ============ VERIFICATION NOTIFICATIONS ============

def notify_verification_update(worker_id, status):
    """Notify worker of verification status change."""
    if worker_id and worker_id in active_users:
        socketio.emit("verification_update", {
            "status": status
        }, room=f"user_{worker_id}")


# ============ UTILITY FUNCTIONS ============

def is_user_online(user_id):
    """Check if user is currently connected."""
    return user_id in active_users


def get_online_users():
    """Get list of online user IDs."""
    return list(active_users.keys())


def register_notification_handlers():
    """Register notification handlers."""
    pass


# ============ REAL-TIME LOCATION HANDLERS ============

@socketio.on("worker_location_update")
def handle_location_update(data):
    """Handle worker location update via WebSocket."""
    user_id = data.get("user_id")
    lat = data.get("lat")
    lng = data.get("lng")
    
    if not user_id or lat is None or lng is None:
        emit("location_error", {"error": "Invalid data"})
        return
    
    # Join worker's room
    join_room(f"worker_{user_id}")
    
    # Update location in service
    from app.services.geo_matching_service import geo_matcher
    from app.models import Worker
    
    worker = Worker.query.filter_by(user_id=user_id).first()
    if worker:
        geo_matcher.update_worker_location(worker.id, lat, lng)
        
        emit("location_updated", {
            "success": True,
            "worker_id": worker.id
        })


@socketio.on("subscribe_job_alerts")
def handle_subscribe_job_alerts(data):
    """Worker subscribes to job alerts in their area."""
    user_id = data.get("user_id")
    lat = data.get("lat")
    lng = data.get("lng")
    radius = data.get("radius", 10)
    
    if not user_id:
        emit("subscription_error", {"error": "user_id required"})
        return
    
    join_room(f"worker_{user_id}")
    
    if lat and lng:
        # Update location and check for nearby jobs
        from app.services.geo_matching_service import geo_matcher
        from app.models import Worker
        
        worker = Worker.query.filter_by(user_id=user_id).first()
        if worker:
            geo_matcher.update_worker_location(worker.id, lat, lng)
    
    emit("job_alerts_subscribed", {
        "success": True,
        "radius_km": radius
    })


@socketio.on("unsubscribe_job_alerts")
def handle_unsubscribe_job_alerts(data):
    """Worker unsubscribes from job alerts."""
    user_id = data.get("user_id")
    if user_id:
        leave_room(f"worker_{user_id}")
        emit("job_alerts_unsubscribed", {"success": True})


def notify_worker_of_job(worker_user_id, job_data, distance_km, match_score):
    """Push notification to worker about a new matching job."""
    if worker_user_id in active_users:
        socketio.emit("new_job_alert", {
            "job": job_data,
            "distance_km": distance_km,
            "match_score": match_score
        }, room=f"worker_{worker_user_id}")
