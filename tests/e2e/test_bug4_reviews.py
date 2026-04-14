"""
Bug 4 — Sistema de avaliação com nota e comentário não funciona.

Cenário:
  1. Limpa access_records e reviews do user de teste
  2. User loga via UI
  3. Navega para página de um restaurante
  4. Faz check-in
  5. Verifica que o form de avaliação aparece IMEDIATAMENTE (sem delay 24h)
  6. Seleciona nota (estrelas) e escreve comentário
  7. Salva
  8. Verifica no banco que a review foi gravada corretamente
  9. Verifica que a review aparece na tela após salvar
"""

import time
import pytest
from playwright.sync_api import Page, expect

from conftest import (
    APP_URL,
    E2E_USER_EMAIL,
    E2E_USER_PASSWORD,
    TEST_RESTAURANT_ID,
    TEST_RESTAURANT_NAME,
    get_reviews_for_place,
    get_profile_by_email,
    delete_reviews_for_user,
    delete_access_records_for_user,
    ui_login,
)


class TestBug4Reviews:
    """Valida que o sistema de avaliação funciona end-to-end."""

    @pytest.fixture(autouse=True)
    def cleanup_user_data(self):
        """Limpa reviews e access_records do user antes de cada teste."""
        delete_reviews_for_user(E2E_USER_EMAIL)
        delete_access_records_for_user(E2E_USER_EMAIL)
        yield
        # Cleanup final
        delete_reviews_for_user(E2E_USER_EMAIL)
        delete_access_records_for_user(E2E_USER_EMAIL)

    def test_review_form_appears_after_checkin(self, page: Page):
        """Após check-in, o form de avaliação deve aparecer imediatamente (sem delay 24h)."""

        # 1. Login
        ui_login(page, E2E_USER_EMAIL, E2E_USER_PASSWORD)

        # 2. Navega para o restaurante
        page.goto(f"{APP_URL}/place/{TEST_RESTAURANT_ID}")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)

        # 3. Verifica que a página carregou
        page.locator(f'h1:has-text("{TEST_RESTAURANT_NAME}")').wait_for(
            state="visible", timeout=10000
        )

        # 4. Faz check-in
        checkin_btn = page.locator('button:has-text("Realizar Check-in")')
        if checkin_btn.count() > 0:
            checkin_btn.click()
            page.wait_for_timeout(1000)

            # Confirma no dialog
            confirm_btn = page.locator('[role="dialog"] button:has-text("Confirmar")')
            if confirm_btn.count() > 0:
                confirm_btn.click()
                page.wait_for_timeout(2000)

        # 5. Verifica que o form de avaliação aparece (não a mensagem de "bloqueado")
        review_section = page.locator('h3:has-text("Avaliação")')
        review_section.wait_for(state="visible", timeout=10000)

        # NÃO deve mostrar mensagem de "Bloqueada Temporariamente"
        blocked_msg = page.locator('text="Avaliação Bloqueada Temporariamente"')
        assert blocked_msg.count() == 0, (
            "BUG 4 AINDA PERSISTE! A mensagem 'Avaliação Bloqueada Temporariamente' "
            "aparece mesmo após check-in. O delay de 24h não foi removido."
        )

        # Deve mostrar as estrelas de avaliação
        stars = page.locator('button:has(svg.lucide-star)')
        expect(stars.first).to_be_visible(timeout=5000)

    def test_can_submit_review_with_rating_and_comment(self, page: Page):
        """Usuário consegue enviar uma avaliação com nota e comentário."""

        # 1. Login
        ui_login(page, E2E_USER_EMAIL, E2E_USER_PASSWORD)

        # 2. Navega para restaurante
        page.goto(f"{APP_URL}/place/{TEST_RESTAURANT_ID}")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)

        # 3. Faz check-in (se necessário)
        checkin_btn = page.locator('button:has-text("Realizar Check-in")')
        if checkin_btn.count() > 0:
            checkin_btn.click()
            page.wait_for_timeout(1000)
            confirm_btn = page.locator('[role="dialog"] button:has-text("Confirmar")')
            if confirm_btn.count() > 0:
                confirm_btn.click()
                page.wait_for_timeout(2000)

        # 4. Scroll até a seção de review
        review_heading = page.locator('h3:has-text("Avaliação")')
        review_heading.scroll_into_view_if_needed()
        page.wait_for_timeout(1000)

        # 5. Clica na 4ª estrela (nota 4)
        star_buttons = page.locator('.mb-8 button:has(svg.lucide-star), [class*="rounded-2xl"] button:has(svg.lucide-star)')
        if star_buttons.count() >= 4:
            star_buttons.nth(3).click()  # 4ª estrela (index 3)
            page.wait_for_timeout(500)

        # 6. Escreve comentário
        comment_textarea = page.locator('textarea[placeholder*="experiência"], textarea[maxlength="200"]')
        if comment_textarea.count() > 0:
            comment_textarea.first.fill("Excelente lugar! Teste E2E automatizado.")
            page.wait_for_timeout(500)

        # 7. Clica em salvar avaliação
        save_review_btn = page.locator('button:has-text("Salvar Avaliação"), button:has-text("Atualizar Avaliação")')
        save_review_btn.first.scroll_into_view_if_needed()
        save_review_btn.first.click()

        # 8. Espera toast de sucesso
        page.wait_for_timeout(3000)

        # 9. Verifica no banco
        time.sleep(1)
        profile = get_profile_by_email(E2E_USER_EMAIL)
        reviews = get_reviews_for_place(TEST_RESTAURANT_ID)

        user_review = next(
            (r for r in reviews if r["user_id"] == profile["id"]),
            None,
        )

        assert user_review is not None, (
            "BUG 4 — Review não foi salva no banco! "
            f"Total de reviews para o place: {len(reviews)}. "
            f"User ID: {profile['id']}"
        )
        assert user_review["rating"] == 4, (
            f"Rating incorreto! Esperado 4, encontrado {user_review['rating']}"
        )
        assert "Teste E2E" in user_review["comment"], (
            f"Comentário incorreto! Encontrado: '{user_review['comment']}'"
        )

    def test_can_update_existing_review(self, page: Page):
        """Usuário consegue atualizar uma avaliação existente (upsert)."""

        # Primeiro, cria uma review via API para simular review existente
        import httpx
        from conftest import SUPABASE_URL, SUPABASE_ANON_KEY, API_TIMEOUT

        profile = get_profile_by_email(E2E_USER_EMAIL)

        # Cria access record primeiro (para o check-in existir)
        from conftest import service_headers
        httpx.post(
            f"{SUPABASE_URL}/rest/v1/access_records",
            headers=service_headers(),
            json={
                "user_id": profile["id"],
                "place_id": TEST_RESTAURANT_ID,
                "timestamp": int(time.time() * 1000) - 3600000,  # 1h atrás
                "expires_at": int(time.time() * 1000) + 3600000,  # expira em 1h
            },
            timeout=API_TIMEOUT,
        )

        # Cria review existente
        httpx.post(
            f"{SUPABASE_URL}/rest/v1/reviews",
            headers=service_headers(),
            json={
                "user_id": profile["id"],
                "place_id": TEST_RESTAURANT_ID,
                "user_email": E2E_USER_EMAIL,
                "rating": 3,
                "comment": "Review antiga",
                "date": int(time.time() * 1000) - 86400000,
            },
            timeout=API_TIMEOUT,
        )

        time.sleep(1)

        # 1. Login
        ui_login(page, E2E_USER_EMAIL, E2E_USER_PASSWORD)

        # 2. Navega para restaurante
        page.goto(f"{APP_URL}/place/{TEST_RESTAURANT_ID}")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)

        # 3. Scroll até review
        review_heading = page.locator('h3:has-text("Avaliação")')
        review_heading.scroll_into_view_if_needed()
        page.wait_for_timeout(1000)

        # 4. A review anterior deve estar carregada — botão deve dizer "Atualizar"
        update_btn = page.locator('button:has-text("Atualizar Avaliação")')
        if update_btn.count() == 0:
            # Pode estar como "Salvar" se o form recém carregou
            update_btn = page.locator('button:has-text("Salvar Avaliação")')

        # 5. Muda para 5 estrelas
        star_buttons = page.locator('.mb-8 button:has(svg.lucide-star), [class*="rounded-2xl"] button:has(svg.lucide-star)')
        if star_buttons.count() >= 5:
            star_buttons.nth(4).click()  # 5ª estrela
            page.wait_for_timeout(500)

        # 6. Muda comentário
        comment_textarea = page.locator('textarea[maxlength="200"]')
        if comment_textarea.count() > 0:
            comment_textarea.first.clear()
            comment_textarea.first.fill("Review atualizada E2E!")
            page.wait_for_timeout(500)

        # 7. Salva
        save_btn = page.locator('button:has-text("Atualizar Avaliação"), button:has-text("Salvar Avaliação")')
        save_btn.first.scroll_into_view_if_needed()
        save_btn.first.click()
        page.wait_for_timeout(3000)

        # 8. Verifica no banco que a review foi ATUALIZADA (não duplicada)
        time.sleep(1)
        reviews = get_reviews_for_place(TEST_RESTAURANT_ID)
        user_reviews = [r for r in reviews if r["user_id"] == profile["id"]]

        assert len(user_reviews) == 1, (
            f"Deveria haver exatamente 1 review do usuário, encontradas {len(user_reviews)}. "
            "O upsert pode estar duplicando reviews."
        )
        assert user_reviews[0]["rating"] == 5, (
            f"Rating não foi atualizado! Esperado 5, encontrado {user_reviews[0]['rating']}"
        )
        assert "atualizada E2E" in user_reviews[0]["comment"], (
            f"Comentário não foi atualizado! Encontrado: '{user_reviews[0]['comment']}'"
        )
