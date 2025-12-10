# ----- FILE: backend/run.py -----
from app import create_app
from app.extensions import socketio

app = create_app()

if name == 'main':
socketio.run(app, host='0.0.0.0', port=5000, debug=True)
# ----- END FILE -----