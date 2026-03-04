# ----- FILE: backend/app/services/ml/fraud_detection.py -----
"""
Fraud Detection Service - AI-powered fraud detection for payments and user behavior.
"""
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sklearn.ensemble import IsolationForest
import joblib
import os


def get_db():
    """Get database instance."""
    from flask import current_app
    from app.extensions import db
    return db


class FraudDetectionService:
    """AI-powered fraud detection for payments and user behavior."""
    
    def __init__(self):
        self.model = None
        self.feature_columns = [
            'login_frequency', 'transaction_amount_avg',
            'location_changes', 'rating_deviation',
            'account_age_days', 'verification_level',
            'failed_transactions', 'unusual_hours'
        ]
        self._load_model()
    
    def _load_model(self):
        """Load existing model or create new one."""
        model_path = os.path.join(os.path.dirname(__file__), '../../models/fraud_detection.pkl')
        if os.path.exists(model_path):
            try:
                self.model = joblib.load(model_path)
            except Exception:
                self.model = None
    
    def _extract_user_features(self, user_id: int) -> Dict[str, float]:
        """Extract features for fraud analysis."""
        from app.models import User, Worker, Payment, LoginLog
        db = get_db()
        
        user = User.query.get(user_id)
        if not user:
            return {}
        
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        
        # Login frequency
        login_count = LoginLog.query.filter(
            LoginLog.user_id == user_id,
            LoginLog.created_at >= thirty_days_ago
        ).count()
        
        # Transaction amount average
        payments = Payment.query.filter(
            (Payment.payer_id == user_id) | (Payment.payee_id == user_id),
            Payment.created_at >= thirty_days_ago
        ).all()
        
        avg_amount = np.mean([float(p.amount) for p in payments]) if payments else 0
        
        # Location changes
        unique_locations = LoginLog.query.filter(
            LoginLog.user_id == user_id,
            LoginLog.created_at >= thirty_days_ago
        ).with_entities(LoginLog.ip_address).distinct().count()
        
        # Failed transactions
        failed_count = Payment.query.filter(
            (Payment.payer_id == user_id) | (Payment.payee_id == user_id),
            Payment.status == 'failed',
            Payment.created_at >= thirty_days_ago
        ).count()
        
        # Account age
        account_age_days = (now - user.created_at).days if user.created_at else 0
        
        # Verification level
        verification_level = 0
        worker = Worker.query.filter_by(user_id=user_id).first()
        if worker:
            verification_level = worker.verification_score / 100.0
        
        return {
            'login_frequency': float(login_count),
            'transaction_amount_avg': float(avg_amount),
            'location_changes': float(unique_locations),
            'rating_deviation': 0.0,
            'account_age_days': float(account_age_days),
            'verification_level': verification_level,
            'failed_transactions': float(failed_count),
            'unusual_hours': float(login_count)
        }
    
    def analyze_user(self, user_id: int) -> Dict[str, Any]:
        """Analyze user for potential fraud."""
        features = self._extract_user_features(user_id)
        
        if not features:
            return {'error': 'User not found', 'risk_score': 0}
        
        # Calculate risk score manually
        risk_score = 0
        
        if features.get('location_changes', 0) > 10:
            risk_score += 30
        if features.get('failed_transactions', 0) > 3:
            risk_score += 40
        if features.get('verification_level', 1) < 0.5:
            risk_score += 20
        if features.get('account_age_days', 0) < 7 and features.get('transaction_amount_avg', 0) > 10000:
            risk_score += 30
        
        if risk_score >= 70:
            risk_level = 'high'
        elif risk_score >= 40:
            risk_level = 'medium'
        else:
            risk_level = 'low'
        
        return {
            'user_id': user_id,
            'risk_score': min(100, risk_score),
            'risk_level': risk_level,
            'features': features,
            'flags': self._get_risk_flags(features)
        }
    
    def _get_risk_flags(self, features: Dict[str, float]) -> List[str]:
        flags = []
        if features.get('location_changes', 0) > 10:
            flags.append('Multiple IP addresses')
        if features.get('failed_transactions', 0) > 3:
            flags.append('Multiple failed transactions')
        if features.get('verification_level', 1) < 0.5:
            flags.append('Low verification level')
        if features.get('account_age_days', 0) < 7:
            flags.append('New account')
        return flags
    
    def analyze_transaction(self, payment_id: int) -> Dict[str, Any]:
        """Analyze a specific transaction for fraud."""
        from app.models import Payment
        
        payment = Payment.query.get(payment_id)
        if not payment:
            return {'error': 'Payment not found'}
        
        payer_risk = self.analyze_user(payment.payer_id)
        risk_factors = []
        
        # Check average payment
        avg_payment = Payment.query.filter(
            Payment.payer_id == payment.payer_id
        ).with_entities(Payment.amount).all()
        
        if avg_payment:
            rates = [float(p.amount) for p in avg_payment]
            avg = sum(rates) / len(rates) if rates else 0
            if float(payment.amount) > avg * 3:
                risk_factors.append('Unusually high amount')
        
        # Multiple transactions in short time
        recent_count = Payment.query.filter(
            Payment.payer_id == payment.payer_id,
            Payment.created_at >= datetime.utcnow() - timedelta(hours=1)
        ).count()
        
        if recent_count > 5:
            risk_factors.append('Multiple transactions in short time')
        
        overall_risk = payer_risk.get('risk_score', 0)
        if risk_factors:
            overall_risk = min(100, overall_risk + 20)
        
        return {
            'payment_id': payment_id,
            'amount': float(payment.amount),
            'payer_risk': payer_risk.get('risk_level', 'unknown'),
            'risk_factors': risk_factors,
            'recommended_action': 'block' if overall_risk > 70 else ('review' if overall_risk > 40 else 'approve')
        }


fraud_detection_service = FraudDetectionService()
