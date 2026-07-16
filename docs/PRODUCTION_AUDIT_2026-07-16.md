# Production Audit Report

**Date:** 2026-07-16  
**Repository:** `minhtuancn/cli-agent-orchestrator`  
**Branch:** `mobile-responsive`  
**Audited revision:** `8e28227`

## Executive summary

The CAO deployment is operationally viable for a single public domain:

```text
agent.go7s.net -> reverse proxy -> cao-server :9889
```

The Web UI uses session-cookie authentication. Internal CAO agents call
`127.0.0.1:9889` and are allowed through the explicit loopback bypass. The
terminal WebSocket remains protected by both the source allowlist and the
`cao_sid` cookie.

## Verification evidence

- Python compile check: pass.
- Targeted API/MCP/profile tests after audit fixes: **177 passed**.
- Terminal WebSocket tests after updating their authentication contract: **39 passed**.
- Full suite was started; it exceeded the local 120–240 second tool timeout. It
  must complete in CI or with a longer timeout before a release gate is marked green.
- Frontend TypeScript/Vite production build: pass.
- Runtime service: `cao-server.service` active and listening on `0.0.0.0:9889`.
- Runtime auth checks: loopback API without cookie returns 200; external API
  without cookie returns 401; login returns 200.
- Public domain checks: `https://agent.go7s.net/health` returns 200, public UI
  loads in Chromium, and unauthenticated terminal access returns 401.
- Security scanner syntax: `bash -n scripts/security-scan.sh` passes.
- Trivy is configured in `.github/workflows/ci.yml` and CodeQL is configured in
  `.github/workflows/codeql.yml`; local binaries were not installed, so local
  scans were skipped.

## Findings

### High — production secret was stored in the systemd unit

The admin password was embedded directly in `cao-server.service`. This was
changed to an external `cao-server.env` file with mode `0600`. The env file is
outside the repository and must never be committed.

**Remaining operational action:** rotate the password after deployment because
it was previously exposed in the unit file and shell history/context.

### High — WebSocket documentation contradicted enforcement

The endpoint docstring claimed unauthenticated PTY access while the implementation
required `cao_sid`. The docstring and API documentation now describe the actual
contract: valid cookie plus configured source allowlist.

### Medium — WebSocket wildcard allowlist

`CAO_WS_ALLOWED_CLIENTS=*` disables source filtering. The current systemd env
uses loopback-only values. If the reverse proxy requires a non-loopback source,
add only its stable IP or CIDR-compatible value; do not restore `*` unless the
network is explicitly trusted and documented.

### Medium — documentation drift

The web-feature workflow documentation referred to `opus-codex` and port 9887.
The workflow now documents `claude-opus-4-8` for OpenCode and the single-server
9889 topology.

### Medium — runtime profile reproducibility

OpenCode agent files are generated under `~/.aws/opencode/agents/`, outside git.
The source profile is committed, but a new machine still needs `cao install`.
The runbook now treats profile installation as a required deployment step.

### Low — external scanners unavailable

Trivy and CodeQL are not installed on this host. CI or a security workstation
should run both before a production release.

## Remaining risks / backlog

1. Rotate the admin password and update the external env file.
2. Verify NPM Proxy WebSocket upgrade from an external browser.
3. Run the Playwright smoke suite against the real domain and add terminal
   WebSocket/reconnect coverage.
4. `scripts/deploy-local.sh` now automates package/UI/profile deployment; validate
   it from a clean checkout and CI runner.
5. `scripts/reconcile-sessions.py` now provides safe dry-run metadata cleanup;
   process-level orphan cleanup still needs ownership-aware hardening.
6. Install Trivy and CodeQL and archive their results.

## Release recommendation

Do not expose the service publicly with the old password or wildcard WebSocket
allowlist. After password rotation and external WebSocket verification, the
single-domain deployment is suitable for controlled production use.
