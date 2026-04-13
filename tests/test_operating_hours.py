"""
Testes: Horários de Funcionamento
Valida que alterações nos horários de operação persistem corretamente no Supabase.
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


class TestOperatingHoursPersistence:
    """Testa que horários de funcionamento são salvos e persistem."""

    def test_create_place_with_hours(self, admin_session):
        """Criar place com horários → horários persistem no banco."""
        place_id = f"test-hours-{uuid.uuid4().hex[:8]}"
        hours = [
            {"day": 0, "isOpen": True, "openTime": "10:00", "closeTime": "22:00"},
            {"day": 1, "isOpen": True, "openTime": "10:00", "closeTime": "22:00"},
            {"day": 2, "isOpen": False, "openTime": "", "closeTime": ""},
            {"day": 3, "isOpen": True, "openTime": "11:00", "closeTime": "23:00"},
            {"day": 4, "isOpen": True, "openTime": "11:00", "closeTime": "23:00"},
            {"day": 5, "isOpen": True, "openTime": "11:00", "closeTime": "01:00"},
            {"day": 6, "isOpen": True, "openTime": "11:00", "closeTime": "01:00"},
        ]
        place = make_place(place_id, operating_hours=hours)
        try:
            r = httpx.post(
                f"{SUPABASE_URL}/rest/v1/places",
                headers=auth_headers(admin_session["access_token"]),
                json=place,
                timeout=30,
            )
            assert r.status_code in (200, 201), f"Insert falhou: {r.text}"

            # Verifica persistência
            r2 = httpx.get(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}&select=operating_hours",
                headers=service_headers(),
                timeout=30,
            )
            row = r2.json()[0]
            saved_hours = row["operating_hours"]
            assert len(saved_hours) == 7, f"Esperava 7 dias, recebeu {len(saved_hours)}"
            assert saved_hours[0]["openTime"] == "10:00"
            assert saved_hours[0]["closeTime"] == "22:00"
            assert saved_hours[2]["isOpen"] is False
            assert saved_hours[5]["closeTime"] == "01:00"
        finally:
            cleanup_test_place(place_id)

    def test_update_hours_only_preserves_other_fields(self, admin_session):
        """Atualizar APENAS horários não apaga nome, descrição, etc."""
        place_id = f"test-hours-upd-{uuid.uuid4().hex[:8]}"
        original_hours = [
            {"day": 0, "isOpen": True, "openTime": "09:00", "closeTime": "18:00"},
        ]
        place = make_place(
            place_id,
            name="Restaurante Horário Teste",
            description="Descrição importante",
            operating_hours=original_hours,
        )
        try:
            httpx.post(
                f"{SUPABASE_URL}/rest/v1/places",
                headers=auth_headers(admin_session["access_token"]),
                json=place,
                timeout=30,
            )

            # Atualiza APENAS os horários (simula o que o form faz)
            new_hours = [
                {"day": 0, "isOpen": True, "openTime": "11:00", "closeTime": "23:00"},
                {"day": 1, "isOpen": False, "openTime": "", "closeTime": ""},
            ]
            r = httpx.patch(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}",
                headers=auth_headers(admin_session["access_token"]),
                json={"operating_hours": new_hours},
                timeout=30,
            )
            assert r.status_code in (200, 204), f"Update falhou: {r.text}"

            # Verifica que horários mudaram E outros campos permaneceram
            r2 = httpx.get(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}&select=name,description,operating_hours",
                headers=service_headers(),
                timeout=30,
            )
            row = r2.json()[0]
            assert row["name"] == "Restaurante Horário Teste", "Nome foi apagado!"
            assert row["description"] == "Descrição importante", "Descrição apagada!"
            assert len(row["operating_hours"]) == 2
            assert row["operating_hours"][0]["openTime"] == "11:00"
            assert row["operating_hours"][1]["isOpen"] is False
        finally:
            cleanup_test_place(place_id)

    def test_establishment_can_update_own_hours(self, admin_session, establishment_session):
        """Empresa consegue atualizar horários do seu próprio lugar."""
        place_id = f"test-emp-hrs-{uuid.uuid4().hex[:8]}"
        place = make_place(place_id, name="Empresa Horário")
        try:
            # Admin cria place
            httpx.post(
                f"{SUPABASE_URL}/rest/v1/places",
                headers=auth_headers(admin_session["access_token"]),
                json=place,
                timeout=30,
            )
            # Vincula establishment
            httpx.patch(
                f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{establishment_session['user_id']}",
                headers=service_headers(),
                json={"role": "establishment", "managed_place_id": place_id},
                timeout=30,
            )

            # Empresa atualiza horários
            new_hours = [
                {"day": 0, "isOpen": True, "openTime": "08:00", "closeTime": "20:00"},
            ]
            r = httpx.patch(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}",
                headers=auth_headers(establishment_session["access_token"]),
                json={"operating_hours": new_hours},
                timeout=30,
            )
            assert r.status_code in (200, 204), f"Update pela empresa falhou: {r.text}"

            # Verifica
            r2 = httpx.get(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}&select=operating_hours",
                headers=service_headers(),
                timeout=30,
            )
            saved = r2.json()[0]["operating_hours"]
            assert saved[0]["openTime"] == "08:00"
        finally:
            cleanup_test_place(place_id)

    def test_full_place_update_preserves_hours(self, admin_session):
        """Atualizar place completo (como o form faz) mantém horários corretos."""
        place_id = f"test-full-hrs-{uuid.uuid4().hex[:8]}"
        hours = [
            {"day": 0, "isOpen": True, "openTime": "12:00", "closeTime": "21:00"},
        ]
        place = make_place(place_id, operating_hours=hours)
        try:
            httpx.post(
                f"{SUPABASE_URL}/rest/v1/places",
                headers=auth_headers(admin_session["access_token"]),
                json=place,
                timeout=30,
            )

            # Simula save do form completo (envia TODOS os campos)
            updated_place = make_place(
                place_id,
                name="Nome Atualizado",
                description="Nova descrição",
                operating_hours=[
                    {"day": 0, "isOpen": True, "openTime": "14:00", "closeTime": "23:00"},
                    {"day": 1, "isOpen": True, "openTime": "14:00", "closeTime": "23:00"},
                ],
            )
            r = httpx.patch(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}",
                headers=auth_headers(admin_session["access_token"]),
                json=updated_place,
                timeout=30,
            )
            assert r.status_code in (200, 204)

            r2 = httpx.get(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{place_id}&select=name,operating_hours",
                headers=service_headers(),
                timeout=30,
            )
            row = r2.json()[0]
            assert row["name"] == "Nome Atualizado"
            assert len(row["operating_hours"]) == 2
            assert row["operating_hours"][0]["openTime"] == "14:00"
        finally:
            cleanup_test_place(place_id)
