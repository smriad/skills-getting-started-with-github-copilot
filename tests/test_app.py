"""Backend tests for the Mergington High School activities API."""

import pytest
from fastapi.testclient import TestClient

from src.app import activities, app

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_activities():
    """Reset in-memory activity data between tests."""
    original = {
        name: {
            **data,
            "participants": list(data["participants"]),
        }
        for name, data in activities.items()
    }
    yield
    activities.clear()
    activities.update(original)


def test_get_activities_returns_catalog():
    response = client.get("/activities")

    assert response.status_code == 200
    assert "Chess Club" in response.json()


def test_signup_adds_participant():
    email = "new.student@mergington.edu"

    response = client.post(
        "/activities/Chess Club/signup",
        params={"email": email},
    )

    assert response.status_code == 200
    assert email in activities["Chess Club"]["participants"]


def test_signup_rejects_duplicate_registration():
    email = "michael@mergington.edu"

    response = client.post(
        "/activities/Chess Club/signup",
        params={"email": email},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Student is already signed up"


def test_unregister_removes_participant():
    email = "michael@mergington.edu"

    response = client.delete(
        "/activities/Chess Club/signup",
        params={"email": email},
    )

    assert response.status_code == 200
    assert email not in activities["Chess Club"]["participants"]
