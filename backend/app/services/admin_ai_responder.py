from __future__ import annotations

from pathlib import Path
from typing import Any

from flask import current_app

from .enhanced_ai_service import get_unified_ai_service, AIContext


class AdminAIResponder:
    """
    Admin AI Responder using the enhanced FAQ-first AI service.
    
    This class provides backward compatibility with the existing
    admin messaging system while leveraging the new unified service
    that uses advanced FAQ matching instead of LoRA models.
    """
    
    def __init__(self) -> None:
        self._service = get_unified_ai_service()
    
    def _should_try_lora(self) -> bool:
        """Check if LoRA is enabled in config (for compatibility)"""
        enabled = current_app.config.get("AI_ADMIN_USE_LORA", False)
        return bool(enabled)
    
    def _adapter_dir(self) -> Path:
        """Get adapter directory from config (for compatibility)"""
        adapter_value = current_app.config.get(
            "AI_ADMIN_ADAPTER_DIR", "training/output/admin-support-lora"
        )
        adapter_path = Path(adapter_value)
        if not adapter_path.is_absolute():
            backend_root = Path(__file__).resolve().parents[2]
            adapter_path = backend_root / adapter_path
        return adapter_path
    
    def _load_lora_model(self) -> bool:
        """Check if LoRA model is available (for compatibility)"""
        # FAQ-first approach doesn't require LoRA
        return False
    
    def _build_prompt(self, user_message: str, history: list[dict[str, Any]]) -> str:
        """Build prompt for generation (compatibility method)"""
        trimmed_history = history[-6:]
        lines: list[str] = [
            "You are the WorkForge admin support assistant.",
            "Be concise, polite, practical, and specific to the platform.",
            "If action is required, provide clear next steps.",
            "",
            "Conversation:",
        ]

        for item in trimmed_history:
            role = str(item.get("role") or "user").strip().lower()
            content = str(item.get("content") or "").strip()
            if not content:
                continue
            speaker = "Admin" if role == "assistant" else "User"
            lines.append(f"{speaker}: {content}")

        lines.append(f"User: {user_message.strip()}")
        lines.append("Admin:")
        return "\n".join(lines)
    
    def _reply_from_lora(self, user_message: str, history: list[dict[str, Any]]) -> str | None:
        """Generate reply using LoRA model (compatibility - returns None)"""
        # FAQ-first approach - LoRA not used
        return None
    
    def _reply_from_faq(self, user_message: str) -> str | None:
        """Generate reply using FAQ (main method)"""
        response = self._service.generate_response(
            query=user_message,
            context=AIContext.ADMIN_SUPPORT
        )
        
        if response.source in ["faq", "template"]:
            return response.text
        return None
    
    def generate_reply(self, user_message: str, history: list[dict[str, Any]] | None = None) -> str:
        """
        Generate admin reply for user message.
        
        This is the main entry point used by the messages route.
        Uses the unified AI service with FAQ-first approach.
        """
        text = (user_message or "").strip()
        if not text:
            return "Hello, I'm here to help. Please share more details so I can assist you."

        history_rows = history or []
        
        # Use unified service (FAQ-first)
        try:
            response = self._service.generate_response(
                query=text,
                context=AIContext.ADMIN_SUPPORT,
                history=history_rows
            )
            
            if response.text:
                return response.text
        except Exception as exc:
            current_app.logger.warning("Unified AI service failed: %s", str(exc))
        
        # Legacy fallback chain (for compatibility)
        faq_reply = self._reply_from_faq(user_message=text)
        if faq_reply:
            return faq_reply

        return (
            "Thanks for reaching out. I'm online and ready to help. "
            "Please share your account email, the exact issue, and when it started so I can resolve it quickly."
        )


# Singleton instance for backward compatibility
_responder: AdminAIResponder | None = None


def get_admin_ai_responder() -> AdminAIResponder:
    """Get or create singleton admin responder instance"""
    global _responder
    if _responder is None:
        _responder = AdminAIResponder()
    return _responder
