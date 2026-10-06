"""
Testes: proteções de segurança (triggers) e features de 2026-10-06
- Usuário não pode virar admin nem renovar o trial
- Empresa não altera campos administrativos/métricas do próprio lugar
- Ativar/desativar local (RLS, reativação automática, bloqueio com check-in ativo)
- Faixa de preço, descontos por horário, role 'agency', país das cidades
"""

import time
import uuid
from datetime import datetime, timedelta, timezone

import httpx
import pytest
from conftest import (
    SUPABASE_URL,
    TIMEOUT,
    anon_headers,
    auth_headers,
    service_headers,
    cleanup_test_place,
)
from test_places_crud import make_place


def get_profile(user_id: str) -> dict:
    r = httpx.get(
        f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}&select=*",
        headers=service_headers(),
        timeout=TIMEOUT,
    )
    return r.json()[0]


def get_place(place_id: str, headers=None) -> list:
    r = httpx.get(
        f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}&select=*",
        headers=headers or service_headers(),
        timeout=TIMEOUT,
    )
    return r.json()


@pytest.fixture
def place_id(admin_session):
    pid = f"test-sec-{uuid.uuid4().hex[:10]}"
    r = httpx.post(
        f"{SUPABASE_URL}/rest/v1/places",
        headers=auth_headers(admin_session["access_token"]),
        json=make_place(pid, access_count=10, check_in_count=5),
        timeout=TIMEOUT,
    )
    assert r.status_code in (200, 201), r.text
    yield pid
    cleanup_test_place(pid)


@pytest.fixture
def owned_place(place_id, establishment_session):
    httpx.patch(
        f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{establishment_session['user_id']}",
        headers=service_headers(),
        json={"role": "establishment", "managed_place_id": place_id},
        timeout=TIMEOUT,
    )
    return place_id


class TestProfileProtection:
    def test_user_cannot_promote_self_to_admin(self, user_session):
        httpx.patch(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_session['user_id']}",
            headers=auth_headers(user_session["access_token"]),
            json={"role": "admin", "managed_place_id": "qualquer"},
            timeout=TIMEOUT,
        )
        profile = get_profile(user_session["user_id"])
        assert profile["role"] == "user"
        assert profile["managed_place_id"] is None

    def test_user_can_set_first_check_in_once(self, user_session):
        uid = user_session["user_id"]
        httpx.patch(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{uid}",
            headers=service_headers(),
            json={"first_check_in_at": None},
            timeout=TIMEOUT,
        )
        first = int(time.time() * 1000) - 25 * 24 * 3600 * 1000  # trial já expirado
        for value in (first, int(time.time() * 1000)):
            httpx.patch(
                f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{uid}",
                headers=auth_headers(user_session["access_token"]),
                json={"first_check_in_at": value},
                timeout=TIMEOUT,
            )
        # Primeiro valor fica; a tentativa de "renovar" o trial é ignorada
        assert get_profile(uid)["first_check_in_at"] == first

    def test_user_can_still_update_own_name(self, user_session):
        new_name = f"CI User {uuid.uuid4().hex[:4]}"
        httpx.patch(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_session['user_id']}",
            headers=auth_headers(user_session["access_token"]),
            json={"name": new_name},
            timeout=TIMEOUT,
        )
        assert get_profile(user_session["user_id"])["name"] == new_name

    def test_admin_can_create_agency_role(self, admin_session, user_session):
        uid = user_session["user_id"]
        r = httpx.patch(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{uid}",
            headers=auth_headers(admin_session["access_token"]),
            json={"role": "agency"},
            timeout=TIMEOUT,
        )
        try:
            assert r.status_code in (200, 204), r.text
            assert get_profile(uid)["role"] == "agency"
        finally:
            httpx.patch(
                f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{uid}",
                headers=service_headers(),
                json={"role": "user"},
                timeout=TIMEOUT,
            )


