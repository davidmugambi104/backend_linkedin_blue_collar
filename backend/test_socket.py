import json
import urllib.request
from socketio import Client

sio = Client(logger=True, engineio_logger=False)


@sio.event
def connect():
    print("[socket-test] connected")
    sio.emit("ping", {"source": "test_socket"})


@sio.on("pong")
def on_pong(data):
    print("[socket-test] pong:", data)


@sio.on("connected")
def on_connected(data):
    print("[socket-test] connected event:", data)


@sio.event
def disconnect():
    print("[socket-test] disconnected")


if __name__ == "__main__":
    login_payload = json.dumps(
        {"email": "employer@workforge.local", "password": "employer123"}
    ).encode()
    req = urllib.request.Request(
        "http://localhost:5000/api/auth/login",
        data=login_payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as response:
        token = json.loads(response.read().decode())["access_token"]

    sio.connect(
        "http://localhost:5000",
        headers={"Authorization": f"Bearer {token}"},
    )
    sio.sleep(2)
    sio.disconnect()
