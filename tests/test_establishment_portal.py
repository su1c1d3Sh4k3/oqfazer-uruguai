"""
Testes: Portal do Estabelecimento
Valida que empresa pode editar seu próprio lugar mas não outros,
e que as edições persistem no Supabase.
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
from test_places_crud import make_place


@pytest.fixture
def establishment_with_place(admin_session, establishment_session):
    """Cria um place e vincula ao establishment de teste."""
    place_id = f"test-emp-place-{uuid.uuid4().hex[:8]}"
    place = make_place(place_id, name="Restaurante da Empresa Teste")

    # Admin cria o place
    httpx.post(
        f"{SUPABASE_URL}/rest/v1/places",
        headers=auth_headers(admin_session["access_token"]),
        json=place,
        timeout=15,
    )

    # Vincula establishment ao place
    httpx.patch(
        f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{establishment_session['user_id']}",
        headers=service_headers(),
        json={"role": "establishment", "managed_place_id": place_id},
        timeout=15,
    )

    yield place_id

    cleanup_test_place(place_id)


class TestEstablishmentEditOwnPlace:
    """Testa que establishment pode editar seu próprio lugar."""

    def test_can_update_own_place_description(self, establishment_session, establishment_with_place):
        """Empresa edita descrição do próprio lugar → persiste."""
        r = httpx.patch(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{establishment_with_place}",
            headers=auth_headers(establishment_session["access_token"]),
            json={
                "description": "Nova descrição atualizada pela empresa",
                "discount_description": "Novo desconto: 30% em sobremesas",
            },
            timeout=15,
        )
        assert r.status_code in (200, 204), f"Update falhou: {r.status_code} {r.text}"

        # Verifica persistência
        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{establishment_with_place}&select=description,discount_description,name",
            headers=service_headers(),
            timeout=15,
        )
        row = r2.json()[0]
        assert row["description"] == "Nova descrição atualizada pela empresa"
        assert row["discount_description"] == "Novo desconto: 30% em sobremesas"
        # Nome original deve estar intacto
        assert row["name"] == "Restaurante da Empresa Teste"

    def test_can_update_own_place_images(self, establishment_session, establishment_with_place):
        """Empresa atualiza imagens → persiste sem apagar outros campos."""
        r = httpx.patch(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{establishment_with_place}",
            headers=auth_headers(establishment_session["access_token"]),
            json={
                "cover_image": "https://example.com/new-cover.jpg",
                "gallery_images": ["https://example.com/new1.jpg", "https://example.com/new2.jpg"],
            },
            timeout=15,
        )
        assert r.status_code in (200, 204)

        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{establishment_with_place}&select=cover_image,gallery_images,name,description",
            headers=service_headers(),
            timeout=15,
        )
        row = r2.json()[0]
        assert row["cover_image"] == "https://example.com/new-cover.jpg"
        assert len(row["gallery_images"]) == 2
        # Campos não editados devem estar intactos
        assert row["name"] == "Restaurante da Empresa Teste"

    def test_can_update_operating_hours(self, establishment_session, establishment_with_place):
        """Empresa atualiza horários de funcionamento."""
        new_hours = [
            {"day": 0, "isOpen": True, "openTime": "11:00", "closeTime": "22:00"},
            {"day": 1, "isOpen": True, "openTime": "11:00", "closeTime": "22:00"},
            {"day": 2, "isOpen": False, "openTime": "", "closeTime": ""},
        ]
        r = httpx.patch(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{establishment_with_place}",
            headers=auth_headers(establishment_session["access_token"]),
            json={"operating_hours": new_hours},
            timeout=15,
        )
        assert r.status_code in (200, 204)

        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{establishment_with_place}&select=operating_hours",
            headers=service_headers(),
            timeout=15,
        )
        hours = r2.json()[0]["operating_hours"]
        assert len(hours) == 3
        assert hours[0]["openTime"] == "11:00"
        assert hours[2]["isOpen"] is False


class TestEstablishmentCannotEditOthers:
    """Testa que establishment NÃO pode editar places de outros."""

    def test_cannot_update_unmanaged_place(self, admin_session, establishment_session):
        """Establishment não pode editar place que não é seu."""
        other_place_id = f"test-other-{uuid.uuid4().hex[:8]}"
        place = make_place(other_place_id, name="Place de Outro")
        try:
            httpx.post(
                f"{SUPABASE_URL}/rest/v1/places",
                headers=auth_headers(admin_session["access_token"]),
                json=place,
                timeout=15,
            )

            r = httpx.patch(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{other_place_id}",
                headers=auth_headers(establishment_session["access_token"]),
                json={"name": "Hacked Name"},
                timeout=15,
            )

            # RLS deve bloquear — retorno vazio (nenhum row afetado)
            if r.status_code == 200:
                affected = r.json()
                assert len(affected) == 0, "RLS falhou — establishment editou place de outro!"

            # Verifica que o nome original permanece
            r2 = httpx.get(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{other_place_id}&select=name",
                headers=service_headers(),
                timeout=15,
            )
            assert r2.json()[0]["name"] == "Place de Outro"
        finally:
            cleanup_test_place(other_place_id)
