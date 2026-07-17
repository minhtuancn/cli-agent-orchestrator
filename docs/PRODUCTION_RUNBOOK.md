# Production Runbook

## Topology

```text
https://agent.go7s.net
        |
        v
reverse proxy / NPM Proxy
        |
        v
cao-server 0.0.0.0:9889
```

Use one public domain and one CAO port. No second public domain is required.

## Authentication

- Set `CAO_ADMIN_PASS` through the external systemd environment file.
- Browser users log in at `/auth/login` and receive the `cao_sid` cookie.
- Internal agents call `http://127.0.0.1:9889` and use the loopback bypass.
- Multi-host/internal agents may use `X-CAO-Agent-Token` when `CAO_AGENT_TOKEN`
  is configured; transmit it only over HTTPS and never log or commit it.
- Terminal WebSocket connections require a browser cookie or agent token, plus
  the configured `CAO_WS_ALLOWED_CLIENTS` source address.

## Systemd deployment

```bash
install -m 600 /dev/null ~/.config/systemd/user/cao-server.env
$EDITOR ~/.config/systemd/user/cao-server.env
systemctl --user daemon-reload
systemctl --user enable cao-server
systemctl --user restart cao-server
systemctl --user status cao-server --no-pager
curl -f http://127.0.0.1:9889/health
```

Do not place the password in `cao-server.service`. Do not commit the env file.

## Reverse proxy requirements

- Forward HTTP and WebSocket traffic to port 9889.
- Preserve the `Host` header or add `agent.go7s.net` to `CAO_ALLOWED_HOSTS`.
- Forward `X-Forwarded-Proto: https` so secure cookies are issued.
- Enable WebSocket upgrade (`Upgrade` and `Connection` headers).
- The current NPM Proxy source observed in production is `10.20.10.111`;
  it is allowlisted in `CAO_WS_ALLOWED_CLIENTS`.
- If the proxy source changes, add its stable IP to `CAO_WS_ALLOWED_CLIENTS`
  and `CAO_FORWARDED_ALLOW_IPS`; do not use `*`.
- Do not use `CAO_WS_ALLOWED_CLIENTS=*` for an internet-facing deployment.

## Agent workflow

```bash
cd /home/dev/cao-web-patch
agent-run
```

Run this from a real TTY/tmux session. Type the feature request in the
supervisor terminal and press `Ctrl+J` to submit it in the OpenCode TUI.
The workflow installs the five profiles and launches `web_feature_supervisor`.
The supervisor should display `claude-opus-4-8` and immediately assign the
web developer and tester.

## Automated deployment and reconciliation

From a clean checkout:

```bash
./scripts/deploy-local.sh
python3 scripts/reconcile-sessions.py
```

`deploy-local.sh` installs the package, builds the Web UI, installs the five
web-feature profiles, restarts the user service, and waits for `/health`.
`reconcile-sessions.py` is dry-run by default and only reports stale metadata
for sessions using the CAO prefix. Add `--apply` only after reviewing output.
Use `--kill-backend` only together with `--apply` when backend teardown is
intended. It never kills arbitrary tmux sessions.

## Browser E2E smoke tests

```bash
cd web
npm ci
npm run test:e2e:install
CAO_E2E_BASE_URL=http://127.0.0.1:9889 npm run test:e2e
```

Authenticated login coverage is opt-in:

```bash
CAO_E2E_ADMIN_PASSWORD='use-a-test-secret' npm run test:e2e
```

Never commit the password or put it in Playwright config.

## Incident checks

```bash
systemctl --user is-active cao-server
ss -ltn | grep 9889
journalctl --user -u cao-server -n 100 --no-pager
curl -i http://127.0.0.1:9889/health
curl -i http://127.0.0.1:9889/sessions
```

Expected unauthenticated behavior:

- `/health`: public success.
- `/sessions` from loopback: success for internal agents.
- `/sessions` through the public proxy: `401` without a browser session.

## Password rotation

1. Generate a new strong password.
2. Update `~/.config/systemd/user/cao-server.env`.
3. Run `chmod 600 ~/.config/systemd/user/cao-server.env`.
4. Restart the service.
5. Log in from an external browser and verify the old password fails.
6. Revoke old browser sessions by restarting the service if necessary.
