from flask import Blueprint, jsonify


docs_bp = Blueprint("docs", __name__)


@docs_bp.route("/health", methods=["GET"])
def docs_health():
    return jsonify({"message": "API docs route available"}), 200
