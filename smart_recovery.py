"""
smart_recovery.py

Trust Boundary: Deterministic Smart Recovery Strategy Recommendation & Policy Validation Layer.
Responsibility: Recommends high-converting, policy-safe recovery strategies based on customer history,
failure type, retry exhaustion, and revenue risk.
Invariant: Purely deterministic. The Policy Engine and hard safety gates maintain absolute veto authority.
"""

from enum import Enum
from typing import Tuple, Optional
from decimal import Decimal
from pydantic import BaseModel, Field

from schema import PaymentEvent, PaymentStatus, FailureCode
from proposals import DiagnosisProposal, DiagnosisClass
from revenue_risk import RevenueRiskResult, RiskLevel
from customer_context import CustomerContext


class RecoveryStrategy(str, Enum):
    SMART_RETRY = "SMART_RETRY"
    PAYMENT_LINK = "PAYMENT_LINK"
    REMINDER = "REMINDER"
    HUMAN_ESCALATION = "HUMAN_ESCALATION"
    NO_ACTION = "NO_ACTION"


class StrategyRecommendation(BaseModel):
    recommended_strategy: RecoveryStrategy
    strategy_reason: str
    is_safe: bool = True
    safety_override: Optional[str] = None


def recommend_recovery_strategy(
    event: PaymentEvent,
    customer_context: CustomerContext,
    risk_result: RevenueRiskResult,
    diagnosis: Optional[DiagnosisProposal] = None,
    attempt_count: int = 0,
) -> StrategyRecommendation:
    """
    Deterministic rule-based strategy recommendation engine.

    Allowed Strategies:
    - SMART_RETRY: Transient network or gateway timeouts for reliable or fresh customers.
    - PAYMENT_LINK: Bank degradations, high-value purchases, or alternate-rail payment fallbacks.
    - REMINDER: User-actionable errors (insufficient funds, invalid credentials) for repeat customers.
    - HUMAN_ESCALATION: High-value enterprise VIP regressions, checkout regressions, or repeated failure stalemates.
    - NO_ACTION: Terminal fraud/risk holds, sub-economic transactions (< 100 INR), or repeated failures.

    Hard Safety Constraints (Enforced Deterministically):
    1. Status is SUCCESS -> NO_ACTION
    2. FailureCode is RISK_BLOCKED -> NO_ACTION (terminal safety override)
    3. Retry attempts >= 1 (attempt_count >= 1) -> CANNOT recommend SMART_RETRY (prevents infinite loops)
    4. Transaction Amount < 100 INR -> NO_ACTION (economic floor)
    """
    amount = Decimal(str(event.amount))
    failure_code = event.failure_code
    diag_class = diagnosis.diagnosis_class if diagnosis else None
    confidence = diagnosis.confidence if diagnosis else 1.0

    # Safety Gate 1: Payment already succeeded
    if event.status == PaymentStatus.SUCCESS:
        return StrategyRecommendation(
            recommended_strategy=RecoveryStrategy.NO_ACTION,
            strategy_reason="Payment is already successful.",
            is_safe=True,
        )

    # Safety Gate 2: Fraud / Risk Hold (Terminal)
    if failure_code == FailureCode.RISK_BLOCKED or failure_code == "RISK_BLOCKED":
        return StrategyRecommendation(
            recommended_strategy=RecoveryStrategy.NO_ACTION,
            strategy_reason="Compliance safety stop: Transaction flagged as RISK_BLOCKED.",
            is_safe=True,
        )

    # Safety Gate 3: Economic Floor
    if amount < Decimal("100.0"):
        return StrategyRecommendation(
            recommended_strategy=RecoveryStrategy.NO_ACTION,
            strategy_reason="Economic constraint: Transaction amount is below intervention threshold (100 INR).",
            is_safe=True,
        )

    # Safety Gate 4: Bounded Retry Limit Exhaustion
    if attempt_count >= 1 or getattr(event, "retry_count", 0) >= 1:
        # If retries exhausted, check if high-value/VIP customer warrants human support, else drop
        if customer_context.customer_tier == "HIGH_VALUE" or risk_result.risk_level == RiskLevel.HIGH:
            return StrategyRecommendation(
                recommended_strategy=RecoveryStrategy.HUMAN_ESCALATION,
                strategy_reason=f"Retry limit reached ({attempt_count} attempts). High-value exposure warrants human support escalation.",
                is_safe=True,
            )
        return StrategyRecommendation(
            recommended_strategy=RecoveryStrategy.NO_ACTION,
            strategy_reason=f"Retry limit exceeded ({attempt_count} attempts). Bounded retry invariant prevents further retries.",
            is_safe=True,
        )

    # Safety Gate 5: Low confidence diagnosis fallback
    if confidence < 0.80:
        return StrategyRecommendation(
            recommended_strategy=RecoveryStrategy.NO_ACTION,
            strategy_reason=f"Diagnosis confidence ({confidence:.2f}) below safe threshold (0.80). Abstaining.",
            is_safe=True,
        )

    # --- Strategy Recommendations by Failure & Customer Profile ---

    # Case A: Systemic Merchant Checkout Regression
    if diag_class == DiagnosisClass.MERCHANT_CHECKOUT_REGRESSION:
        return StrategyRecommendation(
            recommended_strategy=RecoveryStrategy.HUMAN_ESCALATION,
            strategy_reason=f"Systemic merchant regression on {event.device_type}. Escalating to technical support.",
            is_safe=True,
        )

    # Case B: Insufficient Funds
    if failure_code == FailureCode.INSUFFICIENT_FUNDS or diag_class == DiagnosisClass.INSUFFICIENT_FUNDS:
        if customer_context.customer_tier in ["RELIABLE_REPEAT", "HIGH_VALUE"]:
            return StrategyRecommendation(
                recommended_strategy=RecoveryStrategy.REMINDER,
                strategy_reason="Insufficient funds for loyal customer. Send automated push notification / reminder to top up.",
                is_safe=True,
            )
        return StrategyRecommendation(
            recommended_strategy=RecoveryStrategy.NO_ACTION,
            strategy_reason="Insufficient funds for non-repeat customer. Requires user-initiated reload.",
            is_safe=True,
        )

    # Case C: Bank / Issuer Degradation
    if (
        failure_code == FailureCode.ISSUER_DOWN
        or diag_class == DiagnosisClass.BANK_DEGRADATION
    ):
        return StrategyRecommendation(
            recommended_strategy=RecoveryStrategy.PAYMENT_LINK,
            strategy_reason=f"Bank {event.issuing_bank} is degraded. Offering fallback payment link with alternate payment methods.",
            is_safe=True,
        )

    # Case D: Transient Network Timeout
    if (
        failure_code == FailureCode.TIMEOUT
        or diag_class == DiagnosisClass.TRANSIENT_TIMEOUT
    ):
        if customer_context.customer_tier == "FREQUENT_FAILURES":
            return StrategyRecommendation(
                recommended_strategy=RecoveryStrategy.PAYMENT_LINK,
                strategy_reason="Customer has a history of frequent failures. Providing explicit Payment Link instead of blind background retry.",
                is_safe=True,
            )
        return StrategyRecommendation(
            recommended_strategy=RecoveryStrategy.SMART_RETRY,
            strategy_reason="Isolated transient timeout on healthy customer profile. Safe for immediate bounded retry.",
            is_safe=True,
        )

    # Default Fallback
    return StrategyRecommendation(
        recommended_strategy=RecoveryStrategy.NO_ACTION,
        strategy_reason="Unhandled scenario. Defaulting to safe no-action.",
        is_safe=True,
    )
