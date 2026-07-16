# ADR-001: Single Authenticated Server with Loopback Agent Access

## Status

Accepted

## Date

2026-07-16

## Context

CAO exposes a browser Web UI, REST API, and terminal WebSocket. The public
deployment uses `agent.go7s.net` and must require administrator authentication.
Internal supervisor and worker agents run on the same host and need to call the
CAO API without possessing a browser session cookie.

Two ports were considered: one authenticated public server and one separate
unauthenticated internal server. The second server increases operational
complexity, creates two lifecycle states, and can be accidentally exposed.

## Decision

Run one CAO server on port 9889 with admin authentication enabled. Permit API
requests originating from `127.0.0.1` or `::1` through a narrowly scoped
loopback bypass. Keep public requests protected by the `cao_sid` session cookie.

The terminal WebSocket is stricter: it requires both a valid session cookie and
an allowed client source configured by `CAO_WS_ALLOWED_CLIENTS`.

## Alternatives considered

### Separate internal port 9887

Rejected as the default because it duplicates the server lifecycle and creates
a second port that can be misconfigured or exposed. It remains available as an
explicit override for isolated development.

### Service token for agents

Deferred. A dedicated short-lived internal token would remove the loopback
trust assumption, but requires token issuance, rotation, and MCP integration.
It is the preferred future hardening path for multi-host deployments.

### Disable authentication on the public server

Rejected. The terminal endpoint provides full PTY access and must not be
internet-accessible without authentication.

## Consequences

- One systemd service and one reverse-proxy target.
- Internal agents work without browser-cookie plumbing.
- A local process compromise can call the API; host security remains important.
- Multi-host agent execution will require a service-token design or explicit
  network policy.
- WebSocket proxy configuration must preserve cookies and upgrade headers.
