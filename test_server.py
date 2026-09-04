import pytest
from fastapi.testclient import TestClient
from server import app
import json

client = TestClient(app)


def test_root():
    response = client.get("/api/events")
    assert response.status_code == 200
    assert "events" in response.json()


def test_new_event():
    response = client.post("/api/events/new")
    assert response.status_code == 200
    data = response.json()
    assert "event_id" in data
    assert "_raw" in data


def test_pipeline_lifecycle():
    # 1. Create event
    response = client.post("/api/events/new")
    event_data = response.json()

    # 2. Run pipeline
    response = client.post(
        "/api/pipeline/run", json={"event": {"_raw": event_data["_raw"]}}
    )
    assert response.status_code == 200
    data = response.json()
    assert "diagnosis" in data
    assert "decision" in data
    assert "execution" in data
    assert "risk" in data
    assert "risk_score" in data["risk"]
    assert "risk_level" in data["risk"]
    assert "estimated_recoverable_amount" in data["risk"]
    assert "customer_context" in data
    assert "customer_id" in data["customer_context"]
    assert "customer_tier" in data["customer_context"]
    assert "recommended_strategy" in data
    assert "strategy_reason" in data
    assert "workflow" in data
    assert "workflow_id" in data["workflow"]
    assert "status" in data["workflow"]
    assert "current_step" in data["workflow"]
    assert "actions_taken" in data["workflow"]

    # 3. Duplicate protection
    response2 = client.post(
        "/api/pipeline/run", json={"event": {"_raw": event_data["_raw"]}}
    )
    assert response2.status_code == 200
    data2 = response2.json()
    assert data2["execution"]["duplicate_blocked"] == True


def test_state_listing():
    response = client.get("/api/state/reservations")
    assert response.status_code == 200
    assert "rows" in response.json()

    response = client.get("/api/state/executors")
    assert response.status_code == 200
    assert "rows" in response.json()


def test_reset():
    response = client.post("/api/state/reset")
    assert response.status_code == 200


def test_failures():
    r1 = client.post("/api/failure/concurrent-webhooks")
    assert r1.status_code == 200
    r2 = client.post("/api/failure/stale-reservation")
    assert r2.status_code == 200
    r3 = client.post("/api/failure/duplicate-executor")
    assert r3.status_code == 200


def test_workflow_list_endpoint():
    """Workflow list endpoint should return structured response."""
    response = client.get("/api/workflows")
    assert response.status_code == 200
    data = response.json()
    assert "workflows" in data
    assert isinstance(data["workflows"], list)


def test_workflow_detail_endpoint_not_found():
    """Fetching a non-existent workflow returns 404."""
    response = client.get("/api/workflow/does-not-exist")
    assert response.status_code == 404


def test_metrics_includes_workflow_analytics():
    """Metrics endpoint should include live workflow analytics keys."""
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "workflow_total_at_risk" in data
    assert "workflow_total_recovered" in data
    assert "workflow_recovery_rate" in data
    assert "workflow_total_count" in data
    assert "recovered_by_strategy" in data


def test_workflow_created_after_pipeline_run():
    """Pipeline run should create a workflow and it should be retrievable."""
    event_resp = client.post("/api/events/new")
    event_data = event_resp.json()

    pipeline_resp = client.post(
        "/api/pipeline/run", json={"event": {"_raw": event_data["_raw"]}}
    )
    assert pipeline_resp.status_code == 200
    data = pipeline_resp.json()
    wf_id = data["workflow"]["workflow_id"]

    # Fetch it by ID
    detail_resp = client.get(f"/api/workflow/{wf_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["workflow_id"] == wf_id
    assert "actions_taken" in detail

