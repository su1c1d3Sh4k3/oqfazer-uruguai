"""
Configuração compartilhada dos testes E2E — Playwright + Supabase
Cria usuários de teste via API, fornece fixtures de browser/page e helpers de login.
"""

import os
import time
import uuid
import httpx
import pytest
from pathlib import Path
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright, Browser, Page

# ─── Env ────────────────────────────────────────────────────────
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
env_local = Path(__file__).resolve().parent.parent.parent / ".env.local"
load_dotenv(env_path)
load_dotenv(env_local, override=True)

SUPABASE_URL = os.environ["VITE_SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["VITE_SUPABASE_ANON_KEY"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# App URL — dev server
APP_URL = os.environ.get("APP_URL", "http://localhost:8080")

# Timeout para operações de rede
API_TIMEOUT = 30

# ─── Credenciais de teste E2E ───────────────────────────────────
E2E_ADMIN_EMAIL = "e2e-admin@uruguaidescontos.test"
E2E_ADMIN_PASSWORD = "E2eAdmin@2026!"
E2E_USER_EMAIL = "e2e-user@uruguaidescontos.test"
E2E_USER_PASSWORD = "E2eUser@2026!"
E2E_ESTABLISHMENT_EMAIL = "e2e-empresa@uruguaidescontos.test"
E2E_ESTABLISHMENT_PASSWORD = "E2eEmpresa@2026!"
# Usuário criado durante teste do bug 1 (será limpo ao final)
E2E_NEW_EMPRESA_EMAIL = "e2e-new-empresa@uruguaidescontos.test"
E2E_NEW_EMPRESA_PASSWORD = "E2eNewEmpresa@2026!"

# Place de teste (restaurant existente no banco)
TEST_RESTAURANT_ID = "jxhfa53da"
TEST_RESTAURANT_NAME = "Bar da Dri"


# ─── Helpers API ────────────────────────────────────────────────

def service_headers():
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def admin_create_user(email: str, password: str) -> str:
    """Cria usuário via Admin API (service role). Retorna user_id."""
    r = httpx.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers=service_headers(),
        json={"email": email, "password": password, "email_confirm": True},
        timeout=API_TIMEOUT,
    )
    data = r.json()
    if r.status_code == 422 and "already been registered" in str(data):
        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/profiles?email=eq.{email}&select=id",
            headers=service_headers(),
            timeout=API_TIMEOUT,
        )
        profiles = r2.json()
        if profiles:
            return profiles[0]["id"]
        raise RuntimeError(f"User exists in auth but not profiles: {email}")
    assert r.status_code in (200, 201), f"Falha ao criar user {email}: {r.status_code} {data}"
    return data["id"]


def set_profile(user_id: str, data: dict):
    """Atualiza profile via service role (bypassa RLS)."""
    httpx.patch(
        f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}",
        headers=service_headers(),
        json=data,
        timeout=API_TIMEOUT,
    )


def get_profile_by_email(email: str) -> dict | None:
    """Busca profile por email via service role."""
    r = httpx.get(
        f"{SUPABASE_URL}/rest/v1/profiles?email=eq.{email}&select=*",
        headers=service_headers(),
        timeout=API_TIMEOUT,
    )
    profiles = r.json()
    return profiles[0] if profiles else None


def delete_user_by_email(email: str):
    """Deleta usuário do auth + profile via service role."""
    r = httpx.get(
        f"{SUPABASE_URL}/rest/v1/profiles?email=eq.{email}&select=id",
        headers=service_headers(),
        timeout=API_TIMEOUT,
    )
    for p in r.json():
        httpx.delete(
            f"{SUPABASE_URL}/auth/v1/admin/users/{p['id']}",
            headers=service_headers(),
            timeout=API_TIMEOUT,
        )


def get_place(place_id: str) -> dict | None:
    """Busca place por id via service role."""
    r = httpx.get(
        f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}&select=*",
        headers=service_headers(),
        timeout=API_TIMEOUT,
    )
    rows = r.json()
    return rows[0] if rows else None


