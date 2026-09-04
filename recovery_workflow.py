"""
recovery_workflow.py

Trust Boundary: Recovery sequence orchestrator and outcome tracker.
Responsibility: Governs multi-step recovery lifecycles, advances workflows through deterministic
state transitions, enforces hard stopping rules, and tracks auditable recovery outcomes and analytics.
Invariant: Purely deterministic state transitions. All state changes are durably persisted in SQLite.
"""

from enum import Enum
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import sqlite3
import json
import uuid
from decimal import Decimal
from pydantic import BaseModel, Field

from schema import PaymentEvent, PaymentStatus, FailureCode
from proposals import DiagnosisProposal
from revenue_risk import RevenueRiskResult
from customer_context import CustomerContext
from smart_recovery import RecoveryStrategy


class WorkflowStatus(str, Enum):
    ACTIVE = "ACTIVE"
    RECOVERED = "RECOVERED"
    EXHAUSTED = "EXHAUSTED"
    ESCALATED = "ESCALATED"
    STOPPED = "STOPPED"


class WorkflowActionRecord(BaseModel):
    step_number: int
    action: str
    timestamp: str
    result: str  # e.g., "SUCCESS", "FAILED", "PENDING", "STOPPED"
    recovered_amount: float = 0.0
    reason: str
    workflow_id: str


class RecoveryWorkflow(BaseModel):
    workflow_id: str
    payment_attempt_group_id: str
    current_step: int = 1
    status: WorkflowStatus = WorkflowStatus.ACTIVE
    actions_taken: List[WorkflowActionRecord] = Field(default_factory=list)
    next_action: Optional[str] = None
    created_at: str
    updated_at: str
    total_recovered_amount: float = 0.0
    total_at_risk: float = 0.0


