"""
Bug 1 — Cadastro de empresa pelo admin: role deve persistir como 'establishment'.

Cenário:
  1. Admin loga via UI → /admin
  2. Clica na aba Usuários
  3. Clica em "Nova Conta"
  4. Seleciona role "Empresa / Estabelecimento"
  5. Preenche email e senha
  6. Salva
  7. Verifica no banco que o profile foi criado com role='establishment'
"""

import time
import pytest
from playwright.sync_api import Page, expect

from conftest import (
    E2E_ADMIN_EMAIL,
    E2E_ADMIN_PASSWORD,
    E2E_NEW_EMPRESA_EMAIL,
    E2E_NEW_EMPRESA_PASSWORD,
    get_profile_by_email,
    delete_user_by_email,
    ui_login,
    click_admin_tab,
)


@pytest.fixture(autouse=True)
def cleanup_new_empresa():
    """Limpa o usuário criado no teste, antes e depois."""
    try:
        delete_user_by_email(E2E_NEW_EMPRESA_EMAIL)
    except Exception:
        pass
    yield


class TestBug1RoleEmpresa:
    """Valida que criar uma empresa pelo admin preserva role='establishment'."""

    def test_admin_creates_establishment_user_via_ui(self, page: Page):
        """Admin cria usuário empresa e o role persiste no banco."""

        # 1. Login como admin
        ui_login(page, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD)
        page.wait_for_url(lambda url: "/admin" in url, timeout=15000)

        # 2. Aba Usuários
        click_admin_tab(page, "users")

        # 3. Clica em "Nova Conta"
        page.locator('button:has-text("Nova Conta")').click()

        # 4. Dialog abre
        dialog = page.locator('[role="dialog"]')
        dialog.wait_for(state="visible", timeout=5000)

        # 5. Seleciona "Empresa / Estabelecimento"
        role_trigger = dialog.locator('button[role="combobox"]').first
        role_trigger.click()
        page.wait_for_timeout(500)
        page.locator('[role="option"]:has-text("Empresa")').click()
        page.wait_for_timeout(500)

        # 6. Preenche email
        dialog.locator('input[type="email"]').fill(E2E_NEW_EMPRESA_EMAIL)

        # 7. Preenche senha (input logo após o email no grid)
        password_input = dialog.locator('input').nth(1)
        password_input.fill(E2E_NEW_EMPRESA_PASSWORD)

        # 8. Salva
        dialog.locator('button[type="submit"]').click()

        # 9. Espera processamento (signUp + restore session + upsert + delay interno)
        page.wait_for_timeout(6000)

        # 10. Verifica no banco
        time.sleep(2)
        profile = get_profile_by_email(E2E_NEW_EMPRESA_EMAIL)
        assert profile is not None, (
            f"Profile nao encontrado para {E2E_NEW_EMPRESA_EMAIL}. "
            "O usuario pode nao ter sido criado."
        )
        assert profile["role"] == "establishment", (
            f"ROLE INCORRETA! Esperado 'establishment', encontrado '{profile['role']}'. "
            "Bug 1 ainda persiste."
        )

    def test_new_empresa_can_login_as_establishment(self, page: Page):
        """O usuario empresa recem-criado loga e vai para /empresa."""

        profile = get_profile_by_email(E2E_NEW_EMPRESA_EMAIL)
        if not profile or profile["role"] != "establishment":
            pytest.skip("Teste anterior falhou")

        ui_login(page, E2E_NEW_EMPRESA_EMAIL, E2E_NEW_EMPRESA_PASSWORD)
        page.wait_for_url(lambda url: "/empresa" in url, timeout=15000)
        expect(page.locator('h1:has-text("Painel da Empresa")')).to_be_visible(timeout=10000)
