def test_get_skills_excludes_and_includes_deprecated(client, db_session):
    from app.models.skill import Skill

    active = Skill(name="Painting", category="construction")
    deprecated = Skill(name="OldSkill", category="deprecated")
    db_session.add_all([active, deprecated])
    db_session.commit()

    default_response = client.get("/api/skills")
    assert default_response.status_code == 200
    names_default = {item["name"] for item in default_response.json}
    assert "Painting" in names_default
    assert "OldSkill" not in names_default

    include_response = client.get("/api/skills?include_deprecated=true")
    assert include_response.status_code == 200
    names_include = {item["name"] for item in include_response.json}
    assert "OldSkill" in names_include


def test_create_skill_and_duplicate_rejected(client, admin_headers):
    create_response = client.post(
        "/api/skills",
        headers=admin_headers,
        json={"name": "Plumbing", "category": "technical"},
    )
    assert create_response.status_code == 201

    duplicate_response = client.post(
        "/api/skills",
        headers=admin_headers,
        json={"name": "Plumbing", "category": "technical"},
    )
    assert duplicate_response.status_code == 400
    assert "already exists" in duplicate_response.json["error"]


def test_update_skill_duplicate_name_rejected(client, admin_headers, db_session):
    from app.models.skill import Skill

    one = Skill(name="Welding", category="technical")
    two = Skill(name="Carpentry", category="construction")
    db_session.add_all([one, two])
    db_session.commit()

    response = client.put(
        f"/api/skills/{two.id}",
        headers=admin_headers,
        json={"name": "Welding"},
    )

    assert response.status_code == 400
    assert "already exists" in response.json["error"]


def test_delete_skill_in_use_returns_400(client, admin_headers, sample_skill, sample_job):
    response = client.delete(f"/api/skills/{sample_skill.id}", headers=admin_headers)

    assert response.status_code == 400
    assert "Cannot delete skill" in response.json["error"]


def test_delete_unused_skill_marks_deprecated(client, admin_headers, db_session):
    from app.models.skill import Skill

    skill = Skill(name="Window Cleaning", category="maintenance")
    db_session.add(skill)
    db_session.commit()

    response = client.delete(f"/api/skills/{skill.id}", headers=admin_headers)
    assert response.status_code == 200

    db_session.refresh(skill)
    assert skill.category == "deprecated"
