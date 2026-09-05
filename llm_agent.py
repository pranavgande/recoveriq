"""
llm_agent.py

Trust Boundary: The probabilistic/heuristic layer of the system.
Responsibility: Uses historical context (recent failures) to diagnose the root cause of a payment failure.
Invariant: This layer outputs ONLY a DiagnosisProposal. It NEVER executes actions, mutates state,
or decides policy. Its `confidence` score (0.0 to 1.0) is a heuristic that the downstream policy
engine uses to gate risk.

Note: Operates with Gemini GenAI SDK when use_real_llm=True (with deterministic fallback).
"""

import os
import time
from typing import List, Dict, Optional, Any
from collections import deque
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

from schema import PaymentEvent
from proposals import DiagnosisProposal, DiagnosisClass

# --- PROMPT TEMPLATE ---
# In a real implementation, this prompt is sent to Gemini or OpenAI along with the JSON context.
SYSTEM_PROMPT = """
You are the Revenue Resilience Agent, an AI diagnosing payment failures in real-time.
You are given a target failed PaymentEvent, along with a sliding window of recent failed events.

Analyze the context for systemic patterns:
1. Bank Degradation: Are there multiple failures for the same issuing_bank across different merchants?
2. Merchant Regression: Are there multiple failures for the same merchant, especially isolated to a specific device_type?
3. Transient Timeout: Is it an isolated timeout?
4. Insufficient Funds: Is the failure explicitly due to lack of user funds?

You MUST output exactly ONE JSON object matching the DiagnosisProposal schema.
Do NOT attempt to execute an action. Your job is ONLY to diagnose the root cause and provide a confidence score [0.0 - 1.0].
"""


