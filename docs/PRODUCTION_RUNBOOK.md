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
- Terminal WebSocket connections require both the cookie and the configured
  `CAO_WS_ALLOWED_CLIENTS` source address.

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
- If the proxy source is not loopback, add its stable IP to
  `CAO_WS_ALLOWED_CLIENTS` and `CAO_FORWARDED_ALLOW_IPS`.
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
