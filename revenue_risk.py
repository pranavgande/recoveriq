"""
revenue_risk.py

Trust Boundary: Deterministic Revenue-at-Risk scoring engine.
Responsibility: Quantifies the financial exposure and recovery viability of a failed payment.
Invariant: Purely deterministic calculations. Never invokes the LLM or mutates transaction state.
"""

from decimal import Decimal
from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator
from schema import PaymentEvent, FailureCode
from proposals import DiagnosisProposal, DiagnosisClass


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class RevenueRiskResult(BaseModel):
    """
    Structured outcome of the deterministic revenue risk scoring evaluation.
    """
    risk_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Composite score (0-100) reflecting financial impact and urgency",
    )
    risk_level: RiskLevel = Field(
        ...,
        description="Categorical risk tier: LOW, MEDIUM, or HIGH",
    )
    estimated_recoverable_amount: Decimal = Field(
        ...,
        ge=Decimal("0.0"),
        description="Expected recoverable revenue (Amount * Estimated Recovery Probability) in INR",
    )
    explanation: str = Field(
        ...,
        description="Deterministic human-readable explanation of the score components",
    )
    factors: Dict[str, Any] = Field(
        default_factory=dict,
        description="Detailed scoring factors for auditability",
    )

    @field_validator("risk_score")
    def round_score(cls, v):
        return round(v, 1)


