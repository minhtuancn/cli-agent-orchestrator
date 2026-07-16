# CAO Upgrade Backlog

## P0 — bắt buộc trước production public

- [ ] Rotate `CAO_ADMIN_PASS`; verify password cũ fail.
- [ ] Verify `https://agent.go7s.net` từ browser bên ngoài.
- [ ] Verify WebSocket upgrade/auth qua NPM Proxy.
- [ ] Xác nhận `CAO_WS_ALLOWED_CLIENTS` không dùng `*`.

## P1 — reliability

- [x] Viết script deploy tự động: build Web UI, install package, install profiles,
      restart systemd, health check (`scripts/deploy-local.sh`).
- [x] Làm profile bootstrap reproducible cho OpenCode qua deploy script + `cao install`.
- [x] Thêm cleanup/reconciliation dry-run cho metadata session mồ côi
      (`scripts/reconcile-sessions.py`); process kill tự động vẫn cần hardening tiếp.
- [x] Thêm Playwright E2E smoke scaffold cho health/UI/login opt-in;
      terminal WS/reconnect/full external flow còn cần chạy trên staging/domain.
- [ ] Sửa các cảnh báo test JSDOM còn lại (canvas/xterm) để CI log sạch.

## P2 — security/quality

- [ ] Thêm Trivy vào CI.
- [ ] Thêm CodeQL Python vào CI.
- [ ] Thêm secret scanning vào CI.
- [ ] Thiết kế service token cho agent chạy multi-host.
- [ ] Tăng coverage các module có coverage thấp: memory, terminal, MCP, providers.
- [ ] Tách bundle frontend bằng dynamic import và xử lý cảnh báo chunk >500 kB.

## Đã hoàn tất trong audit gần nhất

- [x] Single-domain topology `agent.go7s.net -> 9889`.
- [x] Loopback API bypass cho agent nội bộ.
- [x] WebSocket yêu cầu session cookie và source allowlist.
- [x] Password không còn nằm trong systemd unit; dùng EnvironmentFile 0600.
- [x] Supervisor dùng `claude-opus-4-8`.
- [x] WebSocket tests cập nhật theo auth contract.
- [x] Scope guard loại trừ đúng login/logout bootstrap endpoints.
- [x] Production audit, runbook và ADR.
- [x] Targeted suite: 177 passed.
- [x] Frontend TypeScript/Vite build pass.
