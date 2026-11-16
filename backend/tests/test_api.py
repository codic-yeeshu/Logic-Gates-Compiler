import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)


def test_health():
    assert client.get("/api/health").json()["status"] == "ok"


def test_compile_contract():
    data = client.post("/api/compile", json={"source": "OUTPUT o;o=1;"}).json()
    assert data["schema_version"] == "1.0" and data["success"]
    assert all(p["status"] == "complete" for p in data["phases"].values())
    assert all(
        set(["input", "output", "explanation"]) <= p.keys()
        for p in data["phases"].values()
    )


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"source": 7},
        {"source": "", "optimization": "yes"},
        {"source": "", "extra": True},
    ],
)
def test_invalid_requests(payload):
    assert client.post("/api/compile", json=payload).status_code == 422


def test_failure_and_size_limit():
    for source, phase in [
        ("@", "lexical"),
        ("OUTPUT o;o=;", "syntax"),
        ("OUTPUT o;o=x;", "semantic"),
        (" " * 20481, "lexical"),
    ]:
        response = client.post("/api/compile", json={"source": source})
        assert response.status_code == 200
        data = response.json()
        assert not data["success"]
        assert data["phases"][phase]["status"] == "error"
        assert data["phases"]["codegen"]["status"] == "blocked"


def test_disabled_optimization():
    data = client.post(
        "/api/compile",
        json={"source": "INPUT a;OUTPUT o;o=a AND 1;", "optimization": False},
    ).json()
    assert (
        data["phases"]["optimization"]["output"]["instructions"]
        == data["phases"]["ir"]["output"]["instructions"]
    )


def test_unicode_comment_and_deep_ast_serialization():
    source = "// 🙂\nINPUT a;OUTPUT o;o=" + "NOT " * 50 + "a;"
    response = client.post("/api/compile", json={"source": source})
    assert response.status_code == 200 and response.json()["success"]
    assert response.json()["phases"]["lexical"]["output"][0]["span"]["line"] == 2
