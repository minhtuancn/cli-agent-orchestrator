# Upgrade Plan: CAO Production Readiness

## Overview

Hoàn thiện vận hành CAO sau audit: bảo mật secret, kiểm tra public WebSocket,
tái lập deployment, E2E browser, cleanup session mồ côi và security gates.
Không thay đổi kiến trúc single-domain `agent.go7s.net -> 9889` trong phase này.

## Architecture decisions

- Giữ một CAO server trên `9889`.
- Browser dùng session cookie `cao_sid`.
- Agent cùng host gọi loopback `127.0.0.1`.
- WebSocket luôn yêu cầu cookie + source allowlist.
- Profile supervisor dùng `claude-opus-4-8` khi chạy OpenCode.

## Phase 0: Production blockers

### Task 1: Rotate admin secret

**Status:** Pending operator action (must be done outside git).

**Acceptance criteria:**
- [ ] Password cũ không còn dùng được.
- [ ] `cao-server.env` có mode `0600`, không nằm trong git.
- [ ] Login mới và Remember me hoạt động.

**Verification:** restart systemd, login bằng browser/curl, kiểm tra old password fail.

**Dependencies:** None.

### Task 2: Verify external domain and WebSocket

**Status:** Pending external browser/NPM Proxy verification.

**Acceptance criteria:**
- [ ] `https://agent.go7s.net/` load được.
- [ ] Login và logout hoạt động.
- [ ] Terminal WebSocket upgrade thành công qua NPM Proxy.
- [ ] Không có cookie thì WS bị từ chối.

**Verification:** browser DevTools + Playwright/manual external browser.

**Dependencies:** Task 1.

## Phase 1: Deployment reliability

### Task 3: Automated local deployment

**Acceptance criteria:**
- [ ] Một script build/install package, build Web UI và install profiles.
- [ ] Restart systemd và health check tự động.
- [ ] Không cần copy thủ công vào `site-packages`.

**Verification:** chạy trên clean checkout và kiểm tra service/UI/profile.

**Dependencies:** None.

### Task 4: Reproducible supervisor profile bootstrap

**Acceptance criteria:**
- [ ] `cao install` tạo đúng OpenCode agent file trên máy mới.
- [ ] Model `claude-opus-4-8` được phản ánh trong runtime.
- [ ] Supervisor không có file tools và delegate worker.

**Verification:** xóa profile runtime trong test sandbox, chạy installer, launch smoke test.

**Dependencies:** Task 3.

## Phase 2: Runtime resilience

### Task 5: Orphan session reconciliation

**Acceptance criteria:**
- [ ] Server restart phát hiện session/terminal stale.
- [ ] Có lệnh cleanup an toàn, không đụng session tmux không thuộc CAO.
- [ ] Worker process và DB metadata không bị bỏ lại vô hạn.

**Verification:** kill worker/server giả lập, restart, kiểm tra cleanup/log.

**Dependencies:** None.

### Task 6: Browser E2E regression suite

**Acceptance criteria:**
- [ ] Login/Remember me/logout.
- [ ] Session list và terminal WebSocket.
- [ ] Reconnect sau refresh/network interruption.
- [ ] EN/VI Guide và responsive smoke test.

**Verification:** Playwright trên local và staging domain.

**Dependencies:** Task 2.

## Phase 3: Security and performance

### Task 7: CI security gates

**Acceptance criteria:**
- [ ] Trivy filesystem/dependency scan.
- [ ] CodeQL Python scan.
- [ ] Secret scan không có credential thật.
- [ ] Kết quả lưu trong CI artifact.

**Verification:** CI workflow pass trên branch.

**Dependencies:** None.

### Task 8: Agent service token for multi-host mode

**Acceptance criteria:**
- [ ] Agent không cần loopback bypass khi chạy host khác.
- [ ] Token ngắn hạn, scope riêng, rotation documented.
- [ ] Loopback mode vẫn backward-compatible.

**Verification:** integration test local + second-host simulation.

**Dependencies:** Task 4.

### Task 9: Frontend bundle optimization

**Acceptance criteria:**
- [ ] Tách các panel lớn bằng dynamic import.
- [ ] Main JS chunk dưới 500 kB hoặc warning có lý do được document.
- [ ] Không làm mất route/i18n/auth flow.

**Verification:** `npm run build`, browser smoke test.

**Dependencies:** Task 6.

## Checkpoints

### Checkpoint A — production gate

- [ ] Password rotated.
- [ ] External HTTPS and WebSocket verified.
- [ ] No wildcard WS allowlist.

### Checkpoint B — reliable deployment

- [ ] Automated deploy works from clean checkout.
- [ ] Supervisor profile is reproducible.
- [ ] Targeted tests and frontend build pass.

### Checkpoint C — complete

- [ ] E2E/security gates pass.
- [ ] Runtime resilience tested.
- [ ] Runbook and audit report updated.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| NPM Proxy source IP changes | High | Identify stable proxy IP or use private network policy |
| Loopback bypass abused after host compromise | High | Implement scoped service token for multi-host |
| Generated OpenCode files drift | Medium | Automated profile bootstrap and smoke test |
| Large full suite runtime | Medium | CI parallelization and targeted gates |
| Orphan tmux processes | Medium | Ownership tags and reconciliation command |
