"""Consultas e gravações das métricas de interesse nos produtos."""


def record_view(conn, product_id, visitor_hash, day, cutoff):
    conn.execute("DELETE FROM view_dedup WHERE day<?", (cutoff,))
    cursor = conn.execute(
        "INSERT OR IGNORE INTO view_dedup VALUES (?,?,?)",
        (product_id, visitor_hash, day),
    )
    counted = cursor.rowcount == 1
    if counted:
        conn.execute(
            "INSERT INTO product_views VALUES (?,?,1) "
            "ON CONFLICT(product_id,day) DO UPDATE SET view_count=view_count+1",
            (product_id, day),
        )
    return counted


def daily_views(conn, start):
    return {
        row["day"]: row["count"]
        for row in conn.execute(
            "SELECT day,SUM(view_count) AS count FROM product_views WHERE day>=? GROUP BY day",
            (start,),
        )
    }


def product_views(conn, start):
    return {
        row["product_id"]: row["count"]
        for row in conn.execute(
            "SELECT product_id,SUM(view_count) AS count FROM product_views WHERE day>=? GROUP BY product_id",
            (start,),
        )
    }


def delete_product(conn, product_id):
    conn.execute("DELETE FROM product_views WHERE product_id=?", (product_id,))
    conn.execute("DELETE FROM view_dedup WHERE product_id=?", (product_id,))


def clear(conn):
    conn.execute("DELETE FROM product_views")
    conn.execute("DELETE FROM view_dedup")
