# ----- FILE: backend/app/services/sms_service.py -----
import os
import requests
from typing import Optional

class SMSService:
    """SMS Service using various providers"""
    
    def __init__(self):
        self.provider = os.environ.get('SMS_PROVIDER', 'mock')  # mock, twilio, africa_talking
        
    def send_sms(self, phone: str, message: str) -> bool:
        """Send SMS to phone number"""
        if self.provider == 'mock':
            return self._mock_send(phone, message)
        elif self.provider == 'twilio':
            return self._twilio_send(phone, message)
        elif self.provider == 'africa_talking':
            return self._at_send(phone, message)
        return False
    
    def _mock_send(self, phone: str, message: str) -> bool:
        """Mock SMS for testing - just log it"""
        print(f"[MOCK SMS] To: {phone}, Message: {message}")
        return True
    
    def _twilio_send(self, phone: str, message: str) -> bool:
        """Send via Twilio"""
        try:
            from twilio.rest import Client
            client = Client(
                os.environ.get('TWILIO_ACCOUNT_SID'),
                os.environ.get('TWILIO_AUTH_TOKEN')
            )
            client.messages.create(
                body=message,
                from_=os.environ.get('TWILIO_PHONE_NUMBER'),
                to=phone
            )
            return True
        except Exception as e:
            print(f"Twilio error: {e}")
            return False
    
    def _at_send(self, phone: str, message: str) -> bool:
        """Send via Africa's Talking"""
        try:
            import requests
            url = "https://api.africastalking.com/version1/messaging"
            headers = {
                'ApiKey': os.environ.get('AT_API_KEY'),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            data = {
                'username': os.environ.get('AT_USERNAME'),
                'to': phone,
                'message': message
            }
            response = requests.post(url, headers=headers, data=data)
            return response.status_code == 201
        except Exception as e:
            print(f"Africa's Talking error: {e}")
            return False

sms_service = SMSService()
