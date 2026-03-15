"""
Enhanced AI Service for WorkForge - FAQ-First Implementation
Optimized for systems without GPU training capability
Uses advanced FAQ matching with context-aware responses
"""

from __future__ import annotations

import json
import re
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

from flask import current_app

logger = logging.getLogger(__name__)


class AIContext(Enum):
    """Context types for AI responses"""
    GENERAL = "general"
    ADMIN_SUPPORT = "admin"
    USER_MESSAGE = "user"
    DISPUTE = "dispute"
    ONBOARDING = "onboarding"


@dataclass
class AIResponse:
    """Structured AI response"""
    text: str
    confidence: float
    source: str  # 'faq', 'template', 'fallback'
    suggested_actions: List[str]
    context_used: AIContext
    matched_question: Optional[str] = None


class FAQKnowledgeBase:
    """
    Advanced FAQ system with semantic matching
    Uses TF-IDF + Cosine Similarity for intelligent matching
    """
    
    def __init__(self, backend_root: Path):
        self.backend_root = backend_root
        self.df = None
        self.vectorizer = None
        self.question_matrix = None
        self._load_faq()
        self._load_admin_faq()
        self._load_assistant_faq()
    
    def _load_faq(self):
        """Load main FAQ data"""
        try:
            import pandas as pd
            from sklearn.feature_extraction.text import TfidfVectorizer
            
            faq_path = self.backend_root / "training" / "faq_data.csv"
            if not faq_path.exists():
                logger.warning(f"FAQ file not found: {faq_path}")
                return
            
            self.df = pd.read_csv(faq_path)
            self.df["question"] = self.df["question"].astype(str).str.lower().str.strip()
            self.df["answer"] = self.df["answer"].astype(str).str.strip()
            
            # Initialize vectorizer with better parameters
            self.vectorizer = TfidfVectorizer(
                ngram_range=(1, 3),  # Include trigrams for better matching
                stop_words="english",
                max_features=5000,
                min_df=1
            )
            self.question_matrix = self.vectorizer.fit_transform(self.df["question"].tolist())
            logger.info(f"Loaded {len(self.df)} FAQ entries")
            
        except ImportError:
            logger.warning("sklearn/pandas not available, using basic matching")
        except Exception as e:
            logger.error(f"Failed to load FAQ: {e}")
    
    def _load_admin_faq(self):
        """Load admin-specific responses"""
        admin_path = self.backend_root / "training" / "data" / "admin_training_data.jsonl"
        if admin_path.exists():
            try:
                import pandas as pd
                rows = []
                with open(admin_path, 'r') as f:
                    for line in f:
                        if line.strip():
                            data = json.loads(line)
                            rows.append({
                                'question': data.get('prompt', '').replace('User: ', ''),
                                'answer': data.get('response', ''),
                                'category': data.get('category', 'admin_support'),
                                'context': 'admin'
                            })
                
                if rows and self.df is not None:
                    admin_df = pd.DataFrame(rows)
                    self.df = pd.concat([self.df, admin_df], ignore_index=True)
                    # Re-fit vectorizer
                    self.question_matrix = self.vectorizer.fit_transform(self.df["question"].tolist())
                    logger.info(f"Added {len(rows)} admin responses")
            except Exception as e:
                logger.warning(f"Could not load admin FAQ: {e}")
    
    def _load_assistant_faq(self):
        """Load assistant-specific responses"""
        assistant_path = self.backend_root / "training" / "data" / "assistant_training_data.jsonl"
        if assistant_path.exists():
            try:
                import pandas as pd
                rows = []
                with open(assistant_path, 'r') as f:
                    for line in f:
                        if line.strip():
                            data = json.loads(line)
                            rows.append({
                                'question': data.get('prompt', '').replace('User: ', ''),
                                'answer': data.get('response', ''),
                                'category': data.get('category', 'general'),
                                'context': 'assistant'
                            })
                
                if rows and self.df is not None:
                    assistant_df = pd.DataFrame(rows)
                    self.df = pd.concat([self.df, assistant_df], ignore_index=True)
                    # Re-fit vectorizer
                    self.question_matrix = self.vectorizer.fit_transform(self.df["question"].tolist())
                    logger.info(f"Added {len(rows)} assistant responses")
            except Exception as e:
                logger.warning(f"Could not load assistant FAQ: {e}")
    
    def search(self, query: str, threshold: float = 0.15, top_k: int = 3, 
               context_filter: Optional[str] = None) -> List[Dict]:
        """
        Search FAQ with semantic matching
        
        Args:
            query: User query
            threshold: Minimum similarity score (0-1)
            top_k: Number of results to return
            context_filter: Filter by context ('admin', 'assistant', None for all)
        """
        if self.df is None or self.df.empty or self.question_matrix is None:
            return []
        
        try:
            from sklearn.metrics.pairwise import cosine_similarity
            
            query_clean = query.lower().strip()
            query_vec = self.vectorizer.transform([query_clean])
            similarities = cosine_similarity(query_vec, self.question_matrix).flatten()
            
            # Get top matches
            ranked_indices = similarities.argsort()[::-1][:top_k]
            results = []
            
            for idx in ranked_indices:
                score = float(similarities[idx])
                if score < threshold:
                    continue
                
                row = self.df.iloc[idx]
                
                # Apply context filter if specified
                if context_filter and 'context' in row:
                    if row.get('context') != context_filter:
                        continue
                
                results.append({
                    "question": row["question"],
                    "answer": row["answer"],
                    "category": row.get("category", "general"),
                    "similarity": round(score, 4),
                    "context": row.get("context", "general")
                })
            
            return results
        except Exception as e:
            logger.error(f"FAQ search failed: {e}")
            return []
    
    def get_best_match(self, query: str, context: AIContext) -> Optional[Dict]:
        """Get single best match for query"""
        context_filter = None
        if context == AIContext.ADMIN_SUPPORT:
            context_filter = "admin"
        elif context == AIContext.GENERAL:
            context_filter = "assistant"
        
        results = self.search(query, threshold=0.15, top_k=1, context_filter=context_filter)
        return results[0] if results else None


