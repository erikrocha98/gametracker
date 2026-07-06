from app.modules.games.domain.entities import UserGameStatus


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


# ── GET /games/stats ───────────────────────────────────────────────────────


def test_get_stats_returns_computed_stats(api_client, fake_user_game_repo):
    _login(api_client)
    fake_user_game_repo.add(user_id=1, game_id=1, status=UserGameStatus.playing)
    fake_user_game_repo.add(user_id=1, game_id=2)
    fake_user_game_repo.set_rating(user_id=1, game_id=2, rating=4.0)

    resp = api_client.get("/games/stats")

    assert resp.status_code == 200
    data = resp.json()
    assert data["gamesRated"] == 1
    assert data["averageRating"] == 4.0
    assert data["statusCounts"] == {"wantToPlay": 0, "playing": 1, "finished": 1}
    assert len(data["recentGames"]) == 2
    assert "status" in data["recentGames"][0]


def test_get_stats_empty_collection(api_client):
    _login(api_client)

    resp = api_client.get("/games/stats")

    assert resp.status_code == 200
    data = resp.json()
    assert data["gamesRated"] == 0
    assert data["averageRating"] is None
    assert data["statusCounts"] == {"wantToPlay": 0, "playing": 0, "finished": 0}
    assert data["recentGames"] == []


def test_get_stats_requires_authentication(api_client):
    resp = api_client.get("/games/stats")

    assert resp.status_code == 401
