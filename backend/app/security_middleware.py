from uuid import uuid4
from flask import g, jsonify, request
from werkzeug.exceptions import RequestEntityTooLarge


def register_security_middleware(app):
    @app.before_request
    def _attach_request_id():
        request_id = request.headers.get("X-Request-ID") or str(uuid4())
        g.request_id = request_id

    @app.after_request
    def _set_security_headers(response):
        response.headers["X-Request-ID"] = getattr(g, "request_id", "")
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

        if request.is_secure:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        if request.path.startswith("/api/auth"):
            response.headers["Cache-Control"] = "no-store"

        return response

    @app.errorhandler(RequestEntityTooLarge)
    def _handle_payload_too_large(error):
        return jsonify({"error": "Payload too large"}), 413