class RecoveryWorkflowRepository:
    """
    SQLite-backed durable repository for recovery workflows and action outcome logs.
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
                CREATE TABLE IF NOT EXISTS recovery_workflows (
                    workflow_id TEXT PRIMARY KEY,
                    payment_attempt_group_id TEXT UNIQUE NOT NULL,
                    current_step INTEGER NOT NULL,
                    status TEXT NOT NULL,
                    actions_taken_json TEXT NOT NULL,
                    next_action TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    total_recovered_amount REAL NOT NULL DEFAULT 0.0,
                    total_at_risk REAL NOT NULL DEFAULT 0.0
                )
            """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS recovery_outcomes (
                    id TEXT PRIMARY KEY,
                    workflow_id TEXT NOT NULL,
                    step_number INTEGER NOT NULL,
                    action TEXT NOT NULL,
                    result TEXT NOT NULL,
                    recovered_amount REAL NOT NULL DEFAULT 0.0,
                    reason TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    FOREIGN KEY(workflow_id) REFERENCES recovery_workflows(workflow_id)
                )
            """
            )
        conn.close()

    def get_workflow_by_group_id(
        self, payment_attempt_group_id: str
    ) -> Optional[RecoveryWorkflow]:
        conn = self._get_conn()
        cur = conn.execute(
            """
            SELECT workflow_id, payment_attempt_group_id, current_step, status,
                   actions_taken_json, next_action, created_at, updated_at,
                   total_recovered_amount, total_at_risk
            FROM recovery_workflows WHERE payment_attempt_group_id = ?
        """,
            (payment_attempt_group_id,),
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return None

        actions = [WorkflowActionRecord(**a) for a in json.loads(row[4])]
        return RecoveryWorkflow(
            workflow_id=row[0],
            payment_attempt_group_id=row[1],
            current_step=row[2],
            status=WorkflowStatus(row[3]),
            actions_taken=actions,
            next_action=row[5],
            created_at=row[6],
            updated_at=row[7],
            total_recovered_amount=row[8],
            total_at_risk=row[9],
        )

    def get_workflow(self, workflow_id: str) -> Optional[RecoveryWorkflow]:
        conn = self._get_conn()
        cur = conn.execute(
            """
            SELECT workflow_id, payment_attempt_group_id, current_step, status,
                   actions_taken_json, next_action, created_at, updated_at,
                   total_recovered_amount, total_at_risk
            FROM recovery_workflows WHERE workflow_id = ?
        """,
            (workflow_id,),
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return None

        actions = [WorkflowActionRecord(**a) for a in json.loads(row[4])]
        return RecoveryWorkflow(
            workflow_id=row[0],
            payment_attempt_group_id=row[1],
            current_step=row[2],
            status=WorkflowStatus(row[3]),
            actions_taken=actions,
            next_action=row[5],
            created_at=row[6],
            updated_at=row[7],
            total_recovered_amount=row[8],
            total_at_risk=row[9],
        )

    def save_workflow(self, workflow: RecoveryWorkflow):
        conn = self._get_conn()
        actions_json = json.dumps([a.model_dump() for a in workflow.actions_taken])
        with conn:
            conn.execute(
                """
                INSERT INTO recovery_workflows (
                    workflow_id, payment_attempt_group_id, current_step, status,
                    actions_taken_json, next_action, created_at, updated_at,
                    total_recovered_amount, total_at_risk
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(payment_attempt_group_id) DO UPDATE SET
                    current_step = excluded.current_step,
                    status = excluded.status,
                    actions_taken_json = excluded.actions_taken_json,
                    next_action = excluded.next_action,
                    updated_at = excluded.updated_at,
                    total_recovered_amount = excluded.total_recovered_amount,
                    total_at_risk = excluded.total_at_risk
            """,
                (
                    workflow.workflow_id,
                    workflow.payment_attempt_group_id,
                    workflow.current_step,
                    workflow.status.value,
                    actions_json,
                    workflow.next_action,
                    workflow.created_at,
                    workflow.updated_at,
                    workflow.total_recovered_amount,
                    workflow.total_at_risk,
                ),
            )
        conn.close()

    def record_outcome(self, action_record: WorkflowActionRecord):
        conn = self._get_conn()
        with conn:
            conn.execute(
                """
                INSERT INTO recovery_outcomes (
                    id, workflow_id, step_number, action, result,
                    recovered_amount, reason, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
                (
                    str(uuid.uuid4()),
                    action_record.workflow_id,
                    action_record.step_number,
                    action_record.action,
                    action_record.result,
                    action_record.recovered_amount,
                    action_record.reason,
                    action_record.timestamp,
                ),
            )
        conn.close()

    def list_recent_workflows(self, limit: int = 20) -> List[RecoveryWorkflow]:
        conn = self._get_conn()
        cur = conn.execute(
            """
            SELECT workflow_id, payment_attempt_group_id, current_step, status,
                   actions_taken_json, next_action, created_at, updated_at,
                   total_recovered_amount, total_at_risk
            FROM recovery_workflows ORDER BY updated_at DESC LIMIT ?
        """,
            (limit,),
        )
        rows = cur.fetchall()
        conn.close()

        workflows = []
        for row in rows:
            actions = [WorkflowActionRecord(**a) for a in json.loads(row[4])]
            workflows.append(
                RecoveryWorkflow(
                    workflow_id=row[0],
                    payment_attempt_group_id=row[1],
                    current_step=row[2],
                    status=WorkflowStatus(row[3]),
                    actions_taken=actions,
                    next_action=row[5],
                    created_at=row[6],
                    updated_at=row[7],
                    total_recovered_amount=row[8],
                    total_at_risk=row[9],
                )
            )
        return workflows

    def get_outcome_analytics(self) -> Dict[str, Any]:
        conn = self._get_conn()
        cur = conn.execute(
            """
            SELECT 
                COALESCE(SUM(total_at_risk), 0.0),
                COALESCE(SUM(total_recovered_amount), 0.0),
                COUNT(*),
                SUM(CASE WHEN status = 'RECOVERED' THEN 1 ELSE 0 END),
                SUM(CASE WHEN status = 'ESCALATED' THEN 1 ELSE 0 END),
                SUM(CASE WHEN status = 'STOPPED' THEN 1 ELSE 0 END),
                SUM(CASE WHEN status = 'EXHAUSTED' THEN 1 ELSE 0 END)
            FROM recovery_workflows
        """
        )
        row = cur.fetchone()

        cur2 = conn.execute(
            """
            SELECT action, COUNT(*), COALESCE(SUM(recovered_amount), 0.0)
            FROM recovery_outcomes
            WHERE result = 'SUCCESS'
            GROUP BY action
        """
        )
        recovered_by_strategy = {}
        for action, cnt, amt in cur2.fetchall():
            recovered_by_strategy[action] = {"count": cnt, "recovered_amount": amt}

        conn.close()

        total_at_risk = row[0]
        total_recovered = row[1]
        total_workflows = row[2]
        recovered_count = row[3] or 0
        escalated_count = row[4] or 0
        stopped_count = row[5] or 0
        exhausted_count = row[6] or 0

        recovery_rate = (
            round((recovered_count / total_workflows) * 100, 1)
            if total_workflows > 0
            else 0.0
        )

        return {
            "total_at_risk": round(total_at_risk, 2),
            "total_recovered": round(total_recovered, 2),
            "recovery_rate": recovery_rate,
            "total_workflows": total_workflows,
            "recovered_count": recovered_count,
            "number_of_escalations": escalated_count,
            "number_of_stopped_workflows": stopped_count,
            "number_of_exhausted_workflows": exhausted_count,
            "recovered_by_strategy": recovered_by_strategy,
        }


def advance_recovery_workflow(
    event: PaymentEvent,
    customer_context: CustomerContext,
    risk_result: RevenueRiskResult,
    recommended_strategy: str,
    execution_outcome: str,
    workflow_repo: Optional[RecoveryWorkflowRepository] = None,
) -> RecoveryWorkflow:
    """
    Advances or initializes a recovery workflow for a payment event.

    Deterministic Sequence Transitions:
    Step 1: SMART_RETRY (or PAYMENT_LINK if bank degradation / frequent failures)
    Step 2: PAYMENT_LINK (if SMART_RETRY failed)
    Step 3: REMINDER (if PAYMENT_LINK failed)
    Step 4: HUMAN_ESCALATION (final step before exhaustion)

    Hard Stopping Rules:
    - If failure_code is RISK_BLOCKED -> status = STOPPED
    - If execution_outcome == RETRY_SUCCESS or LINK_SENT (recovered) -> status = RECOVERED
    - If retry limits exceeded or 4 steps exhausted without success -> status = EXHAUSTED (or ESCALATED if VIP)
    """
    repo = workflow_repo or RecoveryWorkflowRepository()
    now_iso = datetime.now(timezone.utc).isoformat()
    amount_float = float(event.amount)

    # 1. Fetch or initialize workflow
    workflow = repo.get_workflow_by_group_id(event.payment_attempt_group_id)
    if not workflow:
        workflow = RecoveryWorkflow(
            workflow_id=f"wf_{uuid.uuid4().hex[:12]}",
            payment_attempt_group_id=event.payment_attempt_group_id,
            current_step=1,
            status=WorkflowStatus.ACTIVE,
            actions_taken=[],
            next_action=recommended_strategy,
            created_at=now_iso,
            updated_at=now_iso,
            total_recovered_amount=0.0,
            total_at_risk=amount_float,
        )

    # If already in a terminal state, return directly
    if workflow.status in [
        WorkflowStatus.RECOVERED,
        WorkflowStatus.STOPPED,
        WorkflowStatus.EXHAUSTED,
        WorkflowStatus.ESCALATED,
    ]:
        return workflow

    # Hard Rule 1: Fraud / Risk Hold -> STOPPED
    if (
        event.failure_code == FailureCode.RISK_BLOCKED
        or event.failure_code == "RISK_BLOCKED"
    ):
        action_rec = WorkflowActionRecord(
            step_number=workflow.current_step,
            action="FRAUD_CHECK",
            timestamp=now_iso,
            result="STOPPED",
            recovered_amount=0.0,
            reason="Transaction blocked by compliance / fraud guard.",
            workflow_id=workflow.workflow_id,
        )
        workflow.actions_taken.append(action_rec)
        workflow.status = WorkflowStatus.STOPPED
        workflow.next_action = None
        workflow.updated_at = now_iso
        repo.record_outcome(action_rec)
        repo.save_workflow(workflow)
        return workflow

    # Hard Rule 2: Successful Execution Outcome -> RECOVERED
    is_success = execution_outcome in ["RETRY_SUCCESS", "SUCCESS"]
    if is_success:
        action_rec = WorkflowActionRecord(
            step_number=workflow.current_step,
            action=recommended_strategy,
            timestamp=now_iso,
            result="SUCCESS",
            recovered_amount=amount_float,
            reason="Payment successfully authorized on recovery attempt.",
            workflow_id=workflow.workflow_id,
        )
        workflow.actions_taken.append(action_rec)
        workflow.status = WorkflowStatus.RECOVERED
        workflow.next_action = None
        workflow.total_recovered_amount = amount_float
        workflow.updated_at = now_iso
        repo.record_outcome(action_rec)
        repo.save_workflow(workflow)
        return workflow

    # Execution did not succeed or was an intermediate action (e.g. LINK_SENT / ESCALATED / FAILED)
    step_action = recommended_strategy
    step_result = "DISPATCHED" if execution_outcome in ["LINK_SENT", "ESCALATED"] else "FAILED"

    action_rec = WorkflowActionRecord(
        step_number=workflow.current_step,
        action=step_action,
        timestamp=now_iso,
        result=step_result,
        recovered_amount=0.0,
        reason=f"Executed {step_action} with outcome {execution_outcome}.",
        workflow_id=workflow.workflow_id,
    )
    workflow.actions_taken.append(action_rec)
    repo.record_outcome(action_rec)

    # Determine Next Action in Sequence
    if step_action == "SMART_RETRY":
        workflow.current_step += 1
        workflow.next_action = "PAYMENT_LINK"
        workflow.status = WorkflowStatus.ACTIVE
    elif step_action == "PAYMENT_LINK":
        workflow.current_step += 1
        workflow.next_action = "REMINDER"
        workflow.status = WorkflowStatus.ACTIVE
    elif step_action == "REMINDER":
        workflow.current_step += 1
        workflow.next_action = "HUMAN_ESCALATION"
        workflow.status = WorkflowStatus.ACTIVE
    elif step_action in ["HUMAN_ESCALATION", "STOP_AND_ESCALATE"]:
        workflow.status = WorkflowStatus.ESCALATED
        workflow.next_action = None
    else:
        # If max sequence steps reached (>= 4)
        if workflow.current_step >= 3:
            if customer_context.customer_tier == "HIGH_VALUE":
                workflow.status = WorkflowStatus.ESCALATED
                workflow.next_action = "HUMAN_ESCALATION"
            else:
                workflow.status = WorkflowStatus.EXHAUSTED
                workflow.next_action = None
        else:
            workflow.current_step += 1
            workflow.next_action = "PAYMENT_LINK"

    workflow.updated_at = now_iso
    repo.save_workflow(workflow)
    return workflow
