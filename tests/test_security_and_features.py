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
    SUPABASE_ANON_KEY,
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


class TestPlacePrivateData:
    """CI e contatos do lugar ficam em place_private (admin + empresa dona)."""

    def test_public_places_do_not_expose_sensitive_data(self):
        r = httpx.get(f"{SUPABASE_URL}/rest/v1/places?select=*", headers=anon_headers(), timeout=TIMEOUT)
        for row in r.json():
            for col in ("ci", "contact_email", "contact_phone", "responsible_name"):
                assert row.get(col) is None, f"{row['id']} expõe {col}"

    def test_private_data_access(self, admin_session, user_session, establishment_session, owned_place):
        httpx.post(
            f"{SUPABASE_URL}/rest/v1/place_private",
            headers=service_headers(),
            json={"place_id": owned_place, "ci": "1234567-8", "contact_email": "x@teste.com"},
            timeout=TIMEOUT,
        )
        url = f"{SUPABASE_URL}/rest/v1/place_private?place_id=eq.{owned_place}&select=ci"
        assert httpx.get(url, headers=anon_headers(), timeout=TIMEOUT).json() == []
        assert httpx.get(url, headers=auth_headers(user_session["access_token"]), timeout=TIMEOUT).json() == []
        assert httpx.get(url, headers=auth_headers(admin_session["access_token"]), timeout=TIMEOUT).json() == [{"ci": "1234567-8"}]
        owner = httpx.get(url, headers=auth_headers(establishment_session["access_token"]), timeout=TIMEOUT)
        assert owner.json() == [{"ci": "1234567-8"}]


class TestImageStorage:
    """Upload no bucket place-images: admin em qualquer pasta, empresa só na do próprio lugar."""

    PNG = bytes.fromhex(
        "89504e470d0a1a0a0000000d4948445200000001000000010806000000"
        "1f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082"
    )

    def _upload(self, token, path):
        return httpx.post(
            f"{SUPABASE_URL}/storage/v1/object/place-images/{path}",
            headers={"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {token}", "Content-Type": "image/png"},
            content=self.PNG,
            timeout=TIMEOUT,
        )

    def _cleanup(self, *paths):
        httpx.request(
            "DELETE",
            f"{SUPABASE_URL}/storage/v1/object/place-images",
            headers=service_headers(),
            json={"prefixes": list(paths)},
            timeout=TIMEOUT,
        )

    def test_upload_permissions(self, admin_session, user_session, establishment_session, owned_place):
        suffix = uuid.uuid4().hex[:6]
        own = f"{owned_place}/test-{suffix}.png"
        other = f"outro-lugar/test-{suffix}.png"
        try:
            assert self._upload(establishment_session["access_token"], own).status_code == 200
            assert self._upload(establishment_session["access_token"], other).status_code >= 400
            assert self._upload(user_session["access_token"], f"{owned_place}/u-{suffix}.png").status_code >= 400
            assert self._upload(admin_session["access_token"], other).status_code == 200
            public = httpx.get(f"{SUPABASE_URL}/storage/v1/object/public/place-images/{own}", timeout=TIMEOUT)
            assert public.status_code == 200
        finally:
            self._cleanup(own, other)

    def test_legacy_writes_are_moved_to_private(self, admin_session, establishment_session):
        """Versão antiga do frontend ainda grava CI/contatos em `places`: o banco move e zera."""
        pid = f"test-legacy-{uuid.uuid4().hex[:8]}"
        try:
            r = httpx.post(
                f"{SUPABASE_URL}/rest/v1/places",
                headers=auth_headers(admin_session["access_token"]),
                json=make_place(pid, ci="9.999.999-9", responsible_name="Fulano"),
                timeout=TIMEOUT,
            )
            assert r.status_code in (200, 201), r.text
            httpx.patch(
                f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{establishment_session['user_id']}",
                headers=service_headers(),
                json={"role": "establishment", "managed_place_id": pid},
                timeout=TIMEOUT,
            )
            r = httpx.patch(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{pid}",
                headers=auth_headers(establishment_session["access_token"]),
                json={"contact_email": "dono@teste.com", "description": "nova"},
                timeout=TIMEOUT,
            )
            assert r.status_code in (200, 204), r.text

            row = get_place(pid)[0]
            assert row["description"] == "nova"
            assert all(row[c] is None for c in ("ci", "responsible_name", "contact_email", "contact_phone"))
            private = httpx.get(
                f"{SUPABASE_URL}/rest/v1/place_private?place_id=eq.{pid}&select=ci,responsible_name,contact_email",
                headers=service_headers(),
                timeout=TIMEOUT,
            ).json()
            assert private == [{"ci": "9.999.999-9", "responsible_name": "Fulano", "contact_email": "dono@teste.com"}]
        finally:
            cleanup_test_place(pid)
