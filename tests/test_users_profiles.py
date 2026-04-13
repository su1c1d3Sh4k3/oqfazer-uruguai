"""
Testes: Registro de usuários e gestão de perfis
Valida que cadastro de novos usuários, atualização de perfil e roles
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
    admin_create_user,
    login_user,
    delete_user_by_email,
)


class TestUserRegistration:
    """Testa registro de novos usuários."""

    def test_signup_creates_auth_and_profile(self):
        """Signup cria usuário no auth E trigger cria profile automaticamente."""
        email = f"test-signup-{uuid.uuid4().hex[:8]}@uruguaidescontos.test"
        password = "SignupTest@2026!"
        try:
            user_id = admin_create_user(email, password)
            assert user_id, f"Signup não retornou user_id"

            # Espera trigger on_auth_user_created
            time.sleep(2)

            # Verifica profile no banco
            r = httpx.get(
                f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}&select=*",
                headers=service_headers(),
                timeout=30,
            )
            profiles = r.json()
            assert len(profiles) == 1, f"Profile não criado pelo trigger! got: {profiles}"
            assert profiles[0]["email"] == email
            assert profiles[0]["role"] == "user"  # default role
        finally:
            delete_user_by_email(email)

    def test_admin_can_create_establishment_user(self, admin_session):
        """Admin cria usuário establishment com dados completos."""
        email = f"test-emp-{uuid.uuid4().hex[:8]}@uruguaidescontos.test"
        password = "Empresa@2026!"
        try:
            # Simula o que AdminUsersList faz: signup + upsert profile
            user_id = admin_create_user(email, password)
            assert user_id, f"Signup falhou"

            time.sleep(2)

            # Admin upsert com dados completos (simula AdminUsersList)
            profile_data = {
                "id": user_id,
                "email": email,
                "role": "establishment",
                "name": "Empresa Teste SA",
                "responsible_name": "Carlos Silva",
                "ci": "98765432",
                "phone": "+59899888777",
                "managed_place_id": "some-place-id",
            }
            r = httpx.post(
                f"{SUPABASE_URL}/rest/v1/profiles",
                headers={
                    **service_headers(),
                    "Prefer": "return=representation,resolution=merge-duplicates",
                },
                json=profile_data,
                timeout=15,
            )
            assert r.status_code in (200, 201), f"Upsert profile falhou: {r.text}"

            # Verifica
            r2 = httpx.get(
                f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}&select=*",
                headers=service_headers(),
                timeout=15,
            )
            profile = r2.json()[0]
            assert profile["role"] == "establishment"
            assert profile["responsible_name"] == "Carlos Silva"
            assert profile["ci"] == "98765432"
            assert profile["phone"] == "+59899888777"
            assert profile["managed_place_id"] == "some-place-id"
        finally:
            delete_user_by_email(email)


class TestProfileUpdate:
    """Testa atualização de perfil do usuário."""

    def test_user_can_update_own_profile(self, user_session):
        """Usuário atualiza seus próprios dados (name, cpf, phone)."""
        r = httpx.patch(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_session['user_id']}",
            headers=auth_headers(user_session["access_token"]),
            json={
                "name": "Maria Teste Updated",
                "cpf": "123.456.789-00",
                "phone": "+5547999888777",
                "travel_period": "Julho 2026",
            },
            timeout=15,
        )
        assert r.status_code in (200, 204), f"Update profile falhou: {r.text}"

        # Verifica persistência
        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_session['user_id']}&select=*",
            headers=service_headers(),
            timeout=15,
        )
        profile = r2.json()[0]
        assert profile["name"] == "Maria Teste Updated"
        assert profile["cpf"] == "123.456.789-00"
        assert profile["phone"] == "+5547999888777"
        assert profile["travel_period"] == "Julho 2026"

    def test_establishment_can_update_own_profile(self, establishment_session):
        """Empresa atualiza dados de registro (responsible_name, ci, phone)."""
        # Primeiro seta como establishment
        httpx.patch(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{establishment_session['user_id']}",
            headers=service_headers(),
            json={"role": "establishment"},
            timeout=15,
        )

        r = httpx.patch(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{establishment_session['user_id']}",
            headers=auth_headers(establishment_session["access_token"]),
            json={
                "responsible_name": "Ana Empresa",
                "ci": "55667788",
                "phone": "+59899112233",
            },
            timeout=15,
        )
        assert r.status_code in (200, 204), f"Update establishment profile falhou: {r.text}"

        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{establishment_session['user_id']}&select=*",
            headers=service_headers(),
            timeout=15,
        )
        profile = r2.json()[0]
        assert profile["responsible_name"] == "Ana Empresa"
        assert profile["ci"] == "55667788"

    def test_deletion_request_persists(self, establishment_session):
        """Solicitação de exclusão de conta persiste no banco."""
        r = httpx.patch(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{establishment_session['user_id']}",
            headers=auth_headers(establishment_session["access_token"]),
            json={"deletion_requested": True},
            timeout=15,
        )
        assert r.status_code in (200, 204)

        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{establishment_session['user_id']}&select=deletion_requested",
            headers=service_headers(),
            timeout=15,
        )
        assert r2.json()[0]["deletion_requested"] is True

        # Limpa
        httpx.patch(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{establishment_session['user_id']}",
            headers=service_headers(),
            json={"deletion_requested": False},
            timeout=15,
        )


class TestRLSPolicies:
    """Testa que RLS está funcionando corretamente."""

    def test_anon_cannot_create_place(self):
        """Anônimo NÃO pode criar places."""
        r = httpx.post(
            f"{SUPABASE_URL}/rest/v1/places",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "id": "test-anon-hack",
                "type": "restaurant",
                "name": "Hack",
                "category": "X",
                "city": "X",
            },
            timeout=15,
        )
        # Deve retornar erro (403 ou 401) ou body vazio (RLS bloqueou)
        assert r.status_code != 201 or len(r.json()) == 0

    def test_user_cannot_update_others_profile(self, user_session, admin_session):
        """Usuário NÃO pode atualizar perfil de outro usuário."""
        r = httpx.patch(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{admin_session['user_id']}",
            headers=auth_headers(user_session["access_token"]),
            json={"name": "Hacked Name"},
            timeout=15,
        )
        # RLS deve bloquear — o retorno será vazio (nenhum row afetado)
        if r.status_code == 200:
            affected = r.json()
            assert len(affected) == 0, "RLS falhou — user conseguiu alterar perfil de admin!"

    def test_anon_can_read_places(self):
        """Anônimo PODE ler places (política pública)."""
        r = httpx.get(
            f"{SUPABASE_URL}/rest/v1/places?select=id,name&limit=1",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            },
            timeout=15,
        )
        assert r.status_code == 200
