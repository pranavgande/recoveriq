import pytest
import uuid
import os
from decimal import Decimal
from datetime import datetime, timezone

from schema import PaymentEvent, PaymentStatus, FailureCode
from proposals import DiagnosisProposal, DiagnosisClass
from revenue_risk import calculate_revenue_risk
from customer_context import CustomerContext, CustomerStore, build_customer_context
from smart_recovery import (
    recommend_recovery_strategy,
    RecoveryStrategy,
    StrategyRecommendation,
)


@pytest.fixture
def temp_customer_store(tmp_path):
    db_file = str(tmp_path / "test_customers.db")
    return CustomerStore(db_path=db_file)


def make_event(amount: Decimal, failure_code: FailureCode, group_id: str = None, retry_count: int = 0):
    return PaymentEvent(
        event_id=str(uuid.uuid4()),
        payment_attempt_group_id=group_id or f"group_{uuid.uuid4()}",
        timestamp=datetime.now(timezone.utc),
        merchant_id="M_SWIGGY",
        amount=amount,
        currency="INR",
        payment_method="UPI",
        issuing_bank="HDFC",
        device_type="MOBILE_ANDROID",
        status=PaymentStatus.FAILED,
        failure_code=failure_code,
        retry_count=retry_count,
    )


def test_reliable_repeat_customer(temp_customer_store):
    cust_id = "cust_reliable_123"
    # Seed history: 5 successful payments, 1 failure
    for _ in range(5):
        temp_customer_store.record_payment(cust_id, 1500.0, PaymentStatus.SUCCESS)
    temp_customer_store.record_payment(cust_id, 1500.0, PaymentStatus.FAILED, failure_code="TIMEOUT")

    ctx = temp_customer_store.get_customer_context(cust_id)
    assert ctx.customer_tier == "RELIABLE_REPEAT"
    assert ctx.historical_success_rate > 0.80

    # Test payment failure with insufficient funds
    event = make_event(amount=Decimal("1200.00"), failure_code=FailureCode.INSUFFICIENT_FUNDS)
    proposal = DiagnosisProposal(
        diagnosis_class=DiagnosisClass.INSUFFICIENT_FUNDS,
        confidence=0.95,
        evidence_summary="Explicit insufficient funds",
        evidence_ids=[],
    )
    risk = calculate_revenue_risk(event, proposal, attempt_count=0)

    # For reliable repeat customer with insufficient funds, recommend REMINDER instead of dropping
    rec = recommend_recovery_strategy(event, ctx, risk, proposal, attempt_count=0)
    assert rec.recommended_strategy == RecoveryStrategy.REMINDER
    assert "loyal customer" in rec.strategy_reason.lower() or "reminder" in rec.strategy_reason.lower()


def test_customer_with_repeated_failures(temp_customer_store):
    cust_id = "cust_bad_luck_456"
    # Seed history: 1 success, 6 failures
    temp_customer_store.record_payment(cust_id, 500.0, PaymentStatus.SUCCESS)
    for _ in range(6):
        temp_customer_store.record_payment(cust_id, 500.0, PaymentStatus.FAILED, failure_code="TIMEOUT")

    ctx = temp_customer_store.get_customer_context(cust_id)
    assert ctx.customer_tier == "FREQUENT_FAILURES"
    assert ctx.historical_success_rate < 0.40

    # Even on transient timeout, strategy should offer a PAYMENT_LINK rather than a blind retry
    event = make_event(amount=Decimal("600.00"), failure_code=FailureCode.TIMEOUT)
    proposal = DiagnosisProposal(
        diagnosis_class=DiagnosisClass.TRANSIENT_TIMEOUT,
        confidence=0.90,
        evidence_summary="Gateway timeout",
        evidence_ids=[],
    )
    risk = calculate_revenue_risk(event, proposal, attempt_count=0)

    rec = recommend_recovery_strategy(event, ctx, risk, proposal, attempt_count=0)
    assert rec.recommended_strategy == RecoveryStrategy.PAYMENT_LINK
    assert "frequent failures" in rec.strategy_reason.lower()


