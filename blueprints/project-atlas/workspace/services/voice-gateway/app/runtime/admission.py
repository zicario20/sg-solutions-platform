from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Generic, Literal, TypeVar

T = TypeVar("T")
RunStatus = Literal["completed", "unavailable"]
UnavailableReason = Literal["capacity", "timeout", "failure"]


@dataclass(frozen=True, slots=True)
class OperationRunResult(Generic[T]):
    status: RunStatus
    value: T | None = None
    reason: UnavailableReason | None = None


class BoundedOperationRunner(Generic[T]):
    def __init__(self, *, capacity: int, timeout_milliseconds: int) -> None:
        if not 1 <= capacity <= 32:
            raise ValueError("OPERATION_CAPACITY_INVALID")
        if not 1 <= timeout_milliseconds <= 30_000:
            raise ValueError("OPERATION_TIMEOUT_INVALID")
        self._capacity = capacity
        self._timeout_seconds = timeout_milliseconds / 1_000
        self._active = 0

    @property
    def active_operations(self) -> int:
        return self._active

    def _release_deferred(self, task: asyncio.Task[T]) -> None:
        try:
            task.exception()
        except (asyncio.CancelledError, Exception):
            pass
        self._active -= 1

    async def run(
        self,
        operation: Callable[[], Awaitable[T]],
    ) -> OperationRunResult[T]:
        if self._active >= self._capacity:
            return OperationRunResult(status="unavailable", reason="capacity")
        self._active += 1
        task = asyncio.create_task(operation())
        deferred_release = False
        try:
            async with asyncio.timeout(self._timeout_seconds):
                value = await asyncio.shield(task)
            return OperationRunResult(status="completed", value=value)
        except TimeoutError:
            deferred_release = True
            task.add_done_callback(self._release_deferred)
            return OperationRunResult(status="unavailable", reason="timeout")
        except asyncio.CancelledError:
            deferred_release = True
            task.add_done_callback(self._release_deferred)
            raise
        except Exception:
            return OperationRunResult(status="unavailable", reason="failure")
        finally:
            if not deferred_release:
                self._active -= 1
