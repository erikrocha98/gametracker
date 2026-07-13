def _login(api_client):
    api_client.post(
        "/auth/signup",
        json={"username": "testuser", "email": "test@example.com", "password": "senha!123"},
    )
    resp = api_client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "senha!123"},
    )
    assert resp.status_code == 200


# ── POST /lists ────────────────────────────────────────────────────────────


def test_create_list_returns_201_with_camelcase_payload(api_client):
    _login(api_client)

    resp = api_client.post("/lists", json={"name": "RPGs", "description": "favoritos"})

    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "RPGs"
    assert data["description"] == "favoritos"
    assert data["isPublic"] is False
    assert "createdAt" in data
    assert "updatedAt" in data


def test_create_list_422_with_empty_name(api_client):
    _login(api_client)

    resp = api_client.post("/lists", json={"name": ""})
    assert resp.status_code == 422


def test_create_list_401_without_auth(api_client):
    resp = api_client.post("/lists", json={"name": "RPGs"})
    assert resp.status_code == 401


# ── GET /lists ─────────────────────────────────────────────────────────────


def test_get_lists_returns_only_own_lists(api_client, fake_game_list_repo):
    fake_game_list_repo.create(user_id=999999, name="alheia", description=None)
    _login(api_client)
    api_client.post("/lists", json={"name": "RPGs"})

    resp = api_client.get("/lists")

    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) == 1
    assert items[0]["name"] == "RPGs"


def test_get_lists_401_without_auth(api_client):
    resp = api_client.get("/lists")
    assert resp.status_code == 401


# ── PUT /lists/{list_id} ───────────────────────────────────────────────────


def test_update_list_changes_name_and_description(api_client):
    _login(api_client)
    created = api_client.post("/lists", json={"name": "RPGs"}).json()

    resp = api_client.put(
        f"/lists/{created['id']}",
        json={"name": "RPGs favoritos", "description": "top"},
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "RPGs favoritos"
    assert data["description"] == "top"


def test_update_missing_list_returns_404(api_client):
    _login(api_client)

    resp = api_client.put("/lists/999", json={"name": "x"})
    assert resp.status_code == 404


def test_update_list_401_without_auth(api_client):
    resp = api_client.put("/lists/1", json={"name": "x"})
    assert resp.status_code == 401


# ── DELETE /lists/{list_id} ────────────────────────────────────────────────


def test_delete_list_returns_204(api_client):
    _login(api_client)
    created = api_client.post("/lists", json={"name": "RPGs"}).json()

    resp = api_client.delete(f"/lists/{created['id']}")

    assert resp.status_code == 204
    assert api_client.get("/lists").json()["items"] == []


def test_delete_missing_list_returns_404(api_client):
    _login(api_client)

    resp = api_client.delete("/lists/999")
    assert resp.status_code == 404


def test_delete_list_401_without_auth(api_client):
    resp = api_client.delete("/lists/1")
    assert resp.status_code == 401
