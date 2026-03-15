from flask import Blueprint, current_app, jsonify, request

from ..services.enhanced_ai_service import get_unified_ai_service, AIContext


ai_bp = Blueprint("ai", __name__)


@ai_bp.route("/ask", methods=["POST"])
def ask_assistant():
    """
    Ask the AI assistant a question.
    Uses the enhanced unified service with LoRA model support.
    """
    data = request.get_json(silent=True) or {}
    query = (data.get("query") or "").strip()
    
    # Optional context hint from client
    context_hint = data.get("context", "general")
    context_map = {
        "general": AIContext.GENERAL,
        "admin": AIContext.ADMIN_SUPPORT,
        "dispute": AIContext.DISPUTE,
        "onboarding": AIContext.ONBOARDING,
    }
    context = context_map.get(context_hint, AIContext.GENERAL)

    if not query:
        return jsonify({"error": "Query is required"}), 400

    try:
        service = get_unified_ai_service()
        response = service.generate_response(query=query, context=context)
        
        current_app.logger.info(
            "AI Query handled. query=%s matches=%s source=%s",
            query[:50], len(response.suggested_actions), response.source
        )

        return jsonify({
            "query": query,
            "answer": response.text,
            "confidence": response.confidence,
            "source": response.source,
            "model_used": response.model_used,
            "suggested_actions": response.suggested_actions,
        }), 200
        
    except Exception as exc:
        current_app.logger.error("AI Assistant error: %s", str(exc))
        return jsonify({"error": "Failed to process query"}), 500


@ai_bp.route("/suggest", methods=["POST"])
def suggest_response():
    """
    Suggest responses based on recent conversation context.
    Enhanced to use the unified AI service.
    """
    data = request.get_json(silent=True) or {}
    conversation_history = data.get("history", [])
    current_text = data.get("current_text", "")

    recent = conversation_history[-3:] if isinstance(conversation_history, list) else []
    context = " ".join(str(item.get("content", "")) for item in recent if isinstance(item, dict)).strip()
    
    # Include current text being typed
    if current_text:
        context = f"{context} {current_text}".strip()

    if not context:
        return jsonify({"suggestions": []}), 200

    try:
        service = get_unified_ai_service()
        response = service.generate_response(
            query=context,
            context=AIContext.GENERAL
        )
        
        # Return top suggestions
        suggestions = []
        if response.source in ["lora", "faq"]:
            suggestions.append(response.text)
        
        # Add action-based suggestions
        suggestions.extend(response.suggested_actions[:2])
        
        return jsonify({
            "suggestions": suggestions[:3],
            "source": response.source,
            "confidence": response.confidence
        }), 200
        
    except Exception as exc:
        current_app.logger.error("AI Suggest error: %s", str(exc))
        return jsonify({"suggestions": []}), 200


@ai_bp.route("/status", methods=["GET"])
def ai_status():
    """
    Get AI service status and available models.
    Useful for admin dashboard and debugging.
    """
    try:
        service = get_unified_ai_service()
        registry = service.registry
        
        models = {}
        for mode in ["admin", "assistant", "unified"]:
            path = registry.get_model_path(mode)
            models[mode] = {
                "available": path is not None,
                "path": str(path) if path else None,
                "loaded": registry._loaded.get(mode, False)
            }
        
        return jsonify({
            "status": "healthy",
            "models": models,
            "config": {
                "enable_lora": service.config["enable_lora"],
                "enable_faq": service.config["enable_faq"],
                "base_model": current_app.config.get("AI_BASE_MODEL", "TinyLlama/TinyLlama-1.1B-Chat-v1.0")
            }
        }), 200
        
    except Exception as exc:
        current_app.logger.error("AI Status error: %s", str(exc))
        return jsonify({"status": "error", "error": str(exc)}), 500
