"""
Testes: Cupom de restaurante (sorteio) — conta 'voucher'
Convite de cupom → conta criada pela Edge Function `accounts` → um único
check-in, só no restaurante do cupom, só pela RPC use_voucher.
"""

import time
import uuid
import httpx
import pytest
from conftest import (
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    TIMEOUT,
    auth_headers,
    service_headers,
    admin_create_user,
    login_user,
    delete_user_by_email,
    cleanup_test_place,
)
from test_places_crud import make_place

PASSWORD = "Cupom@2026!"


def call_accounts(action: str, **payload) -> dict:
    r = httpx.post(
        f"{SUPABASE_URL}/functions/v1/accounts",
        headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
        json={"action": action, **payload},
        timeout=TIMEOUT,
    )
    return r.json()


def rpc(token: str, fn: str, args: dict) -> httpx.Response:
    return httpx.post(
        f"{SUPABASE_URL}/rest/v1/rpc/{fn}",
        headers=auth_headers(token),
        json=args,
        timeout=TIMEOUT,
    )


def get_profile(user_id: str) -> dict:
    r = httpx.get(
        f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}&select=*",
        headers=service_headers(),
        timeout=TIMEOUT,
    )
    return r.json()[0]


def make_voucher_user(place_id: str, **fields) -> dict:
    """Conta cupom criada direto (sem convite) para cenários específicos."""
    email = f"cupom-{uuid.uuid4().hex[:8]}@uruguaidescontos.test"
    user_id = admin_create_user(email, PASSWORD)
    time.sleep(1)
    httpx.patch(
        f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}",
        headers=service_headers(),
        json={"role": "voucher", "voucher_place_id": place_id, **fields},
        timeout=TIMEOUT,
    )
    token = login_user(email, PASSWORD)["access_token"]
    return {"email": email, "user_id": user_id, "token": token}


@pytest.fixture
def voucher_place(admin_session):
    place_id = f"test-cupom-{uuid.uuid4().hex[:8]}"
    r = httpx.post(
        f"{SUPABASE_URL}/rest/v1/places",
        headers=auth_headers(admin_session["access_token"]),
        json=make_place(place_id, check_in_count=0),
        timeout=TIMEOUT,
    )
    assert r.status_code in (200, 201), r.text
    emails: list[str] = []
    yield place_id, emails
    for email in emails:
        delete_user_by_email(email)
    httpx.delete(
        f"{SUPABASE_URL}/rest/v1/invites?voucher_place_id=eq.{place_id}",
        headers=service_headers(),
        timeout=TIMEOUT,
    )
    httpx.delete(
        f"{SUPABASE_URL}/rest/v1/access_records?place_id=eq.{place_id}",
        headers=service_headers(),
        timeout=TIMEOUT,
    )
    cleanup_test_place(place_id)


