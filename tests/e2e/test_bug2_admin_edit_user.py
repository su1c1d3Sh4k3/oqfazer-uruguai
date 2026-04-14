"""
Bug 2 — Admin nao consegue alterar informacoes do usuario.

Cenario:
  1. Admin loga via UI
  2. Aba Usuarios -> clica Editar em um user
  3. Verifica que o select de role NAO esta disabled
  4. Altera role e salva
  5. Verifica no banco que a alteracao persistiu
"""

import time
import pytest
from playwright.sync_api import Page

from conftest import (
    E2E_ADMIN_EMAIL,
    E2E_ADMIN_PASSWORD,
    E2E_USER_EMAIL,
    get_profile_by_email,
    set_profile,
    ui_login,
    click_admin_tab,
)


class TestBug2AdminEditUser:

    @pytest.fixture(autouse=True)
    def restore_user_role(self):
        yield
        profile = get_profile_by_email(E2E_USER_EMAIL)
        if profile:
            set_profile(profile["id"], {"role": "user", "name": "E2E User"})

    def _open_edit_dialog(self, page: Page):
        """Loga como admin, abre aba usuarios e clica editar no E2E_USER."""
        ui_login(page, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD)
        page.wait_for_url(lambda url: "/admin" in url, timeout=15000)
        click_admin_tab(page, "users")

        # Encontra o user na tabela e clica editar
        user_row = page.locator(f'tr:has-text("{E2E_USER_EMAIL}")')
        user_row.wait_for(state="visible", timeout=10000)
        user_row.locator('button.text-blue-500').first.click()

        dialog = page.locator('[role="dialog"]')
        dialog.wait_for(state="visible", timeout=5000)
        return dialog

    def test_role_select_is_not_disabled_when_editing(self, page: Page):
        """O select de role nao deve estar disabled ao editar."""
        dialog = self._open_edit_dialog(page)

        role_trigger = dialog.locator('button[role="combobox"]').first
        disabled = role_trigger.get_attribute("disabled")
        aria_disabled = role_trigger.get_attribute("aria-disabled")

        assert disabled is None, f"Select role tem disabled={disabled}"
        assert aria_disabled != "true", f"Select role tem aria-disabled={aria_disabled}"

    def test_admin_can_change_user_role(self, page: Page):
        """Admin muda role de user para establishment."""
        dialog = self._open_edit_dialog(page)

        # Muda role
        dialog.locator('button[role="combobox"]').first.click()
        page.wait_for_timeout(500)
        page.locator('[role="option"]:has-text("Empresa")').click()
        page.wait_for_timeout(500)

        # Salva
        dialog.locator('button[type="submit"]').click()
        page.wait_for_timeout(3000)

        time.sleep(1)
        profile = get_profile_by_email(E2E_USER_EMAIL)
        assert profile["role"] == "establishment", (
            f"Role nao alterada! Esperado 'establishment', encontrado '{profile['role']}'"
        )

    def test_admin_can_change_user_name(self, page: Page):
        """Admin altera o nome de um usuario."""
        dialog = self._open_edit_dialog(page)

        # Procura o input "Nome Completo" (aparece para role=user)
        name_label = dialog.locator('label:has-text("Nome Completo")')
        if name_label.count() > 0:
            name_input = name_label.locator('..').locator('input')
            name_input.first.clear()
            name_input.first.fill("E2E Nome Alterado")
        else:
            # Fallback
            inputs = dialog.locator('input:not([type="email"])')
            inputs.nth(1).clear()
            inputs.nth(1).fill("E2E Nome Alterado")

        dialog.locator('button[type="submit"]').click()
        page.wait_for_timeout(3000)

        time.sleep(1)
        profile = get_profile_by_email(E2E_USER_EMAIL)
        assert profile["name"] == "E2E Nome Alterado", (
            f"Nome nao alterado! Encontrado: '{profile['name']}'"
        )