class RevenueResilienceAgent:
    """
    Probabilistic Layer (Diagnosis Agent)
    Maintains a sliding window of recent failed events and uses an LLM to detect patterns.
    """

    def __init__(
        self,
        context_window_minutes: int = 60,
        max_context_events: int = 100,
        use_real_llm: bool = False,
    ):
        self.context_window_minutes = context_window_minutes
        self.max_context_events = max_context_events
        self.use_real_llm = use_real_llm
        self.recent_failures: deque = deque(maxlen=max_context_events)

        if self.use_real_llm:
            from google import genai

            api_key = os.getenv("GEMINI_API_KEY")
            self.client = genai.Client(api_key=api_key)

            # Ensure SDK client requests do not include "additional_properties" in responseSchema
            # to prevent 400 INVALID_ARGUMENT errors with Gemini API endpoints.
            original_request = self.client._api_client.request

            def _clean_schema(obj):
                if isinstance(obj, dict):
                    obj.pop("additional_properties", None)
                    obj.pop("additionalProperties", None)
                    for v in obj.values():
                        _clean_schema(v)
                elif isinstance(obj, list):
                    for item in obj:
                        _clean_schema(item)

            def sanitized_request(method, path, request_dict=None, http_options=None):
                if (
                    request_dict
                    and "generationConfig" in request_dict
                    and "responseSchema" in request_dict["generationConfig"]
                ):
                    _clean_schema(request_dict["generationConfig"]["responseSchema"])
                return original_request(method, path, request_dict, http_options)

            self.client._api_client.request = sanitized_request

    def _get_relevant_context(self, current_event: PaymentEvent) -> List[PaymentEvent]:
        # Filter out events older than the context window
        current_ts = current_event.timestamp
        if current_ts.tzinfo is not None:
            current_ts = current_ts.replace(tzinfo=None)

        cutoff_time = current_ts - timedelta(
            minutes=self.context_window_minutes
        )
        relevant = []
        for e in self.recent_failures:
            e_ts = e.timestamp
            if e_ts.tzinfo is not None:
                e_ts = e_ts.replace(tzinfo=None)
            if e_ts >= cutoff_time:
                relevant.append(e)
        return relevant

    def diagnose(
        self,
        event: PaymentEvent,
        customer_context: Optional[Any] = None,
    ) -> DiagnosisProposal:
        """
        Takes a PaymentEvent and optional CustomerContext, analyzes it against the context window,
        and returns a DiagnosisProposal.
        """
        # Get context BEFORE adding the current event
        context = self._get_relevant_context(event)

        # Add current event to memory for future evaluations
        self.recent_failures.append(event)

        if self.use_real_llm:
            try:
                # Build context block
                context_str = "\n".join(
                    [e.model_dump_json(exclude_none=True) for e in context]
                )
                target_str = event.model_dump_json(exclude_none=True)
                cust_str = (
                    f"\nCustomer Profile: {customer_context.model_dump_json()}"
                    if customer_context and hasattr(customer_context, "model_dump_json")
                    else ""
                )

                prompt = f"{SYSTEM_PROMPT}\n\nRecent Failures Context:\n{context_str}\n\nTarget Event:\n{target_str}{cust_str}"

                # Primary model: gemini-2.5-flash (with graceful fallback to gemini-3.6-flash if deprecated for user account)
                models_to_try = ["gemini-2.5-flash", "gemini-3.6-flash"]
                last_error = None
                response = None

                for model_name in models_to_try:
                    try:
                        response = self.client.models.generate_content(
                            model=model_name,
                            contents=prompt,
                            config={
                                "response_mime_type": "application/json",
                                "response_schema": DiagnosisProposal,
                            },
                        )
                        break
                    except Exception as err:
                        last_error = err
                        # If 404/not available, try next model
                        if "404" in str(err) or "NOT_FOUND" in str(err):
                            continue
                        raise err

                if response is None:
                    raise last_error or RuntimeError("Failed to obtain Gemini response")

                return DiagnosisProposal.model_validate_json(response.text)
            except Exception as e:
                # Deterministic fallback preserves system safety if Gemini API fails
                return self._fallback_diagnose(event, context, error_note=str(e))

        return self._fallback_diagnose(event, context)

    def _fallback_diagnose(
        self,
        event: PaymentEvent,
        context: List[PaymentEvent],
        error_note: Optional[str] = None,
    ) -> DiagnosisProposal:
        # ---------------------------------------------------------------------
        # SIMULATED / DETERMINISTIC FALLBACK INFERENCE
        # ---------------------------------------------------------------------

        prefix = f"[Fallback: {error_note}] " if error_note else ""

        # 1. Analyze Context for Bank Degradation
        same_bank_failures = [
            e for e in context if e.issuing_bank == event.issuing_bank
        ]
        if len(same_bank_failures) >= 3:
            return DiagnosisProposal(
                diagnosis_class=DiagnosisClass.BANK_DEGRADATION,
                confidence=0.95,
                evidence_summary=f"{prefix}Detected {len(same_bank_failures)} recent failures for {event.issuing_bank} across merchants.",
            )

        # 2. Analyze Context for Merchant Checkout Regression
        same_merchant_device_failures = [
            e
            for e in context
            if e.merchant_id == event.merchant_id and e.device_type == event.device_type
        ]
        if len(same_merchant_device_failures) >= 3:
            return DiagnosisProposal(
                diagnosis_class=DiagnosisClass.MERCHANT_CHECKOUT_REGRESSION,
                confidence=0.92,
                evidence_summary=f"{prefix}Detected {len(same_merchant_device_failures)} recent failures for {event.merchant_id} on {event.device_type}.",
            )

        # 3. Analyze Isolated Event
        if event.failure_code == "INSUFFICIENT_FUNDS":
            return DiagnosisProposal(
                diagnosis_class=DiagnosisClass.INSUFFICIENT_FUNDS,
                confidence=0.99,
                evidence_summary=f"{prefix}Explicitly flagged as insufficient funds by the issuer.",
            )

        if event.failure_code == "TIMEOUT":
            return DiagnosisProposal(
                diagnosis_class=DiagnosisClass.TRANSIENT_TIMEOUT,
                confidence=0.85,
                evidence_summary=f"{prefix}Isolated timeout with no broader systemic pattern detected in the context window.",
            )

        # Default / Fallback
        return DiagnosisProposal(
            diagnosis_class=DiagnosisClass.TRANSIENT_TIMEOUT,
            confidence=0.50,  # Low confidence, will be caught by Policy Engine Rule 3
            evidence_summary=f"{prefix}Unknown failure code. Guessing transient timeout with low confidence.",
        )
