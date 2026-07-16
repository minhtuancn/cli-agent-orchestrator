#!/usr/bin/env bash
# Reproducible local deployment for the checked-out CAO fork.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CAO_PORT="${CAO_API_PORT:-9889}"
SERVICE_NAME="${CAO_SYSTEMD_SERVICE:-cao-server}"

cd "$ROOT_DIR"
printf '==> Installing Python package from %s\n' "$ROOT_DIR"
uv tool install . --reinstall

if [[ "${CAO_SKIP_WEB_BUILD:-0}" != "1" ]]; then
  printf '==> Building Web UI\n'
  (cd web && npm ci && npm run build)
  uv tool install . --reinstall
fi

if [[ "${CAO_SKIP_PROFILES:-0}" != "1" ]]; then
  printf '==> Installing web-feature profiles\n'
  for profile in examples/web-feature-build/web_feature_supervisor.md \
                 examples/web-feature-build/web_developer.md \
                 examples/web-feature-build/web_tester.md \
                 examples/web-feature-build/web_reviewer.md \
                 examples/web-feature-build/web_documenter.md; do
    cao install "$profile"
  done
fi

if systemctl --user cat "$SERVICE_NAME" >/dev/null 2>&1; then
  printf '==> Restarting %s\n' "$SERVICE_NAME"
  systemctl --user daemon-reload
  systemctl --user restart "$SERVICE_NAME"
  for _ in $(seq 1 30); do
    if curl -fsS "http://127.0.0.1:${CAO_PORT}/health" >/dev/null; then
      printf '==> CAO healthy on port %s\n' "$CAO_PORT"
      exit 0
    fi
    sleep 1
  done
  printf 'ERROR: CAO did not become healthy on port %s\n' "$CAO_PORT" >&2
  exit 1
fi

printf '==> No user service named %s; package/profile deployment completed\n' "$SERVICE_NAME"
