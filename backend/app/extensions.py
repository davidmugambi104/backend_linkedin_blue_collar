# ----- FILE: backend/app/extensions.py -----
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_socketio import SocketIO
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import redis
import json

db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()
socketio = SocketIO()

# Rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Redis cache (optional - falls back gracefully)
try:
    redis_client = redis.Redis(
        host='localhost',
        port=6379,
        db=0,
        decode_responses=True
    )
    redis_client.ping()
except:
    redis_client = None

# Simple cache class
class RedisCache:
    """Simple cache wrapper with Redis or in-memory fallback."""
    
    def __init__(self, client=None):
        self._client = client
        self._memory = {}  # Fallback
    
    def get(self, key):
        if self._client:
            try:
                return self._client.get(key)
            except:
                pass
        return self._memory.get(key)
    
    def set(self, key, value, ex=None):
        if self._client:
            try:
                return self._client.set(key, value, ex=ex)
            except:
                pass
        self._memory[key] = value
    
    def setex(self, key, time, value):
        if self._client:
            try:
                return self._client.setex(key, time, value)
            except:
                pass
        self._memory[key] = value
    
    def delete(self, key):
        if self._client:
            try:
                return self._client.delete(key)
            except:
                pass
        self._memory.pop(key, None)
    
    def sadd(self, key, *values):
        if self._client:
            try:
                return self._client.sadd(key, *values)
            except:
                pass
        if key not in self._memory:
            self._memory[key] = set()
        self._memory[key].update(values)
    
    def smembers(self, key):
        if self._client:
            try:
                return self._client.smembers(key)
            except:
                pass
        return self._memory.get(key, set())
    
    def srem(self, key, *values):
        if self._client:
            try:
                return self._client.srem(key, *values)
            except:
                pass
        if key in self._memory:
            self._memory[key] -= set(values)

redis_cache = RedisCache(redis_client)
# ----- END FILE -----
