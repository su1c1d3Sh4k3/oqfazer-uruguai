"""
Testes: Sistema de Avaliações (Reviews)
Valida que avaliações são salvas, atualizadas e lidas corretamente no Supabase.
"""

import uuid
import time
import httpx
import pytest
from conftest import (
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    auth_headers,
    service_headers,
    cleanup_test_place,
)
from test_places_crud import make_place


@pytest.fixture
def review_place(admin_session):
    """Cria um place para usar nos testes de review."""
    place_id = f"test-rev-place-{uuid.uuid4().hex[:8]}"
    place = make_place(place_id, name="Restaurante para Review")
    httpx.post(
        f"{SUPABASE_URL}/rest/v1/places",
        headers=auth_headers(admin_session["access_token"]),
        json=place,
        timeout=30,
    )
    yield place_id
    # Cleanup: reviews primeiro (FK), depois place
    httpx.delete(
        f"{SUPABASE_URL}/rest/v1/reviews?place_id=eq.{place_id}",
        headers=service_headers(),
        timeout=30,
    )
    cleanup_test_place(place_id)


class TestReviewCreate:
    """Testa criação de avaliações."""

    def test_user_can_create_review(self, user_session, review_place):
        """Usuário autenticado cria review → persiste no banco."""
        review_data = {
            "place_id": review_place,
            "user_id": user_session["user_id"],
            "user_email": user_session["email"],
            "rating": 4,
            "comment": "Ótimo restaurante, recomendo!",
            "date": int(time.time() * 1000),
        }
        r = httpx.post(
            f"{SUPABASE_URL}/rest/v1/reviews",
            headers=auth_headers(user_session["access_token"]),
            json=review_data,
            timeout=30,
        )
        assert r.status_code in (200, 201), f"Insert review falhou: {r.status_code} {r.text}"

        # Verifica persistência
        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/reviews?place_id=eq.{review_place}&user_id=eq.{user_session['user_id']}&select=*",
            headers=service_headers(),
            timeout=30,
        )
        reviews = r2.json()
        assert len(reviews) == 1, f"Review não encontrada! got: {reviews}"
        assert reviews[0]["rating"] == 4
        assert reviews[0]["comment"] == "Ótimo restaurante, recomendo!"
        assert reviews[0]["user_email"] == user_session["email"]

    def test_review_upsert_updates_existing(self, user_session, review_place):
        """Upsert de review existente atualiza rating e comentário."""
        now = int(time.time() * 1000)

        # Primeira review
        httpx.post(
            f"{SUPABASE_URL}/rest/v1/reviews",
            headers={
                **auth_headers(user_session["access_token"]),
                "Prefer": "return=representation,resolution=merge-duplicates",
            },
            json={
                "place_id": review_place,
                "user_id": user_session["user_id"],
                "user_email": user_session["email"],
                "rating": 3,
                "comment": "Razoável",
                "date": now,
            },
            timeout=30,
        )

        # Atualiza via upsert (mesmo user_id + place_id)
        r = httpx.post(
            f"{SUPABASE_URL}/rest/v1/reviews?on_conflict=user_id,place_id",
            headers={
                **auth_headers(user_session["access_token"]),
                "Prefer": "return=representation,resolution=merge-duplicates",
            },
            json={
                "place_id": review_place,
                "user_id": user_session["user_id"],
                "user_email": user_session["email"],
                "rating": 5,
                "comment": "Voltei e agora adorei!",
                "date": now + 10000,
            },
            timeout=30,
        )
        assert r.status_code in (200, 201), f"Upsert review falhou: {r.text}"

        # Verifica que há apenas 1 review e com dados atualizados
        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/reviews?place_id=eq.{review_place}&user_id=eq.{user_session['user_id']}&select=*",
            headers=service_headers(),
            timeout=30,
        )
        reviews = r2.json()
        assert len(reviews) == 1, f"Deveria ter 1 review (upsert), tem {len(reviews)}"
        assert reviews[0]["rating"] == 5
        assert reviews[0]["comment"] == "Voltei e agora adorei!"


class TestReviewRead:
    """Testa leitura de avaliações."""

    def test_anon_can_read_reviews(self, user_session, review_place):
        """Anônimo pode ler reviews (política pública de SELECT)."""
        # Cria uma review primeiro
        httpx.post(
            f"{SUPABASE_URL}/rest/v1/reviews",
            headers={
                **auth_headers(user_session["access_token"]),
                "Prefer": "return=representation,resolution=merge-duplicates",
            },
            json={
                "place_id": review_place,
                "user_id": user_session["user_id"],
                "user_email": user_session["email"],
                "rating": 4,
                "comment": "Bom lugar",
                "date": int(time.time() * 1000),
            },
            timeout=30,
        )

        # Lê como anônimo
        r = httpx.get(
            f"{SUPABASE_URL}/rest/v1/reviews?place_id=eq.{review_place}&select=rating,comment",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            },
            timeout=30,
        )
        assert r.status_code == 200
        reviews = r.json()
        assert len(reviews) >= 1


class TestReviewRLS:
    """Testa RLS policies de reviews."""

    def test_user_cannot_create_review_for_other_user(self, user_session, review_place):
        """Usuário não pode criar review com user_id de outro."""
        fake_user_id = str(uuid.uuid4())
        r = httpx.post(
            f"{SUPABASE_URL}/rest/v1/reviews",
            headers=auth_headers(user_session["access_token"]),
            json={
                "place_id": review_place,
                "user_id": fake_user_id,  # Diferente do user autenticado
                "user_email": "fake@email.com",
                "rating": 1,
                "comment": "Fake review",
                "date": int(time.time() * 1000),
            },
            timeout=30,
        )
        # RLS deve bloquear — 403 ou body vazio
        if r.status_code in (200, 201):
            data = r.json()
            assert len(data) == 0, "RLS falhou — user criou review com user_id de outro!"

    def test_anon_cannot_create_review(self, review_place):
        """Anônimo NÃO pode criar reviews."""
        r = httpx.post(
            f"{SUPABASE_URL}/rest/v1/reviews",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "place_id": review_place,
                "user_id": str(uuid.uuid4()),
                "user_email": "anon@test.com",
                "rating": 5,
                "comment": "Tentativa anônima",
                "date": int(time.time() * 1000),
            },
            timeout=30,
        )
        assert r.status_code != 201 or len(r.json()) == 0


class TestReviewRatingValidation:
    """Testa validação de rating."""

    def test_rating_must_be_between_1_and_5(self, user_session, review_place):
        """Rating fora do intervalo 1-5 é rejeitado pelo CHECK constraint."""
        # Rating 0 (inválido)
        r = httpx.post(
            f"{SUPABASE_URL}/rest/v1/reviews",
            headers=auth_headers(user_session["access_token"]),
            json={
                "place_id": review_place,
                "user_id": user_session["user_id"],
                "user_email": user_session["email"],
                "rating": 0,
                "comment": "Rating inválido",
                "date": int(time.time() * 1000),
            },
            timeout=30,
        )
        assert r.status_code != 201, f"Rating 0 deveria ser rejeitado"

        # Rating 6 (inválido)
        r2 = httpx.post(
            f"{SUPABASE_URL}/rest/v1/reviews",
            headers=auth_headers(user_session["access_token"]),
            json={
                "place_id": review_place,
                "user_id": user_session["user_id"],
                "user_email": user_session["email"],
                "rating": 6,
                "comment": "Rating inválido",
                "date": int(time.time() * 1000),
            },
            timeout=30,
        )
        assert r2.status_code != 201, f"Rating 6 deveria ser rejeitado"
