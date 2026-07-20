from datetime import datetime, timezone

from app.modules.games.domain.entities import GameDetail


_DETAIL = GameDetail(
    id="rawg-1",
    name="Test Game",
    description=None,
    release_date=None,
    cover_url=None,
    genres=[],
    platforms=[],
    developers=[],
    rawg_rating=None,
    screenshots=[],
)


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


def _seed(fake_game_detail_provider, fake_user_game_repo, with_entry: bool = True):
    fake_game_detail_provider._detail = _DETAIL
    fake_user_game_repo.internal_ids["rawg-1"] = 10
    if with_entry:
        fake_user_game_repo.add(user_id=1, game_id=10)


# ── PUT /games/{game_id}/review ────────────────────────────────────────────

def test_put_review_returns_200(api_client, fake_game_detail_provider, fake_user_game_repo):
    _login(api_client)
    _seed(fake_game_detail_provider, fake_user_game_repo)

    resp = api_client.put("/games/rawg-1/review", json={"review": "Amazing game"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["review"] == "Amazing game"
    assert data["reviewCreatedAt"] is not None


def test_put_review_empty_returns_400(api_client, fake_game_detail_provider, fake_user_game_repo):
    _login(api_client)
    _seed(fake_game_detail_provider, fake_user_game_repo)

    resp = api_client.put("/games/rawg-1/review", json={"review": "   "})
    assert resp.status_code == 400


def test_put_review_too_long_returns_400(api_client, fake_game_detail_provider, fake_user_game_repo):
    _login(api_client)
    _seed(fake_game_detail_provider, fake_user_game_repo)

    resp = api_client.put("/games/rawg-1/review", json={"review": "a" * 5001})
    assert resp.status_code == 400


def test_put_review_auto_adds_to_collection(api_client, fake_game_detail_provider, fake_user_game_repo):
    _login(api_client)
    _seed(fake_game_detail_provider, fake_user_game_repo, with_entry=False)

    resp = api_client.put("/games/rawg-1/review", json={"review": "Nice"})
    assert resp.status_code == 200
    assert fake_user_game_repo.exists(user_id=1, game_id=10)


def test_put_review_without_auth_returns_401(api_client):
    resp = api_client.put("/games/rawg-1/review", json={"review": "Nice"})
    assert resp.status_code == 401


# ── DELETE /games/{game_id}/review ─────────────────────────────────────────

def test_delete_review_returns_204(api_client, fake_game_detail_provider, fake_user_game_repo):
    _login(api_client)
    _seed(fake_game_detail_provider, fake_user_game_repo)
    entry = fake_user_game_repo.get(user_id=1, game_id=10)
    entry.review = "To remove"

    resp = api_client.delete("/games/rawg-1/review")
    assert resp.status_code == 204
    assert fake_user_game_repo.get(user_id=1, game_id=10).review is None


def test_delete_review_not_in_collection_returns_404(api_client, fake_game_detail_provider, fake_user_game_repo):
    _login(api_client)
    fake_user_game_repo.internal_ids["rawg-1"] = 10

    resp = api_client.delete("/games/rawg-1/review")
    assert resp.status_code == 404


# ── GET /games/reviews ─────────────────────────────────────────────────────

def test_get_user_reviews_returns_only_reviewed(api_client, fake_user_game_repo):
    _login(api_client)
    fake_user_game_repo.internal_ids["rawg-1"] = 10
    fake_user_game_repo.internal_ids["rawg-2"] = 20
    reviewed = fake_user_game_repo.add(user_id=1, game_id=10)
    reviewed.review = "Reviewed"
    fake_user_game_repo.add(user_id=1, game_id=20)

    resp = api_client.get("/games/reviews")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) == 1
    assert items[0]["review"] == "Reviewed"
    assert items[0]["gameId"] == "rawg-1"


def test_get_user_reviews_without_auth_returns_401(api_client):
    resp = api_client.get("/games/reviews")
    assert resp.status_code == 401


# ── GET /games/{game_id} with userReview ───────────────────────────────────

def test_get_game_details_returns_user_review(api_client, fake_game_detail_provider, fake_user_game_repo):
    _login(api_client)
    _seed(fake_game_detail_provider, fake_user_game_repo)
    entry = fake_user_game_repo.get(user_id=1, game_id=10)
    entry.review = "My review"
    entry.review_created_at = datetime.now(timezone.utc)

    resp = api_client.get("/games/rawg-1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["userReview"] == "My review"
    assert data["userReviewCreatedAt"] is not None


def test_get_game_details_user_review_is_null_when_absent(api_client, fake_game_detail_provider, fake_user_game_repo):
    _login(api_client)
    _seed(fake_game_detail_provider, fake_user_game_repo)

    resp = api_client.get("/games/rawg-1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["userReview"] is None
    assert data["userReviewCreatedAt"] is None
