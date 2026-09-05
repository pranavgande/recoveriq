<img width="1536" height="1024" alt="architecture diagram" src="https://github.com/user-attachments/assets/397d96d8-4a07-47c7-8e08-ba1e6ab3e395" /><div align="center">

# RecoverIQ — AI Revenue Recovery

**An AI-assisted revenue recovery platform that detects at-risk payments, builds customer context, recommends recovery strategies, and enforces deterministic safety controls before any action is executed.**

Built as a synthetic payment-recovery prototype for the Razorpay Buildathon 2026.

</div>

<br />

## Executive Summary

Failed payments do not always mean lost customers.

A payment can fail because of a temporary issuer outage, a network timeout, insufficient funds, an exhausted retry budget, or a risk/compliance hold. Treating every failure the same leads to unnecessary retries, poor customer experience, and avoidable revenue loss.

**RecoverIQ** is designed as a controlled recovery layer around failed payments.

The system combines:

- deterministic revenue-risk scoring
- persistent customer context
- AI-assisted failure diagnosis
- smart recovery strategy recommendation
- deterministic policy enforcement
- bounded multi-step recovery workflows
- execution idempotency
- audit logging
- recovery analytics

The central design principle is simple:

> **AI can recommend. Deterministic controls decide. The executor only performs approved actions.**

The model does not receive unrestricted authority over financial actions.

---
## Architecture

![RecoverIQ Architecture](architecture/architecture.png)

---
## The Problem

When a payment fails, a merchant needs to answer four questions quickly:

1. **Why did it fail?**
2. **How much revenue is at risk?**
3. **What recovery action has the highest probability of success?**
4. **Can that action be executed safely without duplicate or uncontrolled operations?**

Traditional systems often use a simple retry loop:

```text
Payment failed
      ↓
Retry
      ↓
Retry again
      ↓
Give up