class TestVoucherInvite:
    def test_full_flow(self, admin_session, seeded_other_place, voucher_place):
        place_id, emails = voucher_place
        email = f"ganhador-{uuid.uuid4().hex[:8]}@uruguaidescontos.test"
        emails.append(email)

        # Admin cria o convite de cupom
        expires = "2099-12-31T23:59:59-03:00"
        r = httpx.post(
            f"{SUPABASE_URL}/rest/v1/invites",
            headers=auth_headers(admin_session["access_token"]),
            json={
                "email": email,
                "role": "voucher",
                "voucher_place_id": place_id,
                "voucher_discount": "20% OFF",
                "voucher_expires_at": expires,
                "expires_at": expires,
            },
            timeout=TIMEOUT,
        )
        assert r.status_code == 201, r.text
        token = r.json()[0]["token"]

        info = call_accounts("invite-info", token=token)
        assert info["success"], info
        assert info["role"] == "voucher"
        assert info["voucherDiscount"] == "20% OFF"
        assert info["placeName"]

        created = call_accounts("accept-invite", token=token, password=PASSWORD, name="Ganhador")
        assert created["success"], created

        session = login_user(email, PASSWORD)
        user_id, access = session["user"]["id"], session["access_token"]
        profile = get_profile(user_id)
        assert profile["role"] == "voucher"
        assert profile["voucher_place_id"] == place_id
        assert profile["voucher_discount"] == "20% OFF"
        assert profile["voucher_expires_at"] > int(time.time() * 1000)
        assert profile["voucher_used_at"] is None

        # Gravação direta de check-in é bloqueada (em qualquer lugar)
        now = int(time.time() * 1000)
        for pid in (place_id, seeded_other_place):
            r = httpx.post(
                f"{SUPABASE_URL}/rest/v1/access_records",
                headers=auth_headers(access),
                json={"user_id": user_id, "place_id": pid, "timestamp": now, "expires_at": now + 1000},
                timeout=TIMEOUT,
            )
            assert r.status_code >= 400 and "VOUCHER_USE_RPC" in r.text, r.text

        # Usa o cupom: desconto do cupom, não o enviado pelo cliente
        r = rpc(access, "use_voucher", {"p_label": "99% OFF"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["placeId"] == place_id
        assert data["discount"] == {"source": "voucher", "label": "20% OFF"}
        assert data["expiresAt"] - data["timestamp"] == 24 * 60 * 60 * 1000
        assert get_profile(user_id)["voucher_used_at"] is not None

        # Segundo uso é recusado
        r = rpc(access, "use_voucher", {})
        assert r.status_code >= 400 and "VOUCHER_ALREADY_USED" in r.text, r.text

        # O usuário não consegue "zerar" o cupom
        httpx.patch(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}",
            headers=auth_headers(access),
            json={"voucher_used_at": None, "role": "user"},
            timeout=TIMEOUT,
        )
        profile = get_profile(user_id)
        assert profile["voucher_used_at"] is not None
        assert profile["role"] == "voucher"

        # Convite já usado não cria outra conta
        again = call_accounts("accept-invite", token=token, password=PASSWORD)
        assert not again["success"]


class TestVoucherRules:
    def test_expired_voucher(self, voucher_place):
        place_id, emails = voucher_place
        u = make_voucher_user(place_id, voucher_discount="20% OFF", voucher_expires_at=1000)
        emails.append(u["email"])
        r = rpc(u["token"], "use_voucher", {})
        assert r.status_code >= 400 and "VOUCHER_EXPIRED" in r.text, r.text

    def test_default_discount_needs_current_discount(self, voucher_place):
        """Desconto padrão: vale o desconto vigente do restaurante (enviado pelo front)."""
        place_id, emails = voucher_place
        u = make_voucher_user(place_id)
        emails.append(u["email"])
        r = rpc(u["token"], "use_voucher", {})
        assert r.status_code >= 400 and "VOUCHER_NO_DISCOUNT_NOW" in r.text, r.text
        r = rpc(u["token"], "use_voucher", {"p_label": "Desconto de 20%"})
        assert r.status_code == 200, r.text
        assert r.json()["discount"]["label"] == "Desconto de 20%"

    def test_common_user_cannot_use_voucher(self, user_session):
        r = rpc(user_session["access_token"], "use_voucher", {})
        assert r.status_code >= 400 and "VOUCHER_NOT_FOUND" in r.text, r.text

    def test_upgrade_to_user_restarts_trial(self, voucher_place):
        """Admin transforma a conta cupom em usuário: os 20 dias contam do próximo acesso."""
        place_id, emails = voucher_place
        u = make_voucher_user(place_id, voucher_discount="20% OFF")
        emails.append(u["email"])
        rpc(u["token"], "register_first_access", {})
        assert get_profile(u["user_id"])["first_access_at"] is not None
        httpx.patch(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{u['user_id']}",
            headers=service_headers(),
            json={"role": "user"},
            timeout=TIMEOUT,
        )
        profile = get_profile(u["user_id"])
        assert profile["first_access_at"] is None
        assert profile["trial_from_first_access"] is True


@pytest.fixture
def seeded_other_place(admin_session):
    place_id = f"test-outro-{uuid.uuid4().hex[:8]}"
    httpx.post(
        f"{SUPABASE_URL}/rest/v1/places",
        headers=auth_headers(admin_session["access_token"]),
        json=make_place(place_id),
        timeout=TIMEOUT,
    )
    yield place_id
    cleanup_test_place(place_id)
