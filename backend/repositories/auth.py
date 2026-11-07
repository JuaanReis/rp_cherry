"""Persistência das sessões e das tentativas de login."""


def get_session(conn, token_hash, timestamp):
    row = conn.execute(
        "SELECT * FROM admin_sessions WHERE token_hash=? AND expires_at>?",
        (token_hash, timestamp),
    ).fetchone()
    return dict(row) if row else None


def clear_old_attempts(conn, cutoff):
    conn.execute("DELETE FROM login_attempts WHERE first_attempt < ?", (cutoff,))


def failed_attempts(conn, client_key):
    row = conn.execute("SELECT failures FROM login_attempts WHERE client_key=?", (client_key,)).fetchone()
    return row["failures"] if row else 0


def record_failure(conn, client_key, timestamp):
    conn.execute(
        "INSERT INTO login_attempts VALUES (?,1,?) "
        "ON CONFLICT(client_key) DO UPDATE SET failures=failures+1",
        (client_key, timestamp),
    )


def clear_attempts(conn, client_key):
    conn.execute("DELETE FROM login_attempts WHERE client_key=?", (client_key,))


def clear_expired_sessions(conn, timestamp):
    conn.execute("DELETE FROM admin_sessions WHERE expires_at <= ?", (timestamp,))


def delete_session(conn, token_hash):
    conn.execute("DELETE FROM admin_sessions WHERE token_hash=?", (token_hash,))


def create_session(conn, token_hash, csrf, expires_at):
    conn.execute("INSERT INTO admin_sessions VALUES (?,?,?)", (token_hash, csrf, expires_at))
