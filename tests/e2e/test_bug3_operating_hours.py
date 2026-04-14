"""
Bug 3 — Painel de empresa: nao deixa mudar os horarios do estabelecimento.

Cenario:
  1. Via API, limpa operating_hours do place (simula bug original)
  2. Empresa loga -> /empresa -> aba Editar
  3. Verifica que o form de horarios renderiza (com defaults restaurados)
  4. Altera horarios de um dia especifico
  5. Salva e verifica no banco que os operating_hours foram gravados
"""

import time
import pytest
from playwright.sync_api import Page, expect

from conftest import (
    APP_URL,
    E2E_ESTABLISHMENT_EMAIL,
    E2E_ESTABLISHMENT_PASSWORD,
    TEST_RESTAURANT_ID,
    get_place,
    ensure_place_has_empty_hours,
    ui_login,
)


class TestBug3OperatingHours:

    @pytest.fixture(autouse=True)
    def setup_empty_hours(self):
        """Limpa operating_hours antes de cada teste para simular o bug."""
        ensure_place_has_empty_hours(TEST_RESTAURANT_ID)
        yield

    def _goto_edit_tab(self, page: Page):
        """Loga como empresa e navega para aba Editar."""
        ui_login(page, E2E_ESTABLISHMENT_EMAIL, E2E_ESTABLISHMENT_PASSWORD)
        page.wait_for_url(lambda url: "/empresa" in url, timeout=15000)

        edit_tab = page.locator('[role="tab"]:has-text("Editar")')
        edit_tab.wait_for(state="visible", timeout=10000)
        edit_tab.click()
        page.wait_for_timeout(2000)

    def _get_day_row(self, page: Page, day_id: int):
        """Retorna o container de um dia especifico no form de horarios."""
        # Cada dia tem checkbox #day-{n} dentro de um flex row
        checkbox = page.locator(f'#day-{day_id}')
        # O row e o parent do parent (checkbox > div.flex.w-40 > div.flex.flex-col)
        return checkbox.locator('..').locator('..')

    def test_hours_form_renders_with_empty_hours(self, page: Page):
        """O form de horarios deve renderizar quando operating_hours e [] (defaults restaurados)."""

        self._goto_edit_tab(page)

        hours_heading = page.locator('h3:has-text("Funcionamento")')
        expect(hours_heading).to_be_visible(timeout=10000)

        # Os 7 dias devem aparecer
        for day_name in ["Domingo", "Segunda", "Quarta", "Sexta"]:
            expect(page.locator(f'label:has-text("{day_name}")')).to_be_visible()

    def test_can_change_hours_and_save(self, page: Page):
        """Empresa altera horarios de um dia e salva."""

        self._goto_edit_tab(page)
        page.locator('h3:has-text("Funcionamento")').wait_for(state="visible", timeout=10000)

        # Os defaults restauram todos os dias como abertos (09:00-18:00 / 09:00-23:00)
        # Vamos desmarcar Domingo (day=0) e alterar horario de Segunda (day=1)

        # Desmarcar Domingo
        dom_cb = page.locator('#day-0')
        dom_cb.wait_for(state="visible", timeout=5000)
        if dom_cb.get_attribute("data-state") == "checked":
            dom_cb.click()
            page.wait_for_timeout(500)

        # Alterar horario de Segunda (day=1) — os time inputs estao no mesmo row
        day1_row = self._get_day_row(page, 1)
        day1_open = day1_row.locator('input[type="time"]').first
        day1_close = day1_row.locator('input[type="time"]').nth(1)
        day1_open.fill("10:30")
        day1_close.fill("22:45")
        page.wait_for_timeout(500)

        # Salva
        save_btn = page.locator('button[type="submit"]:has-text("Salvar")')
        save_btn.scroll_into_view_if_needed()
        save_btn.click()
        page.wait_for_timeout(4000)

        # Verifica no banco
        time.sleep(1)
        place = get_place(TEST_RESTAURANT_ID)
        assert place is not None

        hours = place.get("operating_hours", [])
        assert len(hours) > 0, (
            f"BUG 3 AINDA PERSISTE! operating_hours continua vazio. Valor: {hours}"
        )

        # Domingo deve estar fechado
        domingo = next((h for h in hours if h["day"] == 0), None)
        assert domingo is not None, "Domingo nao encontrado nos horarios"
        assert domingo["isOpen"] is False, f"Domingo deveria estar fechado: isOpen={domingo['isOpen']}"

        # Segunda deve ter os horarios alterados
        segunda = next((h for h in hours if h["day"] == 1), None)
        assert segunda is not None, "Segunda nao encontrada nos horarios"
        assert segunda["isOpen"] is True, f"Segunda deveria estar aberta: isOpen={segunda['isOpen']}"
        assert segunda["openTime"] == "10:30", f"Abertura errada: {segunda['openTime']}"
        assert segunda["closeTime"] == "22:45", f"Fechamento errado: {segunda['closeTime']}"

    def test_hours_persist_after_reload(self, page: Page):
        """Apos salvar horarios, eles persistem ao recarregar a pagina."""

        # 1. Login e vai para aba Editar
        self._goto_edit_tab(page)
        page.locator('h3:has-text("Funcionamento")').wait_for(state="visible", timeout=10000)

        # 2. Altera Segunda (day=1)
        day1_row = self._get_day_row(page, 1)
        day1_open = day1_row.locator('input[type="time"]').first
        day1_close = day1_row.locator('input[type="time"]').nth(1)
        day1_open.fill("11:00")
        day1_close.fill("23:00")

        # 3. Salva
        page.locator('button[type="submit"]:has-text("Salvar")').scroll_into_view_if_needed()
        page.locator('button[type="submit"]:has-text("Salvar")').click()
        page.wait_for_timeout(4000)

        # 4. Navega para outra aba e volta (simula "reload" sem perder sessao)
        metrics_tab = page.locator('[role="tab"]:has-text("Conta"), [role="tab"]:has-text("trica")')
        if metrics_tab.count() > 0:
            metrics_tab.first.click()
            page.wait_for_timeout(1500)

        edit_tab = page.locator('[role="tab"]:has-text("Editar")')
        edit_tab.click()
        page.wait_for_timeout(2000)

        # 5. Verifica que Segunda esta checked
        segunda_cb = page.locator('#day-1')
        segunda_cb.wait_for(state="visible", timeout=10000)
        state = segunda_cb.get_attribute("data-state")
        assert state == "checked", f"Segunda deveria estar checked apos trocar abas, esta '{state}'"

        # 6. Verifica horario persistiu no input
        day1_row = self._get_day_row(page, 1)
        open_val = day1_row.locator('input[type="time"]').first.input_value()
        assert open_val == "11:00", f"Horario de abertura nao persistiu: {open_val}"

        # 7. Double-check no banco
        place = get_place(TEST_RESTAURANT_ID)
        hours = place.get("operating_hours", [])
        segunda = next((h for h in hours if h["day"] == 1), None)
        assert segunda is not None and segunda["openTime"] == "11:00", (
            f"Horario nao persistiu no banco: {segunda}"
        )
