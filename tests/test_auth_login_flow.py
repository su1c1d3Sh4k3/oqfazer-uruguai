"""
Testes do fluxo de autenticação: login, sessão, re-login.
Valida que o login funciona para todos os 3 tipos de usuário
e que é possível fazer login múltiplas vezes sem travar.
"""

import httpx
import pytest
from conftest import (
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    TIMEOUT,
    admin_create_user,
    login_user,
    service_headers,
    auth_headers,
    delete_user_by_email,
)


# ─── Credenciais de teste ────────────────────────────────────────

AUTH_TEST_USER = "test-auth-user@uruguaidescontos.test"
AUTH_TEST_ESTABLISHMENT = "test-auth-empresa@uruguaidescontos.test"
AUTH_TEST_ADMIN = "test-auth-admin@uruguaidescontos.test"
AUTH_TEST_PASSWORD = "AuthTest@2026!"


# ─── Fixtures ────────────────────────────────────────────────────

@pytest.fixture(scope="module", autouse=True)
def setup_auth_test_users():
    """Cria os 3 tipos de usuário para teste de auth."""
    import time

    users = [
        (AUTH_TEST_USER, "user", "Auth Test User"),
        (AUTH_TEST_ESTABLISHMENT, "establishment", "Auth Test Empresa"),
        (AUTH_TEST_ADMIN, "admin", "Auth Test Admin"),
    ]

    user_ids = []
    for email, role, name in users:
        uid = admin_create_user(email, AUTH_TEST_PASSWORD)
        user_ids.append(uid)
        time.sleep(0.5)
        # Garante role e nome
        httpx.patch(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{uid}",
            headers=service_headers(),
            json={"role": role, "name": name, "email": email},
            timeout=TIMEOUT,
        )

    yield user_ids

    # Cleanup
    for email, _, _ in users:
        try:
            delete_user_by_email(email)
        except Exception:
            pass


# ─── Testes de Login por Role ────────────────────────────────────

class TestLoginByRole:
    """Verifica que cada tipo de usuário consegue fazer login."""

    def test_user_login(self):
        """Usuário comum (role=user) consegue logar."""
        data = login_user(AUTH_TEST_USER, AUTH_TEST_PASSWORD)
        assert "access_token" in data
        assert data["user"]["email"] == AUTH_TEST_USER

        # Verifica que o perfil é acessível com o token
        r = httpx.get(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{data['user']['id']}&select=role,name",
            headers=auth_headers(data["access_token"]),
            timeout=TIMEOUT,
        )
        assert r.status_code == 200
        profiles = r.json()
        assert len(profiles) == 1
        assert profiles[0]["role"] == "user"

    def test_establishment_login(self):
        """Usuário empresa (role=establishment) consegue logar."""
        data = login_user(AUTH_TEST_ESTABLISHMENT, AUTH_TEST_PASSWORD)
        assert "access_token" in data

        r = httpx.get(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{data['user']['id']}&select=role",
            headers=auth_headers(data["access_token"]),
            timeout=TIMEOUT,
        )
        profiles = r.json()
        assert profiles[0]["role"] == "establishment"

    def test_admin_login(self):
        """Usuário admin (role=admin) consegue logar."""
        data = login_user(AUTH_TEST_ADMIN, AUTH_TEST_PASSWORD)
        assert "access_token" in data

        r = httpx.get(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{data['user']['id']}&select=role",
            headers=auth_headers(data["access_token"]),
            timeout=TIMEOUT,
        )
        profiles = r.json()
        assert profiles[0]["role"] == "admin"


class TestRepeatedLogin:
    """Verifica que é possível fazer login múltiplas vezes (simula logout+re-login)."""

    def test_user_can_login_three_times(self):
        """Login repetido 3x não trava nem falha."""
        for i in range(3):
            data = login_user(AUTH_TEST_USER, AUTH_TEST_PASSWORD)
            assert "access_token" in data, f"Falhou na tentativa {i + 1}"
            # Verifica que o token funciona
            r = httpx.get(
                f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{data['user']['id']}&select=id",
                headers=auth_headers(data["access_token"]),
                timeout=TIMEOUT,
            )
            assert r.status_code == 200, f"Token inválido na tentativa {i + 1}"

    def test_establishment_can_login_three_times(self):
        """Empresa consegue logar 3x seguidas."""
        for i in range(3):
            data = login_user(AUTH_TEST_ESTABLISHMENT, AUTH_TEST_PASSWORD)
            assert "access_token" in data, f"Falhou na tentativa {i + 1}"

    def test_admin_can_login_three_times(self):
        """Admin consegue logar 3x seguidas."""
        for i in range(3):
            data = login_user(AUTH_TEST_ADMIN, AUTH_TEST_PASSWORD)
            assert "access_token" in data, f"Falhou na tentativa {i + 1}"


class TestInvalidCredentials:
    """Verifica que credenciais inválidas são rejeitadas corretamente."""

    def test_wrong_password_rejected(self):
        """Senha errada retorna erro, não trava."""
        r = httpx.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
            json={"email": AUTH_TEST_USER, "password": "SenhaErrada123!"},
            timeout=TIMEOUT,
        )
        data = r.json()
        assert "access_token" not in data
        assert r.status_code == 400

    def test_nonexistent_user_rejected(self):
        """Email inexistente retorna erro, não trava."""
        r = httpx.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
            json={"email": "naoexiste@uruguaidescontos.test", "password": "Qualquer123!"},
            timeout=TIMEOUT,
        )
        assert r.status_code == 400

    def test_login_after_failed_attempt(self):
        """Após tentativa com senha errada, login com senha certa funciona."""
        # Tenta com senha errada
        r = httpx.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
            json={"email": AUTH_TEST_USER, "password": "SenhaErrada123!"},
            timeout=TIMEOUT,
        )
        assert r.status_code == 400

        # Agora com senha certa
        data = login_user(AUTH_TEST_USER, AUTH_TEST_PASSWORD)
        assert "access_token" in data


class TestProfileAccessAfterLogin:
    """Verifica que após login o perfil é acessível e contém os dados corretos."""

    def test_user_profile_has_correct_fields(self):
        """Perfil do usuário retorna todos os campos necessários."""
        data = login_user(AUTH_TEST_USER, AUTH_TEST_PASSWORD)
        r = httpx.get(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{data['user']['id']}&select=*",
            headers=auth_headers(data["access_token"]),
            timeout=TIMEOUT,
        )
        assert r.status_code == 200
        profiles = r.json()
        assert len(profiles) == 1
        profile = profiles[0]
        # Campos obrigatórios
        assert profile["id"] == data["user"]["id"]
        assert profile["role"] == "user"
        assert profile["name"] is not None

    def test_establishment_profile_has_role(self):
        """Perfil da empresa retorna role=establishment."""
        data = login_user(AUTH_TEST_ESTABLISHMENT, AUTH_TEST_PASSWORD)
        r = httpx.get(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{data['user']['id']}&select=role",
            headers=auth_headers(data["access_token"]),
            timeout=TIMEOUT,
        )
        profiles = r.json()
        assert profiles[0]["role"] == "establishment"
