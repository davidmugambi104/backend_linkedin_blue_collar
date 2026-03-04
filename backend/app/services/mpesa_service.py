# ----- FILE: backend/app/services/mpesa_service.py -----
"""
M-Pesa Payment Service using Safaricom Daraja API
Supports: STK Push, C2B, B2C, Transaction Status
"""
import os
import base64
import requests
from datetime import datetime
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)


class MpesaService:
    """M-Pesa Daraja API integration"""
    
    def __init__(self):
        self.consumer_key = os.environ.get('MPESA_CONSUMER_KEY')
        self.consumer_secret = os.environ.get('MPESA_CONSUMER_SECRET')
        self.short_code = os.environ.get('MPESA_SHORT_CODE', '174379')
        self.passkey = os.environ.get('MPESA_PASSKEY')
        self.callback_url = os.environ.get('MPESA_CALLBACK_URL')
        self.env = os.environ.get('MPESA_ENV', 'sandbox')  # sandbox or production
        
        # API URLs
        if self.env == 'production':
            self.base_url = 'https://api.safaricom.co.ke'
        else:
            self.base_url = 'https://sandbox.safaricom.co.ke'
        
        self._access_token = None
        self._token_expiry = None
    
    def get_access_token(self) -> str:
        """Get M-Pesa OAuth access token"""
        if self._access_token and self._token_expiry and datetime.now() < self._token_expiry:
            return self._access_token
        
        if not self.consumer_key or not self.consumer_secret:
            logger.warning("M-Pesa credentials not configured - using mock mode")
            return "mock_token"
        
        try:
            auth_url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
            auth = base64.b64encode(f"{self.consumer_key}:{self.consumer_secret}".encode()).decode()
            
            response = requests.get(
                auth_url,
                headers={"Authorization": f"Basic {auth}"},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self._access_token = data['access_token']
                # Token expires in ~1 hour (3600s), set expiry slightly earlier
                self._token_expiry = datetime.now().timestamp() + 3500
                return self._access_token
            else:
                logger.error(f"Failed to get M-Pesa token: {response.text}")
                return "mock_token"
        except Exception as e:
            logger.error(f"M-Pesa token error: {e}")
            return "mock_token"
    
    def stk_push(self, phone: str, amount: int, reference: str, description: str = "") -> Dict:
        """
        Initiate STK Push (Lipa na M-Pesa Online)
        Returns dict with success status and details
        """
        # Use mock mode if not configured
        if not self.consumer_key:
            return self._mock_stk_push(phone, amount, reference, description)
        
        try:
            access_token = self.get_access_token()
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            password = base64.b64encode(f"{self.short_code}{self.passkey}{timestamp}".encode()).decode()
            
            stk_url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
            
            payload = {
                "BusinessShortCode": self.short_code,
                "Password": password,
                "Timestamp": timestamp,
                "TransactionType": "CustomerBuyGoodsOnline",
                "Amount": amount,
                "PartyA": phone,
                "PartyB": self.short_code,
                "PhoneNumber": phone,
                "CallBackURL": self.callback_url or "",
                "AccountReference": reference,
                "TransactionDesc": description or f"Payment for {reference}"
            }
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(stk_url, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "checkout_request_id": result.get("CheckoutRequestID"),
                    "response_code": result.get("ResponseCode"),
                    "response_description": result.get("ResponseDescription")
                }
            else:
                return {
                    "success": False,
                    "error": response.text
                }
        except Exception as e:
            logger.error(f"STK Push error: {e}")
            return {"success": False, "error": str(e)}
    
    def _mock_stk_push(self, phone: str, amount: int, reference: str, description: str) -> Dict:
        """Mock STK Push for testing without M-Pesa credentials"""
        logger.info(f"[MOCK STK] Phone: {phone}, Amount: {amount}, Ref: {reference}")
        return {
            "success": True,
            "checkout_request_id": f"MOCK_{datetime.now().timestamp()}",
            "response_code": "0",
            "response_description": "Mock payment initiated",
            "mock": True
        }
    
    def check_transaction_status(self, checkout_request_id: str) -> Dict:
        """Check status of an M-Pesa transaction"""
        if not self.consumer_key:
            return {"success": True, "mock": True, "result_code": "0"}
        
        try:
            access_token = self.get_access_token()
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            password = base64.b64encode(f"{self.short_code}{self.passkey}{timestamp}".encode()).decode()
            
            url = f"{self.base_url}/mpesa/stkpushquery/v1/query"
            
            payload = {
                "BusinessShortCode": self.short_code,
                "Password": password,
                "Timestamp": timestamp,
                "CheckoutRequestID": checkout_request_id
            }
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "result_code": result.get("ResultCode"),
                    "result_desc": result.get("ResultDesc")
                }
            else:
                return {"success": False, "error": response.text}
        except Exception as e:
            logger.error(f"Transaction status error: {e}")
            return {"success": False, "error": str(e)}
    
    def c2b_register(self, confirmation_url: str, validation_url: str) -> Dict:
        """Register C2B URLs (Customer to Business)"""
        if not self.consumer_key:
            return {"success": True, "mock": True}
        
        try:
            access_token = self.get_access_token()
            url = f"{self.base_url}/mpesa/c2b/v1/registerurl"
            
            payload = {
                "ShortCode": self.short_code,
                "ResponseType": "Completed",
                "ConfirmationURL": confirmation_url,
                "ValidationURL": validation_url
            }
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            return {"success": response.status_code == 200, "response": response.json()}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def b2c_payment(self, phone: str, amount: int, command_id: str = "BusinessPayment", remark: str = "") -> Dict:
        """B2C Payment (Business to Customer - for fundi payouts)"""
        if not self.consumer_key:
            return {"success": True, "mock": True}
        
        try:
            access_token = self.get_access_token()
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            password = base64.b64encode(f"{self.short_code}{self.passkey}{timestamp}".encode()).decode()
            
            url = f"{self.base_url}/mpesa/b2c/v1/paymentrequest"
            
            payload = {
                "InitiatorName": os.environ.get('MPESA_INITIATOR_NAME', 'testapi'),
                "SecurityCredential": password,
                "CommandID": command_id,
                "Amount": amount,
                "PartyA": self.short_code,
                "PartyB": phone,
                "Remarks": remark or "Payment",
                "QueueTimeOutURL": f"{self.callback_url}/timeout",
                "ResultURL": f"{self.callback_url}/b2c"
            }
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "conversation_id": result.get("ConversationID"),
                    "originator_conversation_id": result.get("OriginatorConversationID")
                }
            else:
                return {"success": False, "error": response.text}
        except Exception as e:
            logger.error(f"B2C payment error: {e}")
            return {"success": False, "error": str(e)}


# Singleton instance
mpesa_service = MpesaService()
