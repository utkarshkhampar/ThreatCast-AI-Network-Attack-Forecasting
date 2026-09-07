#!/usr/bin/env python3
"""
ThreatCast - Database Inspector CLI
Allows operators and administrators to query registered users, clearance states,
and all primary table metrics across local SQLite or live cloud deployment.

Usage:
  python3 scripts/inspect_db.py             # Inspect local threatcast.db
  python3 scripts/inspect_db.py --remote    # Inspect live Render cloud database
  python3 scripts/inspect_db.py --url <URL> # Custom API URL
"""

import sys
import os
import argparse
import json
import sqlite3
from urllib import request, error


def format_table(headers, rows):
    if not rows:
        return "  (No records found)"
    
    col_widths = [len(h) for h in headers]
    for row in rows:
        for i, val in enumerate(row):
            col_widths[i] = max(col_widths[i], len(str(val)))
            
    header_line = " | ".join(h.ljust(col_widths[i]) for i, h in enumerate(headers))
    separator = "-+-".join("-" * col_widths[i] for i in range(len(headers)))
    row_lines = [
        " | ".join(str(val).ljust(col_widths[i]) for i, val in enumerate(row))
        for row in rows
    ]
    return f"{header_line}\n{separator}\n" + "\n".join(row_lines)


def inspect_local(db_path="threatcast.db"):
    if not os.path.exists(db_path):
        print(f"[-] Database file not found at: {db_path}")
        return

    print("=" * 72)
    print(f"  THREATCAST DATABASE INSPECTOR  [LOCAL SQLITE: {db_path}]")
    print("=" * 72)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Inspect Users
    cursor.execute("""
        SELECT id, username, email, role, is_verified, created_at 
        FROM users 
        ORDER BY id ASC;
    """)
    user_rows = cursor.fetchall()

    total_users = len(user_rows)
    verified_users = sum(1 for r in user_rows if r[4] in (1, True))
    pending_users = total_users - verified_users

    print(f"\n[+] USER CLEARANCE SUMMARY:")
    print(f"    Total Operators Registered : {total_users}")
    print(f"    Verified (Active Clearance): {verified_users}")
    print(f"    Pending OTP Verification   : {pending_users}")

    user_table_data = [
        [
            r[0],
            r[1],
            r[2],
            r[3],
            "VERIFIED" if r[4] in (1, True) else "PENDING_OTP",
            str(r[5])[:19] if r[5] else "N/A"
        ]
        for r in user_rows
    ]

    print("\n[+] REGISTERED USERS DIRECTORY:")
    headers = ["ID", "Username", "Email", "Role", "Status", "Registered At"]
    print(format_table(headers, user_table_data))

    # 2. Inspect All Database Tables
    print("\n[+] DATABASE TABLE ROW COUNTS:")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    tables = [t[0] for t in cursor.fetchall() if not t[0].startswith("sqlite_")]

    table_data = []
    for t in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {t};")
            count = cursor.fetchone()[0]
            table_data.append([t, count])
        except Exception as e:
            table_data.append([t, f"Error: {e}"])

    print(format_table(["Table Name", "Total Records"], table_data))
    print("=" * 72)
    conn.close()


def inspect_remote(base_url="https://threatcast-ai-network-attack-forecasting.onrender.com/api/v1"):
    url = f"{base_url.rstrip('/')}/users"
    print("=" * 72)
    print(f"  THREATCAST DATABASE INSPECTOR  [REMOTE CLOUD: {url}]")
    print("=" * 72)

    try:
        req = request.Request(url, headers={"User-Agent": "ThreatCast-Inspector/1.0"})
        with request.urlopen(req, timeout=15) as response:
            if response.status != 200:
                print(f"[-] HTTP Error {response.status} connecting to {url}")
                return
            data = json.loads(response.read().decode("utf-8"))

        total_users = len(data)
        verified_users = sum(1 for u in data if u.get("is_verified") is True)
        pending_users = total_users - verified_users

        print(f"\n[+] USER CLEARANCE SUMMARY:")
        print(f"    Total Operators Registered : {total_users}")
        print(f"    Verified (Active Clearance): {verified_users}")
        print(f"    Pending OTP Verification   : {pending_users}")

        user_table_data = [
            [
                u.get("id"),
                u.get("username"),
                u.get("email"),
                u.get("role"),
                "VERIFIED" if u.get("is_verified") else "PENDING_OTP",
                str(u.get("created_at", ""))[:19] or "N/A"
            ]
            for u in data
        ]

        print("\n[+] REGISTERED USERS DIRECTORY (PRODUCTION):")
        headers = ["ID", "Username", "Email", "Role", "Status", "Registered At"]
        print(format_table(headers, user_table_data))

        # Also fetch overview if available
        overview_url = f"{base_url.rstrip('/')}/users/database-overview"
        try:
            ov_req = request.Request(overview_url, headers={"User-Agent": "ThreatCast-Inspector/1.0"})
            with request.urlopen(ov_req, timeout=10) as ov_resp:
                if ov_resp.status == 200:
                    ov_data = json.loads(ov_resp.read().decode("utf-8"))
                    print("\n[+] PRODUCTION TABLE METRICS:")
                    tables = [[k, v] for k, v in ov_data.get("tables", {}).items()]
                    print(format_table(["Table Name", "Total Records"], tables))
        except Exception:
            pass

        print("=" * 72)

    except error.URLError as e:
        print(f"[-] Network connection error: {e}")
    except Exception as e:
        print(f"[-] Error querying remote API: {e}")


def main():
    parser = argparse.ArgumentParser(description="ThreatCast Database & Operator Clearance Inspector")
    parser.add_argument("--remote", action="store_true", help="Query live cloud Render database API")
    parser.add_argument("--url", type=str, help="Custom API URL (e.g. https://threatcast.netlify.app/api/v1)")
    parser.add_argument("--db", type=str, default="threatcast.db", help="Local SQLite file path (default: threatcast.db)")
    args = parser.parse_args()

    if args.url:
        inspect_remote(args.url)
    elif args.remote:
        inspect_remote()
    else:
        inspect_local(args.db)


if __name__ == "__main__":
    main()
