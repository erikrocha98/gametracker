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


# ── PATCH /games/{game_id}/status ──────────────────────────────────────────


def test_patch_status_returns_200_with_new_status(api_client, fake_user_game_repo):
    _login(api_client)
    fake_user_game_repo.internal_ids["rawg-1"] = 10
    fake_user_game_repo.add(user_id=1, game_id=10)

    resp = api_client.patch("/games/rawg-1/status", json={"status": "playing"})

    assert resp.status_code == 200
    data = resp.json()
    assert data["gameId"] == "rawg-1"
    assert data["status"] == "playing"


def test_patch_status_persists(api_client, fake_user_game_repo):
    from app.modules.games.domain.entities import UserGameStatus

    _login(api_client)
    fake_user_game_repo.internal_ids["rawg-1"] = 10
    fake_user_game_repo.add(user_id=1, game_id=10)

    api_client.patch("/games/rawg-1/status", json={"status": "playing"})

    assert fake_user_game_repo.get(user_id=1, game_id=10).status == UserGameStatus.playing


def test_patch_status_not_in_collection_returns_404(api_client, fake_user_game_repo):
    _login(api_client)
    fake_user_game_repo.internal_ids["rawg-1"] = 10

    resp = api_client.patch("/games/rawg-1/status", json={"status": "playing"})

    assert resp.status_code == 404


def test_patch_status_invalid_value_returns_422(api_client, fake_user_game_repo):
    _login(api_client)
    fake_user_game_repo.internal_ids["rawg-1"] = 10
    fake_user_game_repo.add(user_id=1, game_id=10)

    resp = api_client.patch("/games/rawg-1/status", json={"status": "not_a_status"})

    assert resp.status_code == 422


def test_patch_status_requires_authentication(api_client):
    resp = api_client.patch("/games/rawg-1/status", json={"status": "playing"})

    assert resp.status_code == 401
