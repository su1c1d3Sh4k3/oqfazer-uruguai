"""
Testes: CRUD de Places (locais e passeios)
Simula as operações do admin no frontend e valida persistência no Supabase.
"""

import uuid
import httpx
import pytest
from conftest import (
    SUPABASE_URL,
    auth_headers,
    service_headers,
    cleanup_test_place,
)


def make_place(place_id: str, **overrides) -> dict:
    """Cria payload de place completo (snake_case, como o banco espera)."""
    base = {
        "id": place_id,
        "type": "restaurant",
        "name": f"Restaurante Teste {place_id[:8]}",
        "category": "Restaurantes",
        "city": "Montevideo",
        "discount_badge": "Desconto de 20%",
        "cover_image": "https://example.com/cover.jpg",
        "gallery_images": ["https://example.com/g1.jpg", "https://example.com/g2.jpg"],
        "logo_image": "https://example.com/logo.jpg",
        "description": "Descrição do restaurante de teste.",
        "discount_description": "20% de desconto em pratos principais.",
        "address": "Av. 18 de Julio 1234, Montevideo",
        "coordinates": {"lat": -34.9011, "lng": -56.1645},
        "featured": False,
        "featured_order": None,
        "display_order": None,
        "operating_hours": [
            {"day": 0, "isOpen": True, "openTime": "09:00", "closeTime": "18:00"},
        ],
        "duration": None,
        "departure_city": None,
        "included": [],
        "available_days": [],
        "booking_url": None,
        "coupon_code": None,
        "instagram_url": "https://instagram.com/teste",
        "website_url": "https://teste.com",
        "access_count": 0,
        "coupon_click_count": 0,
        "check_in_count": 0,
        "highlight_click_count": 0,
        "flash_offer": None,
        "responsible_name": "João Teste",
        "ci": "12345678",
        "contact_email": "joao@teste.com",
        "contact_phone": "+59899123456",
    }
    base.update(overrides)
    return base


class TestAdminCreatePlace:
    """Testa criação de locais/passeios pelo admin."""

    def test_admin_can_create_restaurant(self, admin_session, test_place_id):
        """Admin cria restaurante → dados persistem no banco."""
        place = make_place(test_place_id)
        r = httpx.post(
            f"{SUPABASE_URL}/rest/v1/places",
            headers=auth_headers(admin_session["access_token"]),
            json=place,
            timeout=15,
        )
        assert r.status_code in (200, 201), f"Insert falhou: {r.status_code} {r.text}"

        # Verifica que o dado está realmente no banco
        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{test_place_id}&select=*",
            headers=service_headers(),
            timeout=15,
        )
        rows = r2.json()
        assert len(rows) == 1, f"Place não encontrado no banco: {rows}"
        row = rows[0]
        assert row["name"] == place["name"]
        assert row["category"] == "Restaurantes"
        assert row["city"] == "Montevideo"
        assert row["discount_badge"] == "Desconto de 20%"
        assert row["description"] == place["description"]
        assert row["discount_description"] == place["discount_description"]
        assert row["address"] == place["address"]
        assert row["instagram_url"] == "https://instagram.com/teste"
        assert row["responsible_name"] == "João Teste"
        assert row["coordinates"]["lat"] == pytest.approx(-34.9011, abs=0.001)

    def test_admin_can_create_tour(self, admin_session):
        """Admin cria passeio/tour → campos específicos persistem."""
        place_id = f"test-tour-{uuid.uuid4().hex[:8]}"
        place = make_place(
            place_id,
            type="tour",
            name="Passeio Teste Colonia",
            category="Passeios",
            city="Colonia del Sacramento",
            duration="Meio dia (4h)",
            departure_city="Montevideo",
            included=["Transporte", "Guia bilíngue", "Ingresso museu"],
            available_days=["Segunda", "Quarta", "Sexta"],
            booking_url="https://booking.example.com/tour1",
            coupon_code="BNU10",
        )
        try:
            r = httpx.post(
                f"{SUPABASE_URL}/rest/v1/places",
                headers=auth_headers(admin_session["access_token"]),
                json=place,
                timeout=15,
            )
            assert r.status_code in (200, 201), f"Insert tour falhou: {r.text}"

            # Verifica campos tour no banco
            r2 = httpx.get(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}&select=*",
                headers=service_headers(),
                timeout=15,
            )
            row = r2.json()[0]
            assert row["type"] == "tour"
            assert row["duration"] == "Meio dia (4h)"
            assert row["departure_city"] == "Montevideo"
            assert "Transporte" in row["included"]
            assert "Segunda" in row["available_days"]
            assert row["booking_url"] == "https://booking.example.com/tour1"
            assert row["coupon_code"] == "BNU10"
        finally:
            cleanup_test_place(place_id)


