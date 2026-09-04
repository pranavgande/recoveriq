"""
customer_context.py

Trust Boundary: Customer contextualization and persistent profile store.
Responsibility: Tracks customer payment history, calculates historical aggregates,
and builds CustomerContext for incoming transactions.
Invariant: Purely deterministic calculations. Concurrency-safe SQLite storage.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from decimal import Decimal
import sqlite3
from schema import PaymentEvent, PaymentStatus


class CustomerContext(BaseModel):
    """
    Structured customer historical profile and performance metrics.
    """
    customer_id: str
    total_successful_payments: int = 0
    total_failed_payments: int = 0
    historical_success_rate: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Ratio of successful payments to total attempts (0.0 - 1.0)",
    )
    previous_recovery_attempts: int = 0
    average_transaction_value: float = Field(
        ...,
        ge=0.0,
        description="Average transaction value in INR",
    )
    recent_failures: List[str] = Field(
        default_factory=list,
        description="List of failure codes in recent transactions",
    )
    customer_tier: str = Field(
        default="STANDARD",
        description="HIGH_VALUE, RELIABLE_REPEAT, FREQUENT_FAILURES, or STANDARD",
    )


class CustomerStore:
    """
    Persistent SQLite customer context repository.
    Tracks historical payments, calculates aggregates, and caches customer profiles.
    """

    def __init__(self, db_path: str = "idempotency.db"):
        self.db_path = db_path
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.execute("PRAGMA journal_mode = WAL")
        return conn

    def _init_db(self):
        conn = self._get_conn()
        with conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS customer_profiles (
                    customer_id TEXT PRIMARY KEY,
                    total_successful INTEGER NOT NULL DEFAULT 0,
                    total_failed INTEGER NOT NULL DEFAULT 0,
                    total_volume REAL NOT NULL DEFAULT 0.0,
                    recovery_attempts INTEGER NOT NULL DEFAULT 0,
                    recent_failures_json TEXT NOT NULL DEFAULT '[]'
                )
            """
            )
        conn.close()

    def record_payment(
        self,
        customer_id: str,
        amount: float,
        status: PaymentStatus,
        failure_code: Optional[str] = None,
        is_recovery_attempt: bool = False,
    ):
        """Records a payment outcome and updates customer aggregates atomically."""
        conn = self._get_conn()
        import json

        with conn:
            cur = conn.execute(
                "SELECT total_successful, total_failed, total_volume, recovery_attempts, recent_failures_json FROM customer_profiles WHERE customer_id = ?",
                (customer_id,),
            )
            row = cur.fetchone()
            if row:
                succ, fail, vol, recov, fail_json = row
                recent_failures = json.loads(fail_json)
            else:
                succ, fail, vol, recov = 0, 0, 0.0, 0
                recent_failures = []

            if status == PaymentStatus.SUCCESS or status == "SUCCESS":
                succ += 1
            else:
                fail += 1
                if failure_code:
                    recent_failures.append(str(failure_code))
                    recent_failures = recent_failures[-5:]  # keep last 5

            vol += float(amount)
            if is_recovery_attempt:
                recov += 1

            conn.execute(
                """
                INSERT INTO customer_profiles (customer_id, total_successful, total_failed, total_volume, recovery_attempts, recent_failures_json)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(customer_id) DO UPDATE SET
                    total_successful = excluded.total_successful,
                    total_failed = excluded.total_failed,
                    total_volume = excluded.total_volume,
                    recovery_attempts = excluded.recovery_attempts,
                    recent_failures_json = excluded.recent_failures_json
            """,
                (customer_id, succ, fail, vol, recov, json.dumps(recent_failures)),
            )
        conn.close()

    def get_customer_context(self, customer_id: str) -> CustomerContext:
        """Retrieves and calculates customer profile metrics."""
        import json

        conn = self._get_conn()
        cur = conn.execute(
            "SELECT total_successful, total_failed, total_volume, recovery_attempts, recent_failures_json FROM customer_profiles WHERE customer_id = ?",
            (customer_id,),
        )
        row = cur.fetchone()
        conn.close()

        if not row:
            return CustomerContext(
                customer_id=customer_id,
                total_successful_payments=0,
                total_failed_payments=0,
                historical_success_rate=0.85,  # baseline platform prior
                previous_recovery_attempts=0,
                average_transaction_value=0.0,
                recent_failures=[],
                customer_tier="STANDARD",
            )

        succ, fail, vol, recov, fail_json = row
        total_tx = succ + fail
        success_rate = (succ / total_tx) if total_tx > 0 else 0.85
        avg_val = (vol / total_tx) if total_tx > 0 else 0.0
        failures = json.loads(fail_json) if fail_json else []

        # Determine Customer Tier
        if avg_val >= 5000.0 or vol >= 25000.0:
            tier = "HIGH_VALUE"
        elif succ >= 3 and success_rate >= 0.75:
            tier = "RELIABLE_REPEAT"
        elif fail >= 3 and success_rate < 0.40:
            tier = "FREQUENT_FAILURES"
        else:
            tier = "STANDARD"

        return CustomerContext(
            customer_id=customer_id,
            total_successful_payments=succ,
            total_failed_payments=fail,
            historical_success_rate=round(success_rate, 2),
            previous_recovery_attempts=recov,
            average_transaction_value=round(avg_val, 2),
            recent_failures=failures,
            customer_tier=tier,
        )


def build_customer_context(
    event: PaymentEvent,
    customer_store: Optional[CustomerStore] = None,
) -> CustomerContext:
    """
    Deterministic service that derives or looks up a customer profile for a given PaymentEvent.
    """
    # Deterministic customer_id derivation from event attributes if not explicit
    customer_id = getattr(event, "customer_id", None)
    if not customer_id:
        import hashlib

        # Derive a stable customer hash from payment_attempt_group_id or merchant + method context
        # In synthetic datasets, payment_attempt_group_id prefixes or merchant/bank combinations
        # map to identifiable customer cohorts
        group = event.payment_attempt_group_id
        h = hashlib.md5(group.encode()).hexdigest()[:8]
        customer_id = f"cust_{h}"

    store = customer_store or CustomerStore()
    return store.get_customer_context(customer_id)
