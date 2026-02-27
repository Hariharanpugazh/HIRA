from io import BytesIO


def _create_job(client, headers):
    payload = {
        "title": "Data Platform Engineer",
        "description": "Need Python, SQL, Docker, and 3+ years backend/data engineering experience.",
    }
    response = client.post("/api/v1/jobs", headers=headers, json=payload)
    assert response.status_code == 200
    return response.json()["id"]


def test_upload_screening(client, auth_headers):
    job_id = _create_job(client, auth_headers)

    files = [
        ("resumes", ("alice.txt", BytesIO(b"5 years Python Docker SQL backend engineering"), "text/plain")),
        ("resumes", ("bob.txt", BytesIO(b"2 years React frontend JavaScript"), "text/plain")),
    ]
    response = client.post(f"/api/v1/jobs/{job_id}/screen/upload", headers=auth_headers, files=files)
    assert response.status_code == 200
    assert response.json()["processed_count"] == 2


def test_upload_validation_errors(client, auth_headers):
    job_id = _create_job(client, auth_headers)

    unsupported = client.post(
        f"/api/v1/jobs/{job_id}/screen/upload",
        headers=auth_headers,
        files=[("resumes", ("malware.exe", BytesIO(b"abc"), "application/octet-stream"))],
    )
    assert unsupported.status_code == 415

    empty = client.post(
        f"/api/v1/jobs/{job_id}/screen/upload",
        headers=auth_headers,
        files=[("resumes", ("empty.txt", BytesIO(b""), "text/plain"))],
    )
    assert empty.status_code == 400


def test_frontend_single_call_upload_flow(client, auth_headers):
    files = [
        ("resumes", ("alice.txt", BytesIO(b"5 years Python Docker SQL backend engineering"), "text/plain")),
        ("resumes", ("bob.txt", BytesIO(b"2 years React frontend JavaScript"), "text/plain")),
    ]
    data = {
        "title": "Data Platform Engineer",
        "description": "Need Python, SQL, Docker, and 3+ years backend/data engineering experience.",
    }
    response = client.post(
        "/api/v1/frontend/screening/upload",
        headers=auth_headers,
        data=data,
        files=files,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["job"]["id"]
    assert body["screening"]["processed_count"] == 2
    assert len(body["rankings"]["items"]) == 2


def test_batch_limit_enforced(client, auth_headers):
    job_id = _create_job(client, auth_headers)
    client.app.state.workflow.settings.max_batch_candidates = 1

    payload = {
        "candidates": [
            {"display_name": "A", "resume_text": "Python backend engineer with 5 years.", "source_filename": "a.txt"},
            {"display_name": "B", "resume_text": "Python backend engineer with 4 years.", "source_filename": "b.txt"},
        ]
    }
    response = client.post(f"/api/v1/jobs/{job_id}/screen/text", headers=auth_headers, json=payload)
    assert response.status_code == 400
    assert "MAX_BATCH_CANDIDATES" in response.json()["detail"]

    client.app.state.workflow.settings.max_batch_candidates = 200
