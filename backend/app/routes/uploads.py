import os
import uuid
from pathlib import Path

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename


uploads_bp = Blueprint("uploads", __name__)


def _uploads_root() -> Path:
    backend_root = Path(__file__).resolve().parents[2]
    target = backend_root / "uploads" / "cdn"
    target.mkdir(parents=True, exist_ok=True)
    return target


@uploads_bp.route("/signed-url", methods=["POST"])
@jwt_required()
def get_signed_url():
    """Return a local upload target compatible with CDN-style direct uploads."""
    data = request.get_json(silent=True) or {}
    file_name = secure_filename((data.get("fileName") or "upload.bin").strip())

    if not file_name:
        return jsonify({"error": "fileName is required"}), 400

    key = f"uploads/cdn/{uuid.uuid4().hex}-{file_name}"
    return jsonify({
        "url": "/api/uploads/direct",
        "fields": {"key": key},
    }), 200


@uploads_bp.route("/direct", methods=["POST"])
@jwt_required()
def direct_upload():
    """Handle direct uploads from frontend and store them under uploads/cdn."""
    file = request.files.get("file")
    key = (request.form.get("key") or "").strip()

    if not file:
        return jsonify({"error": "No file provided"}), 400

    safe_name = secure_filename(file.filename or "upload.bin")
    if key:
        key_name = os.path.basename(key)
        safe_name = secure_filename(key_name) or safe_name

    destination = _uploads_root() / safe_name
    file.save(destination)

    return ("", 204)
