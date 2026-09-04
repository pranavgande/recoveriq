import pytest
import uuid
from decimal import Decimal
from datetime import datetime, timezone

from schema import PaymentEvent, PaymentStatus, FailureCode
from proposals import DiagnosisProposal, DiagnosisClass
from revenue_risk import calculate_revenue_risk, RiskLevel


def make_event(amount: Decimal, failure_code: FailureCode, retry_count: int = 0, method: str = "UPI"):
    return PaymentEvent(
        event_id=str(uuid.uuid4()),
        payment_attempt_group_id=f"group_{uuid.uuid4()}",
        timestamp=datetime.now(timezone.utc),
        merchant_id="M_AMAZON",
        amount=amount,
        currency="INR",
        payment_method=method,
        issuing_bank="HDFC",
        device_type="MOBILE_ANDROID",
        status=PaymentStatus.FAILED,
        failure_code=failure_code,
        retry_count=retry_count,
    )


def test_high_value_failed_payment():
    # High value (> 2500 INR), fresh transient timeout
    event = make_event(amount=Decimal("15000.00"), failure_code=FailureCode.TIMEOUT)
    proposal = DiagnosisProposal(
        diagnosis_class=DiagnosisClass.TRANSIENT_TIMEOUT,
        confidence=0.95,
        evidence_summary="Isolated timeout",
        evidence_ids=[],
    )

    result = calculate_revenue_risk(event, proposal, attempt_count=0)

    # 40 (val) + 35 (transient) + 15 (0 retries) + 8 (UPI) = 98 -> HIGH
    assert result.risk_level == RiskLevel.HIGH
    assert result.risk_score >= 70.0
    assert result.estimated_recoverable_amount > Decimal("10000.00")
    assert "High Value" in result.explanation
    assert "> 2,500 INR" in result.factors["value_component"]["tier"]


def test_low_value_failed_payment():
    # Low value (< 100 INR)
    event = make_event(amount=Decimal("45.00"), failure_code=FailureCode.INSUFFICIENT_FUNDS)

    result = calculate_revenue_risk(event, attempt_count=0)

    # 5 (val) + 10 (insufficient) + 15 (0 retries) + 8 (UPI) = 38 -> LOW
    assert result.risk_level == RiskLevel.LOW
    assert result.risk_score < 40.0
    # Expected yield for insufficient funds is 10%: 45 * 0.10 = 4.50
    assert result.estimated_recoverable_amount == Decimal("4.50")
    assert "Low Value" in result.explanation


def test_repeated_failure():
    # Attempt count >= 2 means retry exhausted
    event = make_event(amount=Decimal("3500.00"), failure_code=FailureCode.TIMEOUT, retry_count=2)

    result = calculate_revenue_risk(event, attempt_count=2)

    # Retry component should be 0, recoverable amount should drop to 0
    assert result.factors["retry_component"]["score"] == 0.0
    assert result.estimated_recoverable_amount == Decimal("0.00")
    assert "attempts exhausted" in result.explanation


def test_fraud_risk_blocked_payment():
    # Fraud / compliance blocked payment
    event = make_event(amount=Decimal("12000.00"), failure_code=FailureCode.RISK_BLOCKED)

    result = calculate_revenue_risk(event, attempt_count=0)

    # Even with high amount, recovery probability is strictly 0%
    assert result.estimated_recoverable_amount == Decimal("0.00")
    assert result.factors["failure_component"]["score"] == 5.0
    assert "Risk blocked / Fraud hold" in result.explanation


def test_normal_transient_failure():
    # Typical transient timeout on moderate transaction
    event = make_event(amount=Decimal("1200.00"), failure_code=FailureCode.TIMEOUT)
    proposal = DiagnosisProposal(
        diagnosis_class=DiagnosisClass.TRANSIENT_TIMEOUT,
        confidence=0.90,
        evidence_summary="Gateway latency timeout",
        evidence_ids=[],
    )

    result = calculate_revenue_risk(event, proposal, attempt_count=0)

    # 28 (val 500-2500) + 35 (timeout) + 15 (0 retries) + 8 (UPI) = 86 -> HIGH urgency to recover
    assert result.risk_level == RiskLevel.HIGH
    assert result.risk_score >= 70.0
    # Expected recoverable yield is 85%: 1200 * 0.85 = 1020.00
    assert result.estimated_recoverable_amount == Decimal("1020.00")
    assert "Transient timeout" in result.explanation


def test_customer_repeat_history_boost():
    event = make_event(amount=Decimal("1200.00"), failure_code=FailureCode.ISSUER_DOWN)
    history = {"is_repeat_customer": True, "prior_transactions": 5}

    result = calculate_revenue_risk(event, attempt_count=0, customer_history=history)

    assert result.factors["customer_component"]["score"] == 10.0
    assert "Repeat loyal customer" in result.factors["customer_component"]["description"]
