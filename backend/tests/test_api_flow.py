def test_health_ready_and_auth(client, auth_headers):
    health = client.get("/api/v1/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"

    ready = client.get("/api/v1/ready")
    assert ready.status_code == 200
    assert ready.json()["status"] in {"ok", "degraded"}

    unauthorized = client.get("/api/v1/jobs")
    assert unauthorized.status_code == 401

    authorized = client.get("/api/v1/jobs", headers=auth_headers)
    assert authorized.status_code == 200
    assert "items" in authorized.json()


def test_full_text_screening_flow(client, auth_headers):
    create_payload = {
        "title": "Senior Backend Engineer",
        "description": "Need Python, FastAPI, Docker, PostgreSQL, AWS and 5+ years backend experience.",
    }
    created = client.post("/api/v1/jobs", headers=auth_headers, json=create_payload)
    assert created.status_code == 200
    job = created.json()
    job_id = job["id"]

    listed = client.get("/api/v1/jobs", headers=auth_headers)
    assert listed.status_code == 200
    assert any(item["id"] == job_id for item in listed.json()["items"])

    batch_payload = {
        "candidates": [
            {
                "display_name": "Candidate One",
                "resume_text": "6 years Python, FastAPI, Docker and PostgreSQL with AWS deployment.",
                "source_filename": "candidate_one.txt",
            },
            {
                "display_name": "Candidate Two",
                "resume_text": "2 years frontend React and Node.js experience with little backend.",
                "source_filename": "candidate_two.txt",
            },
        ]
    }
    screened = client.post(
        f"/api/v1/jobs/{job_id}/screen/text",
        headers=auth_headers,
        json=batch_payload,
    )
    assert screened.status_code == 200
    screened_body = screened.json()
    assert screened_body["processed_count"] == 2
    assert len(screened_body["results"]) == 2
    assert screened_body["results"][0]["rank"] == 1
    assert screened_body["results"][1]["rank"] == 2

    candidates = client.get(f"/api/v1/jobs/{job_id}/candidates", headers=auth_headers)
    assert candidates.status_code == 200
    assert candidates.json()["total"] == 2

    rankings = client.get(f"/api/v1/jobs/{job_id}/rankings", headers=auth_headers)
    assert rankings.status_code == 200
    ranking_items = rankings.json()["items"]
    assert len(ranking_items) == 2
    assert ranking_items[0]["fit_score"] >= ranking_items[1]["fit_score"]

    candidate_id = ranking_items[0]["candidate_id"]
    detail = client.get(f"/api/v1/candidates/{candidate_id}", headers=auth_headers)
    assert detail.status_code == 200
    assert detail.json()["candidate_id"] == candidate_id

    bias = client.get(f"/api/v1/analytics/bias-report?job_id={job_id}", headers=auth_headers)
    assert bias.status_code == 200
    assert bias.json()["total_evaluations"] == 2

    closed = client.patch(
        f"/api/v1/jobs/{job_id}/status",
        headers=auth_headers,
        json={"status": "closed"},
    )
    assert closed.status_code == 200
    assert closed.json()["status"] == "closed"

    blocked = client.post(
        f"/api/v1/jobs/{job_id}/screen/text",
        headers=auth_headers,
        json=batch_payload,
    )
    assert blocked.status_code == 409


def test_frontend_single_call_text_flow(client, auth_headers):
    payload = {
        "title": "Platform Engineer",
        "description": "Need Python, Docker, PostgreSQL, AWS and 4+ years backend experience.",
        "candidates": [
            {
                "display_name": "Candidate Alpha",
                "resume_text": "5 years Python, Docker, PostgreSQL and AWS with production systems.",
                "source_filename": "alpha.txt",
            },
            {
                "display_name": "Candidate Beta",
                "resume_text": "2 years React and frontend JavaScript with limited backend exposure.",
                "source_filename": "beta.txt",
            },
        ],
    }

    response = client.post("/api/v1/frontend/screening/text", headers=auth_headers, json=payload)
    assert response.status_code == 200
    body = response.json()

    assert body["job"]["id"]
    assert body["job"]["title"] == payload["title"]
    assert body["screening"]["processed_count"] == 2
    assert len(body["rankings"]["items"]) == 2
    assert body["rankings"]["items"][0]["fit_score"] >= body["rankings"]["items"][1]["fit_score"]
