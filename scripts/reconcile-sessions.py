#!/usr/bin/env python3
"""Reconcile stale CAO database rows against live backend sessions.

Safe by default: without --apply this only reports stale sessions. It never
kills arbitrary tmux sessions; it only removes CAO metadata for sessions with
CAO_SESSION_PREFIX (default: cao-). Use the CAO API DELETE endpoint separately
when provider teardown is required.
"""
from __future__ import annotations

import argparse
import json
import os
import sqlite3
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path, default=Path.home() / ".aws/cli-agent-orchestrator/cao.db")
    parser.add_argument("--prefix", default=os.getenv("CAO_SESSION_PREFIX", "cao-"))
    parser.add_argument("--apply", action="store_true", help="delete stale terminal metadata")
    args = parser.parse_args()

    if not args.db.exists():
        print(json.dumps({"status": "ok", "stale": [], "reason": "database_missing"}))
        return 0

    # Import lazily so --help and missing-db checks do not require CAO runtime.
    from cli_agent_orchestrator.backends.registry import get_backend
    from cli_agent_orchestrator.clients.database import delete_terminals_by_session

    live = {item["id"] for item in get_backend().list_sessions()}
    connection = sqlite3.connect(args.db)
    try:
        rows = connection.execute(
            "SELECT DISTINCT tmux_session FROM terminals WHERE tmux_session LIKE ?",
            (f"{args.prefix}%",),
        ).fetchall()
    finally:
        connection.close()

    stale = sorted({row[0] for row in rows} - live)
    removed = []
    if args.apply:
        for session_name in stale:
            delete_terminals_by_session(session_name)
            removed.append(session_name)

    print(json.dumps({"status": "ok", "prefix": args.prefix, "stale": stale, "removed": removed}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