def calculate_revenue_risk(
    event: PaymentEvent,
    diagnosis: Optional[DiagnosisProposal] = None,
    attempt_count: int = 0,
    customer_history: Optional[Dict[str, Any]] = None,
) -> RevenueRiskResult:
    """
    Computes deterministic revenue risk metrics for a failed payment.

    Scoring Model Breakdown:
    1. Value Component (0 - 40 points):
       - Measures raw revenue exposure based on transaction amount (INR).
       - < 100 INR: 5 pts
       - 100 - 500 INR: 15 pts
       - 500 - 2,500 INR: 28 pts
       - > 2,500 INR: 40 pts

    2. Failure Severity & Recoverability Component (0 - 35 points):
       - RISK_BLOCKED (fraud/compliance): 5 pts, 0% recovery probability
       - INSUFFICIENT_FUNDS: 10 pts, 10% recovery probability
       - ISSUER_DOWN / BANK_DEGRADATION: 30 pts, 65% recovery probability
       - TIMEOUT / TRANSIENT: 35 pts, 85% recovery probability
       - Other: 15 pts, 25% recovery probability

    3. Retry & Exhaustion Penalty (0 - 15 points):
       - 0 retries / attempts: 15 pts (fresh failure)
       - 1 retry: 8 pts (diminishing return)
       - >= 2 retries: 0 pts (exhausted bounded retry threshold)

    4. Customer History & Method Leverage (0 - 10 points):
       - Repeat customer with positive history: 10 pts
       - UPI / Credit Card: 8 pts
       - Default baseline: 5 pts
    """
    amount = Decimal(str(event.amount))
    factors = {}

    # 1. Value Component (Max 40)
    if amount < Decimal("100.0"):
        value_score = 5.0
        value_tier = "< 100 INR (Low Value)"
    elif amount < Decimal("500.0"):
        value_score = 15.0
        value_tier = "100 - 500 INR (Mid-Low Value)"
    elif amount < Decimal("2500.0"):
        value_score = 28.0
        value_tier = "500 - 2,500 INR (Medium-High Value)"
    else:
        value_score = 40.0
        value_tier = "> 2,500 INR (High Value)"
    factors["value_component"] = {"score": value_score, "tier": value_tier}

    # 2. Failure Category & Recovery Probability (Max 35)
    effective_code = event.failure_code
    diag_class = diagnosis.diagnosis_class if diagnosis else None

    if effective_code == FailureCode.RISK_BLOCKED or effective_code == "RISK_BLOCKED":
        failure_score = 5.0
        recovery_prob = Decimal("0.00")
        fail_desc = "Risk blocked / Fraud hold (terminal, non-recoverable)"
    elif effective_code == FailureCode.INSUFFICIENT_FUNDS or effective_code == "INSUFFICIENT_FUNDS":
        failure_score = 10.0
        recovery_prob = Decimal("0.10")
        fail_desc = "Insufficient funds (requires customer top-up)"
    elif (
        effective_code == FailureCode.ISSUER_DOWN
        or effective_code == "ISSUER_DOWN"
        or diag_class == DiagnosisClass.BANK_DEGRADATION
    ):
        failure_score = 30.0
        recovery_prob = Decimal("0.65")
        fail_desc = "Issuer down / bank degradation (high salvage rate via alternate rails)"
    elif (
        effective_code == FailureCode.TIMEOUT
        or effective_code == "TIMEOUT"
        or diag_class == DiagnosisClass.TRANSIENT_TIMEOUT
    ):
        failure_score = 35.0
        recovery_prob = Decimal("0.85")
        fail_desc = "Transient timeout (high salvage rate via retry)"
    elif diag_class == DiagnosisClass.MERCHANT_CHECKOUT_REGRESSION:
        failure_score = 15.0
        recovery_prob = Decimal("0.15")
        fail_desc = "Merchant checkout regression (requires merchant technical escalation)"
    else:
        failure_score = 15.0
        recovery_prob = Decimal("0.25")
        fail_desc = f"Other failure: {effective_code or 'UNKNOWN'}"

    factors["failure_component"] = {
        "score": failure_score,
        "description": fail_desc,
        "base_recovery_probability": float(recovery_prob),
    }

    # 3. Retry / Attempt Degradation (Max 15)
    total_retries = max(getattr(event, "retry_count", 0), attempt_count)
    if total_retries == 0:
        retry_score = 15.0
        retry_desc = "Fresh failure (0 prior retries)"
    elif total_retries == 1:
        retry_score = 8.0
        retry_desc = "1 prior retry recorded"
        recovery_prob *= Decimal("0.50")
    else:
        retry_score = 0.0
        retry_desc = f"{total_retries} retries recorded (attempts exhausted)"
        recovery_prob = Decimal("0.00")

    factors["retry_component"] = {
        "score": retry_score,
        "total_retries": total_retries,
        "description": retry_desc,
    }

    # 4. Customer History & Channel Leverage (Max 10)
    customer_score = 5.0
    customer_desc = "Standard profile"

    if customer_history and customer_history.get("is_repeat_customer", False):
        customer_score = 10.0
        customer_desc = "Repeat loyal customer"
        recovery_prob = min(Decimal("1.0"), recovery_prob * Decimal("1.15"))
    elif event.payment_method in ["UPI", "CREDIT_CARD"]:
        customer_score = 8.0
        customer_desc = f"High-conversion payment rail ({event.payment_method})"
    factors["customer_component"] = {"score": customer_score, "description": customer_desc}

    # Compute Total Score (Bounded 0 - 100)
    raw_total = value_score + failure_score + retry_score + customer_score
    risk_score = max(0.0, min(100.0, float(raw_total)))

    # Determine Risk Tier
    if risk_score >= 70.0:
        risk_level = RiskLevel.HIGH
    elif risk_score >= 40.0:
        risk_level = RiskLevel.MEDIUM
    else:
        risk_level = RiskLevel.LOW

    # Calculate Expected Recoverable Revenue
    estimated_recoverable = round(amount * recovery_prob, 2)

    explanation = (
        f"Score {risk_score:.1f}/100 ({risk_level.value}): {value_tier}; {fail_desc}; "
        f"{retry_desc}. Estimated recoverable revenue: ₹{estimated_recoverable:,.2f} INR "
        f"({float(recovery_prob) * 100:.0f}% expected yield)."
    )

    return RevenueRiskResult(
        risk_score=risk_score,
        risk_level=risk_level,
        estimated_recoverable_amount=estimated_recoverable,
        explanation=explanation,
        factors=factors,
    )
