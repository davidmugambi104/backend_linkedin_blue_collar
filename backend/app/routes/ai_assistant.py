from flask import Blueprint, current_app, jsonify, request

from ..services.ai_assistant import AIAssistant, suggest_actions


ai_bp = Blueprint("ai", __name__)
assistant = AIAssistant()


@ai_bp.route("/ask", methods=["POST"])
def ask_assistant():
    """Ask the AI assistant a question."""
    data = request.get_json(silent=True) or {}
    query = (data.get("query") or "").strip()

    if not query:
        return jsonify({"error": "Query is required"}), 400

    try:
        answers = assistant.get_answer(query)
        current_app.logger.info("AI Query handled. matches=%s", len(answers))

        return jsonify(
            {
                "query": query,
                "answers": answers,
                "suggested_actions": suggest_actions(query),
            }
        ), 200
    except Exception as exc:
        current_app.logger.error("AI Assistant error: %s", str(exc))
        return jsonify({"error": "Failed to process query"}), 500


@ai_bp.route("/suggest", methods=["POST"])
def suggest_response():
    """Suggest responses based on recent conversation context."""
    data = request.get_json(silent=True) or {}
    conversation_history = data.get("history", [])

    recent = conversation_history[-3:] if isinstance(conversation_history, list) else []
    context = " ".join(str(item.get("content", "")) for item in recent if isinstance(item, dict)).strip()

    if not context:
        return jsonify({"suggestions": []}), 200

    suggestions = assistant.get_answer(context, threshold=0.1, top_k=3)
    return jsonify({"suggestions": [item["answer"] for item in suggestions]}), 200