class TestPlaceProtection:
    def test_establishment_cannot_change_admin_fields(self, establishment_session, owned_place):
        httpx.patch(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{owned_place}",
            headers=auth_headers(establishment_session["access_token"]),
            json={
                "featured": True,
                "display_order": 1,
                "access_count": 9999,
                "is_active": False,
                "price_level": 3,
                "type": "tour",
                "description": "Editado pela empresa",
            },
            timeout=TIMEOUT,
        )
        row = get_place(owned_place)[0]
        assert row["featured"] is False
        assert row["display_order"] is None
        assert row["access_count"] == 10
        assert row["is_active"] is True
        assert row["price_level"] is None
        assert row["type"] == "restaurant"
        assert row["description"] == "Editado pela empresa"

    def test_establishment_can_edit_discount_rules(self, establishment_session, owned_place):
        rules = [{"id": "r1", "startTime": "08:00", "endTime": "12:00", "label": "10% OFF"}]
        httpx.patch(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{owned_place}",
            headers=auth_headers(establishment_session["access_token"]),
            json={"discount_rules": rules},
            timeout=TIMEOUT,
        )
        assert get_place(owned_place)[0]["discount_rules"] == rules

    def test_admin_edit_does_not_overwrite_metrics(self, admin_session, place_id):
        """Form do admin envia métricas antigas — o banco mantém as atuais."""
        httpx.patch(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}",
            headers=auth_headers(admin_session["access_token"]),
            json={"access_count": 0, "check_in_count": 0, "name": "Renomeado"},
            timeout=TIMEOUT,
        )
        row = get_place(place_id)[0]
        assert row["access_count"] == 10
        assert row["check_in_count"] == 5
        assert row["name"] == "Renomeado"

    def test_metric_rpc_still_increments(self, place_id):
        httpx.post(
            f"{SUPABASE_URL}/rest/v1/rpc/increment_place_metric",
            headers=anon_headers(),
            json={"p_place_id": place_id, "p_metric": "access_count"},
            timeout=TIMEOUT,
        )
        assert get_place(place_id)[0]["access_count"] == 11

    def test_price_level_range(self, admin_session, place_id):
        r = httpx.patch(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}",
            headers=auth_headers(admin_session["access_token"]),
            json={"price_level": 4},
            timeout=TIMEOUT,
        )
        assert r.status_code >= 400
        r = httpx.patch(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}",
            headers=auth_headers(admin_session["access_token"]),
            json={"price_level": 2},
            timeout=TIMEOUT,
        )
        assert r.status_code in (200, 204), r.text
        assert get_place(place_id)[0]["price_level"] == 2


class TestActivation:
    def test_inactive_place_hidden_from_public(self, admin_session, place_id):
        httpx.patch(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}",
            headers=auth_headers(admin_session["access_token"]),
            json={"is_active": False},
            timeout=TIMEOUT,
        )
        assert get_place(place_id, anon_headers()) == []
        assert len(get_place(place_id, auth_headers(admin_session["access_token"]))) == 1

    def test_inactive_place_visible_to_owner(self, admin_session, establishment_session, owned_place):
        httpx.patch(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{owned_place}",
            headers=auth_headers(admin_session["access_token"]),
            json={"is_active": False},
            timeout=TIMEOUT,
        )
        rows = get_place(owned_place, auth_headers(establishment_session["access_token"]))
        assert len(rows) == 1

    def test_reactivation_date_in_past_makes_place_visible(self, admin_session, place_id):
        past = (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat()
        httpx.patch(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}",
            headers=auth_headers(admin_session["access_token"]),
            json={"is_active": False, "reactivate_at": past},
            timeout=TIMEOUT,
        )
        assert len(get_place(place_id, anon_headers())) == 1

    def test_cannot_deactivate_with_active_check_in(self, admin_session, user_session, place_id):
        now_ms = int(time.time() * 1000)
        httpx.post(
            f"{SUPABASE_URL}/rest/v1/access_records",
            headers=service_headers(),
            json={
                "user_id": user_session["user_id"],
                "place_id": place_id,
                "timestamp": now_ms,
                "expires_at": now_ms + 2 * 3600 * 1000,
                "discount": {"source": "badge", "label": "Desconto de 20%"},
            },
            timeout=TIMEOUT,
        )
        r = httpx.patch(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}",
            headers=auth_headers(admin_session["access_token"]),
            json={"is_active": False},
            timeout=TIMEOUT,
        )
        assert r.status_code >= 400
        assert "PLACE_HAS_ACTIVE_CHECKINS" in r.text
        assert get_place(place_id)[0]["is_active"] is True


class TestCities:
    def test_cities_have_country(self):
        r = httpx.get(
            f"{SUPABASE_URL}/rest/v1/cities?select=name,country",
            headers=anon_headers(),
            timeout=TIMEOUT,
        )
        rows = r.json()
        assert len(rows) > 0
        assert all(row["country"] for row in rows)