def test_high_value_customer(temp_customer_store):
    cust_id = "cust_vip_789"
    # Seed high transaction volume
    for _ in range(4):
        temp_customer_store.record_payment(cust_id, 12000.0, PaymentStatus.SUCCESS)

    ctx = temp_customer_store.get_customer_context(cust_id)
    assert ctx.customer_tier == "HIGH_VALUE"

    event = make_event(amount=Decimal("15000.00"), failure_code=FailureCode.ISSUER_DOWN)
    proposal = DiagnosisProposal(
        diagnosis_class=DiagnosisClass.BANK_DEGRADATION,
        confidence=0.95,
        evidence_summary="HDFC bank degraded",
        evidence_ids=[],
    )
    risk = calculate_revenue_risk(event, proposal, attempt_count=0)

    rec = recommend_recovery_strategy(event, ctx, risk, proposal, attempt_count=0)
    # Bank degradation should recommend Payment Link to bypass issuer
    assert rec.recommended_strategy == RecoveryStrategy.PAYMENT_LINK
    assert "degraded" in rec.strategy_reason.lower()


def test_fraud_risk_blocked_payment(temp_customer_store):
    cust_id = "cust_suspicious_000"
    ctx = temp_customer_store.get_customer_context(cust_id)

    event = make_event(amount=Decimal("25000.00"), failure_code=FailureCode.RISK_BLOCKED)
    risk = calculate_revenue_risk(event, attempt_count=0)

    rec = recommend_recovery_strategy(event, ctx, risk, attempt_count=0)
    # Hard safety check: must be NO_ACTION regardless of amount
    assert rec.recommended_strategy == RecoveryStrategy.NO_ACTION
    assert "RISK_BLOCKED" in rec.strategy_reason


def test_exhausted_retry_case(temp_customer_store):
    cust_id = "cust_exhausted_111"
    ctx = temp_customer_store.get_customer_context(cust_id)

    # Retry count / attempt count already at 1 or higher
    event = make_event(amount=Decimal("200.00"), failure_code=FailureCode.TIMEOUT, retry_count=1)
    proposal = DiagnosisProposal(
        diagnosis_class=DiagnosisClass.TRANSIENT_TIMEOUT,
        confidence=0.95,
        evidence_summary="Timeout",
        evidence_ids=[],
    )
    risk = calculate_revenue_risk(event, proposal, attempt_count=1)

    rec = recommend_recovery_strategy(event, ctx, risk, proposal, attempt_count=1)
    # Standard customer with exhausted retries -> NO_ACTION (cannot retry again)
    assert rec.recommended_strategy == RecoveryStrategy.NO_ACTION
    assert "limit exceeded" in rec.strategy_reason.lower() or "limit reached" in rec.strategy_reason.lower()


def test_high_value_exhausted_retry_escalates(temp_customer_store):
    cust_id = "cust_vip_escalate"
    for _ in range(5):
        temp_customer_store.record_payment(cust_id, 15000.0, PaymentStatus.SUCCESS)
    ctx = temp_customer_store.get_customer_context(cust_id)
    assert ctx.customer_tier == "HIGH_VALUE"

    event = make_event(amount=Decimal("12000.00"), failure_code=FailureCode.TIMEOUT, retry_count=1)
    proposal = DiagnosisProposal(
        diagnosis_class=DiagnosisClass.TRANSIENT_TIMEOUT,
        confidence=0.95,
        evidence_summary="Timeout",
        evidence_ids=[],
    )
    risk = calculate_revenue_risk(event, proposal, attempt_count=1)

    rec = recommend_recovery_strategy(event, ctx, risk, proposal, attempt_count=1)
    # High value customer with exhausted retries gets HUMAN_ESCALATION
    assert rec.recommended_strategy == RecoveryStrategy.HUMAN_ESCALATION
    assert "human support" in rec.strategy_reason.lower()
