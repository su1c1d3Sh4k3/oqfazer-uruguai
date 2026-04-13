"""
Testes: Categorias, Cidades e Badges
Valida CRUD das tabelas auxiliares (lookup tables).
"""

import uuid
import httpx
import pytest
from conftest import (
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    auth_headers,
    service_headers,
    cleanup_test_record,
)


class TestCategories:
    """Testa CRUD de categorias."""

    def test_admin_can_add_category(self, admin_session):
        """Admin adiciona categoria → persiste no banco."""
        cat_name = f"TestCat-{uuid.uuid4().hex[:6]}"
        try:
            r = httpx.post(
                f"{SUPABASE_URL}/rest/v1/categories",
                headers=auth_headers(admin_session["access_token"]),
                json={"name": cat_name},
                timeout=15,
            )
            assert r.status_code in (200, 201), f"Insert categoria falhou: {r.text}"

            # Verifica
            r2 = httpx.get(
                f"{SUPABASE_URL}/rest/v1/categories?name=eq.{cat_name}&select=name",
                headers=service_headers(),
                timeout=15,
            )
            assert len(r2.json()) == 1
            assert r2.json()[0]["name"] == cat_name
        finally:
            cleanup_test_record("categories", "name", cat_name)

    def test_admin_can_delete_category(self, admin_session):
        """Admin deleta categoria → não existe mais no banco."""
        cat_name = f"TestCatDel-{uuid.uuid4().hex[:6]}"
        # Cria
        httpx.post(
            f"{SUPABASE_URL}/rest/v1/categories",
            headers=auth_headers(admin_session["access_token"]),
            json={"name": cat_name},
            timeout=15,
        )

        # Deleta
        r = httpx.delete(
            f"{SUPABASE_URL}/rest/v1/categories?name=eq.{cat_name}",
            headers=auth_headers(admin_session["access_token"]),
            timeout=15,
        )
        assert r.status_code in (200, 204)

        # Verifica
        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/categories?name=eq.{cat_name}&select=name",
            headers=service_headers(),
            timeout=15,
        )
        assert len(r2.json()) == 0

    def test_duplicate_category_rejected(self, admin_session):
        """Categoria duplicada é rejeitada (UNIQUE constraint)."""
        cat_name = f"TestCatDup-{uuid.uuid4().hex[:6]}"
        try:
            httpx.post(
                f"{SUPABASE_URL}/rest/v1/categories",
                headers=auth_headers(admin_session["access_token"]),
                json={"name": cat_name},
                timeout=15,
            )
            r2 = httpx.post(
                f"{SUPABASE_URL}/rest/v1/categories",
                headers=auth_headers(admin_session["access_token"]),
                json={"name": cat_name},
                timeout=15,
            )
            assert r2.status_code == 409, f"Deveria rejeitar duplicata: {r2.status_code}"
        finally:
            cleanup_test_record("categories", "name", cat_name)

    def test_anon_can_read_categories(self):
        """Anônimo pode ler categorias (política pública)."""
        r = httpx.get(
            f"{SUPABASE_URL}/rest/v1/categories?select=name&limit=5",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            },
            timeout=15,
        )
        assert r.status_code == 200


class TestCities:
    """Testa CRUD de cidades."""

    def test_admin_can_add_city(self, admin_session):
        """Admin adiciona cidade → persiste no banco."""
        city_name = f"TestCity-{uuid.uuid4().hex[:6]}"
        try:
            r = httpx.post(
                f"{SUPABASE_URL}/rest/v1/cities",
                headers=auth_headers(admin_session["access_token"]),
                json={"name": city_name},
                timeout=15,
            )
            assert r.status_code in (200, 201)

            r2 = httpx.get(
                f"{SUPABASE_URL}/rest/v1/cities?name=eq.{city_name}&select=name",
                headers=service_headers(),
                timeout=15,
            )
            assert len(r2.json()) == 1
        finally:
            cleanup_test_record("cities", "name", city_name)

    def test_admin_can_delete_city(self, admin_session):
        """Admin deleta cidade."""
        city_name = f"TestCityDel-{uuid.uuid4().hex[:6]}"
        httpx.post(
            f"{SUPABASE_URL}/rest/v1/cities",
            headers=auth_headers(admin_session["access_token"]),
            json={"name": city_name},
            timeout=15,
        )

        r = httpx.delete(
            f"{SUPABASE_URL}/rest/v1/cities?name=eq.{city_name}",
            headers=auth_headers(admin_session["access_token"]),
            timeout=15,
        )
        assert r.status_code in (200, 204)

        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/cities?name=eq.{city_name}&select=name",
            headers=service_headers(),
            timeout=15,
        )
        assert len(r2.json()) == 0


class TestBadges:
    """Testa CRUD de badges de desconto."""

    def test_admin_can_add_badge(self, admin_session):
        """Admin adiciona badge → persiste no banco."""
        badge_name = f"TestBadge-{uuid.uuid4().hex[:6]}"
        try:
            r = httpx.post(
                f"{SUPABASE_URL}/rest/v1/badges",
                headers=auth_headers(admin_session["access_token"]),
                json={"name": badge_name},
                timeout=15,
            )
            assert r.status_code in (200, 201)

            r2 = httpx.get(
                f"{SUPABASE_URL}/rest/v1/badges?name=eq.{badge_name}&select=name",
                headers=service_headers(),
                timeout=15,
            )
            assert len(r2.json()) == 1
        finally:
            cleanup_test_record("badges", "name", badge_name)

    def test_admin_can_delete_badge(self, admin_session):
        """Admin deleta badge."""
        badge_name = f"TestBadgeDel-{uuid.uuid4().hex[:6]}"
        httpx.post(
            f"{SUPABASE_URL}/rest/v1/badges",
            headers=auth_headers(admin_session["access_token"]),
            json={"name": badge_name},
            timeout=15,
        )

        r = httpx.delete(
            f"{SUPABASE_URL}/rest/v1/badges?name=eq.{badge_name}",
            headers=auth_headers(admin_session["access_token"]),
            timeout=15,
        )
        assert r.status_code in (200, 204)

        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/badges?name=eq.{badge_name}&select=name",
            headers=service_headers(),
            timeout=15,
        )
        assert len(r2.json()) == 0


class TestAppSettings:
    """Testa tabela app_settings."""

    def test_admin_can_update_whatsapp(self, admin_session):
        """Admin atualiza número de WhatsApp."""
        r = httpx.post(
            f"{SUPABASE_URL}/rest/v1/app_settings",
            headers={
                **auth_headers(admin_session["access_token"]),
                "Prefer": "return=representation,resolution=merge-duplicates",
            },
            json={"key": "whatsapp_support", "value": "+5547999999999"},
            timeout=15,
        )
        assert r.status_code in (200, 201), f"Upsert app_settings falhou: {r.text}"

        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/app_settings?key=eq.whatsapp_support&select=value",
            headers=service_headers(),
            timeout=15,
        )
        assert r2.json()[0]["value"] == "+5547999999999"

    def test_anon_can_read_settings(self):
        """Anônimo pode ler configurações."""
        r = httpx.get(
            f"{SUPABASE_URL}/rest/v1/app_settings?select=key,value",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            },
            timeout=15,
        )
        assert r.status_code == 200