def get_reviews_for_place(place_id: str) -> list:
    """Busca reviews de um place via service role."""
    r = httpx.get(
        f"{SUPABASE_URL}/rest/v1/reviews?place_id=eq.{place_id}&select=*",
        headers=service_headers(),
        timeout=API_TIMEOUT,
    )
    return r.json()


def delete_reviews_for_user(user_email: str):
    """Deleta todas as reviews de um usuário."""
    profile = get_profile_by_email(user_email)
    if profile:
        httpx.delete(
            f"{SUPABASE_URL}/rest/v1/reviews?user_id=eq.{profile['id']}",
            headers=service_headers(),
            timeout=API_TIMEOUT,
        )


def delete_access_records_for_user(user_email: str):
    """Deleta todos os access_records de um usuário."""
    profile = get_profile_by_email(user_email)
    if profile:
        httpx.delete(
            f"{SUPABASE_URL}/rest/v1/access_records?user_id=eq.{profile['id']}",
            headers=service_headers(),
            timeout=API_TIMEOUT,
        )


def ensure_place_has_empty_hours(place_id: str):
    """Limpa operating_hours de um place para testar o bug."""
    httpx.patch(
        f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}",
        headers=service_headers(),
        json={"operating_hours": []},
        timeout=API_TIMEOUT,
    )


# ─── Setup global: cria usuários de teste ───────────────────────

def _ensure_test_user(email, password, role, name, managed_place_id=None):
    uid = admin_create_user(email, password)
    time.sleep(0.5)
    data = {"role": role, "name": name, "email": email}
    if managed_place_id:
        data["managed_place_id"] = managed_place_id
    set_profile(uid, data)
    return uid


@pytest.fixture(scope="session", autouse=True)
def setup_e2e_users():
    """Cria os 3 tipos de usuário de teste antes de todos os testes."""
    _ensure_test_user(E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD, "admin", "E2E Admin")
    _ensure_test_user(E2E_USER_EMAIL, E2E_USER_PASSWORD, "user", "E2E User")
    _ensure_test_user(
        E2E_ESTABLISHMENT_EMAIL, E2E_ESTABLISHMENT_PASSWORD,
        "establishment", "E2E Empresa",
        managed_place_id=TEST_RESTAURANT_ID,
    )
    yield
    # Cleanup
    for email in [E2E_ADMIN_EMAIL, E2E_USER_EMAIL, E2E_ESTABLISHMENT_EMAIL, E2E_NEW_EMPRESA_EMAIL]:
        try:
            delete_user_by_email(email)
        except Exception:
            pass


# ─── Playwright fixtures ────────────────────────────────────────

@pytest.fixture(scope="session")
def browser():
    """Inicia browser Chromium (headless) para a sessão inteira."""
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        yield b
        b.close()


@pytest.fixture
def page(browser: Browser):
    """Cria um contexto isolado e página para cada teste."""
    context = browser.new_context(
        viewport={"width": 1280, "height": 900},
        locale="pt-BR",
    )
    pg = context.new_page()
    pg.set_default_timeout(15000)
    yield pg
    context.close()


# ─── Helper: login via UI ───────────────────────────────────────

def ui_login(page: Page, email: str, password: str):
    """Navega até /auth e faz login via formulário."""
    page.goto(f"{APP_URL}/auth")
    page.wait_for_load_state("networkidle")

    # Preenche email
    email_input = page.locator('input[type="email"]')
    email_input.wait_for(state="visible", timeout=10000)
    email_input.fill(email)

    # Preenche senha
    password_input = page.locator('input[type="password"]')
    password_input.fill(password)

    # Clica no botão de login
    page.locator('button[type="submit"]').click()

    # Espera navegação sair de /auth
    page.wait_for_url(lambda url: "/auth" not in url, timeout=15000)
    page.wait_for_load_state("networkidle")


def click_admin_tab(page: Page, tab_name: str):
    """Clica em uma aba do admin panel. tab_name: 'users', 'list', 'form', 'settings', etc."""
    # Radix Tabs gera IDs como radix-...-trigger-{value}
    tab = page.locator(f'[role="tab"][id$="trigger-{tab_name}"]')
    tab.wait_for(state="visible", timeout=10000)
    tab.click()
    page.wait_for_timeout(2000)
