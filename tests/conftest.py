"""
Configuração compartilhada dos testes — Uruguai Descontos
Usa httpx para fazer requisições diretamente à API REST do Supabase,
simulando exatamente o que o frontend faz.
"""

import os
import uuid
import time
import pytest
import httpx
from dotenv import load_dotenv
from pathlib import Path

# Carrega variáveis de ambiente
env_path = Path(__file__).resolve().parent.parent / ".env"
env_local_path = Path(__file__).resolve().parent.parent / ".env.local"
load_dotenv(env_path)
load_dotenv(env_local_path, override=True)

SUPABASE_URL = os.environ["VITE_SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["VITE_SUPABASE_ANON_KEY"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# Credenciais dos usuários de teste
TEST_ADMIN_EMAIL = "test-admin-ci@uruguaidescontos.test"
TEST_ADMIN_PASSWORD = "TestAdmin@2026!"
TEST_USER_EMAIL = "test-user-ci@uruguaidescontos.test"
TEST_USER_PASSWORD = "TestUser@2026!"
TEST_ESTABLISHMENT_EMAIL = "test-empresa-ci@uruguaidescontos.test"
TEST_ESTABLISHMENT_PASSWORD = "TestEmpresa@2026!"

# Timeout mais generoso para rede
TIMEOUT = 30


def service_headers():
    """Headers com service_role key (admin total, bypassa RLS)."""
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def anon_headers():
    """Headers com anon key (sem autenticação)."""
    return {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def auth_headers(access_token: str):
    """Headers com token de usuário autenticado."""
    return {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def admin_create_user(email: str, password: str) -> str:
    """Cria usuário via Admin API (service role) — pula confirmação de email.
    Retorna o user_id."""
    r = httpx.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers=service_headers(),
        json={
            "email": email,
            "password": password,
            "email_confirm": True,  # Marca email como confirmado
        },
        timeout=TIMEOUT,
    )
    data = r.json()
    if r.status_code == 422 and "already been registered" in str(data):
        # Usuário já existe, busca o id
        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/profiles?email=eq.{email}&select=id",
            headers=service_headers(),
            timeout=TIMEOUT,
        )
        profiles = r2.json()
        assert len(profiles) > 0, f"Usuário existe no auth mas não no profiles: {email}"
        return profiles[0]["id"]
    assert r.status_code in (200, 201), f"Falha ao criar user {email}: {r.status_code} {data}"
    return data["id"]


def login_user(email: str, password: str) -> dict:
    """Faz login e retorna access_token + user."""
    r = httpx.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
        json={"email": email, "password": password},
        timeout=TIMEOUT,
    )
    data = r.json()
    assert "access_token" in data, f"Login falhou para {email}: {data}"
    return data


def delete_user_by_email(email: str):
    """Deleta usuário do auth + profile via service role."""
    r = httpx.get(
        f"{SUPABASE_URL}/rest/v1/profiles?email=eq.{email}&select=id",
        headers=service_headers(),
        timeout=TIMEOUT,
    )
    profiles = r.json()
    for p in profiles:
        uid = p["id"]
        httpx.delete(
            f"{SUPABASE_URL}/auth/v1/admin/users/{uid}",
            headers=service_headers(),
            timeout=TIMEOUT,
        )


def cleanup_test_place(place_id: str):
    """Remove um place de teste do banco."""
    httpx.delete(
        f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}",
        headers=service_headers(),
        timeout=TIMEOUT,
    )


def cleanup_test_record(table: str, column: str, value: str):
    """Remove registro de teste genérico."""
    httpx.delete(
        f"{SUPABASE_URL}/rest/v1/{table}?{column}=eq.{value}",
        headers=service_headers(),
        timeout=TIMEOUT,
    )


def _create_session(email: str, password: str, role: str, name: str) -> dict:
    """Cria (ou reutiliza) usuário de teste e retorna sessão."""
    user_id = admin_create_user(email, password)
    # Espera trigger criar o profile
    time.sleep(1)

    # Garante role e nome no profile
    httpx.patch(
        f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}",
        headers=service_headers(),
        json={"role": role, "name": name},
        timeout=TIMEOUT,
    )

    # Login para obter access_token
    data = login_user(email, password)
    return {
        "access_token": data["access_token"],
        "user_id": data["user"]["id"],
        "email": email,
    }


# ─── Fixtures ────────────────────────────────────────────────

@pytest.fixture(scope="session")
def admin_session():
    """Cria (ou reutiliza) usuário admin de teste e retorna access_token + user_id."""
    return _create_session(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, "admin", "CI Test Admin")


@pytest.fixture(scope="session")
def user_session():
    """Cria (ou reutiliza) usuário comum de teste."""
    return _create_session(TEST_USER_EMAIL, TEST_USER_PASSWORD, "user", "CI Test User")


@pytest.fixture(scope="session")
def establishment_session():
    """Cria (ou reutiliza) usuário establishment de teste."""
    return _create_session(
        TEST_ESTABLISHMENT_EMAIL, TEST_ESTABLISHMENT_PASSWORD, "establishment", "CI Test Empresa"
    )


@pytest.fixture
def test_place_id():
    """Gera um ID único para um place de teste e limpa ao final."""
    place_id = f"test-{uuid.uuid4().hex[:12]}"
    yield place_id
    cleanup_test_place(place_id)
