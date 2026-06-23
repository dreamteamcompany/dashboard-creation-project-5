"""Универсальное получение и сохранение данных дашборда по dashboard_id."""
import json
import os
import psycopg2
from psycopg2.extras import execute_values

SCHEMA = "t_p56096254_dashboard_creation_p"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    dashboard_id = params.get("dashboard_id")

    if not dashboard_id:
        return {
            "statusCode": 400,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"error": "dashboard_id required"}),
        }

    conn = psycopg2.connect(os.environ["DATABASE_URL"], connect_timeout=5)
    cur = conn.cursor()
    cur.execute("SET lock_timeout = '3s'")
    cur.execute("SET statement_timeout = '8s'")
    cur.execute("SET idle_in_transaction_session_timeout = '8s'")

    try:
        cur.execute(
            f"SELECT id, columns FROM {SCHEMA}.dashboards WHERE id = %s",
            (int(dashboard_id),),
        )
        dash = cur.fetchone()
        if not dash:
            return {
                "statusCode": 404,
                "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"error": "Dashboard not found"}),
            }

        columns = dash[1] if isinstance(dash[1], list) else json.loads(dash[1])
        col_keys = [c["key"] for c in columns]

        if method == "GET" and params.get("cleanup") == "1":
            cur.execute(
                f"""DELETE FROM {SCHEMA}.dashboard_rows
                    WHERE dashboard_id = %s
                      AND id NOT IN (
                          SELECT MIN(id) FROM {SCHEMA}.dashboard_rows
                          WHERE dashboard_id = %s
                          GROUP BY city
                      )""",
                (int(dashboard_id), int(dashboard_id)),
            )
            removed = cur.rowcount
            conn.commit()
            return {
                "statusCode": 200,
                "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": True, "removed": removed}),
            }

        if method == "GET":
            raw_mode = params.get("raw") == "1"
            cur.execute(
                f"SELECT id, city, data FROM {SCHEMA}.dashboard_rows WHERE dashboard_id = %s ORDER BY id",
                (int(dashboard_id),),
            )
            rows = cur.fetchall()
            result = []
            for r in rows:
                row_data = r[2] if isinstance(r[2], dict) else json.loads(r[2])
                if raw_mode:
                    item = {"id": r[0], "city": r[1], "data": row_data}
                else:
                    item = {"id": r[0], "city": r[1]}
                    for k in col_keys:
                        item[k] = row_data.get(k, 0)
                    if "fact" not in item:
                        item["fact"] = row_data.get("fact", 0)
                result.append(item)
            return {
                "statusCode": 200,
                "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps(result, ensure_ascii=False),
            }

        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            rows = body.get("rows", [])

            # Существующие строки города -> id, чтобы не плодить дубли
            cur.execute(
                f"SELECT id, city FROM {SCHEMA}.dashboard_rows WHERE dashboard_id = %s",
                (int(dashboard_id),),
            )
            city_to_id = {}
            for rid, rcity in cur.fetchall():
                city_to_id.setdefault(rcity, rid)

            updates = []  # (id, city, data_json)
            inserts = []  # (city, data_json)
            seen_insert_cities = set()

            for row in rows:
                row_id = row.get("id")
                city = row.get("city", "")
                if not city:
                    continue
                full = {k: int(row.get(k, 0)) for k in col_keys}
                if not row_id:
                    row_id = city_to_id.get(city)
                if row_id:
                    updates.append((int(row_id), city, json.dumps(full)))
                elif city not in seen_insert_cities:
                    inserts.append((int(dashboard_id), city, json.dumps(full)))
                    seen_insert_cities.add(city)

            if updates:
                execute_values(
                    cur,
                    f"""UPDATE {SCHEMA}.dashboard_rows AS t
                        SET data = v.data::jsonb, city = v.city, updated_at = NOW()
                        FROM (VALUES %s) AS v(id, city, data)
                        WHERE t.id = v.id::int AND t.dashboard_id = {int(dashboard_id)}""",
                    updates,
                )

            if inserts:
                execute_values(
                    cur,
                    f"INSERT INTO {SCHEMA}.dashboard_rows (dashboard_id, city, data) VALUES %s",
                    [(d, c, dj) for (d, c, dj) in inserts],
                    template="(%s, %s, %s::jsonb)",
                )

            conn.commit()
            return {
                "statusCode": 200,
                "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": True}),
            }

    except Exception as e:
        conn.rollback()
        return {
            "statusCode": 500,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)}),
        }
    finally:
        cur.close()
        conn.close()

    return {
        "statusCode": 405,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps({"error": "Method not allowed"}),
    }