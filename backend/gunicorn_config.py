# ----- FILE: backend/gunicorn_config.py -----
bind = "127.0.0.1:5000"
workers = 1
worker_class = "sync"
timeout = 120
keepalive = 5
accesslog = "-"
errorlog = "-"
loglevel = "info"
