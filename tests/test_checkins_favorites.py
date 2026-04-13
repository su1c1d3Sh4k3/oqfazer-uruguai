"""
Testes: Check-ins, Favoritos e Métricas
Valida que check-ins, favoritos e incremento de métricas
são corretamente persistidos no Supabase.
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
    cleanup_test_record,
)
from test_places_crud import make_place


@pytest.fixture
def seeded_place(admin_session):
    """Cria um place no banco para usar nos testes de check-in/favorito."""
    place_id = f"test-seed-{uuid.uuid4().hex[:8]}"
    place = make_place(place_id, access_count=10, check_in_count=5)
    httpx.post(
        f"{SUPABASE_URL}/rest/v1/places",
        headers=auth_headers(admin_session["access_token"]),
        json=place,
        timeout=15,
    )
    yield place_id
    # Cleanup: remove favorites e access_records associados, depois o place
    httpx.delete(
        f"{SUPABASE_URL}/rest/v1/favorites?place_id=eq.{place_id}",
        headers=service_headers(),
        timeout=15,
    )
    httpx.delete(
        f"{SUPABASE_URL}/rest/v1/access_records?place_id=eq.{place_id}",
        headers=service_headers(),
        timeout=15,
    )
    cleanup_test_place(place_id)


class TestCheckIn:
    """Testa sistema de check-in."""

    def test_user_can_checkin(self, user_session, seeded_place):
        """Check-in cria registro em access_records."""
        now = int(time.time() * 1000)
        expires = now + 2 * 60 * 60 * 1000  # 2 horas

        r = httpx.post(
            f"{SUPABASE_URL}/rest/v1/access_records",
            headers={
                **auth_headers(user_session["access_token"]),
                "Prefer": "return=representation,resolution=merge-duplicates",
            },
            json={
                "user_id": user_session["user_id"],
                "place_id": seeded_place,
                "timestamp": now,
                "expires_at": expires,
            },
            timeout=15,
        )
        assert r.status_code in (200, 201), f"Check-in falhou: {r.text}"

        # Verifica persistência
        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/access_records?user_id=eq.{user_session['user_id']}&place_id=eq.{seeded_place}&select=*",
            headers=auth_headers(user_session["access_token"]),
            timeout=15,
        )
        records = r2.json()
        assert len(records) >= 1, "Registro de check-in não encontrado!"
        assert records[0]["place_id"] == seeded_place
        assert records[0]["timestamp"] == now

    def test_checkin_upsert_updates_existing(self, user_session, seeded_place):
        """Segundo check-in no mesmo lugar atualiza o registro (upsert)."""
        now1 = int(time.time() * 1000)
        expires1 = now1 + 2 * 60 * 60 * 1000

        upsert_headers = {
            **auth_headers(user_session["access_token"]),
            "Prefer": "return=representation,resolution=merge-duplicates",
        }

        # Primeiro check-in
        httpx.post(
            f"{SUPABASE_URL}/rest/v1/access_records?on_conflict=user_id,place_id",
            headers=upsert_headers,
            json={
                "user_id": user_session["user_id"],
                "place_id": seeded_place,
                "timestamp": now1,
                "expires_at": expires1,
            },
            timeout=30,
        )

        # Segundo check-in (timestamp diferente)
        now2 = now1 + 10000
        expires2 = now2 + 2 * 60 * 60 * 1000
        httpx.post(
            f"{SUPABASE_URL}/rest/v1/access_records?on_conflict=user_id,place_id",
            headers=upsert_headers,
            json={
                "user_id": user_session["user_id"],
                "place_id": seeded_place,
                "timestamp": now2,
                "expires_at": expires2,
            },
            timeout=30,
        )

        # Deve ter apenas 1 registro (upsert)
        r = httpx.get(
            f"{SUPABASE_URL}/rest/v1/access_records?user_id=eq.{user_session['user_id']}&place_id=eq.{seeded_place}&select=*",
            headers=auth_headers(user_session["access_token"]),
            timeout=30,
        )
        records = r.json()
        assert len(records) == 1, f"Deveria ter 1 registro (upsert), tem {len(records)}"
        assert records[0]["timestamp"] == now2, "Timestamp não foi atualizado pelo upsert"


class TestFavorites:
    """Testa sistema de favoritos."""

    def test_user_can_add_favorite(self, user_session, seeded_place):
        """Adicionar favorito persiste no banco."""
        r = httpx.post(
            f"{SUPABASE_URL}/rest/v1/favorites",
            headers=auth_headers(user_session["access_token"]),
            json={
                "user_id": user_session["user_id"],
                "place_id": seeded_place,
            },
            timeout=15,
        )
        assert r.status_code in (200, 201), f"Add favorite falhou: {r.text}"

        # Verifica
        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/favorites?user_id=eq.{user_session['user_id']}&place_id=eq.{seeded_place}&select=*",
            headers=auth_headers(user_session["access_token"]),
            timeout=15,
        )
        favs = r2.json()
        assert len(favs) >= 1, "Favorito não encontrado!"

    def test_user_can_remove_favorite(self, user_session, seeded_place):
        """Remover favorito deleta do banco."""
        # Garante que existe
        httpx.post(
            f"{SUPABASE_URL}/rest/v1/favorites",
            headers={
                **auth_headers(user_session["access_token"]),
                "Prefer": "return=representation,resolution=merge-duplicates",
            },
            json={
                "user_id": user_session["user_id"],
                "place_id": seeded_place,
            },
            timeout=15,
        )

        # Remove
        r = httpx.delete(
            f"{SUPABASE_URL}/rest/v1/favorites?user_id=eq.{user_session['user_id']}&place_id=eq.{seeded_place}",
            headers=auth_headers(user_session["access_token"]),
            timeout=15,
        )
        assert r.status_code in (200, 204)

        # Verifica que sumiu
        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/favorites?user_id=eq.{user_session['user_id']}&place_id=eq.{seeded_place}&select=id",
            headers=auth_headers(user_session["access_token"]),
            timeout=15,
        )
        assert len(r2.json()) == 0, "Favorito ainda existe após delete!"


class TestMetricsRPC:
    """Testa incremento de métricas via RPC."""

    def test_increment_access_count(self, user_session, seeded_place):
        """RPC increment_place_metric incrementa access_count."""
        # Pega valor atual
        r0 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{seeded_place}&select=access_count",
            headers=service_headers(),
            timeout=15,
        )
        before = r0.json()[0]["access_count"]

        # Chama RPC
        r = httpx.post(
            f"{SUPABASE_URL}/rest/v1/rpc/increment_place_metric",
            headers=auth_headers(user_session["access_token"]),
            json={"p_place_id": seeded_place, "p_metric": "access_count"},
            timeout=15,
        )
        assert r.status_code in (200, 204), f"RPC falhou: {r.text}"

        # Verifica incremento
        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{seeded_place}&select=access_count",
            headers=service_headers(),
            timeout=15,
        )
        after = r2.json()[0]["access_count"]
        assert after == before + 1, f"Métrica não incrementou! before={before}, after={after}"

    def test_increment_coupon_click(self, user_session, seeded_place):
        """RPC incrementa coupon_click_count."""
        r0 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{seeded_place}&select=coupon_click_count",
            headers=service_headers(),
            timeout=15,
        )
        before = r0.json()[0]["coupon_click_count"]

        httpx.post(
            f"{SUPABASE_URL}/rest/v1/rpc/increment_place_metric",
            headers=auth_headers(user_session["access_token"]),
            json={"p_place_id": seeded_place, "p_metric": "coupon_click_count"},
            timeout=15,
        )

        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{seeded_place}&select=coupon_click_count",
            headers=service_headers(),
            timeout=15,
        )
        after = r2.json()[0]["coupon_click_count"]
        assert after == before + 1

    def test_increment_check_in_count(self, user_session, seeded_place):
        """RPC incrementa check_in_count."""
        r0 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{seeded_place}&select=check_in_count",
            headers=service_headers(),
            timeout=15,
        )
        before = r0.json()[0]["check_in_count"]

        httpx.post(
            f"{SUPABASE_URL}/rest/v1/rpc/increment_place_metric",
            headers=auth_headers(user_session["access_token"]),
            json={"p_place_id": seeded_place, "p_metric": "check_in_count"},
            timeout=15,
        )

        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{seeded_place}&select=check_in_count",
            headers=service_headers(),
            timeout=15,
        )
        after = r2.json()[0]["check_in_count"]
        assert after == before + 1

    def test_increment_highlight_click(self, user_session, seeded_place):
        """RPC incrementa highlight_click_count."""
        r0 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{seeded_place}&select=highlight_click_count",
            headers=service_headers(),
            timeout=15,
        )
        before = r0.json()[0]["highlight_click_count"]

        httpx.post(
            f"{SUPABASE_URL}/rest/v1/rpc/increment_place_metric",
            headers=auth_headers(user_session["access_token"]),
            json={"p_place_id": seeded_place, "p_metric": "highlight_click_count"},
            timeout=15,
        )

        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{seeded_place}&select=highlight_click_count",
            headers=service_headers(),
            timeout=15,
        )
        after = r2.json()[0]["highlight_click_count"]
        assert after == before + 1