class TestAdminUpdatePlace:
    """Testa atualização parcial de places (BUG PRINCIPAL corrigido)."""

    def test_partial_update_preserves_other_fields(self, admin_session):
        """Atualizar 'featured' NÃO deve apagar nome, descrição, imagens etc.
        Este era o BUG CRÍTICO — updatePlace enviava defaults para todos os campos.
        """
        place_id = f"test-partial-{uuid.uuid4().hex[:8]}"
        place = make_place(place_id, name="Lugar Importante", description="Descrição que não pode sumir")
        try:
            # Cria o place
            r = httpx.post(
                f"{SUPABASE_URL}/rest/v1/places",
                headers=auth_headers(admin_session["access_token"]),
                json=place,
                timeout=15,
            )
            assert r.status_code in (200, 201)

            # Atualiza APENAS featured (simulando o que AdminDisplayManager faz)
            r2 = httpx.patch(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}",
                headers=auth_headers(admin_session["access_token"]),
                json={"featured": True, "featured_order": 1},
                timeout=15,
            )
            assert r2.status_code in (200, 204), f"Update falhou: {r2.text}"

            # Verifica que os outros campos NÃO foram apagados
            r3 = httpx.get(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}&select=*",
                headers=service_headers(),
                timeout=15,
            )
            row = r3.json()[0]
            assert row["featured"] is True
            assert row["featured_order"] == 1
            # Estes campos NÃO devem ter sido sobrescritos:
            assert row["name"] == "Lugar Importante", f"Nome foi sobrescrito! got: {row['name']}"
            assert row["description"] == "Descrição que não pode sumir", f"Descrição apagada!"
            assert row["discount_badge"] == "Desconto de 20%", f"Badge apagado!"
            assert row["cover_image"] == "https://example.com/cover.jpg", f"Cover apagada!"
            assert row["instagram_url"] == "https://instagram.com/teste", f"Instagram apagado!"
            assert row["responsible_name"] == "João Teste", f"Responsável apagado!"
        finally:
            cleanup_test_place(place_id)

    def test_update_discount_badge_preserves_images(self, admin_session):
        """Atualizar badge de desconto não deve apagar imagens."""
        place_id = f"test-badge-{uuid.uuid4().hex[:8]}"
        place = make_place(place_id, cover_image="https://example.com/my-cover.jpg")
        try:
            httpx.post(
                f"{SUPABASE_URL}/rest/v1/places",
                headers=auth_headers(admin_session["access_token"]),
                json=place,
                timeout=15,
            )

            # Atualiza apenas o badge
            httpx.patch(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}",
                headers=auth_headers(admin_session["access_token"]),
                json={"discount_badge": "Desconto de 50%"},
                timeout=15,
            )

            r = httpx.get(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}&select=*",
                headers=service_headers(),
                timeout=15,
            )
            row = r.json()[0]
            assert row["discount_badge"] == "Desconto de 50%"
            assert row["cover_image"] == "https://example.com/my-cover.jpg", "Cover image foi apagada!"
        finally:
            cleanup_test_place(place_id)

    def test_update_order_preserves_metrics(self, admin_session):
        """Atualizar display_order não deve zerar métricas."""
        place_id = f"test-order-{uuid.uuid4().hex[:8]}"
        place = make_place(place_id, access_count=42, coupon_click_count=15, check_in_count=7)
        try:
            httpx.post(
                f"{SUPABASE_URL}/rest/v1/places",
                headers=auth_headers(admin_session["access_token"]),
                json=place,
                timeout=15,
            )

            # Atualiza apenas a ordem
            httpx.patch(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}",
                headers=auth_headers(admin_session["access_token"]),
                json={"display_order": 5},
                timeout=15,
            )

            r = httpx.get(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}&select=*",
                headers=service_headers(),
                timeout=15,
            )
            row = r.json()[0]
            assert row["display_order"] == 5
            assert row["access_count"] == 42, f"access_count zerado! got: {row['access_count']}"
            assert row["coupon_click_count"] == 15, f"coupon_click_count zerado!"
            assert row["check_in_count"] == 7, f"check_in_count zerado!"
        finally:
            cleanup_test_place(place_id)


