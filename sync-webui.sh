#!/usr/bin/env bash
#
# sync-webui.sh — rebuild CAO Web UI từ source patch và đồng bộ vào package đang cài.
#
# Dùng khi:
#   - `uv tool upgrade cli-agent-orchestrator` ghi đè web_ui (mất bản responsive)
#   - bạn sửa thêm file trong /home/dev/cao-web-patch/web/src rồi muốn build lại
#
# Không động tới 6 session tmux user hay cao-supervisor (chỉ restart cao-server).
#
set -euo pipefail

BUILD_DIR="/home/dev/cao-web-patch"
PORT=9889
HOST="0.0.0.0"
# IP máy + domain công khai (NPM Proxy + Let's Encrypt) để whitelist DNS-rebinding.
# Thêm domain bạn trỏ tới (VD agent.go7s.net) nếu chưa có.
ALLOWED_HOSTS="localhost,127.0.0.1,10.20.10.103,113.189.249.218,agent.go7s.net"
WS_CLIENTS="*"

echo "==> [1/4] Tìm đường dẫn package web_ui ..."
CAO_BIN="$(command -v cao-server || true)"
[ -z "${CAO_BIN:-}" ] && CAO_BIN="/home/dev/.local/share/uv/tools/cli-agent-orchestrator/bin/cao-server"
CAO_REAL="$(readlink -f "$CAO_BIN" 2>/dev/null || echo "$CAO_BIN")"
VENV_PY="$(dirname "$CAO_REAL")/python3"
PKG_WEBUI="$("$VENV_PY" - <<'PY'
import os, cli_agent_orchestrator as m
print(os.path.join(os.path.dirname(m.__file__), "web_ui"))
PY
)"
echo "    package web_ui: $PKG_WEBUI"
[ -d "$PKG_WEBUI" ] || { echo "    LỖI: không tìm thấy $PKG_WEBUI"; exit 1; }

echo "==> [2/4] Rebuild Web UI (npm install + vite build) ..."
cd "$BUILD_DIR/web"
npm install >/dev/null 2>&1
npm run build 2>&1 | tail -4
SRC_WEBUI="$BUILD_DIR/src/cli_agent_orchestrator/web_ui"
[ -f "$SRC_WEBUI/index.html" ] || { echo "    LỖI: build không ra index.html"; exit 1; }

echo "==> [3/4] Copy bản build mới đè vào package ..."
rm -f "$PKG_WEBUI"/assets/*
cp -r "$SRC_WEBUI"/. "$PKG_WEBUI"/
echo "    mới: $(grep -o '/assets/index-[A-Za-z0-9_]*\.js' "$PKG_WEBUI/index.html")"

echo "==> [3b] Copy backend patch (api/main.py) vào package đang cài ..."
PKG_DIR="$("$VENV_PY" - <<'PY'
import os, cli_agent_orchestrator as m
print(os.path.dirname(m.__file__))
PY
)"
SRC_MAIN="$BUILD_DIR/src/cli_agent_orchestrator/api/main.py"
if [ -f "$SRC_MAIN" ]; then
  cp -f "$SRC_MAIN" "$PKG_DIR/api/main.py"
  rm -f "$PKG_DIR/api/__pycache__/main"*.pyc 2>/dev/null || true
  echo "    patched: $PKG_DIR/api/main.py"
else
  echo "    CẢNH BÁO: không tìm thấy $SRC_MAIN (bỏ qua backend patch)"
fi

echo "==> [4/4] Restart cao-server (kill theo port $PORT) ..."
PID="$(ss -ltnp 2>/dev/null | grep ":$PORT" | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2 || true)"
if [ -n "${PID:-}" ]; then
  echo "    kill old cao-server pid=$PID"
  kill "$PID" 2>/dev/null || kill -9 "$PID" 2>/dev/null || true
  sleep 1
fi

export CAO_ALLOWED_HOSTS="$ALLOWED_HOSTS"
export CAO_WS_ALLOWED_CLIENTS="$WS_CLIENTS"
setsid "$CAO_BIN" --host "$HOST" --port "$PORT" > /tmp/cao_server.log 2>&1 &
disown 2>/dev/null
sleep 3

echo "==> Verify ..."
CODE="$(curl -s --max-time 5 -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/" || echo 000)"
echo "    GET / -> $CODE"
if [ "$CODE" = "200" ]; then
  JS="$(curl -s --max-time 5 "http://127.0.0.1:$PORT/" | grep -o '/assets/index-[A-Za-z0-9_]*\.js' | head -1)"
  echo "    asset: $JS -> $(curl -s --max-time 5 -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT$JS")"
  echo ">>> DONE: Web UI responsive đã đồng bộ & cao-server đang chạy."
else
  echo ">>> CẢNH BÁO: server không trả 200, xem /tmp/cao_server.log"
  exit 1
fi
