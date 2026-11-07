"""Small in-memory rate limiter for public API endpoints."""

from collections import defaultdict, deque
from dataclasses import dataclass
from threading import Lock
from time import monotonic


@dataclass(frozen=True)
class Limit:
    requests: int
    window_seconds: int


class RateLimiter:
    def __init__(self):
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def allow(self, key: str, limit: Limit) -> tuple[bool, int, int]:
        now = monotonic()
        cutoff = now - limit.window_seconds

        with self._lock:
            events = self._events[key]
            while events and events[0] <= cutoff:
                events.popleft()

            if len(events) >= limit.requests:
                retry_after = max(1, int(limit.window_seconds - (now - events[0])) + 1)
                return False, 0, retry_after

            events.append(now)
            return True, limit.requests - len(events), 0


limiter = RateLimiter()