class ResponseTemplates:
    """Template-based responses for common scenarios"""
    
    ADMIN_TEMPLATES = {
        "greeting": "Hello! I'm here to help. Please share more details about your issue so I can assist you effectively.",
        "escalation": "I understand this requires immediate attention. I'm escalating this to our support team who will contact you within 4 hours. Your ticket number is #{ticket_id}.",
        "verification_needed": "To proceed, I'll need to verify your identity. Please provide your registered email address and the last 4 digits of your phone number.",
        "investigation": "Thank you for reporting this. I'm opening an investigation and will update you within 24 hours. Please preserve any evidence (screenshots, messages) related to this issue.",
    }
    
    ASSISTANT_TEMPLATES = {
        "greeting": "Hi there! I'm your WorkForge assistant. How can I help you today?",
        "not_found": "I don't have specific information about that. Try browsing our Help Center or contact support for detailed assistance.",
        "clarification": "Could you provide more details? For example: what specific feature or issue are you asking about?",
    }


class UnifiedAIService:
    """
    Unified AI Service - FAQ-First Implementation
    Works without GPU training using advanced FAQ matching
    """
    
    def __init__(self, backend_root: Optional[Path] = None):
        if backend_root is None:
            backend_root = Path(__file__).resolve().parents[2]
        
        self.backend_root = backend_root
        self.faq = FAQKnowledgeBase(backend_root)
        self.templates = ResponseTemplates()
        
        # Configuration
        self.config = {
            "faq_threshold": 0.20,
            "enable_templates": True,
        }
    
    def _detect_context(self, query: str) -> AIContext:
        """Auto-detect context from query"""
        query_lower = query.lower()
        
        # Admin keywords
        admin_keywords = [
            'report', 'dispute', 'violation', 'suspend', 'ban', 'refund',
            'billing', 'fraud', 'scam', 'harassment', 'hack', 'unauthorized',
            'complaint', 'investigation', 'escalate', 'urgent', 'serious'
        ]
        
        # Dispute keywords
        dispute_keywords = [
            'conflict', 'disagreement', 'not fair', 'refund', 'not paid',
            'milestone', 'contract breach', 'quality issue'
        ]
        
        if any(kw in query_lower for kw in admin_keywords):
            return AIContext.ADMIN_SUPPORT
        elif any(kw in query_lower for kw in dispute_keywords):
            return AIContext.DISPUTE
        elif any(kw in query_lower for kw in ['new', 'first time', 'how to start', 'beginner']):
            return AIContext.ONBOARDING
        
        return AIContext.GENERAL
    
    def _get_suggested_actions(self, query: str, context: AIContext) -> List[str]:
        """Get context-appropriate suggested actions"""
        query_lower = query.lower()
        
        if context == AIContext.ADMIN_SUPPORT:
            if any(kw in query_lower for kw in ['password', 'login', 'access', 'account']):
                return ["Reset password", "Check account status", "Enable 2FA"]
            elif any(kw in query_lower for kw in ['payment', 'refund', 'charge', 'billing']):
                return ["View transaction history", "Process refund", "Escalate to finance"]
            elif any(kw in query_lower for kw in ['report', 'violation', 'harassment', 'fraud']):
                return ["Review reported content", "Suspend account", "Contact user"]
            elif any(kw in query_lower for kw in ['verify', 'verification', 'document']):
                return ["Check verification status", "Request documents", "Approve verification"]
            return ["Contact support", "View help center", "Submit ticket"]
        
        # General actions
        if any(kw in query_lower for kw in ['profile', 'account', 'settings']):
            return ["Open profile settings", "Update skills", "Verify account"]
        elif any(kw in query_lower for kw in ['job', 'work', 'hire', 'apply']):
            return ["Browse jobs", "Post a job", "View applications"]
        elif any(kw in query_lower for kw in ['message', 'chat', 'conversation']):
            return ["Open inbox", "Start new conversation", "View notifications"]
        elif any(kw in query_lower for kw in ['payment', 'wallet', 'money', 'pay']):
            return ["View wallet", "Withdraw funds", "Payment history"]
        
        return ["Go to dashboard", "View help center", "Contact support"]
    
    def generate_response(self, 
                         query: str,
                         context: Optional[AIContext] = None,
                         history: Optional[List[Dict]] = None) -> AIResponse:
        """
        Generate AI response using FAQ-first approach
        
        Priority:
        1. FAQ match (if good match found)
        2. Template response (for specific scenarios)
        3. Fallback response
        """
        
        # Auto-detect context if not provided
        if context is None:
            context = self._detect_context(query)
        
        text = (query or "").strip()
        if not text:
            return AIResponse(
                text=self.templates.ASSISTANT_TEMPLATES["greeting"],
                confidence=1.0,
                source="template",
                suggested_actions=["Browse help center", "Contact support"],
                context_used=context
            )
        
        # Try FAQ search first
        best_match = self.faq.get_best_match(text, context)
        
        if best_match and best_match["similarity"] >= self.config["faq_threshold"]:
            return AIResponse(
                text=best_match["answer"],
                confidence=best_match["similarity"],
                source="faq",
                suggested_actions=self._get_suggested_actions(query, context),
                context_used=context,
                matched_question=best_match["question"]
            )
        
        # Use template for admin context
        if context == AIContext.ADMIN_SUPPORT:
            if any(kw in text.lower() for kw in ['urgent', 'serious', 'emergency']):
                template = self.templates.ADMIN_TEMPLATES["escalation"].format(ticket_id=hash(text) % 10000)
            else:
                template = self.templates.ADMIN_TEMPLATES["greeting"]
            
            return AIResponse(
                text=template,
                confidence=0.6,
                source="template",
                suggested_actions=self._get_suggested_actions(query, context),
                context_used=context
            )
        
        # General fallback
        return AIResponse(
            text=self.templates.ASSISTANT_TEMPLATES["not_found"],
            confidence=0.4,
            source="fallback",
            suggested_actions=self._get_suggested_actions(query, context),
            context_used=context
        )
    
    def generate_admin_reply(self, 
                            user_message: str,
                            history: Optional[List[Dict]] = None) -> str:
        """Generate admin auto-reply for user messages"""
        response = self.generate_response(
            query=user_message,
            context=AIContext.ADMIN_SUPPORT,
            history=history
        )
        return response.text
    
    def ask_assistant(self, query: str, context_hint: str = "general") -> Dict[str, Any]:
        """General AI assistant query"""
        context_map = {
            "general": AIContext.GENERAL,
            "admin": AIContext.ADMIN_SUPPORT,
            "dispute": AIContext.DISPUTE,
            "onboarding": AIContext.ONBOARDING,
        }
        context = context_map.get(context_hint, AIContext.GENERAL)
        
        response = self.generate_response(query=query, context=context)
        
        return {
            "query": query,
            "answer": response.text,
            "confidence": response.confidence,
            "source": response.source,
            "context": response.context_used.value,
            "suggested_actions": response.suggested_actions,
            "matched_question": response.matched_question
        }


# Singleton instance
_unified_service: Optional[UnifiedAIService] = None


def get_unified_ai_service() -> UnifiedAIService:
    """Get or create singleton AI service instance"""
    global _unified_service
    if _unified_service is None:
        _unified_service = UnifiedAIService()
    return _unified_service


def reset_ai_service():
    """Reset the singleton"""
    global _unified_service
    _unified_service = None