class TestAdminDeletePlace:
    """Testa exclusão de places."""

    def test_admin_can_delete_place(self, admin_session):
        """Admin deleta place → place não existe mais no banco."""
        place_id = f"test-del-{uuid.uuid4().hex[:8]}"
        place = make_place(place_id)
        httpx.post(
            f"{SUPABASE_URL}/rest/v1/places",
            headers=auth_headers(admin_session["access_token"]),
            json=place,
            timeout=15,
        )

        r = httpx.delete(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}",
            headers=auth_headers(admin_session["access_token"]),
            timeout=15,
        )
        assert r.status_code in (200, 204)

        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}&select=id",
            headers=service_headers(),
            timeout=15,
        )
        assert len(r2.json()) == 0, "Place ainda existe após delete!"


class TestFeaturedOrder:
    """Testa persistência do featuredOrder (BUG 3 corrigido)."""

    def test_featured_order_persists(self, admin_session):
        """featured_order é salvo no banco e sobrevive a reload."""
        place_id = f"test-feat-{uuid.uuid4().hex[:8]}"
        place = make_place(place_id)
        try:
            httpx.post(
                f"{SUPABASE_URL}/rest/v1/places",
                headers=auth_headers(admin_session["access_token"]),
                json=place,
                timeout=15,
            )

            # Marca como destaque com ordem
            httpx.patch(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}",
                headers=auth_headers(admin_session["access_token"]),
                json={"featured": True, "featured_order": 3},
                timeout=15,
            )

            # Verifica persistência
            r = httpx.get(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}&select=featured,featured_order",
                headers=service_headers(),
                timeout=15,
            )
            row = r.json()[0]
            assert row["featured"] is True
            assert row["featured_order"] == 3, f"featured_order não persistiu! got: {row['featured_order']}"
        finally:
            cleanup_test_place(place_id)

    def test_remove_featured_clears_order(self, admin_session):
        """Remover destaque limpa featured_order."""
        place_id = f"test-unfeat-{uuid.uuid4().hex[:8]}"
        place = make_place(place_id, featured=True, featured_order=2)
        try:
            httpx.post(
                f"{SUPABASE_URL}/rest/v1/places",
                headers=auth_headers(admin_session["access_token"]),
                json=place,
                timeout=15,
            )

            # Remove destaque
            httpx.patch(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}",
                headers=auth_headers(admin_session["access_token"]),
                json={"featured": False, "featured_order": None},
                timeout=15,
            )

            r = httpx.get(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}&select=featured,featured_order",
                headers=service_headers(),
                timeout=15,
            )
            row = r.json()[0]
            assert row["featured"] is False
            assert row["featured_order"] is None
        finally:
            cleanup_test_place(place_id)


class TestFlashOffer:
    """Testa criação e remoção de flash offers."""

    def test_create_flash_offer(self, admin_session):
        """Flash offer é salvo como JSONB no banco."""
        place_id = f"test-flash-{uuid.uuid4().hex[:8]}"
        place = make_place(place_id)
        try:
            httpx.post(
                f"{SUPABASE_URL}/rest/v1/places",
                headers=auth_headers(admin_session["access_token"]),
                json=place,
                timeout=15,
            )

            flash = {
                "percentage": "30%",
                "description": "Desconto relâmpago de sexta!",
                "expiresAt": 1750000000000,
                "durationLabel": "2 horas",
            }
            httpx.patch(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}",
                headers=auth_headers(admin_session["access_token"]),
                json={"flash_offer": flash},
                timeout=15,
            )

            r = httpx.get(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}&select=flash_offer",
                headers=service_headers(),
                timeout=15,
            )
            row = r.json()[0]
            assert row["flash_offer"] is not None
            assert row["flash_offer"]["percentage"] == "30%"
            assert row["flash_offer"]["description"] == "Desconto relâmpago de sexta!"
        finally:
            cleanup_test_place(place_id)
