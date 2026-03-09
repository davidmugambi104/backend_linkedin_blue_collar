import csv

from app.services.ai_assistant import AIAssistant, suggest_actions


def test_suggest_actions_branches():
    assert "Open profile settings" in suggest_actions("help with profile")
    assert "Browse open jobs" in suggest_actions("find job")
    assert "Open inbox" in suggest_actions("message tips")
    assert "Go to dashboard" in suggest_actions("hello")


def test_ai_assistant_service_custom_csv(tmp_path):
    csv_path = tmp_path / "faq.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["question", "answer", "category"])
        writer.writerow(["how to start", "Use the messages page", "messaging"])
        writer.writerow(["create profile", "Open profile settings", "profile"])

    assistant = AIAssistant(csv_path=str(csv_path))
    answers = assistant.get_answer("How do I create profile?", threshold=0.0)

    assert answers
    assert answers[0]["answer"]
    assert "similarity" in answers[0]


def test_ai_ask_requires_query(client):
    response = client.post("/api/ai/ask", json={})

    assert response.status_code == 400
    assert response.json["error"] == "Query is required"


def test_ai_ask_returns_answers_and_actions(client):
    response = client.post("/api/ai/ask", json={"query": "how to apply for jobs"})

    assert response.status_code == 200
    data = response.json
    assert data["query"] == "how to apply for jobs"
    assert "answers" in data
    assert "suggested_actions" in data


def test_ai_suggest_empty_history(client):
    response = client.post("/api/ai/suggest", json={"history": []})

    assert response.status_code == 200
    assert response.json == {"suggestions": []}


def test_ai_suggest_from_history(client):
    history = [
        {"role": "user", "content": "I need help with profile"},
        {"role": "assistant", "content": "Sure"},
        {"role": "user", "content": "how do i create a profile"},
    ]
    response = client.post("/api/ai/suggest", json={"history": history})

    assert response.status_code == 200
    assert "suggestions" in response.json
    assert isinstance(response.json["suggestions"], list)
